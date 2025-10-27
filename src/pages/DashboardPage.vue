<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import type { SessionResponse } from "../types/session";

// Composables
import { useUser } from "../composables/useUser";
import { useNotifications } from "../composables/useNotification";
import { useNotificationDetail } from "../composables/useNotificationDetail";
import { useSessions } from "../composables/useSession";
import { useNotificationToast } from "../composables/useNotificationToast";
import { useWebSocket } from "../composables/useWebsocket";
import { useSchedule } from "../composables/useSchedule";

// Components
import DashboardHeader from "../components/DashboardHeader.vue";
import NotificationsList from "../components/NotificationsList.vue";
import RecentSessions from "../components/RecentSessions.vue";
import ToastNotification from "../components/ToastNotification.vue";
import JoinSessionModal from "../components/JoinSessionModal.vue";
import UpcomingSchedules from "../components/UpcomingSchedules.vue";

const router = useRouter();

// Composables
const {
  userId,
  userType,
  userName,
  userIdentifier,
  userThesisId,
  userPhoto,
  userTotalStudent,
  userStudyProgram,
  userFaculty,
  isLoadingProfile,
  fetchUserProfile,
} = useUser();

const { notifications, isLoadingNotifications, fetchNotifications } =
  useNotifications(userId);

const { fetchNotificationDetail } = useNotificationDetail();

const {
  sessions,
  isLoadingSessions,
  isStartingSession,
  fetchSessions,
  startSession,
  joinActiveSession,
} = useSessions(userId, userType, userIdentifier);

const { show: showToast } = useNotificationToast();
const { connect, on, isConnected, disconnect } = useWebSocket();

const {
  schedules,
  isLoading: isLoadingSchedules,
  fetchSchedules,
} = useSchedule();

const isRefreshing = ref(false);
const webSocketReconnectAttempts = ref(0);
const maxReconnectAttempts = 5;
const showJoinModal = ref(false);
const isJoiningSession = ref(false);
let webSocketListenersSetup = false;

// Computed stats
const totalSessions = computed(() => sessions.value.length);
const finishedSessions = computed(
  () => sessions.value.filter((s) => s.status === "finished").length
);
const pendingSchedules = computed(
  () => schedules.value.filter((s) => s.status === "pending").length
);
const approvedSchedules = computed(
  () => schedules.value.filter((s) => s.status === "approved").length
);

// Next schedule
const nextSchedule = computed(() => {
  const now = new Date();
  const upcoming = schedules.value
    .filter((s) => s.status === "approved" && new Date(s.proposed_at) >= now)
    .sort(
      (a, b) =>
        new Date(a.proposed_at).getTime() - new Date(b.proposed_at).getTime()
    );
  return upcoming[0] || null;
});

const formatScheduleDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Handlers
const handleSessionClick = async (session: SessionResponse) => {
  try {
    const status = session.status.toLowerCase();
    if (status === "finished" || status === "completed") {
      router.push(`/session/${session.id}`);
      return;
    }
    if (status === "waiting" || status === "ongoing") {
      await joinActiveSession(session.id);
      router.push(`/session/${session.id}`);
      return;
    }
    router.push(`/session/${session.id}`);
  } catch (error: any) {
    showToast(error.message || "Gagal mengakses sesi.", "error");
  }
};

const handleNewSession = async () => {
  if (!userThesisId.value) {
    showToast("Thesis ID tidak ditemukan.", "error");
    return;
  }
  try {
    const sessionData = await startSession(userThesisId.value);
    if (sessionData?.id) {
      showToast("Sesi baru telah dibuat!", "success");
      router.push(`/waiting-room/${sessionData.id}`);
    }
  } catch (error: any) {
    showToast(error.message || "Gagal memulai sesi bimbingan.", "error");
  }
};

const handleJoinWithId = () => {
  showJoinModal.value = true;
};

const handleJoinModalClose = () => {
  showJoinModal.value = false;
};

