<script setup lang="ts">
import { onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUser } from "../composables/useUser";
import { useSessions } from "../composables/useSession";
import { useWebSocket } from "../composables/useWebsocket";
import { useNotificationToast } from "../composables/useNotificationToast";
import { useChatMessages } from "../composables/useChatMessages";
import { useChatParticipants } from "../composables/useChatParticipants";
import { useChatWebSocket } from "../composables/useChatWebsocket";
import {
  leaveSession as leaveSessionApi,
  endSession as endSessionApi,
} from "../api/session";
import type { Message } from "../types/message";

// Components
import ChatHeader from "../components/ChatHeader.vue";
import MessageBubble from "../components/MessageBubble.vue";
import MessageInput from "../components/MessageInput.vue";

const route = useRoute();
const router = useRouter();
const sessionId = route.params.session_id as string;

// Composables
const { userId, userType, userName, userIdentifier, fetchUserProfile } =
  useUser();
const { sessionDetail, isLoadingDetail, fetchSessionDetail } = useSessions(
  userId,
  userType,
  userIdentifier
);
const { on, connect, isConnected } = useWebSocket();
const { show: showToast } = useNotificationToast();

// Wrap showToast
const toastWrapper = (
  message: string,
  type?: "info" | "success" | "warning" | "error"
) => {
  showToast(message, type);
};

// Chat Participants
const {
  onlineCount,
  allParticipants,
  otherParticipants,
  getSenderName,
  isMyMessage,
  addOnlineParticipant,
  removeOnlineParticipant,
  clearOnlineParticipants,
} = useChatParticipants(sessionDetail, userId);

console.log("all participants", allParticipants);

// Chat Messages
const {
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
} = useChatMessages(
  sessionId,
  userId,
  userName,
  userIdentifier,
  userType,
  toastWrapper
);

// WebSocket Setup
const { setupWebSocketListeners, resetWebSocket } = useChatWebSocket(
  sessionId,
  on,
  addNewMessage,
  addOnlineParticipant,
  removeOnlineParticipant,
  toastWrapper
);

// Check if current user is session owner
const isSessionOwner = computed<boolean>(() => {
  return userId.value === sessionDetail.value?.user_owner?.id;
});

// Can leave session (jika bukan owner)
const canLeaveSession = computed<boolean>(() => {
  return !isSessionOwner.value;
});

// Can end session (hanya owner)
const canEndSession = computed<boolean>(() => {
  return isSessionOwner.value;
});

// Computed
const sessionTitle = computed<string>(() => {
  if (!sessionDetail.value) return "Loading...";

  if (userType.value === "mahasiswa") {
    const supervisors = sessionDetail.value.thesis?.supervisors;
    if (supervisors && supervisors.length > 1) {
      return `Bimbingan dengan ${supervisors.map((s) => s.name).join(" & ")}`;
    }
    return `Bimbingan dengan ${supervisors?.[0]?.name || "Dosen"}`;
  } else {
    return `Bimbingan dengan ${
      sessionDetail.value.thesis?.student?.name || "Mahasiswa"
    }`;
  }
});

const sessionStatus = computed<string>(() => {
  return sessionDetail.value?.status || "ongoing";
});

const replyToSenderName = computed<string>(() => {
  return replyingTo.value ? getSenderName(replyingTo.value) : "";
});

const totalParticipantCount = computed<number>(() => {
  return allParticipants.value.length;
});

const getReplyToMessage = (message: Message): Message | null => {
  if (!message.parent_message_id) return null;
  return messages.value.find((m) => m.id === message.parent_message_id) || null;
};

const getReplyToSenderName = (message: Message): string => {
  if (!message.parent_message_id) return "";
  const parentMessage = getReplyToMessage(message);
  return parentMessage ? getSenderName(parentMessage) : "";
};

// Actions
const handleLeaveSession = async (): Promise<void> => {
  if (confirm("Apakah Anda yakin ingin meninggalkan sesi ini?")) {
    try {
      await leaveSessionApi(sessionId);
      toastWrapper("Anda telah meninggalkan sesi.", "success");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to leave session:", error);
      toastWrapper(
        error.response?.data?.message || "Gagal meninggalkan sesi.",
        "error"
      );
    }
  }
};

const handleEndSession = async (): Promise<void> => {
  if (confirm("Apakah Anda yakin ingin mengakhiri sesi ini?")) {
    try {
      await endSessionApi(sessionId);
      toastWrapper("Sesi bimbingan telah diakhiri.", "success");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to end session:", error);
      toastWrapper(
        error.response?.data?.message || "Gagal mengakhiri sesi.",
        "error"
      );
    }
  }
};

