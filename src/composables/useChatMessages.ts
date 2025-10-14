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

    messages.value.forEach((msg) => {
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
      console.log("📥 Fetching messages for session:", sessionId);

      const response = await getMessages(sessionId);

      if (response.status && Array.isArray(response.data)) {
        console.log("📦 Raw messages from API:", response.data.length);

        const messagesData = response.data.map((msg: any) => {
          console.log("🔄 Mapping message:", {
            id: msg.id,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            text: msg.text?.substring(0, 30),
          });

          return {
            id: msg.id,
            session_id: msg.session_id || sessionId,
            sender: {
              id: msg.sender_id,
              name: msg.sender_name || "Unknown",
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
        });

        // Sort messages by timestamp
        messages.value = messagesData.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        console.log("✅ Messages loaded and sorted:", messages.value.length);

        // Debug: Log first and last message
        if (messages.value.length > 0) {
          console.log("📝 First message:", {
            id: messages.value[0].id,
            sender: messages.value[0].sender.name,
            timestamp: messages.value[0].timestamp,
          });
          console.log("📝 Last message:", {
            id: messages.value[messages.value.length - 1].id,
            sender: messages.value[messages.value.length - 1].sender.name,
            timestamp: messages.value[messages.value.length - 1].timestamp,
          });
        }

        // Scroll after render
        nextTick(() => {
          scrollToBottom();
        });
      } else {
        console.error("❌ Invalid response format:", response);
        throw new Error("Failed to load messages");
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      showToast("Gagal memuat pesan", "error");
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!newMessage.value.trim() || isSending.value) return;

    const messageText = newMessage.value.trim();
    const parentId = replyingTo.value?.id;

    // Create temp sender with current user data
    const tempSender: CustomUserResponse = {
      id: userId.value,
      name: userName.value,
      identifier: userIdentifier.value,
      role: userType.value === "mahasiswa" ? "student" : "lecturer",
    };

    console.log("📤 Sending message:", {
      userId: userId.value,
      userName: userName.value,
      userType: userType.value,
    });

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

      console.log("✅ Message sent successfully");
      scrollToBottom();
    } catch (error: any) {
      console.error("❌ Failed to send message:", error);

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
    console.log("📨 Adding new message from WebSocket:", {
      id: data.id,
      sender_id: data.sender.id,
      sender_name: data.sender.name,
      text: data.text?.substring(0, 30),
    });

    if (data.session_id !== sessionId) {
      console.warn("⚠️ Message from different session, ignoring");
      return;
    }

    // Check if message already exists
    const exists = messages.value.some((m) => m.id === data.id);
    if (exists) {
      console.log("ℹ️ Message already exists, skipping");
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

    // Add new message
    messages.value.push(data);

    // Re-sort by timestamp to maintain order
    messages.value.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log("✅ Message added, total:", messages.value.length);
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
