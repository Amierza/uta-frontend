<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getSessionDetail } from "../api/session";
import { useWebSocket } from "../composables/useWebsocket";
import type { SessionResponse } from "../types/session";

const router = useRouter();
const route = useRoute();

const sessionId = ref<string>(route.params.session_id as string);
const session = ref<SessionResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const notifications = ref<string[]>([]); // Menyimpan notifikasi

// Use centralized WebSocket
const { latestMessage, subscribe, connect, disconnect } = useWebSocket();

// Fetch session detail
const fetchSessionDetail = async () => {
  try {
    const response = await getSessionDetail(sessionId.value);

    if (response.status && response.data) {
      session.value = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
    }
  } catch (err: any) {
    console.error("❌ Error fetching session detail:", err);
    error.value = err.response?.data?.message || "Gagal memuat detail sesi";
  } finally {
    isLoading.value = false;
  }
};

// Watch for WebSocket messages
watch(latestMessage, (message) => {
  if (!message) return;

  console.log("📨 Received WebSocket message in waiting room:", message);

  // Cek jenis pesan dan tampilkan notifikasi
  if (message.type === "session_started") {
    notifications.value.push(`${message.student_name} telah memulai sesi.`);
  } else if (message.type === "primary_lecturer_joined") {
    notifications.value.push(
      `${message.supervisors[0].name} (Dosen Pembimbing 1) telah bergabung.`
    );
  } else if (message.type === "secondary_lecturer_joined") {
    notifications.value.push(
      `${message.supervisors[1].name} (Dosen Pembimbing 2) telah bergabung.`
    );
  }

  // Jika pesan terkait sesi ini, ambil detail terbaru
  if (message.data?.session_id === sessionId.value) {
    fetchSessionDetail();
  }
});

// Cancel and go back
const handleCancel = async () => {
  disconnect();
  router.push("/dashboard");
};

// Copy session ID to clipboard
const copySessionId = () => {
  navigator.clipboard.writeText(sessionId.value);
  alert("Session ID berhasil disalin!");
};

onMounted(() => {
  if (!sessionId.value) {
    error.value = "Session ID tidak ditemukan";
    return;
  }

  // Get the token from localStorage
  const token = localStorage.getItem("access_token");

  if (token) {
    // Connect WebSocket for real-time updates with token
    connect(`ws://localhost:8000/ws?token=${token}`);

    // Subscribe to session updates via WebSocket
    subscribe(`session:${sessionId.value}`);
  }

  // Initial fetch to load session detail
  fetchSessionDetail();
});

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4"
  >
    <div class="max-w-2xl w-full">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="bg-white rounded-3xl shadow-xl p-12 text-center"
      >
        <div
          class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-6"
        ></div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Memuat Sesi...</h2>
        <p class="text-gray-500">Mohon tunggu sebentar</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-white rounded-3xl shadow-xl p-12 text-center"
      >
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg
            class="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
        <p class="text-gray-600 mb-8">{{ error }}</p>
        <button
          @click="handleCancel"
          class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Kembali ke Dashboard
        </button>
      </div>

      <!-- Waiting Room -->
      <div v-else class="bg-white rounded-3xl shadow-xl overflow-hidden">
        <!-- Header -->
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative"
        >
          <div
            class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-10 h-10"
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
          </div>
          <h1 class="text-3xl font-bold mb-2">Ruang Tunggu</h1>
          <p class="text-blue-100">
            Menunggu dosen pembimbing untuk bergabung...
          </p>
        </div>

        <!-- Content -->
        <div class="p-8">
          <div class="bg-gray-50 rounded-2xl p-6 mb-6">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Informasi Sesi
            </h3>
            <div class="flex items-start justify-between">
              <span class="text-sm text-gray-600">Session ID</span>
              <code
                class="text-sm font-mono bg-white px-3 py-1.5 rounded-lg border border-gray-200 break-all max-w-xs text-right"
              >
                {{ sessionId }}
              </code>
            </div>
            <div class="flex items-center mt-3">
              <button
                @click="copySessionId"
                class="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors text-xs font-medium"
              >
                Salin Session ID
              </button>
            </div>
            <!-- Display Session Info -->
            <div
              class="flex items-center justify-between pt-3 border-t border-gray-200"
            >
              <span class="text-sm text-gray-600">Judul Skripsi</span>
              <p class="text-sm text-gray-900 font-medium" v-if="session">
                {{ session.thesis.title }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3">
            <button
              @click="handleCancel"
              class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Batalkan
            </button>
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          💡 <span class="font-medium">Tips:</span> Pastikan dosen pembimbing
          memiliki Session ID untuk bergabung
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