const handleJoinSession = async (sessionId: string) => {
  try {
    isJoiningSession.value = true;
    await joinActiveSession(sessionId);
    showToast("Berhasil bergabung ke sesi!", "success");
    showJoinModal.value = false;
    router.push(`/session/${sessionId}`);
  } catch (error: any) {
    showToast(error.message || "Gagal bergabung ke sesi.", "error");
  } finally {
    isJoiningSession.value = false;
  }
};

const handleNotificationClick = async (notificationId: string) => {
  try {
    const detailData = await fetchNotificationDetail(notificationId);
    const index = notifications.value.findIndex((n) => n.id === notificationId);
    if (index !== -1 && detailData) {
      notifications.value[index] = {
        ...notifications.value[index],
        ...detailData,
        is_read: true,
      };
    }
  } catch (error: any) {
    console.error("❌ Error fetching notification detail:", error);
  }
};

// WebSocket
const setupWebSocketListeners = () => {
  if (webSocketListenersSetup) return;
  webSocketListenersSetup = true;

  on("session_started", (data: any) => {
    fetchSessions(false);
    fetchNotifications();
    showToast(`${data.student_name || "Mahasiswa"} memulai sesi`, "info");
  });
  on("primary_lecturer_joined", () => {
    fetchSessions(false);
    fetchNotifications();
  });
  on("secondary_lecturer_joined", () => {
    fetchSessions(false);
    fetchNotifications();
  });
  on("student_joined", () => {
    fetchSessions(false);
    fetchNotifications();
  });
  on("user_ended", () => {
    fetchSessions(false);
    fetchNotifications();
    showToast("Sesi bimbingan telah berakhir", "info");
  });
  on("primary_lecturer_leaved", () => {
    fetchSessions(false);
    fetchNotifications();
  });
  on("secondary_lecturer_leaved", () => {
    fetchSessions(false);
    fetchNotifications();
  });
  on("student_leaved", () => {
    fetchSessions(false);
    fetchNotifications();
  });
};

const connectWebSocket = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return;
  if (isConnected.value) {
    setupWebSocketListeners();
    return;
  }
  connect(token);
};

const handleWebSocketReconnect = () => {
  if (webSocketReconnectAttempts.value >= maxReconnectAttempts) {
    showToast("Koneksi terputus. Silakan refresh halaman.", "error");
    return;
  }
  webSocketReconnectAttempts.value++;
  setTimeout(() => connectWebSocket(), 2000 * webSocketReconnectAttempts.value);
};

const refreshData = async () => {
  if (isRefreshing.value) return;
  try {
    isRefreshing.value = true;
    await Promise.all([
      fetchNotifications(),
      fetchSessions(false),
      fetchSchedules(),
    ]);
    showToast("Data berhasil diperbarui", "success");
  } catch (error) {
    showToast("Gagal memperbarui data", "error");
  } finally {
    isRefreshing.value = false;
  }
};

const logout = () => {
  if (isConnected.value) disconnect();
  localStorage.clear();
  router.push("/");
};

watch(isConnected, (connected, wasConnected) => {
  if (connected) {
    webSocketReconnectAttempts.value = 0;
    setupWebSocketListeners();
  } else if (wasConnected !== undefined) {
    handleWebSocketReconnect();
  }
});

onMounted(async () => {
  try {
    await fetchUserProfile();
  } catch (error) {
    showToast("Gagal memuat profil pengguna", "error");
    setTimeout(logout, 2000);
    return;
  }
  connectWebSocket();
  try {
    await Promise.all([
      fetchNotifications(),
      fetchSessions(false),
      fetchSchedules(),
    ]);
  } catch (error) {
    showToast("Gagal memuat data awal", "error");
  }
});

