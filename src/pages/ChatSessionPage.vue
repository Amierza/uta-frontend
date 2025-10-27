<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
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
import ToastNotification from "../components/ToastNotification.vue";
import SessionEndingScreen from "../components/SessionEndingScreen.vue";

const route = useRoute();
const router = useRouter();
const sessionId = route.params.session_id as string;
const isProcessingEnd = ref(false);

// Modal states
const showLeaveModal = ref(false);
const showEndModal = ref(false);
const isLeavingSession = ref(false);
const isEndingSession = ref(false);

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
  type?: "info" | "success" | "warning" | "error",
  duration: number = 3000
) => {
  showToast(message, type, duration);
};

// Chat Participants
const {
  onlineCount,
  allParticipants,
  getSenderName,
  isMyMessage,
  addOnlineParticipant,
  removeOnlineParticipant,
  clearOnlineParticipants,
} = useChatParticipants(sessionDetail, userId);

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
} = useChatMessages(sessionId, userId, userName, userIdentifier, userType);

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

// Actions - Show modals
const handleLeaveSessionClick = (): void => {
  showLeaveModal.value = true;
};

const handleEndSessionClick = (): void => {
  showEndModal.value = true;
};

// Confirm leave session
const confirmLeaveSession = async (): Promise<void> => {
  try {
    isLeavingSession.value = true;
    await leaveSessionApi(sessionId);
    showLeaveModal.value = false;
    toastWrapper("Anda telah meninggalkan sesi", "success");
    router.push("/dashboard");
  } catch (error: any) {
    console.error("Failed to leave session:", error);
    toastWrapper("Gagal meninggalkan sesi", "error");
  } finally {
    isLeavingSession.value = false;
  }
};

// Confirm end session
const confirmEndSession = async (): Promise<void> => {
  try {
    isEndingSession.value = true;
    showEndModal.value = false;

    // Show processing screen
    isProcessingEnd.value = true;

    // Call API to end session
    const response = await endSessionApi(sessionId);
    console.log("✅ Session ended:", response);

    // Processing screen will handle the redirect
  } catch (error: any) {
    console.error("Failed to end session:", error);
    isProcessingEnd.value = false;
    isEndingSession.value = false;
    toastWrapper("Gagal mengakhiri sesi.", "error");
  }
};

// Cancel modals
const cancelLeaveSession = (): void => {
  showLeaveModal.value = false;
};

const cancelEndSession = (): void => {
  showEndModal.value = false;
};

const handleProcessingComplete = () => {
  // Redirect to dashboard dengan toast
  toastWrapper(
    "Sesi berhasil diakhiri. AI sedang memproses ringkasan percakapan.",
    "success"
  );
  router.push("/dashboard");
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
    return;
  }

  await fetchMessages();

  setupWebSocketListeners();
  scrollToBottom();
});

onUnmounted(() => {
  resetWebSocket();
  clearOnlineParticipants();
});
</script>

<template>
  <!-- Processing Screen Overlay -->
  <SessionEndingScreen
    v-if="isProcessingEnd"
    :session-title="sessionTitle"
    @complete="handleProcessingComplete"
  />

  <!-- Leave Session Modal -->
  <Transition name="modal">
    <div
      v-if="showLeaveModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="cancelLeaveSession"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
        @click.stop
      >
        <!-- Icon -->
        <div class="pt-8 pb-4 px-6 text-center">
          <div
            class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>

          <h3 class="text-xl font-bold text-gray-900 mb-2">Tinggalkan Sesi?</h3>
          <p class="text-sm text-gray-600">
            Apakah Anda yakin ingin meninggalkan sesi bimbingan ini? Anda dapat
            bergabung kembali jika sesi masih berlangsung.
          </p>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6 flex gap-3">
          <button
            @click="cancelLeaveSession"
            :disabled="isLeavingSession"
            class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            @click="confirmLeaveSession"
            :disabled="isLeavingSession"
            class="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <div
              v-if="isLeavingSession"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{
              isLeavingSession ? "Meninggalkan..." : "Ya, Tinggalkan"
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- End Session Modal -->
  <Transition name="modal">
    <div
      v-if="showEndModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="cancelEndSession"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
        @click.stop
      >
        <!-- Icon -->
        <div class="pt-8 pb-4 px-6 text-center">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h3 class="text-xl font-bold text-gray-900 mb-2">Akhiri Sesi?</h3>
          <p class="text-sm text-gray-600 mb-4">
            Apakah Anda yakin ingin mengakhiri sesi bimbingan ini?
          </p>

          <!-- Info Box -->
          <div
            class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 mt-0.5">
                <svg
                  class="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-blue-900 mb-1">
                  Yang akan terjadi:
                </h4>
                <ul class="text-xs text-blue-800 space-y-1">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 mt-0.5">•</span>
                    <span>Sesi akan ditutup untuk semua peserta</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 mt-0.5">•</span>
                    <span>AI akan memproses ringkasan percakapan</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 mt-0.5">•</span>
                    <span>Hasil ringkasan dapat dilihat di riwayat sesi</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6 flex gap-3">
          <button
            @click="cancelEndSession"
            :disabled="isEndingSession"
            class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            @click="confirmEndSession"
            :disabled="isEndingSession"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <div
              v-if="isEndingSession"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{
              isEndingSession ? "Mengakhiri..." : "Ya, Akhiri Sesi"
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Toast Notifications -->
  <ToastNotification />

  <div
    class="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
  >
    <!-- Header -->
    <ChatHeader
      :session-id="sessionId"
      :session-title="sessionTitle"
      :session-status="sessionStatus"
      :all-participants="allParticipants"
      :online-count="onlineCount"
      :total-count="totalParticipantCount"
      :user-type="userType"
      :is-session-owner="isSessionOwner"
      :can-leave="canLeaveSession"
      :can-end="canEndSession"
      @back="router.back()"
      @leave="handleLeaveSessionClick"
      @end="handleEndSessionClick"
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

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: all 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
  opacity: 0;
}
</style>
