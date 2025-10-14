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
import QuickActions from "../components/QuickActions.vue";
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

const toastNotifications = ref([]); // Menyimpan notifikasi toast
const { show: showToast } = useNotificationToast(); // Mengambil fungsi untuk menampilkan toast
const { connect, on, isConnected } = useWebSocket();

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

// Handlers
const handleQuickAction = (action: string) => {
  const routes: Record<string, string> = {
    chat: "/chat",
    progress: "/progress",
    upload: "/documents",
    schedule: "/schedule",
    students: "/students",
    review: "/review",
    summaries: "/summaries",
  };

  const route = routes[action];
  if (route) router.push(route);
};

const handleSessionClick = async (sessionId: string) => {
  try {
    await joinActiveSession(sessionId);
    router.push(`/session/${sessionId}`);
  } catch (error: any) {
    console.error("Failed to join session:", error);
    showToast(
      error.message || "Gagal bergabung ke sesi. Silakan coba lagi.",
      "error"
    );
  }
};

const handleNewSession = async () => {
  if (!userThesisId.value) {
    console.error("Thesis ID not found");
    showToast("Thesis ID tidak ditemukan. Silakan hubungi admin.", "error");
    return;
  }

  try {
    const sessionData = await startSession(userThesisId.value);

    if (sessionData && sessionData.id) {
      showToast("Sesi baru telah dibuat!", "success");
      router.push(`/waiting-room/${sessionData.id}`);
    } else {
      throw new Error("Session ID tidak ditemukan dalam response");
    }
  } catch (error: any) {
    console.error("Failed to start session:", error);
    showToast(
      error.message || "Gagal memulai sesi bimbingan. Silakan coba lagi.",
      "error"
    );
  }
};

// WebSocket listeners setup
let webSocketListenersSetup = false;

const setupWebSocketListeners = () => {
  if (webSocketListenersSetup) {
    console.log("✅ WebSocket listeners sudah di-setup");
    return;
  }

  webSocketListenersSetup = true;
  console.log("🔌 Setting up WebSocket listeners di Dashboard");

  // Event: Session dimulai oleh mahasiswa
  on("session_started", (data: any) => {
    console.log("📢 EVENT: session_started", data);
    // Auto-refresh sessions
    fetchSessions();
    // Show notification
    showToast(`${data.student_name} memulai sesi bimbingan`, "info");
  });

  // Event: Primary lecturer join
  on("primary_lecturer_joined", (data: any) => {
    console.log("📢 EVENT: primary_lecturer_joined", data);
    fetchSessions();
    showToast(
      `${data.supervisors[0]?.name || "Dosen"} telah bergabung`,
      "info"
    );
  });

  // Event: Secondary lecturer join
  on("secondary_lecturer_joined", (data: any) => {
    console.log("📢 EVENT: secondary_lecturer_joined", data);
    fetchSessions();
    showToast(
      `${data.supervisors[1]?.name || "Dosen"} telah bergabung`,
      "info"
    );
  });

  // Event: Student join
  on("student_joined", (data: any) => {
    console.log("📢 EVENT: student_joined", data);
    fetchSessions();
    showToast(`${data.student_name} bergabung ke sesi`, "info");
  });

  // Event: Session ended
  on("user_ended", (data: any) => {
    console.log("📢 EVENT: user_ended", data);
    fetchSessions();
    showToast("Sesi telah berakhir", "info");
  });

  // Event: Someone left
  on("primary_lecturer_leaved", (data: any) => {
    console.log("📢 EVENT: primary_lecturer_leaved", data);
    fetchSessions();
  });

  on("secondary_lecturer_leaved", (data: any) => {
    console.log("📢 EVENT: secondary_lecturer_leaved", data);
    fetchSessions();
  });

  on("student_leaved", (data: any) => {
    console.log("📢 EVENT: student_leaved", data);
    fetchSessions();
  });
};

const logout = () => {
  localStorage.clear();
  router.push("/");
};

// Watch untuk memastikan WebSocket selalu connected
watch(isConnected, (connected) => {
  console.log("🔗 WebSocket connection status:", connected);
  if (connected && !webSocketListenersSetup) {
    setupWebSocketListeners();
  }
});

// Lifecycle
onMounted(async () => {
  console.log("=== DASHBOARD MOUNTED ===");

  // Fetch user profile
  await fetchUserProfile();
  console.log("✅ User profile loaded");

  // Connect WebSocket
  const token = localStorage.getItem("access_token");
  if (token) {
    console.log("🔌 Connecting WebSocket with token");
    connect(token);
  }

  // Fetch initial data
  await Promise.all([fetchNotifications(), fetchSessions()]);
  console.log("✅ Initial data loaded");

  // Setup listeners jika sudah connected
  if (isConnected.value) {
    setupWebSocketListeners();
  }
});

onUnmounted(() => {
  webSocketListenersSetup = false;
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Toast Notifications -->
    <ToastNotification :toasts="toastNotifications" />

    <!-- Header -->
    <DashboardHeader
      :user-name="userName"
      :user-identifier="userIdentifier"
      :user-type="userType"
      :is-online="isConnected"
      :user-photo="userPhoto"
      :is-loading="isLoadingProfile"
      @logout="logout"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Column - Progress & Quick Actions -->
        <div class="lg:col-span-4 space-y-6">
          <WelcomeCard
            :user-name="userName"
            :user-type="userType"
            :user-study-program="userStudyProgram"
            :user-faculty="userFaculty"
            :user-total-student="userTotalStudent"
            :is-loading="isLoadingProfile"
          />

          <ProgressCard
            :user-type="userType"
            :total-meetings="progressData.mahasiswa.totalMeetings"
            :next-schedule="
              userType === 'mahasiswa'
                ? progressData.mahasiswa.nextSchedule
                : progressData.dosen.nextSchedule
            "
          />

          <QuickActions
            :user-type="userType"
            @action-click="handleQuickAction"
          />
        </div>

        <!-- Right Column - Notifications & Sessions -->
        <div class="lg:col-span-8 space-y-6">
          <NotificationsList
            :notifications="notifications"
            :is-loading="isLoadingNotifications"
          />

          <RecentSessions
            :sessions="sessions"
            :user-type="userType"
            :user-id="userId"
            :is-loading="isLoadingSessions"
            :is-starting-session="isStartingSession"
            @session-click="handleSessionClick"
            @new-session="handleNewSession"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
