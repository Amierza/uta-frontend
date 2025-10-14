<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUser } from "../composables/useUser";
import { useSessions } from "../composables/useSession";
import { useWebSocket } from "../composables/useWebsocket";
import { useNotificationToast } from "../composables/useNotificationToast";
import { sendMessage, getMessages } from "../api/message";
import {
  leaveSession as leaveSessionApi,
  endSession as endSessionApi,
} from "../api/session";

const route = useRoute();
const router = useRouter();
const sessionId = route.params.session_id as string;

// Composables
const { userId, userType, userIdentifier } = useUser();
const { sessionDetail, isLoadingDetail, fetchSessionDetail } = useSessions(
  userId,
  userType,
  userIdentifier
);
const { on } = useWebSocket();
const { show: showToast } = useNotificationToast();

// State
const messages = ref<any[]>([]);
const newMessage = ref("");
const replyingTo = ref<any | null>(null);
const isSending = ref(false);
const isLoadingMessages = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const typingUsers = ref<string[]>([]);

// Computed
const otherParticipants = computed(() => {
  if (!sessionDetail.value) return [];

  if (userType.value === "mahasiswa") {
    return sessionDetail.value.thesis.supervisors || [];
  } else {
    return [
      {
        id: sessionDetail.value.thesis.student.id,
        name: sessionDetail.value.thesis.student.name,
        identifier: sessionDetail.value.thesis.student.identifier,
        photo: null,
      },
    ];
  }
});

const sessionTitle = computed(() => {
  if (!sessionDetail.value) return "Loading...";

  if (userType.value === "mahasiswa") {
    const supervisors = sessionDetail.value.thesis.supervisors;
    if (supervisors.length > 1) {
      return `Bimbingan dengan ${supervisors
        .map((s: any) => s.name)
        .join(" & ")}`;
    }
    return `Bimbingan dengan ${supervisors[0]?.name || "Dosen"}`;
  } else {
    return `Bimbingan dengan ${sessionDetail.value.thesis.student.name}`;
  }
});

const sessionStatus = computed(() => {
  return sessionDetail.value?.status || "ongoing";
});

// Functions
const getInitials = (name: string) => {
  if (!name) return "?";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-teal-500",
  ];

  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const fetchMessages = async () => {
  try {
    isLoadingMessages.value = true;
    const response = await getMessages(sessionId);

    if (response.status && response.data) {
      messages.value = Array.isArray(response.data)
        ? response.data
        : [response.data];
      scrollToBottom();
    }
  } catch (error) {
    console.error("Failed to fetch messages:", error);
  } finally {
    isLoadingMessages.value = false;
  }
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim() || isSending.value) return;

  const messageText = newMessage.value.trim();
  const parentId = replyingTo.value?.id;

  newMessage.value = "";
  replyingTo.value = null;
  isSending.value = true;

  try {
    const payload: any = {
      is_text: true,
      text: messageText,
    };

    if (parentId) {
      payload.parent_message_id = parentId;
    }

    await sendMessage(sessionId, payload);

    // Message will be received via WebSocket
    scrollToBottom();
  } catch (error: any) {
    console.error("Failed to send message:", error);
    showToast(
      error.response?.data?.message ||
        "Gagal mengirim pesan. Silakan coba lagi.",
      "error"
    );
    // Restore message on error
    newMessage.value = messageText;
  } finally {
    isSending.value = false;
  }
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  } else if (event.key === "Escape") {
    replyingTo.value = null;
  }
};

const setReplyTo = (message: any) => {
  replyingTo.value = message;
  // Focus on textarea
  nextTick(() => {
    const textarea = document.querySelector("textarea");
    if (textarea) textarea.focus();
  });
};

const cancelReply = () => {
  replyingTo.value = null;
};