// Lifecycle
onMounted(async () => {
  console.log("=== CHAT ROOM MOUNTED ===");
  console.log("Session ID:", sessionId);

  try {
    await fetchUserProfile();
    console.log("✅ User profile loaded:", {
      userId: userId.value,
      userType: userType.value,
    });
  } catch (error) {
    console.error("Failed to load user profile:", error);
    toastWrapper("Gagal memuat data pengguna.", "error");
    return;
  }

  if (!isConnected.value) {
    const token = localStorage.getItem("access_token");
    if (token) {
      connect(token);
    }
  }

  try {
    await fetchSessionDetail(sessionId);
    console.log("✅ Session detail loaded:", {
      owner: sessionDetail.value?.user_owner,
      isCurrentUserOwner: isSessionOwner.value,
    });
  } catch (error) {
    console.error("Failed to load session detail:", error);
    toastWrapper("Gagal memuat detail sesi.", "error");
    return;
  }

  await fetchMessages();
  console.log("✅ Messages loaded");

  setupWebSocketListeners();
  scrollToBottom();
});

onUnmounted(() => {
  resetWebSocket();
  clearOnlineParticipants();
});
</script>

<template>
  <div
    class="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
  >
    <!-- Header -->
    <ChatHeader
      :session-title="sessionTitle"
      :session-status="sessionStatus"
      :other-participants="otherParticipants"
      :all-participants="allParticipants"
      :online-count="onlineCount"
      :total-count="totalParticipantCount"
      :user-type="userType"
      :is-session-owner="isSessionOwner"
      :can-leave="canLeaveSession"
      :can-end="canEndSession"
      @back="router.push('/dashboard')"
      @leave="handleLeaveSession"
      @end="handleEndSession"
    />

    <!-- Loading State -->
    <div
      v-if="isLoadingDetail || isLoadingMessages"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"
        ></div>
        <p class="text-sm text-gray-500 mt-4 font-medium">
          Memuat sesi bimbingan...
        </p>
      </div>
    </div>

    <!-- Chat Container -->
    <div
      v-else
      ref="chatContainer"
      class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 chat-background"
    >
      <!-- Tambahkan loading state ketika messages sedang dimuat -->
      <div
        v-if="isLoadingMessages"
        class="flex items-center justify-center h-full"
      >
        <div class="text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"
          ></div>
          <p class="text-sm text-gray-500 mt-2">Memuat pesan...</p>
        </div>
      </div>

      <!-- Chat messages -->
      <div class="max-w-4xl mx-auto space-y-4">
        <div v-if="messages.length === 0" class="text-center py-16">
          <div
            class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <svg
              class="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h4 class="font-semibold text-gray-900 mb-2">Belum ada pesan</h4>
          <p class="text-sm text-gray-500">
            Mulai percakapan dengan mengirim pesan pertama
          </p>
        </div>

        <div
          v-for="(msgs, date) in groupedMessages"
          :key="date"
          class="space-y-3"
        >
          <div class="flex items-center justify-center my-8">
            <div
              class="bg-white/90 backdrop-blur-sm shadow-sm rounded-full px-5 py-2 border border-gray-200/50"
            >
              <span class="text-xs text-gray-600 font-semibold">{{
                date
              }}</span>
            </div>
          </div>

          <MessageBubble
            v-for="message in msgs"
            :key="message.id"
            :message="message"
            :is-my-message="isMyMessage(message)"
            :sender-name="getSenderName(message)"
            :reply-to-message="getReplyToMessage(message)"
            :reply-to-sender-name="getReplyToSenderName(message)"
            @reply="setReplyTo"
          />
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <MessageInput
      v-model="newMessage"
      :replying-to="replyingTo"
      :reply-to-sender-name="replyToSenderName"
      :is-sending="isSending"
      :session-status="sessionStatus"
      @send="handleSendMessage"
      @cancel-reply="cancelReply"
    />
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1, #94a3b8);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8, #64748b);
}

.chat-background {
  background-color: #f8fafc;
  background-image: radial-gradient(
      circle at 20% 50%,
      rgba(59, 130, 246, 0.03) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 80%,
      rgba(99, 102, 241, 0.03) 0%,
      transparent 50%
    );
  background-attachment: fixed;
}

#chatContainer {
  scroll-behavior: smooth;
}
</style>
