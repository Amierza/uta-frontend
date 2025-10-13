<script setup lang="ts">
import { ref, onMounted } from "vue";
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

// Use composables
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
  isOnline,
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
} = useSessions(userId, userType, userIdentifier);

// State untuk notifikasi toast
const toastNotifications = ref([]); // Menyimpan notifikasi toast
const { show: showToast } = useNotificationToast(); // Mengambil fungsi untuk menampilkan toast
const { on } = useWebSocket(); // Ambil fungsi dari WebSocket

// Dashboard data (could be moved to composable if needed)
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

const handleSessionClick = (sessionId: string) => {
  router.push(`/session/${sessionId}`);
};

const handleNewSession = async () => {
  // Jika dosen, langsung ke chat biasa
  if (userType.value === "dosen") {
    router.push("/chat");
    return;
  }

  // Jika mahasiswa, check thesis_id dulu
  if (!userThesisId.value) {
    console.error("Thesis ID not found");
    showToast("Thesis ID tidak ditemukan. Silakan hubungi admin.", "error");
    return;
  }

  try {
    // Start session dengan thesis_id
    const sessionData = await startSession(userThesisId.value);

    if (sessionData && sessionData.id) {
      // Redirect ke waiting room dengan session_id
      showToast("Sesi baru telah dibuat!, mohon tunggu...", "info"); // Notifikasi saat sesi dimulai
      router.push(`/waiting-room/${sessionData.id}`);
    } else {
      throw new Error("Session ID tidak ditemukan dalam response");
    }
  } catch (error: any) {
    console.error("Failed to start session:", error);
    showToast(
      error.message || "Gagal memulai sesi bimbingan. Silakan coba lagi.",
      "error"
    ); // Notifikasi kesalahan
  }
};

// Setup WebSocket listeners
let isWebSocketInitialized = false;
const setupWebSocketListeners = () => {
  if (isWebSocketInitialized) return; // ✅ mencegah listener ganda
  isWebSocketInitialized = true;
  on("session_started", (data: any) => {
    if (data.thesis_id && data.student_name) {
      showToast(`${data.student_name} telah membuat sesi baru.`, "info");
    } else {
      const primarySupervisor = data.supervisors.find(
        (s: any) => s.role === "primary_lecturer"
      );
      const secondarySupervisor = data.supervisors.find(
        (s: any) => s.role === "secondary_lecturer"
      );

      // Jika pembimbing utama yang mengawali sesi
      if (primarySupervisor) {
        showToast(`${primarySupervisor.name} telah membuat sesi baru.`, "info");
      }

      // Jika pembimbing sekunder yang mengawali sesi
      if (secondarySupervisor) {
        showToast(
          `${secondarySupervisor.name} telah membuat sesi baru.`,
          "info"
        );
      }
    }
  });
};

const logout = () => {
  localStorage.clear();
  router.push("/");
};

// Lifecycle
onMounted(async () => {
  await fetchUserProfile();
  await Promise.all([fetchNotifications(), fetchSessions()]);
  setupWebSocketListeners();
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
      :is-online="isOnline"
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

        <!-- Right Column - Chats & Notifications -->
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
