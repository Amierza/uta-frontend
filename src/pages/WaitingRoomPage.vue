<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getSessionDetail } from "../api/session";
import { useWebSocket } from "../composables/useWebsocket";
import { useNotificationToast } from "../composables/useNotificationToast";
import type { SessionResponse } from "../types/session";
import ToastNotification from "../components/ToastNotification.vue";

const router = useRouter();
const route = useRoute();

const sessionId = ref<string>(route.params.session_id as string);
const session = ref<SessionResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const elapsedTime = ref(0);
const timeInterval = ref<number | null>(null);
const joinedSupervisors = ref<string[]>([]);

// Use centralized WebSocket
const { on, isConnected } = useWebSocket();
const { show: showToast } = useNotificationToast();

// Unsubscribe functions
let unsubscribeFunctions: Function[] = [];

// Fetch session detail
const fetchSessionDetail = async () => {
  try {
    const response = await getSessionDetail(sessionId.value);

    if (response.status && response.data) {
      session.value = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      // Check if session is active (both supervisors joined)
      if (session.value && session.value.status === "active") {
        console.log("✅ Session is now active! Redirecting...");
        stopTimer();
        router.push(`/session/${sessionId.value}`);
      }
    }
  } catch (err: any) {
    console.error("❌ Error fetching session detail:", err);
    error.value = err.response?.data?.message || "Gagal memuat detail sesi";
  } finally {
    isLoading.value = false;
  }
};

// Setup WebSocket listeners
const setupWebSocketListeners = () => {
  // Listen for primary lecturer joined
  const unsubPrimary = on("primary_lecturer_joined", (data: any) => {
    console.log("🎯 Primary lecturer joined:", data);

    if (data.thesis_id && session.value?.thesis.id === data.thesis_id) {
      const supervisorName = data.supervisors[0]?.name;
      if (supervisorName) {
        showToast(
          `${supervisorName} (Pembimbing 1) telah bergabung`,
          "success",
          5000
        );
        joinedSupervisors.value.push("primary");
        fetchSessionDetail();
      }
    }
  });

  // Listen for secondary lecturer joined
  const unsubSecondary = on("secondary_lecturer_joined", (data: any) => {
    console.log("🎯 Secondary lecturer joined:", data);

    if (data.thesis_id && session.value?.thesis.id === data.thesis_id) {
      const supervisorName = data.supervisors[1]?.name;
      if (supervisorName) {
        showToast(
          `${supervisorName} (Pembimbing 2) telah bergabung`,
          "success",
          5000
        );
        joinedSupervisors.value.push("secondary");

        // Check if both supervisors joined
        if (joinedSupervisors.value.length === 2) {
          showToast(
            "Kedua pembimbing telah bergabung! Mengarahkan ke ruang bimbingan...",
            "success",
            3000
          );

          setTimeout(() => {
            router.push(`/session/${sessionId.value}`);
          }, 2000);
        } else {
          fetchSessionDetail();
        }
      }
    }
  });

  unsubscribeFunctions = [unsubPrimary, unsubSecondary];
};

// Start timer
const startTimer = () => {
  timeInterval.value = window.setInterval(() => {
    elapsedTime.value++;
  }, 1000);
};

// Stop timer
const stopTimer = () => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value);
    timeInterval.value = null;
  }
};

// Cancel and go back
const handleCancel = async () => {
  stopTimer();
  router.push("/dashboard");
};

// Copy session ID to clipboard
const copySessionId = () => {
  navigator.clipboard.writeText(sessionId.value);
  showToast("Session ID berhasil disalin!", "success", 3000);
};

onMounted(() => {
  if (!sessionId.value) {
    error.value = "Session ID tidak ditemukan";
    return;
  }

  // Initial fetch
  fetchSessionDetail();

  // Setup WebSocket listeners
  setupWebSocketListeners();

  // Start timer
  startTimer();
});

onUnmounted(() => {
  stopTimer();
  // Cleanup WebSocket listeners
  unsubscribeFunctions.forEach((unsub) => unsub());
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4"
  >
    <!-- Toast Notifications -->
    <ToastNotification />

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
          <!-- Connection Status Badge -->
          <div class="absolute top-4 right-4">
            <span
              :class="[
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                isConnected
                  ? 'bg-green-500/20 text-green-100'
                  : 'bg-yellow-500/20 text-yellow-100',
              ]"
            >
              <span
                :class="[
                  'w-2 h-2 rounded-full mr-2',
                  isConnected ? 'bg-green-300 animate-pulse' : 'bg-yellow-300',
                ]"
              ></span>
              {{ isConnected ? "Terhubung" : "Menghubungkan..." }}
            </span>
          </div>

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
          <!-- Animated Waiting Indicator -->
          <div class="flex justify-center items-center space-x-3 mb-8">
            <div
              class="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 0s"
            ></div>
            <div
              class="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 0.2s"
            ></div>
            <div
              class="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 0.4s"
            ></div>
          </div>

          <!-- Session Info -->
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

            <div class="space-y-4">
              <!-- Session ID Section -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-600"
                    >Session ID</span
                  >
                </div>
                <code
                  class="block text-sm font-mono bg-white px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 break-all w-full"
                >
                  {{ sessionId }}
                </code>
                <button
                  @click="copySessionId"
                  class="w-full px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors text-sm font-medium"
                >
                  📋 Salin Session ID
                </button>
              </div>

              <!-- Thesis Title -->
              <div
                v-if="session"
                class="pt-4 border-t border-gray-200 space-y-2"
              >
                <span class="text-sm font-medium text-gray-600 block"
                  >Judul Skripsi</span
                >
                <p class="text-sm text-gray-900 leading-relaxed">
                  {{ session.thesis.title }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tips -->
          <div class="bg-blue-50 rounded-xl p-4 mb-6">
            <p class="text-sm text-blue-900 text-center">
              💡 <span class="font-medium">Tips:</span> Pastikan dosen
              pembimbing memiliki Session ID untuk bergabung
            </p>
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
