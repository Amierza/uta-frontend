<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { ScheduleResponse } from "../types/schedule";

const props = defineProps<{
  schedules: ScheduleResponse[];
  isLoading: boolean;
  userType: "mahasiswa" | "dosen";
}>();

const router = useRouter();

// Helper functions untuk format tanggal dan waktu
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (timeString: string | undefined) => {
  if (!timeString) return "-";

  // If it's a full datetime string
  if (timeString.includes("T") || timeString.includes(" ")) {
    const date = new Date(timeString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // If it's just time (HH:MM:SS)
  return timeString.substring(0, 5); // Get HH:MM only
};

const getShortDay = (dateString: string) => {
  const date = new Date(dateString);
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[date.getDay()];
};

// Get upcoming schedules (approved, pending, rejected - max 3)
const upcomingSchedules = computed(() => {
  const now = new Date();
  return props.schedules
    .filter((s) => {
      const scheduleDate = new Date(s.proposed_at);
      // Show all statuses: approved, pending, rejected
      return scheduleDate >= now;
    })
    .sort(
      (a, b) =>
        new Date(a.proposed_at).getTime() - new Date(b.proposed_at).getTime()
    )
    .slice(0, 2);
});

const pendingCount = computed(() => {
  return props.schedules.filter((s) => s.status === "pending").length;
});

const getStatusBadge = (status: string) => {
  const badges = {
    approved: {
      class: "bg-green-100 text-green-800 border-green-200",
      label: "Disetujui",
    },
    pending: {
      class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Menunggu",
    },
    rejected: {
      class: "bg-red-100 text-red-800 border-red-200",
      label: "Ditolak",
    },
  };
  return badges[status as keyof typeof badges] || badges.pending;
};

const goToSchedules = () => {
  router.push("/schedules");
};
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
  >
    <!-- Header -->
    <div class="p-6 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
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
          <div>
            <h3 class="text-lg font-bold text-gray-900">Jadwal Mendatang</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              Semua jadwal bimbingan mendatang
            </p>
          </div>
        </div>
        <button
          @click="goToSchedules"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
        >
          Lihat Semua
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Pending Alert (if any) -->
    <div
      v-if="pendingCount > 0 && userType === 'dosen'"
      class="bg-yellow-50 border-b border-yellow-100 p-4"
    >
      <div class="flex items-center gap-3">
        <svg
          class="w-5 h-5 text-yellow-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-yellow-900">
            {{ pendingCount }} jadwal menunggu persetujuan Anda
          </p>
        </div>
        <button
          @click="goToSchedules"
          class="text-sm font-medium text-yellow-700 hover:text-yellow-800"
        >
          Tinjau
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-3 border-gray-200 border-t-purple-600"
        ></div>
        <p class="text-sm text-gray-500 mt-3">Memuat jadwal...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="upcomingSchedules.length === 0" class="text-center py-8">
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h4 class="text-sm font-semibold text-gray-900 mb-1">
          Belum Ada Jadwal
        </h4>
        <p class="text-xs text-gray-500 mb-4">
          {{
            userType === "mahasiswa"
              ? "Ajukan jadwal bimbingan untuk memulai"
              : "Belum ada jadwal yang disetujui"
          }}
        </p>
        <button
          v-if="userType === 'mahasiswa'"
          @click="goToSchedules"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg
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
          Ajukan Jadwal
        </button>
      </div>

      <!-- Schedule List -->
      <div v-else class="space-y-3">
        <div
          v-for="schedule in upcomingSchedules"
          :key="schedule.id"
          class="group p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer"
          @click="goToSchedules"
        >
          <div class="flex items-start gap-3">
            <!-- Date Badge -->
            <div class="flex-shrink-0 w-14 text-center">
              <div class="bg-purple-100 rounded-lg p-2">
                <p class="text-xs font-medium text-purple-600 uppercase">
                  {{ getShortDay(schedule.proposed_at) }}
                </p>
                <p class="text-lg font-bold text-purple-900">
                  {{ new Date(schedule.proposed_at).getDate() }}
                </p>
              </div>
            </div>

            <!-- Schedule Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-semibold text-gray-900 truncate flex-1">
                  {{ formatDate(schedule.proposed_at) }}
                </p>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                    getStatusBadge(schedule.status).class,
                  ]"
                >
                  {{ getStatusBadge(schedule.status).label }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <svg
                  class="w-3.5 h-3.5 flex-shrink-0"
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
                <span
                  >{{ formatTime(schedule.start_time) }} -
                  {{ formatTime(schedule.end_time) }}</span
                >
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-600">
                <svg
                  class="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span class="truncate">{{ schedule.location }}</span>
              </div>
            </div>

            <!-- Arrow Icon -->
            <svg
              class="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>

          <!-- Description (if exists) -->
          <p
            v-if="schedule.description"
            class="text-xs text-gray-500 mt-3 pl-17 line-clamp-2"
          >
            {{ schedule.description }}
          </p>
        </div>
      </div>

      <!-- View All Button (Mobile) -->
      <button
        v-if="!isLoading && upcomingSchedules.length > 0"
        @click="goToSchedules"
        class="w-full mt-4 px-4 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
      >
        Lihat Semua Jadwal
      </button>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  /* -webkit-line-clamp: 2; */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pl-17 {
  padding-left: 4.25rem;
}
</style>
