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

  // Create temporary message for immediate display
  const tempMessage = {
    id: `temp-${Date.now()}`,
    session_id: sessionId,
    sender_id: userId.value,
    sender_role: userType.value === "mahasiswa" ? "student" : "lecturer",
    is_text: true,
    text: messageText,
    file_url: null,
    file_type: null,
    parent_message_id: parentId || null,
    timestamp: new Date().toISOString(),
    is_sending: true, // Flag untuk menandai pesan sedang dikirim
  };

  // Add to messages immediately
  messages.value.push(tempMessage);
  scrollToBottom();

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

    // Replace temp message with real message from server
    const tempIndex = messages.value.findIndex((m) => m.id === tempMessage.id);
    if (tempIndex !== -1) {
      messages.value.splice(tempIndex, 1);
    }

    // Message will be received via WebSocket with real ID
    scrollToBottom();
  } catch (error: any) {
    console.error("Failed to send message:", error);

    // Remove temp message on error
    const tempIndex = messages.value.findIndex((m) => m.id === tempMessage.id);
    if (tempIndex !== -1) {
      messages.value.splice(tempIndex, 1);
    }

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
      timestamp: data.timestamp || new Date().toISOString(),
    };

    // Remove temporary message if exists
    const tempIndex = messages.value.findIndex(
      (m) =>
        m.is_sending &&
        m.text === messageData.text &&
        m.sender_id === messageData.sender_id
    );
    if (tempIndex !== -1) {
      messages.value.splice(tempIndex, 1);
    }

    // Check if message already exists (by real ID)
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
    class="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
  >
    <!-- Header -->
    <div
      class="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left: Back button & Session info -->
          <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <button
              @click="router.push('/dashboard')"
              class="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 flex-shrink-0"
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
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ring-2 ring-white shadow-md"
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
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white flex items-center justify-center shadow-md"
                    :class="getAvatarColor(participant.name)"
                  >
                    <span class="text-white font-semibold text-xs sm:text-sm">
                      {{ getInitials(participant.name) }}
                    </span>
                  </div>
                </div>

                <div
                  class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"
                ></div>
              </div>

              <div class="min-w-0 flex-1">
                <h3
                  class="font-semibold text-gray-900 text-sm sm:text-base truncate"
                >
                  {{ sessionTitle }}
                </h3>
                <p class="text-xs text-gray-500 flex items-center space-x-1">
                  <span>{{ otherParticipants.length }} peserta</span>
                  <span>•</span>
                  <span class="capitalize flex items-center space-x-1">
                    <span
                      v-if="sessionStatus === 'ongoing'"
                      class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"
                    ></span>
                    <span>{{ sessionStatus }}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Right: Action buttons -->
          <div class="flex items-center space-x-2 flex-shrink-0">
            <button
              @click="handleLeaveSession"
              class="hidden sm:flex px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              Tinggalkan
            </button>
            <button
              v-if="userType === 'dosen'"
              @click="handleEndSession"
              class="hidden sm:flex px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl transition-all duration-200 shadow-sm"
            >
              Akhiri Sesi
            </button>

            <!-- Mobile menu button -->
            <button
              class="sm:hidden p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
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
      <div class="max-w-4xl mx-auto space-y-4">
        <!-- Empty state -->
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
          <h4 class="font-semibold text-gray-900 mb-2 text-lg">
            Belum ada pesan
          </h4>
          <p class="text-sm text-gray-500">
            Mulai percakapan dengan mengirim pesan pertama
          </p>
        </div>

        <!-- Messages grouped by date -->
        <div
          v-for="(msgs, date) in groupedMessages"
          :key="date"
          class="space-y-3"
        >
          <!-- Date separator -->
          <div class="flex items-center justify-center my-8">
            <div
              class="bg-white/90 backdrop-blur-sm shadow-sm rounded-full px-5 py-2 border border-gray-200/50"
            >
              <span class="text-xs text-gray-600 font-semibold">{{
                date
              }}</span>
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
                'flex items-end space-x-2 max-w-[85%] sm:max-w-lg',
                isMyMessage(message) ? 'flex-row-reverse space-x-reverse' : '',
              ]"
            >
              <!-- Avatar (only for others) -->
              <div
                v-if="!isMyMessage(message)"
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white"
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
                  class="text-xs font-medium text-gray-600 mb-1 px-1"
                >
                  {{ getSenderName(message) }}
                </div>
                <div
                  :class="[
                    'rounded-2xl px-4 py-2.5 break-words relative shadow-sm',
                    isMyMessage(message)
                      ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-900 border border-gray-200/50 rounded-tl-sm',
                    message.is_sending ? 'opacity-70' : '',
                  ]"
                >
                  <!-- Replied message (parent) -->
                  <div
                    v-if="message.parent_message_id"
                    :class="[
                      'mb-2 pb-2 border-l-3 pl-3 text-xs rounded-lg',
                      isMyMessage(message)
                        ? 'border-white/50 bg-white/10'
                        : 'border-blue-500/50 bg-gray-50',
                    ]"
                  >
                    <div class="font-semibold mb-1">
                      Membalas
                      {{
                        getSenderName(
                          messages.find(
                            (m) => m.id === message.parent_message_id
                          ) || {}
                        )
                      }}
                    </div>
                    <div class="truncate opacity-90">
                      {{
                        messages.find((m) => m.id === message.parent_message_id)
                          ?.text || "Pesan"
                      }}
                    </div>
                  </div>

                  <p
                    class="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap"
                  >
                    {{ message.text }}
                  </p>

                  <!-- Time & Status -->
                  <div
                    :class="[
                      'flex items-center space-x-1 mt-1',
                      isMyMessage(message) ? 'justify-end' : '',
                    ]"
                  >
                    <span
                      :class="[
                        'text-[10px]',
                        isMyMessage(message)
                          ? 'text-white/80'
                          : 'text-gray-500',
                      ]"
                    >
                      {{ formatTime(message.timestamp) }}
                    </span>
                    <svg
                      v-if="isMyMessage(message) && !message.is_sending"
                      class="w-3.5 h-3.5 text-white/80"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      />
                    </svg>
                    <div
                      v-if="message.is_sending"
                      class="w-3 h-3 border-2 border-white/80 border-t-transparent rounded-full animate-spin"
                    ></div>
                  </div>

                  <!-- Reply button (shown on hover) -->
                  <button
                    v-if="!message.is_sending"
                    @click="setReplyTo(message)"
                    :class="[
                      'absolute -bottom-7 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg hover:scale-110',
                      isMyMessage(message) ? 'right-0' : 'left-0',
                    ]"
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
          <span class="text-sm text-gray-500 font-medium">
            {{ typingUsers.join(", ") }} sedang mengetik...
          </span>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div
      class="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 shadow-lg"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <!-- Reply preview -->
        <div
          v-if="replyingTo"
          class="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 flex items-start justify-between shadow-sm"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <svg
                class="w-4 h-4 text-blue-600"
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
              <span class="text-xs font-semibold text-blue-700">
                Membalas {{ getSenderName(replyingTo) }}
              </span>
            </div>
            <p class="text-sm text-gray-700 truncate font-medium">
              {{ replyingTo.text }}
            </p>
          </div>
          <button
            @click="cancelReply"
            class="ml-2 p-1.5 hover:bg-blue-100 rounded-full transition-all duration-200 flex-shrink-0"
          >
            <svg
              class="w-4 h-4 text-blue-600"
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
          <div class="flex-1 relative">
            <textarea
              v-model="newMessage"
              @keypress="handleKeyPress"
              placeholder="Ketik pesan..."
              rows="1"
              :disabled="sessionStatus === 'finished'"
              class="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              style="max-height: 120px; min-height: 44px"
            ></textarea>
          </div>
          <button
            @click="handleSendMessage"
            :disabled="
              !newMessage.trim() || isSending || sessionStatus === 'finished'
            "
            class="p-3 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-xl hover:scale-105 active:scale-95"
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

        <div
          class="mt-2 text-xs text-gray-500 px-1 flex items-center space-x-1"
        >
          <svg
            class="w-3.5 h-3.5"
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
          <span>
            <span v-if="replyingTo" class="font-medium"
              >Tekan ESC untuk batal membalas ·
            </span>
            Tekan Enter untuk kirim · Shift+Enter untuk baris baru
          </span>
        </div>
      </div>
    </div>
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

textarea {
  font-family: inherit;
  line-height: 1.5;
}

/* Chat background pattern */
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
    ),
    radial-gradient(
      circle at 40% 20%,
      rgba(139, 92, 246, 0.02) 0%,
      transparent 50%
    );
  background-attachment: fixed;
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

/* WhatsApp-like tail for messages */
.rounded-tr-sm::after {
  content: "";
  position: absolute;
  top: 0;
  right: -8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 12px 8px;
  border-color: transparent transparent transparent currentColor;
  filter: drop-shadow(1px 0px 1px rgba(0, 0, 0, 0.1));
}

.rounded-tl-sm::after {
  content: "";
  position: absolute;
  top: 0;
  left: -8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 8px 12px 0;
  border-color: transparent white transparent transparent;
  filter: drop-shadow(-1px 0px 1px rgba(0, 0, 0, 0.05));
}

/* Smooth scroll behavior */
#chatContainer {
  scroll-behavior: smooth;
}
</style>
