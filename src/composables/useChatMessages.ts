import { ref, computed, nextTick, type Ref } from "vue";
import { sendMessage, getMessages } from "../api/message";
import { formatDate } from "../utils";
import type { Message, GroupedMessages } from "../types/message";
import type { SendMessageRequest } from "../types/message";
import type { CustomUserResponse } from "../types/user";

type ToastType = "info" | "success" | "warning" | "error";

export const useChatMessages = (
  sessionId: string,
  userId: Ref<string>,
  userName: Ref<string>,
  userIdentifier: Ref<string>,
  userType: Ref<string>,
  showToast: (message: string, type?: ToastType, duration?: number) => void
  // getSenderNameFn: (message: Message | { sender: CustomUserResponse }) => string
) => {
  const messages = ref<Message[]>([]);
  const newMessage = ref<string>("");
  const replyingTo = ref<Message | null>(null);
  const isSending = ref<boolean>(false);
  const isLoadingMessages = ref<boolean>(false);
  const chatContainer = ref<HTMLElement | null>(null);

  const groupedMessages = computed<GroupedMessages>(() => {
    const groups: GroupedMessages = {};

    // Sort messages first by timestamp
    const sortedMessages = [...messages.value].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedMessages.forEach((msg) => {
      const dateKey = formatDate(msg.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return groups;
  });

  const scrollToBottom = (): void => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  };

  const fetchMessages = async (): Promise<void> => {
    try {
      isLoadingMessages.value = true;
      const response = await getMessages(sessionId);

      if (response.status && Array.isArray(response.data)) {
        console.log("📥 Raw messages from API:", response.data.length);

        const messagesData = response.data.map((msg: any) => {
          // Create message object with proper sender data
          const messageObj: Message = {
            id: msg.id,
            session_id: msg.session_id || sessionId,
            sender: {
              id: msg.sender_id,
              name: msg.sender_name || "", // Keep original name from backend
              identifier: msg.sender_identifier || "",
              role: msg.sender_role || "student",
            },
            is_text: msg.is_text,
            text: msg.text,
            file_url: msg.file_url || null,
            file_type: msg.file_type || null,
            parent_message_id: msg.parent_message_id || null,
            timestamp: msg.timestamp || new Date().toISOString(),
            is_sending: false,
          };

          console.log("📝 Mapped message:", {
            id: messageObj.id,
            sender_id: messageObj.sender.id,
            sender_name: messageObj.sender.name,
            timestamp: messageObj.timestamp,
          });

          return messageObj;
        });

        // Sort by timestamp ascending (oldest first)
        messages.value = messagesData.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        console.log("✅ Messages loaded and sorted:", messages.value.length);
        console.log("First message:", messages.value[0]?.text);
        console.log(
          "Last message:",
          messages.value[messages.value.length - 1]?.text
        );

        scrollToBottom();
      } else {
        console.error("❌ Invalid response format:", response);
        throw new Error("Failed to load messages");
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      showToast("Gagal memuat pesan. Silakan refresh halaman.", "error");
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!newMessage.value.trim() || isSending.value) return;

    const messageText = newMessage.value.trim();
    const parentId = replyingTo.value?.id;

    // Get current user's actual name
    const currentUserName = userName.value || "You";

    console.log("📤 Sending message:", {
      userId: userId.value,
      userName: currentUserName,
      userType: userType.value,
      text: messageText.substring(0, 30),
    });

    // Create temporary sender object
    const tempSender: CustomUserResponse = {
      id: userId.value,
      name: currentUserName,
      identifier: userIdentifier.value,
      role: userType.value === "mahasiswa" ? "student" : "lecturer",
    };

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender: tempSender,
      is_text: true,
      text: messageText,
      file_url: null,
      file_type: null,
      parent_message_id: parentId || null,
      timestamp: new Date().toISOString(),
      is_sending: true,
    };

    messages.value.push(tempMessage);
    scrollToBottom();

    newMessage.value = "";
    replyingTo.value = null;
    isSending.value = true;

    try {
      const payload: SendMessageRequest = {
        is_text: true,
        text: messageText,
      };

      if (parentId) {
        payload.parent_message_id = parentId;
      }

      await sendMessage(sessionId, payload);

      // Remove temporary message after success
      const tempIndex = messages.value.findIndex(
        (m) => m.id === tempMessage.id
      );
      if (tempIndex !== -1) {
        messages.value.splice(tempIndex, 1);
      }

      scrollToBottom();
    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Remove temporary message on failure
      const tempIndex = messages.value.findIndex(
        (m) => m.id === tempMessage.id
      );
      if (tempIndex !== -1) {
        messages.value.splice(tempIndex, 1);
      }

      showToast(
        error.response?.data?.message ||
          "Gagal mengirim pesan. Silakan coba lagi.",
        "error"
      );
      newMessage.value = messageText;
    } finally {
      isSending.value = false;
    }
  };

  const addNewMessage = (data: Message): void => {
    if (data.session_id !== sessionId) {
      console.warn("⚠️ Message dari session berbeda, ignoring");
      return;
    }

    const exists = messages.value.some((m) => m.id === data.id);
    if (exists) {
      console.log("⏭️ Message sudah ada, skipping");
      return;
    }

    // Remove temporary message if match found
    const tempIndex = messages.value.findIndex(
      (m) =>
        m.is_sending && m.text === data.text && m.sender.id === data.sender.id
    );
    if (tempIndex !== -1) {
      console.log("🔄 Replacing temp message with real message");
      messages.value.splice(tempIndex, 1);
    }

    console.log("➕ Adding new message:", {
      id: data.id,
      sender: data.sender.name,
      text: data.text.substring(0, 30),
    });

    messages.value.push(data);

    // Re-sort after adding
    messages.value.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    scrollToBottom();
  };

  const setReplyTo = (message: Message): void => {
    replyingTo.value = message;
    nextTick(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) textarea.focus();
    });
  };

  const cancelReply = (): void => {
    replyingTo.value = null;
  };

  return {
    messages,
    newMessage,
    replyingTo,
    isSending,
    isLoadingMessages,
    chatContainer,
    groupedMessages,
    fetchMessages,
    handleSendMessage,
    addNewMessage,
    setReplyTo,
    cancelReply,
    scrollToBottom,
  };
};
