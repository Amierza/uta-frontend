<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

// Composables
import { useUser } from "../composables/useUser";
import { useNotifications } from "../composables/useNotification";
import { useSessions } from "../composables/useSession";

// Components
import DashboardHeader from "../components/DashboardHeader.vue";
import WelcomeCard from "../components/WelcomeCard.vue";
import ProgressCard from "../components/ProgressCard.vue";
import QuickActions from "../components/QuickActions.vue";
import NotificationsList from "../components/NotificationsList.vue";
import RecentSessions from "../components/RecentSessions.vue";

const router = useRouter();

// Use composables
const {
  userId,
  userType,
  userName,
  userIdentifier,
  // userEmail,
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
  error: sessionError,
  fetchSessions,
  startSession,
} = useSessions(userId, userType, userIdentifier);

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
    alert("Thesis ID tidak ditemukan. Silakan hubungi admin.");
    return;
  }

  try {
    // Start session dengan thesis_id
    const sessionData = await startSession(userThesisId.value);

    if (sessionData && sessionData.id) {
      // Redirect ke waiting room dengan session_id
      router.push(`/waiting-room/${sessionData.id}`);
    } else {
      throw new Error("Session ID tidak ditemukan dalam response");
    }
  } catch (error: any) {
    console.error("Failed to start session:", error);
    const errorMessage =
      sessionError.value ||
      error.message ||
      "Gagal memulai sesi bimbingan. Silakan coba lagi.";
    alert(errorMessage);
  }
};

const logout = () => {
  localStorage.clear();
  router.push("/");
};

// Lifecycle
onMounted(async () => {
  await fetchUserProfile();
  await Promise.all([fetchNotifications(), fetchSessions()]);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
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