onUnmounted(() => {
  webSocketListenersSetup = false;
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
  >
    <ToastNotification />
    <JoinSessionModal
      :is-open="showJoinModal"
      :is-joining="isJoiningSession"
      @close="handleJoinModalClose"
      @join="handleJoinSession"
    />

    <DashboardHeader
      :user-name="userName"
      :user-identifier="userIdentifier"
      :user-type="userType"
      :is-online="isConnected"
      :user-photo="userPhoto"
      :is-loading="isLoadingProfile"
      @logout="logout"
      @refresh="refreshData"
    />

    <!-- Loading Overlay -->
    <div
      v-if="isLoadingProfile"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"
        ></div>
        <p class="text-gray-700 font-medium">Memuat dashboard...</p>
      </div>
    </div>

    <main
      class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
    >
      <!-- Welcome Section -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Halo, {{ userName }}! 👋
        </h1>
        <p class="text-gray-600">
          <span v-if="userType === 'mahasiswa'"
            >{{ userStudyProgram }} • {{ userFaculty }}</span
          >
          <span v-else>{{ userTotalStudent }} Mahasiswa Bimbingan</span>
        </p>
      </div>

      <!-- Connection Warning -->
      <div
        v-if="!isConnected"
        class="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl shadow-sm animate-pulse"
      >
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-yellow-400 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-yellow-800">Koneksi terputus</p>
            <p class="text-xs text-yellow-700 mt-1">
              Mencoba menghubungkan kembali... ({{
                webSocketReconnectAttempts
              }}/{{ maxReconnectAttempts }})
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Total Sessions -->
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer"
          @click="router.push('/sessions')"
        >
          <div class="flex items-center justify-between mb-2">
            <div
              class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
            >
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ totalSessions }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Sesi</p>
        </div>

        <!-- Finished Sessions -->
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
        >
          <div class="flex items-center justify-between mb-2">
            <div
              class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ finishedSessions }}</p>
          <p class="text-xs text-gray-500 mt-1">Selesai</p>
        </div>

        <!-- Approved Schedules -->
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer"
          @click="router.push('/schedules')"
        >
          <div class="flex items-center justify-between mb-2">
            <div
              class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">
            {{ approvedSchedules }}
          </p>
          <p class="text-xs text-gray-500 mt-1">Jadwal Disetujui</p>
        </div>

        <!-- Pending Schedules (Dosen only) -->
        <div
          v-if="userType === 'dosen'"
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer"
          @click="router.push('/schedules')"
        >
          <div class="flex items-center justify-between mb-2">
            <div
              class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ pendingSchedules }}</p>
          <p class="text-xs text-gray-500 mt-1">Menunggu Approval</p>
        </div>

        <!-- Next Schedule (Mahasiswa) -->
        <div
          v-else-if="nextSchedule"
          class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-4 text-white cursor-pointer hover:shadow-xl transition-all"
          @click="router.push('/schedules')"
        >
          <div class="flex items-center justify-between mb-2">
            <div
              class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm"
            >
              <svg
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <p class="text-xs opacity-90 mb-1">Jadwal Berikutnya</p>
          <p class="text-sm font-bold">
            {{ formatScheduleDate(nextSchedule.proposed_at) }}
          </p>
        </div>
        <div
          v-else
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <div
              class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p class="text-sm text-gray-500">Belum ada jadwal</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Schedules + Notifications (2 col) -->
        <div class="lg:col-span-2 space-y-6">
          <NotificationsList
            :notifications="notifications"
            :is-loading="isLoadingNotifications"
            @notification-click="handleNotificationClick"
          />
          <UpcomingSchedules
            :schedules="schedules"
            :is-loading="isLoadingSchedules"
            :user-type="userType"
          />
        </div>

        <!-- Right: Recent Sessions (1 col) -->
        <div class="lg:col-span-1">
          <RecentSessions
            :sessions="sessions"
            :user-type="userType"
            :user-id="userId"
            :is-loading="isLoadingSessions"
            :is-starting-session="isStartingSession"
            @session-click="handleSessionClick"
            @new-session="handleNewSession"
            @join-with-id="handleJoinWithId"
          />
        </div>
      </div>
    </main>

    <!-- Floating Refresh Button -->
    <button
      @click="refreshData"
      :disabled="isRefreshing"
      class="hidden lg:flex fixed bottom-8 right-8 items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 z-40"
    >
      <svg
        :class="{ 'animate-spin': isRefreshing }"
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1, #94a3b8);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8, #64748b);
}
</style>
