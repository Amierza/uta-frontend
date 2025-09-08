<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

// Mock user data - replace with actual auth store
const userType = ref<"mahasiswa" | "dosen">("mahasiswa"); // Get from localStorage or auth store
const userName = ref("Ahmad Fauzi");
const userNim = ref("160411100001");
const userPhoto = ref("");
const isOnline = ref(true);
const router = useRouter();

// Dashboard data
const notifications = ref([
  {
    id: 1,
    type: "chat",
    message: "Pesan baru dari Dr. Siti Aminah",
    time: "2 menit lalu",
    unread: true,
  },
  {
    id: 2,
    type: "progress",
    message: "Progres skripsi diperbarui",
    time: "1 jam lalu",
    unread: true,
  },
  {
    id: 3,
    type: "summary",
    message: "Ringkasan konsultasi tersedia",
    time: "3 jam lalu",
    unread: false,
  },
]);

const recentChats = ref([
  {
    id: 1,
    name: "Dr. Siti Aminah",
    role: "Dosen Pembimbing 1",
    lastMessage: "Revisi bab 3 sudah bagus, lanjutkan ke bab 4",
    time: "14:30",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Prof. Dr. Budi Santoso",
    role: "Dosen Pembimbing 2",
    lastMessage: "Jadwal bimbingan besok jam 10:00",
    time: "12:15",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Dr. Maria Kusuma",
    role: "Koordinator Skripsi",
    lastMessage: "Jangan lupa upload proposal terbaru",
    time: "Kemarin",
    unread: 1,
    online: true,
  },
]);

const progressData = ref({
  mahasiswa: {
    currentPhase: "Penulisan Skripsi",
    progress: 65,
    totalMeetings: 12,
    completedTasks: 8,
    pendingTasks: 3,
    nextDeadline: "Upload Bab 4 - 15 Jan 2025",
  },
  dosen: {
    totalStudents: 15,
    activeSessions: 3,
    pendingReviews: 7,
    completedSummaries: 28,
    nextSchedule: "Bimbingan dengan Ahmad Fauzi - 14:00",
  },
});

