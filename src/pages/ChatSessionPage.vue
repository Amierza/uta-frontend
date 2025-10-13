<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUser } from "../composables/useUser";
import { useSessions } from "../composables/useSession";
import { useWebSocket } from "../composables/useWebsocket";
import { useNotificationToast } from "../composables/useNotificationToast";

const route = useRoute();
const router = useRouter();
const sessionId = route.params.session_id as string;

// Composables
const { userId, userName, userType, userPhoto } = useUser();
const { sessionDetail, isLoadingDetail, fetchSessionDetail } = useSessions(
  userId,
  userType,
  ref("")
);
const { on, send } = useWebSocket();
const { show: showToast } = useNotificationToast();

// State
const messages = ref<any[]>([]);
const newMessage = ref("");
const isTyping = ref(false);
const isSending = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const typingUsers = ref<string[]>([]);

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

// Computed
const otherParticipants = computed(() => {
  if (!sessionDetail.value) return [];

  if (userType.value === "mahasiswa") {
    return sessionDetail.value.thesis.supervisors || [];
  } else {
    return [
      {
        name: sessionDetail.value.thesis.student.name,
        photo: getAvatarColor(sessionDetail.value.user_owner.identifier),
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

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || isSending.value) return;

  const messageText = newMessage.value.trim();
  newMessage.value = "";
  isSending.value = true;

  try {
    // Send message via WebSocket
    send({
      event: "send_message",
      data: {
        session_id: sessionId,
        user_id: userId.value,
        message: messageText,
        timestamp: new Date().toISOString(),
      },
    });

    // Add to local messages immediately for better UX
    messages.value.push({
      id: Date.now().toString(),
      user_id: userId.value,
      user_name: userName.value,
      user_photo: userPhoto.value,
      message: messageText,
      timestamp: new Date().toISOString(),
      status: "sending",
    });

    scrollToBottom();
  } catch (error) {
    console.error("Failed to send message:", error);
    showToast("Gagal mengirim pesan. Silakan coba lagi.", "error");
  } finally {
    isSending.value = false;
  }
};

const handleTyping = () => {
  if (!isTyping.value) {
    isTyping.value = true;
    send({
      event: "user_typing",
      data: {
        session_id: sessionId,
        user_id: userId.value,
        user_name: userName.value,
      },
    });

    setTimeout(() => {
      isTyping.value = false;
    }, 3000);
  }
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const leaveSession = () => {
  if (confirm("Apakah Anda yakin ingin meninggalkan sesi ini?")) {
    send({
      event: "leave_session",
      data: {
        session_id: sessionId,
        user_id: userId.value,
      },
    });
    router.push("/dashboard");
  }
};

const endSession = () => {
  if (confirm("Apakah Anda yakin ingin mengakhiri sesi ini?")) {
    send({
      event: "end_session",
      data: {
        session_id: sessionId,
        user_id: userId.value,
      },
    });
    showToast("Sesi bimbingan telah diakhiri.", "success");
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
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

// WebSocket listeners
const setupWebSocketListeners = () => {
  on("new_message", (message: any) => {
    // Check if message already exists
    const exists = messages.value.some((m) => m.id === message.data.id);
    if (!exists) {
      messages.value.push(message.data);
      scrollToBottom();
    }
  });

  on("user_typing", (message: any) => {
    const data = message.data;
    if (data.user_id !== userId.value) {
      if (!typingUsers.value.includes(data.user_name)) {
        typingUsers.value.push(data.user_name);
      }

      setTimeout(() => {
        typingUsers.value = typingUsers.value.filter(
          (name) => name !== data.user_name
        );
      }, 3000);
    }
  });

  on("user_joined", (message: any) => {
    const data = message.data;
    if (data.user_id !== userId.value) {
      showToast(`${data.user_name} telah bergabung ke sesi.`, "info");
    }
  });

  on("user_left", (message: any) => {
    const data = message.data;
    showToast(`${data.user_name} telah meninggalkan sesi.`, "warning");
  });

  on("session_ended", () => {
    showToast("Sesi bimbingan telah diakhiri.", "info");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  });
};

// Lifecycle
onMounted(async () => {
  await fetchSessionDetail(sessionId);
  setupWebSocketListeners();

  // Send user joined event
  send({
    event: "join_session",
    data: {
      session_id: sessionId,
      user_id: userId.value,
      user_name: userName.value,
    },
  });

  scrollToBottom();
});

onUnmounted(() => {
  // Send user left event when component unmounts
  send({
    event: "leave_session",
    data: {
      session_id: sessionId,
      user_id: userId.value,
    },
  });
});
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            @click="router.push('/dashboard')"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

          <div class="flex items-center space-x-3">
            <div class="relative">
              <!-- Single participant -->
              <div
                v-if="otherParticipants.length === 1"
                class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                :class="getAvatarColor(otherParticipants[0].name)"
              >
                <img
                  v-if="getAvatarColor(otherParticipants[0].name)"
                  :src="getAvatarColor(otherParticipants[0].name)"
                  :alt="otherParticipants[0].name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-white font-semibold text-sm">
                  {{ getInitials(otherParticipants[0].name) }}
                </span>
              </div>

              <!-- Multiple participants -->
              <div v-else class="flex -space-x-2">
                <div
                  v-for="(participant, idx) in otherParticipants.slice(0, 2)"
                  :key="idx"
                  class="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex items-center justify-center"
                  :class="getAvatarColor(participant.name)"
                >
                  <img
                    v-if="getAvatarColor(participant.name)"
                    :src="getAvatarColor(participant.name)"
                    :alt="participant.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-white font-semibold text-xs">
                    {{ getInitials(participant.name) }}
                  </span>
                </div>
              </div>

              <div
                class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
              ></div>
            </div>

            <div>
              <h3 class="font-semibold text-gray-900">{{ sessionTitle }}</h3>
              <p class="text-xs text-gray-500">
                {{ otherParticipants.length }} peserta
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="leaveSession"
            class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Tinggalkan
          </button>
          <button
            v-if="userType === 'dosen'"
            @click="endSession"
            class="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Akhiri Sesi
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingDetail" class="flex-1 flex items-center justify-center">
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
      class="flex-1 overflow-y-auto px-6 py-4 space-y-6"
    >
      <!-- Messages grouped by date -->
      <div
        v-for="(msgs, date) in groupedMessages"
        :key="date"
        class="space-y-4"
      >
        <!-- Date separator -->
        <div class="flex items-center justify-center">
          <div class="bg-gray-200 rounded-full px-4 py-1">
            <span class="text-xs text-gray-600 font-medium">{{ date }}</span>
          </div>
        </div>

        <!-- Messages -->
        <div
          v-for="message in msgs"
          :key="message.id"
          :class="[
            'flex',
            message.user_id === userId ? 'justify-end' : 'justify-start',
          ]"
        >
          <div
            :class="[
              'flex items-end space-x-2 max-w-2xl',
              message.user_id === userId
                ? 'flex-row-reverse space-x-reverse'
                : '',
            ]"
          >
            <!-- Avatar -->
            <div
              v-if="message.user_id !== userId"
              class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              :class="
                message.user_photo
                  ? 'bg-gray-200'
                  : getAvatarColor(message.user_name)
              "
            >
              <img
                v-if="message.user_photo"
                :src="message.user_photo"
                :alt="message.user_name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-white font-semibold text-xs">
                {{ getInitials(message.user_name) }}
              </span>
            </div>

            <!-- Message bubble -->
            <div class="flex flex-col">
              <div
                v-if="message.user_id !== userId"
                class="text-xs text-gray-500 mb-1 px-1"
              >
                {{ message.user_name }}
              </div>
              <div
                :class="[
                  'rounded-2xl px-4 py-3 break-words',
                  message.user_id === userId
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200',
                ]"
              >
                <p class="text-sm whitespace-pre-wrap">{{ message.message }}</p>
              </div>
              <div
                :class="[
                  'text-xs mt-1 px-1',
                  message.user_id === userId
                    ? 'text-right text-gray-500'
                    : 'text-gray-500',
                ]"
              >
                {{ formatTime(message.timestamp) }}
                <span
                  v-if="message.status === 'sending'"
                  class="ml-1 text-gray-400"
                >
                  ⏳
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="typingUsers.length > 0" class="flex items-center space-x-2">
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

    <!-- Message Input -->
    <div class="bg-white border-t border-gray-200 px-6 py-4">
      <div class="flex items-end space-x-3">
        <div class="flex-1">
          <textarea
            v-model="newMessage"
            @input="handleTyping"
            @keypress="handleKeyPress"
            placeholder="Ketik pesan Anda..."
            rows="1"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style="max-height: 120px"
          ></textarea>
        </div>
        <button
          @click="sendMessage"
          :disabled="!newMessage.trim() || isSending"
          class="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

textarea {
  font-family: inherit;
  min-height: 44px;
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
