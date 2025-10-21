<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";

// Composables
import { useUser } from "../composables/useUser";
import { useNotifications } from "../composables/useNotification";
import { useSessions } from "../composables/useSession";
import { useNotificationToast } from "../composables/useNotificationToast";
import { useWebSocket } from "../composables/useWebsocket";

// Components
import DashboardHeader from "../components/DashboardHeader.vue";
import WelcomeCard from "../components/WelcomeCard.vue";
import ProgressCard from "../components/ProgressCard.vue";
import NotificationsList from "../components/NotificationsList.vue";
import RecentSessions from "../components/RecentSessions.vue";
import ToastNotification from "../components/ToastNotification.vue";

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

// State
const progressData = ref({
  mahasiswa: {
    totalMeetings: 12,
    nextSchedule: "Bimbingan dengan Dr. Ahmad Fauzi - 14:00",
  },
  dosen: {
    totalStudents: 15,
    nextSchedule: "Bimbingan dengan Ahmad Fauzi - 14:00",
  },
});

const isRefreshing = ref(false);
const webSocketReconnectAttempts = ref(0);
const maxReconnectAttempts = 5;

// WebSocket state tracker
let webSocketListenersSetup = false;

const handleSessionClick = async (sessionId: string) => {
  try {
    console.log("🔗 Joining session:", sessionId);
    await joinActiveSession(sessionId);
    router.push(`/session/${sessionId}`);
  } catch (error: any) {
    console.error("❌ Failed to join session:", error);
    showToast(
      error.message || "Gagal bergabung ke sesi. Silakan coba lagi.",
      "error"
    );
  }
};

const handleNewSession = async () => {
  if (!userThesisId.value) {
    console.error("❌ Thesis ID not found");
    showToast("Thesis ID tidak ditemukan. Silakan hubungi admin.", "error");
    return;
  }

  try {
    console.log("🚀 Starting new session for thesis:", userThesisId.value);
    const sessionData = await startSession(userThesisId.value);

    if (sessionData && sessionData.id) {
      showToast("Sesi baru telah dibuat!", "success");
      router.push(`/waiting-room/${sessionData.id}`);
    } else {
      throw new Error("Session ID tidak ditemukan dalam response");
    }
  } catch (error: any) {
    console.error("❌ Failed to start session:", error);
    showToast(
      error.message || "Gagal memulai sesi bimbingan. Silakan coba lagi.",
      "error"
    );
  }
};

// WebSocket setup
const setupWebSocketListeners = () => {
  if (webSocketListenersSetup) {
    console.log("⏭️ WebSocket listeners already setup, skipping");
    return;
  }

  webSocketListenersSetup = true;
  console.log("🔌 Setting up WebSocket listeners for Dashboard");

  // Event: Session started
  on("session_started", (data: any) => {
    console.log("📢 [WS] session_started:", data);
    fetchSessions();

    const studentName = data.student_name || "Mahasiswa";
    showToast(`${studentName} memulai sesi bimbingan`, "info");
  });

  // Event: Primary lecturer joined
  on("primary_lecturer_joined", (data: any) => {
    console.log("📢 [WS] primary_lecturer_joined:", data);
    fetchSessions();
  });

  // Event: Secondary lecturer joined
  on("secondary_lecturer_joined", (data: any) => {
    console.log("📢 [WS] secondary_lecturer_joined:", data);
    fetchSessions();
  });

  // Event: Student joined
  on("student_joined", (data: any) => {
    console.log("📢 [WS] student_joined:", data);
    fetchSessions();
  });

  // Event: Session ended
  on("user_ended", (data: any) => {
    console.log("📢 [WS] user_ended:", data);
    fetchSessions();
    showToast("Sesi bimbingan telah berakhir", "info");
  });

  // Event: Lecturer left
  on("primary_lecturer_leaved", (data: any) => {
    console.log("📢 [WS] primary_lecturer_leaved:", data);
    fetchSessions();
  });

  on("secondary_lecturer_leaved", (data: any) => {
    console.log("📢 [WS] secondary_lecturer_leaved:", data);
    fetchSessions();
  });

  // Event: Student left
  on("student_leaved", (data: any) => {
    console.log("📢 [WS] student_leaved:", data);
    fetchSessions();
  });

  console.log("✅ All WebSocket listeners registered for Dashboard");
};

// WebSocket connection manager
const connectWebSocket = () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    console.error("❌ No access token found");
    return;
  }

  if (isConnected.value) {
    console.log("✅ WebSocket already connected");
    setupWebSocketListeners();
    return;
  }

  console.log("🔌 Connecting WebSocket...");
  connect(token);
};

const handleWebSocketReconnect = () => {
  if (webSocketReconnectAttempts.value >= maxReconnectAttempts) {
    console.error("❌ Max WebSocket reconnection attempts reached");
    showToast("Koneksi terputus. Silakan refresh halaman.", "error");
    return;
  }

  webSocketReconnectAttempts.value++;
  console.log(
    `🔄 Reconnecting WebSocket (attempt ${webSocketReconnectAttempts.value}/${maxReconnectAttempts})`
  );

  setTimeout(() => {
    connectWebSocket();
  }, 2000 * webSocketReconnectAttempts.value); // Exponential backoff
};

// Refresh data handler
const refreshData = async () => {
  if (isRefreshing.value) return;

  try {
    isRefreshing.value = true;
    console.log("🔄 Refreshing dashboard data...");

    await Promise.all([fetchNotifications(), fetchSessions()]);

    console.log("✅ Dashboard data refreshed");
    showToast("Data berhasil diperbarui", "success");
  } catch (error) {
    console.error("❌ Failed to refresh data:", error);
    showToast("Gagal memperbarui data", "error");
  } finally {
    isRefreshing.value = false;
  }
};

