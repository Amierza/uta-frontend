<script setup lang="ts">
import { defineProps } from "vue";

interface Props {
  userType: "mahasiswa" | "dosen";
  totalMeetings?: number;
  nextSchedule?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h3 class="font-semibold text-gray-900 mb-4 flex items-center">
      <svg
        class="w-5 h-5 mr-2 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      {{ userType === "mahasiswa" ? "Progres Skripsi" : "Statistik Bimbingan" }}
    </h3>

    <div v-if="userType === 'mahasiswa'" class="space-y-4">
      <div class="gap-4 mt-4">
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">
            {{ totalMeetings || 0 }}
          </div>
          <div class="text-xs text-gray-600">Total Bimbingan</div>
        </div>
      </div>

      <div
        v-if="nextSchedule"
        class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
      >
        <div class="text-xs text-yellow-800 font-medium">
          Jadwal Berikutnya:
        </div>
        <div class="text-sm text-yellow-900">
          {{ nextSchedule }}
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <div
        v-if="nextSchedule"
        class="col-span-2 mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
      >
        <div class="text-xs text-indigo-800 font-medium">
          Jadwal Berikutnya:
        </div>
        <div class="text-sm text-indigo-900">
          {{ nextSchedule }}
        </div>
      </div>
    </div>
  </div>
</template>