const handleLeaveSession = async () => {
  if (confirm("Apakah Anda yakin ingin meninggalkan sesi ini?")) {
    try {
      await leaveSessionApi(sessionId);
      showToast("Anda telah meninggalkan sesi.", "success");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to leave session:", error);
      showToast(
        error.response?.data?.message || "Gagal meninggalkan sesi.",
        "error"
      );
    }
  }
};

const handleEndSession = async () => {
  if (confirm("Apakah Anda yakin ingin mengakhiri sesi ini?")) {
    try {
      await endSessionApi(sessionId);
      showToast("Sesi bimbingan telah diakhiri.", "success");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to end session:", error);
      showToast(
        error.response?.data?.message || "Gagal mengakhiri sesi.",
        "error"
      );
    }
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hari Ini";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Kemarin";
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
};

// Group messages by date
const groupedMessages = computed(() => {
  const groups: Record<string, any[]> = {};

  messages.value.forEach((msg) => {
    const dateKey = formatDate(msg.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
  });

  return groups;
});

// Get sender name from message
const getSenderName = (message: any) => {
  if (!sessionDetail.value) return "Unknown";

  if (message.sender_role === "student") {
    return sessionDetail.value.thesis.student.name;
  } else {
    const supervisor = sessionDetail.value.thesis.supervisors.find(
      (s: any) => s.id === message.sender_id
    );
    return supervisor?.name || "Dosen";
  }
};

// Check if message is from current user
const isMyMessage = (message: any) => {
  return message.sender_id === userId.value;
};

// WebSocket listeners
const setupWebSocketListeners = () => {
  // New message event
  on("new_message", (data: any) => {
    console.log("📨 New message received:", data);

    const messageData = {
      id: data.id,
      session_id: data.session_id,
      sender_id: data.sender_id,
      sender_role: data.sender_role,
      is_text: data.is_text,
      text: data.text,
      file_url: data.file_url,
      file_type: data.file_type,
      parent_message_id: data.parent_message_id,
      timestamp: new Date().toISOString(),
    };

    // Check if message already exists
    const exists = messages.value.some((m) => m.id === messageData.id);
    if (!exists) {
      messages.value.push(messageData);
      scrollToBottom();
    }
  });

  // Session started event
  on("session_started", (data: any) => {
    console.log("🎬 Session started:", data);
    if (data.student_name) {
      showToast(`${data.student_name} telah memulai sesi bimbingan.`, "info");
    }
  });

  // User joined events
  on("primary_lecturer_joined", (data: any) => {
    console.log("👤 Primary lecturer joined:", data);
    const supervisor = data.supervisors?.find(
      (s: any) => s.role === "primary_lecturer"
    );
    if (supervisor && supervisor.id !== userId.value) {
      showToast(`${supervisor.name} telah bergabung ke sesi.`, "info");
    }
  });

  on("secondary_lecturer_joined", (data: any) => {
    console.log("👤 Secondary lecturer joined:", data);
    const supervisor = data.supervisors?.find(
      (s: any) => s.role === "secondary_lecturer"
    );
    if (supervisor && supervisor.id !== userId.value) {
      showToast(`${supervisor.name} telah bergabung ke sesi.`, "info");
    }
  });

  on("student_joined", (data: any) => {
    console.log("👤 Student joined:", data);
    if (data.student_id !== userId.value) {
      showToast(`${data.student_name} telah bergabung ke sesi.`, "info");
    }
  });

  // User left events
  on("primary_lecturer_leaved", (data: any) => {
    console.log("👋 Primary lecturer left:", data);
    showToast("Pembimbing utama telah meninggalkan sesi.", "warning");
  });

  on("secondary_lecturer_leaved", (data: any) => {
    console.log("👋 Secondary lecturer left:", data);
    showToast("Pembimbing kedua telah meninggalkan sesi.", "warning");
  });

  on("student_leaved", (data: any) => {
    console.log("👋 Student left:", data);
    if (data.student_name) {
      showToast(`${data.student_name} telah meninggalkan sesi.`, "warning");
    }
  });

  // Session ended event
  on("user_ended", (data: any) => {
    console.log("🔚 Session ended:", data);
    showToast("Sesi bimbingan telah diakhiri.", "info");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  });
};

// Watch for session status changes
watch(sessionStatus, (newStatus) => {
  if (newStatus === "finished") {
    showToast("Sesi telah selesai. Anda akan diarahkan ke dashboard.", "info");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  }
});

// Lifecycle
onMounted(async () => {
  await fetchSessionDetail(sessionId);
  await fetchMessages();
  setupWebSocketListeners();
  scrollToBottom();
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<template>
  <div
    class="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100"
  >
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left: Back button & Session info -->
          <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <button
              @click="router.push('/dashboard')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div class="flex items-center space-x-3 min-w-0 flex-1">
              <div class="relative flex-shrink-0">
                <!-- Single participant -->
                <div
                  v-if="otherParticipants.length === 1"
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                  :class="getAvatarColor(otherParticipants[0].name)"
                >
                  <span class="text-white font-semibold text-sm sm:text-base">
                    {{ getInitials(otherParticipants[0].name) }}
                  </span>
                </div>

                <!-- Multiple participants -->
                <div v-else class="flex -space-x-2">
                  <div
                    v-for="(participant, idx) in otherParticipants.slice(0, 2)"
                    :key="idx"
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white flex items-center justify-center"
                    :class="getAvatarColor(participant.name)"
                  >
                    <span class="text-white font-semibold text-xs sm:text-sm">
                      {{ getInitials(participant.name) }}
                    </span>
                  </div>
                </div>

                <div
                  class="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white"
                ></div>
              </div>

              <div class="min-w-0 flex-1">
                <h3
                  class="font-semibold text-gray-900 text-sm sm:text-base truncate"
                >
                  {{ sessionTitle }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ otherParticipants.length }} peserta ·
                  <span class="capitalize">{{ sessionStatus }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Right: Action buttons -->
          <div class="flex items-center space-x-2 flex-shrink-0">
            <button
              @click="handleLeaveSession"
              class="hidden sm:flex px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Tinggalkan
            </button>
            <button
              v-if="userType === 'dosen'"
              @click="handleEndSession"
              class="hidden sm:flex px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Akhiri Sesi
            </button>

            <!-- Mobile menu button -->
            <button
              class="sm:hidden p-2 hover:bg-gray-100 rounded-lg"
              @click="() => {}"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoadingDetail || isLoadingMessages"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"
        ></div>
        <p class="text-sm text-gray-500 mt-4">Memuat sesi bimbingan...</p>
      </div>
    </div>

    <!-- Chat Container -->
    <div
      v-else
      ref="chatContainer"
      class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
    >
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Empty state -->
        <div v-if="messages.length === 0" class="text-center py-12">
          <div
            class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-gray-400"
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
          <h4 class="font-medium text-gray-900 mb-2">Belum ada pesan</h4>
          <p class="text-sm text-gray-500">
            Mulai percakapan dengan mengirim pesan pertama
          </p>
        </div>

        <!-- Messages grouped by date -->
        <div
          v-for="(msgs, date) in groupedMessages"
          :key="date"
          class="space-y-4"
        >
          <!-- Date separator -->
          <div class="flex items-center justify-center my-6">
            <div
              class="bg-white shadow-sm rounded-full px-4 py-1.5 border border-gray-200"
            >
              <span class="text-xs text-gray-600 font-medium">{{ date }}</span>
            </div>
          </div>

          <!-- Messages -->
          <div
            v-for="message in msgs"
            :key="message.id"
            :class="[
              'flex group',
              isMyMessage(message) ? 'justify-end' : 'justify-start',
            ]"
          >
            <div
              :class="[
                'flex items-end space-x-2 max-w-[85%] sm:max-w-2xl',
                isMyMessage(message) ? 'flex-row-reverse space-x-reverse' : '',
              ]"
            >
              <!-- Avatar -->
              <div
                v-if="!isMyMessage(message)"
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                :class="getAvatarColor(getSenderName(message))"
              >
                <span class="text-white font-semibold text-xs">
                  {{ getInitials(getSenderName(message)) }}
                </span>
              </div>

              <!-- Message bubble -->
              <div class="flex flex-col min-w-0 flex-1">
                <div
                  v-if="!isMyMessage(message)"
                  class="text-xs text-gray-500 mb-1 px-1"
                >
                  {{ getSenderName(message) }}
                </div>
                <div
                  :class="[
                    'rounded-2xl px-4 py-2.5 sm:py-3 break-words shadow-sm relative',
                    isMyMessage(message)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200',
                  ]"
                >
                  <!-- Replied message (parent) -->
                  <div
                    v-if="message.parent_message_id"
                    :class="[
                      'mb-2 pb-2 border-l-2 pl-2 text-xs opacity-75',
                      isMyMessage(message) ? 'border-white' : 'border-gray-400',
                    ]"
                  >
                    <div class="font-medium mb-1">
                      Membalas
                      {{
                        getSenderName(
                          messages.find(
                            (m) => m.id === message.parent_message_id
                          ) || {}
                        )
                      }}
                    </div>
                    <div class="truncate">
                      {{
                        messages.find((m) => m.id === message.parent_message_id)
                          ?.text || "Pesan"
                      }}
                    </div>
                  </div>

                  <p class="text-sm whitespace-pre-wrap">{{ message.text }}</p>

                  <!-- Reply button (shown on hover) -->
                  <button
                    @click="setReplyTo(message)"
                    class="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50"
                    title="Balas pesan"
                  >
                    <svg
                      class="w-3.5 h-3.5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  :class="[
                    'text-xs mt-1 px-1',
                    isMyMessage(message)
                      ? 'text-right text-gray-500'
                      : 'text-gray-500',
                  ]"
                >
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div
          v-if="typingUsers.length > 0"
          class="flex items-center space-x-2 px-2"
        >
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style="animation-delay: 0.1s"
            ></div>
            <div
              class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style="animation-delay: 0.2s"
            ></div>
          </div>
          <span class="text-sm text-gray-500">
            {{ typingUsers.join(", ") }} sedang mengetik...
          </span>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="bg-white border-t border-gray-200 shadow-lg">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <!-- Reply preview -->
        <div
          v-if="replyingTo"
          class="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              <span class="text-xs font-medium text-gray-700">
                Membalas {{ getSenderName(replyingTo) }}
              </span>
            </div>
            <p class="text-sm text-gray-600 truncate">{{ replyingTo.text }}</p>
          </div>
          <button
            @click="cancelReply"
            class="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
          >
            <svg
              class="w-4 h-4 text-gray-500"
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
          </button>
        </div>

        <div class="flex items-end space-x-2 sm:space-x-3">
          <div class="flex-1">
            <textarea
              v-model="newMessage"
              @keypress="handleKeyPress"
              placeholder="Ketik pesan Anda..."
              rows="1"
              :disabled="sessionStatus === 'finished'"
              class="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              style="max-height: 120px; min-height: 44px"
            ></textarea>
          </div>
          <button
            @click="handleSendMessage"
            :disabled="
              !newMessage.trim() || isSending || sessionStatus === 'finished'
            "
            class="p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
          >
            <svg
              v-if="!isSending"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <div
              v-else
              class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
          </button>
        </div>

        <div class="mt-2 text-xs text-gray-500 px-1">
          <span v-if="replyingTo">Tekan ESC untuk batal membalas · </span>
          Tekan Enter untuk kirim, Shift+Enter untuk baris baru
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

textarea {
  font-family: inherit;
  line-height: 1.5;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.5rem);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