const logout = () => {
  console.log("👋 Logging out...");

  // Disconnect WebSocket
  if (isConnected.value) {
    disconnect();
  }

  // Clear local storage
  localStorage.clear();

  // Redirect to login
  router.push("/");
};

// Watch WebSocket connection status
watch(isConnected, (connected, wasConnected) => {
  console.log(`🔗 WebSocket status changed: ${wasConnected} → ${connected}`);

  if (connected) {
    console.log("✅ WebSocket connected");
    webSocketReconnectAttempts.value = 0; // Reset attempts
    setupWebSocketListeners();
  } else if (wasConnected !== undefined) {
    // Only try to reconnect if it was previously connected
    console.warn("⚠️ WebSocket disconnected");
    handleWebSocketReconnect();
  }
});

// Lifecycle
onMounted(async () => {
  console.log("=== 🏠 DASHBOARD MOUNTED ===");

  try {
    // Step 1: Load user profile
    console.log("1️⃣ Loading user profile...");
    await fetchUserProfile();
    console.log("✅ User profile loaded:", {
      userId: userId.value,
      userType: userType.value,
      userName: userName.value,
    });
  } catch (error) {
    console.error("❌ Failed to load user profile:", error);
    showToast("Gagal memuat profil pengguna", "error");

    // If profile fails, redirect to login
    setTimeout(() => {
      logout();
    }, 2000);
    return;
  }

  // Step 2: Connect WebSocket
  console.log("2️⃣ Connecting WebSocket...");
  connectWebSocket();

  // Step 3: Load initial data
  console.log("3️⃣ Loading initial data...");
  try {
    await Promise.all([fetchNotifications(), fetchSessions()]);
    console.log("✅ Initial data loaded");
  } catch (error) {
    console.error("❌ Failed to load initial data:", error);
    showToast("Gagal memuat data awal", "error");
  }

  console.log("=== ✅ DASHBOARD INITIALIZATION COMPLETE ===");
});

onUnmounted(() => {
  console.log("👋 Dashboard unmounting...");
  webSocketListenersSetup = false;

  // Don't disconnect WebSocket here, keep it alive for navigation
  // disconnect();
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
  >
    <!-- Toast Notifications (z-index: 60, above header which is 50) -->
    <ToastNotification />

    <!-- Header -->
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

    <!-- Main Content -->
    <main
      class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        <!-- Left Column - Profile, Progress & Quick Actions -->
        <div class="lg:col-span-4 space-y-4 sm:space-y-6">
          <!-- Welcome Card -->
          <WelcomeCard
            :user-name="userName"
            :user-type="userType"
            :user-study-program="userStudyProgram"
            :user-faculty="userFaculty"
            :user-total-student="userTotalStudent"
            :is-loading="isLoadingProfile"
            class="transform transition-all duration-300 hover:scale-[1.02]"
          />

          <!-- Progress Card -->
          <ProgressCard
            :user-type="userType"
            :total-meetings="progressData.mahasiswa.totalMeetings"
            :next-schedule="
              userType === 'mahasiswa'
                ? progressData.mahasiswa.nextSchedule
                : progressData.dosen.nextSchedule
            "
            class="transform transition-all duration-300 hover:scale-[1.02]"
          />
        </div>

        <!-- Right Column - Notifications & Sessions -->
        <div class="lg:col-span-8 space-y-4 sm:space-y-6">
          <!-- Connection Status Banner (Only show if disconnected) -->
          <div
            v-if="!isConnected"
            class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl shadow-sm animate-pulse"
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
                <p class="text-sm font-medium text-yellow-800">
                  Koneksi terputus
                </p>
                <p class="text-xs text-yellow-700 mt-1">
                  Mencoba menghubungkan kembali... ({{
                    webSocketReconnectAttempts
                  }}/{{ maxReconnectAttempts }})
                </p>
              </div>
            </div>
          </div>

          <!-- Notifications List -->
          <NotificationsList
            :notifications="notifications"
            :is-loading="isLoadingNotifications"
            class="transform transition-all duration-300"
          />

          <!-- Recent Sessions -->
          <RecentSessions
            :sessions="sessions"
            :user-type="userType"
            :user-id="userId"
            :is-loading="isLoadingSessions"
            :is-starting-session="isStartingSession"
            @session-click="handleSessionClick"
            @new-session="handleNewSession"
            class="transform transition-all duration-300"
          />
        </div>
      </div>
    </main>

    <!-- Floating Refresh Button (Desktop) -->
    <button
      @click="refreshData"
      :disabled="isRefreshing"
      class="hidden lg:flex fixed bottom-8 right-8 items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed z-40"
      title="Refresh data"
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
/* Custom scrollbar */
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

/* Smooth transitions */
* {
  transition-property: transform, opacity, box-shadow;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Prevent transition on page load */
.no-transition {
  transition: none !important;
}

/* Responsive improvements */
@media (max-width: 640px) {
  main {
    padding-left: 12px;
    padding-right: 12px;
  }
}

/* Animation for cards */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lg\:col-span-4 > *,
.lg\:col-span-8 > * {
  animation: fadeInUp 0.5s ease-out;
}

/* Stagger animation */
.lg\:col-span-4 > *:nth-child(1) {
  animation-delay: 0.1s;
}

.lg\:col-span-4 > *:nth-child(2) {
  animation-delay: 0.2s;
}

.lg\:col-span-4 > *:nth-child(3) {
  animation-delay: 0.3s;
}

.lg\:col-span-8 > *:nth-child(1) {
  animation-delay: 0.15s;
}

.lg\:col-span-8 > *:nth-child(2) {
  animation-delay: 0.25s;
}
</style>
