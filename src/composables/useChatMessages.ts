import { ref, computed, nextTick, type Ref } from "vue";
import { sendMessage, getMessages } from "../api/message";
import { uploadFiles } from "../api/upload";
import { formatDate } from "../utils";
import type { Message, GroupedMessages } from "../types/message";
import type { SendMessageRequest } from "../types/message";
import type { CustomUserResponse } from "../types/user";

export const useChatMessages = (
  sessionId: string,
  userId: Ref<string>,
  userName: Ref<string>,
  userIdentifier: Ref<string>,
  userType: Ref<string>
) => {
  const messages = ref<Message[]>([]);
  const newMessage = ref<string>("");
  const replyingTo = ref<Message | null>(null);
  const isSending = ref<boolean>(false);
  const isLoadingMessages = ref<boolean>(false);
  const chatContainer = ref<HTMLElement | null>(null);

  const groupedMessages = computed<GroupedMessages>(() => {
    const groups: GroupedMessages = {};

    if (!messages.value || messages.value.length === 0) {
      return groups;
    }

    messages.value.forEach((msg) => {
      if (!msg.timestamp) {
        console.warn("Message without timestamp:", msg);
        return;
      }

      const dateKey = formatDate(msg.timestamp);

      if (dateKey === "Invalid Date") {
        console.warn("Invalid date for message:", msg);
        return;
      }

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
          const sender: CustomUserResponse = {
            id: msg.sender.id || "",
            name: msg.sender.name || "Unknown",
            identifier: msg.sender.identifier || "",
            role: msg.sender.role || "student",
          };

          return {
            id: msg.id,
            session_id: msg.session_id || sessionId,
            sender: sender,
            is_text: msg.is_text,
            text: msg.text || "",
            file_url: msg.file_url || null,
            parent_message_id: msg.parent_message_id || null,
            timestamp: msg.timestamp || new Date().toISOString(),
            is_sending: false,
          };
        });

        messages.value = messagesData.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        console.log("✅ Messages loaded and sorted:", messages.value.length);

        nextTick(() => {
          scrollToBottom();
        });
      } else {
        console.error("❌ Invalid response format:", response);
        throw new Error("Failed to load messages");
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const handleSendMessage = async (files?: File[]): Promise<void> => {
    const messageText = newMessage.value.trim();
    const hasText = messageText.length > 0;
    const hasFiles = files && files.length > 0;

    if ((!hasText && !hasFiles) || isSending.value) return;

    const parentId = replyingTo.value?.id;

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
      hasFiles: hasFiles,
      fileCount: files?.length || 0,
    });

    // Create temp message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender: tempSender,
      is_text: hasText && !hasFiles, // Only true if has text and no files
      text: hasText ? messageText : hasFiles ? "📎 Mengirim file..." : "",
      file_url: null,
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
      let fileUrl: string | null = null;

      // Upload files first if exists
      if (hasFiles && files) {
        console.log("📤 Uploading files...");
        const uploadResponse = await uploadFiles(files);

        if (uploadResponse.length > 0) {
          fileUrl = uploadResponse[0]; // Use first uploaded file URL
          console.log("✅ File uploaded:", fileUrl);
        }
      }

      // Determine is_text based on whether we have a file
      const isTextMessage = hasText && !fileUrl;

      // Send message with or without file
      const payload: SendMessageRequest = {
        is_text: isTextMessage, // false if file exists, true if only text
        text: hasText ? messageText : fileUrl ? "📎 File" : "",
      };

      if (parentId) {
        payload.parent_message_id = parentId;
      }

      if (fileUrl) {
        payload.file_url = fileUrl;
      }

      console.log("📤 Payload:", payload);

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

      // Restore message if it was text
      if (hasText) {
        newMessage.value = messageText;
      }

      // Show error
      alert("Gagal mengirim pesan. Silakan coba lagi.");
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

    const exists = messages.value.some((m) => m.id === data.id);
    if (exists) {
      console.log("ℹ️ Message already exists, skipping");
      return;
    }

    messages.value.push(data);

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
