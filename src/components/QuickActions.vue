<script setup lang="ts">
import { defineProps, defineEmits, computed } from "vue";

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  action: string;
}

interface Props {
  userType: "mahasiswa" | "dosen";
}

const props = defineProps<Props>();
const emit = defineEmits<{
  actionClick: [action: string];
}>();

const quickActions = computed<QuickAction[]>(() => {
  if (props.userType === "mahasiswa") {
    return [
      {
        icon: "💬",
        label: "Mulai Chat",
        description: "Konsultasi dengan dosen",
        action: "chat",
      },
      {
        icon: "📊",
        label: "Lihat Progress",
        description: "Pantau kemajuan skripsi",
        action: "progress",
      },
      {
        icon: "📝",
        label: "Upload Dokumen",
        description: "Upload draft/revisi",
        action: "upload",
      },
      {
        icon: "📅",
        label: "Jadwal Bimbingan",
        description: "Atur jadwal konsultasi",
        action: "schedule",
      },
    ];
  } else {
    return [
      {
        icon: "👥",
        label: "Daftar Mahasiswa",
        description: "Kelola bimbingan mahasiswa",
        action: "students",
      },
      {
        icon: "💬",
        label: "Chat Aktif",
        description: "Sesi konsultasi berlangsung",
        action: "chat",
      },
      {
        icon: "📋",
        label: "Review Dokumen",
        description: "Review draft mahasiswa",
        action: "review",
      },
      {
        icon: "🤖",
        label: "Ringkasan AI",
        description: "Lihat ringkasan konsultasi",
        action: "summaries",
      },
    ];
  }
});
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
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      Aksi Cepat
    </h3>
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="action in quickActions"
        :key="action.action"
        @click="emit('actionClick', action.action)"
        class="p-4 text-left border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
      >
        <div class="text-2xl mb-2">{{ action.icon }}</div>
        <div
          class="text-sm font-medium text-gray-900 group-hover:text-blue-700"
        >
          {{ action.label }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ action.description }}
        </div>
      </button>
    </div>
  </div>
</template>
