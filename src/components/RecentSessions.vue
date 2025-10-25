<script setup lang="ts">
import { defineEmits, computed } from "vue";
import { useRouter } from "vue-router";
import type { SessionResponse } from "../types/session";
import SessionCard from "./SessionCard.vue";

interface Props {
  sessions: SessionResponse[];
  userType: "mahasiswa" | "dosen";
  userId: string;
  isLoading?: boolean;
  isStartingSession?: boolean;
}

const router = useRouter();

const props = defineProps<Props>();

const emit = defineEmits<{
  sessionClick: [session: SessionResponse];
  newSession: [];
  joinWithId: [];
}>();

// Computed: Sort sessions - pending/waiting first for dosen
const sortedSessions = computed(() => {
  if (props.userType === "dosen") {
    // For dosen: prioritize pending/waiting sessions
    return [...props.sessions].sort((a, b) => {
      const statusPriority: Record<string, number> = {
        waiting: 0,
        ongoing: 1,
        finished: 2,
      };

      const priorityA = statusPriority[a.status.toLowerCase()] ?? 1;
      const priorityB = statusPriority[b.status.toLowerCase()] ?? 1;

      // If same priority, sort by date (newest first)
      if (priorityA === priorityB) {
        return (
          new Date(b.start_time || "").getTime() -
          new Date(a.start_time || "").getTime()
        );
      }

      return priorityA - priorityB;
    });
  }

  // For mahasiswa: keep original order (newest first)
  return props.sessions;
});

const handleSessionClick = (session: SessionResponse) => {
  emit("sessionClick", session);
};

// Navigate to all sessions page
const goToAllSessions = () => {
  router.push("/sessions");
};
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div
          class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3"
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 text-lg">Sesi Bimbingan</h3>
          <p class="text-xs text-gray-500">
            {{ sessions.length }} sesi tersedia
          </p>
        </div>
      </div>
      <button
        @click="goToAllSessions"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
      >
        Lihat Semua
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"
      ></div>
      <p class="text-sm text-gray-500 mt-3">Memuat sesi bimbingan...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="sessions.length === 0" class="text-center py-12">
      <div
        class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-10 h-10 text-gray-400"
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
      <h4 class="font-medium text-gray-900 mb-1">Belum ada sesi bimbingan</h4>
      <p class="text-sm text-gray-500 mb-6">
        {{
          userType === "mahasiswa"
            ? "Mulai sesi bimbingan pertama Anda dengan dosen pembimbing"
            : "Belum ada mahasiswa yang memulai sesi bimbingan"
        }}
      </p>
      <button
        v-if="userType === 'mahasiswa'"
        @click="emit('newSession')"
        :disabled="isStartingSession"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div
          v-if="isStartingSession"
          class="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <svg
          v-else
          class="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        {{ isStartingSession ? "Memulai sesi..." : "Mulai Sesi Baru" }}
      </button>
    </div>

    <!-- Sessions List -->
    <div v-else class="space-y-3">
      <SessionCard
        v-for="session in sortedSessions.slice(0, 3)"
        :key="session.id"
        :session="session"
        :user-type="userType"
        :user-id="userId"
        @click="handleSessionClick(session)"
      />
    </div>

    <!-- Start New Session Button (Only for Mahasiswa) -->
    <div
      v-if="sessions.length > 0 && userType === 'mahasiswa'"
      class="mt-6 pt-6 border-t border-gray-100"
    >
      <button
        @click="emit('newSession')"
        :disabled="isStartingSession"
        class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div
          v-if="isStartingSession"
          class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <svg
          v-else
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>{{
          isStartingSession ? "Memulai sesi..." : "Mulai Sesi Bimbingan Baru"
        }}</span>
      </button>
    </div>

    <!-- Join with Session ID Button (Only for Dosen) -->
    <div
      v-if="sessions.length > 0 && userType === 'dosen'"
      class="mt-6 pt-6 border-t border-gray-100"
    >
      <button
        @click="emit('joinWithId')"
        class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-sm hover:shadow-md"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        <span>Bergabung dengan Session ID</span>
      </button>
    </div>
  </div>
</template>
