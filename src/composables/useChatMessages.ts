// composables/useChatMessages.ts
import { ref, computed, nextTick, type Ref } from "vue";
import { sendMessage, getMessages } from "../api/message";
import { formatDate } from "../utils";
import type { Message, GroupedMessages } from "../types/message";
import type { SendMessageRequest } from "../types/message";
import type { SuccessResponse } from "../types/api";
import type { SessionResponse } from "../types/session";

type ToastType = "info" | "success" | "warning" | "error";

export const useChatMessages = (
  sessionId: string,
  userId: Ref<string>,
  userType: Ref<string>,
  showToast: (message: string, type?: ToastType, duration?: number) => void,
  getSenderNameFn: (message: Message | { sender_id: string }) => string
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
      const response = (await getMessages(sessionId)) as SuccessResponse<
        SessionResponse[]
      >;

      if (response.status && response.data) {
        const messagesData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        messages.value = messagesData.map((msg: any) => ({
          id: msg.id,
          session_id: msg.session_id || sessionId,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          sender_role: msg.sender_role,
          is_text: msg.is_text,
          text: msg.text,
          file_url: msg.file_url,
          file_type: msg.file_type,
          parent_message_id: msg.parent_message_id,
          timestamp: msg.timestamp,
          event: msg.event,
        }));

        messages.value.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        console.log("Messages loaded:", messages.value.length);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!newMessage.value.trim() || isSending.value) return;

    const messageText = newMessage.value.trim();
    const parentId = replyingTo.value?.id;

    // Gunakan getSenderNameFn untuk mendapatkan nama yang benar
    const senderName = getSenderNameFn({ sender_id: userId.value });

    console.log("📤 Sending message with sender:", {
      userId: userId.value,
      senderName,
      userType: userType.value,
    });

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender_id: userId.value,
      sender_name: senderName,
      sender_role: userType.value === "mahasiswa" ? "student" : "lecturer",
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

      // Hapus temporary message setelah berhasil
      const tempIndex = messages.value.findIndex(
        (m) => m.id === tempMessage.id
      );
      if (tempIndex !== -1) {
        messages.value.splice(tempIndex, 1);
      }

      scrollToBottom();
    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Hapus temporary message jika gagal
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
      console.warn("Message dari session berbeda, ignoring");
      return;
    }

    const exists = messages.value.some((m) => m.id === data.id);
    if (exists) {
      console.log("Message sudah ada, skipping");
      return;
    }

    // Hapus temporary message jika ada yang match
    const tempIndex = messages.value.findIndex(
      (m) =>
        m.is_sending && m.text === data.text && m.sender_id === data.sender_id
    );
    if (tempIndex !== -1) {
      console.log("🔄 Replacing temp message with real message");
      messages.value.splice(tempIndex, 1);
    }

    messages.value.push(data);
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
