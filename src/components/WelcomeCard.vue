<script setup lang="ts">
import { defineProps } from "vue";

interface Props {
  userName: string;
  userType: "mahasiswa" | "dosen";
  userStudyProgram: string;
  userFaculty: string;
  userTotalStudent?: number;
  isLoading?: boolean;
}

defineProps<Props>();
</script>

<template>
  <div
    class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white"
  >
    <h2 class="text-xl font-bold mb-2">
      Selamat datang, {{ userName ? userName.split(" ")[0] : "User" }}!
    </h2>
    <p class="text-blue-100 text-sm mb-4">
      {{
        userType === "mahasiswa"
          ? "Mari lanjutkan progres skripsi Anda"
          : "Kelola bimbingan mahasiswa hari ini"
      }}
    </p>

    <!-- User Info Card -->
    <div
      v-if="!isLoading && userName"
      class="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4"
    >
      <div class="text-xs text-blue-100 mb-1">Program Studi</div>
      <div class="text-sm font-semibold">
        {{ userStudyProgram || "-" }}
      </div>
      <div class="text-xs text-blue-100 mt-1">
        {{ userFaculty || "-" }}
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="text-sm text-blue-100">
        {{
          new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }}
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold">
          {{ userType === "dosen" ? userTotalStudent : "" }}
        </div>
        <div class="text-xs text-blue-200">
          {{ userType === "mahasiswa" ? "" : "Mahasiswa" }}
        </div>
      </div>
    </div>
  </div>
</template>