const quickActions = computed(() => {
  if (userType.value === "mahasiswa") {
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

const handleQuickAction = (action: string) => {
  switch (action) {
    case "chat":
      router.push("/chat");
      break;
    case "progress":
      router.push("/progress");
      break;
    case "upload":
      router.push("/documents");
      break;
    case "schedule":
      router.push("/schedule");
      break;
    case "students":
      router.push("/students");
      break;
    case "review":
      router.push("/review");
      break;
    case "summaries":
      router.push("/summaries");
      break;
  }
};

const logout = () => {
  localStorage.clear();
  router.push("/");
};

const startChat = (chatId: number) => {
  router.push(`/chat/${chatId}`);
};

onMounted(() => {
  // Get user type from localStorage
  const storedUserType = localStorage.getItem("user_type");
  if (storedUserType) {
    userType.value = storedUserType as "mahasiswa" | "dosen";
  }

  // Mock different user data based on type
  if (userType.value === "dosen") {
    userName.value = "Dr. Siti Aminah, M.Kom";
    userNim.value = "196505121992032001";
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Title -->
          <div class="flex items-center space-x-4">
            <img
              src="/src/assets/logo-unair.png"
              alt="Unair Logo"
              class="h-8 w-8"
            />
            <div>
              <h1 class="text-xl font-bold text-gray-900">UTA Dashboard</h1>
              <p class="text-xs text-gray-500">Thesis Assistant System</p>
            </div>
          </div>

          <!-- User Profile -->
          <div class="flex items-center space-x-4">
            <!-- Notifications -->
            <div class="relative">
              <button class="p-2 text-gray-600 hover:text-blue-600 relative">
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span
                  class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
                >
                  {{ notifications.filter((n) => n.unread).length }}
                </span>
              </button>
            </div>

            <!-- Online Status -->
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-2 h-2 rounded-full',
                  isOnline ? 'bg-green-500' : 'bg-gray-400',
                ]"
              ></div>
              <span class="text-sm text-gray-600">{{
                isOnline ? "Online" : "Offline"
              }}</span>
            </div>

            <!-- User Menu -->
            <div class="flex items-center space-x-3">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
                <p class="text-xs text-gray-500">
                  {{ userType === "mahasiswa" ? "NIM" : "NIP" }}: {{ userNim }}
                </p>
              </div>
              <div class="relative">
                <img
                  :src="
                    userPhoto ||
                    `https://ui-avatars.com/api/?name=${userName}&background=3b82f6&color=white`
                  "
                  alt="Profile"
                  class="w-10 h-10 rounded-full border-2 border-gray-200"
                />
                <button
                  @click="logout"
                  class="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <svg
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Column - Progress & Quick Actions -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Welcome Card -->
          <div
            class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white"
          >
            <h2 class="text-xl font-bold mb-2">
              Selamat datang, {{ userName.split(" ")[0] }}! 👋
            </h2>
            <p class="text-blue-100 text-sm mb-4">
              {{
                userType === "mahasiswa"
                  ? "Mari lanjutkan progres skripsi Anda"
                  : "Kelola bimbingan mahasiswa hari ini"
              }}
            </p>
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
                  {{
                    userType === "mahasiswa"
                      ? progressData.mahasiswa.progress + "%"
                      : progressData.dosen.totalStudents
                  }}
                </div>
                <div class="text-xs text-blue-200">
                  {{ userType === "mahasiswa" ? "Progress" : "Mahasiswa" }}
                </div>
              </div>
            </div>
          </div>

          <!-- Progress Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
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
              {{
                userType === "mahasiswa"
                  ? "Progres Skripsi"
                  : "Statistik Bimbingan"
              }}
            </h3>

            <div v-if="userType === 'mahasiswa'" class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-600">{{
                    progressData.mahasiswa.currentPhase
                  }}</span>
                  <span class="font-semibold"
                    >{{ progressData.mahasiswa.progress }}%</span
                  >
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    :style="`width: ${progressData.mahasiswa.progress}%`"
                  ></div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ progressData.mahasiswa.totalMeetings }}
                  </div>
                  <div class="text-xs text-gray-600">Total Bimbingan</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">
                    {{ progressData.mahasiswa.completedTasks }}
                  </div>
                  <div class="text-xs text-gray-600">Tugas Selesai</div>
                </div>
              </div>

              <div
                class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div class="text-xs text-yellow-800 font-medium">
                  Deadline Berikutnya:
                </div>
                <div class="text-sm text-yellow-900">
                  {{ progressData.mahasiswa.nextDeadline }}
                </div>
              </div>
            </div>

            <div v-else class="grid grid-cols-2 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">
                  {{ progressData.dosen.activeSessions }}
                </div>
                <div class="text-xs text-gray-600">Sesi Aktif</div>
              </div>
              <div class="text-center p-4 bg-orange-50 rounded-lg">
                <div class="text-2xl font-bold text-orange-600">
                  {{ progressData.dosen.pendingReviews }}
                </div>
                <div class="text-xs text-gray-600">Pending Review</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded-lg col-span-2">
                <div class="text-2xl font-bold text-green-600">
                  {{ progressData.dosen.completedSummaries }}
                </div>
                <div class="text-xs text-gray-600">Ringkasan AI Dibuat</div>
              </div>

              <div
                class="col-span-2 mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <div class="text-xs text-indigo-800 font-medium">
                  Jadwal Berikutnya:
                </div>
                <div class="text-sm text-indigo-900">
                  {{ progressData.dosen.nextSchedule }}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
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
                @click="handleQuickAction(action.action)"
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
        </div>

        <!-- Right Column - Chats & Notifications -->
        <div class="lg:col-span-8 space-y-6">
          <!-- Recent Notifications -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h3
              class="font-semibold text-gray-900 mb-4 flex items-center justify-between"
            >
              <div class="flex items-center">
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Notifikasi Terbaru
              </div>
              <button class="text-sm text-blue-600 hover:text-blue-800">
                Lihat Semua
              </button>
            </h3>

            <div class="space-y-3">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                :class="{
                  'bg-blue-50 border border-blue-100': notification.unread,
                }"
              >
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full mt-2',
                      notification.type === 'chat'
                        ? 'bg-green-500'
                        : notification.type === 'progress'
                        ? 'bg-blue-500'
                        : 'bg-purple-500',
                    ]"
                  ></div>
                </div>
                <div class="flex-1">
                  <p
                    class="text-sm text-gray-900"
                    :class="{ 'font-semibold': notification.unread }"
                  >
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ notification.time }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Chats -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h3
              class="font-semibold text-gray-900 mb-4 flex items-center justify-between"
            >
              <div class="flex items-center">
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {{
                  userType === "mahasiswa"
                    ? "Chat dengan Dosen"
                    : "Chat dengan Mahasiswa"
                }}
              </div>
              <button class="text-sm text-blue-600 hover:text-blue-800">
                Lihat Semua
              </button>
            </h3>

            <div class="space-y-4">
              <div
                v-for="chat in recentChats"
                :key="chat.id"
                @click="startChat(chat.id)"
                class="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
              >
                <div class="relative">
                  <img
                    :src="`https://ui-avatars.com/api/?name=${chat.name}&background=random&color=white`"
                    alt="Profile"
                    class="w-12 h-12 rounded-full"
                  />
                  <div
                    :class="[
                      'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                      chat.online ? 'bg-green-500' : 'bg-gray-400',
                    ]"
                  ></div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium text-gray-900 truncate">
                      {{ chat.name }}
                    </h4>
                    <div class="flex items-center space-x-2">
                      <span class="text-xs text-gray-500">{{ chat.time }}</span>
                      <div
                        v-if="chat.unread > 0"
                        class="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        {{ chat.unread }}
                      </div>
                    </div>
                  </div>
                  <p class="text-sm text-gray-500 truncate">{{ chat.role }}</p>
                  <p class="text-sm text-gray-700 truncate mt-1">
                    {{ chat.lastMessage }}
                  </p>
                </div>

                <div class="flex-shrink-0">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Start New Chat Button -->
            <div class="mt-6 pt-4 border-t border-gray-100">
              <button
                @click="handleQuickAction('chat')"
                class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>{{
                  userType === "mahasiswa"
                    ? "Mulai Konsultasi Baru"
                    : "Chat dengan Mahasiswa"
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Custom scrollbar for better UX */
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
