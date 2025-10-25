<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useSessions } from "../composables/useSession";
import { useWebSocket } from "../composables/useWebsocket";
import { useNotificationToast } from "../composables/useNotificationToast";
import { useUser } from "../composables/useUser";
import type { SessionResponse } from "../types/session";
import ToastNotification from "../components/ToastNotification.vue";

const router = useRouter();
const route = useRoute();

const sessionId = ref<string>(route.params.session_id as string);
const session = ref<SessionResponse | null>(null);
const error = ref<string | null>(null);
const elapsedTime = ref(0);
const timeInterval = ref<number | null>(null);

// Use centralized WebSocket
const { on, isConnected } = useWebSocket();
const { show: showToast } = useNotificationToast();
const { userId, userType, userIdentifier } = useUser();
const { fetchSessionDetail, isLoadingDetail } = useSessions(
  userId,
  userType,
  userIdentifier
);

// Unsubscribe functions
let unsubscribeFunctions: Function[] = [];

// Setup WebSocket listeners
const setupWebSocketListeners = () => {
  // Listen for primary lecturer joined
  on("primary_lecturer_joined", (data: any) => {
    if (data.thesis_id) {
      showToast(
        `${data.supervisors[0]?.name} (Pembimbing 1) telah bergabung.`,
        "success"
      );
    }

    setTimeout(() => {
      router.push(`/session/${sessionId.value}`);
    }, 2000);
  });

  // Listen for secondary lecturer joined
  on("secondary_lecturer_joined", (data: any) => {
    if (data.thesis_id) {
      showToast(
        `${data.supervisors[1]?.name} (Pembimbing 2) telah bergabung.`,
        "success"
      );
    }

    setTimeout(() => {
      router.push(`/session/${sessionId.value}`);
    }, 2000);
  });
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

onMounted(async () => {
  try {
    if (!sessionId.value) throw new Error("Session ID tidak ditemukan");

    const data = await fetchSessionDetail(sessionId.value);
    session.value = data;
  } catch (err: any) {
    error.value = err.message || "Gagal memuat sesi";
  }
});

onMounted(() => {
  if (!sessionId.value) {
    error.value = "Session ID tidak ditemukan";
    return;
  }

  // Initial fetch
  fetchSessionDetail(sessionId.value);

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
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
  >
    <!-- Toast Notifications -->
    <ToastNotification />

    <div class="max-w-2xl w-full">
      <!-- Loading State -->
      <div
        v-if="isLoadingDetail"
        class="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 sm:p-12 text-center"
      >
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-200 border-t-blue-600 mb-4 sm:mb-6"
        ></div>
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Memuat Sesi...
        </h2>
        <p class="text-sm sm:text-base text-gray-500">Mohon tunggu sebentar</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 sm:p-12 text-center"
      >
        <div
          class="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
        >
          <svg
            class="w-8 h-8 sm:w-10 sm:h-10 text-red-600"
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
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Terjadi Kesalahan
        </h2>
        <p class="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          {{ error }}
        </p>
        <button
          @click="handleCancel"
          class="px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
        >
          Kembali ke Dashboard
        </button>
      </div>

      <!-- Waiting Room -->
      <div
        v-else
        class="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
      >
        <!-- Header -->
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white text-center relative"
        >
          <!-- Connection Status Badge -->
          <div class="absolute top-3 right-3 sm:top-4 sm:right-4">
            <span
              :class="[
                'inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium',
                isConnected
                  ? 'bg-green-500/20 text-green-100'
                  : 'bg-yellow-500/20 text-yellow-100',
              ]"
            >
              <span
                :class="[
                  'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2',
                  isConnected ? 'bg-green-300 animate-pulse' : 'bg-yellow-300',
                ]"
              ></span>
              <span class="hidden xs:inline">
                {{ isConnected ? "Terhubung" : "Menghubungkan..." }}
              </span>
              <span class="xs:hidden">
                {{ isConnected ? "●" : "○" }}
              </span>
            </span>
          </div>

          <div
            class="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
          >
            <svg
              class="w-8 h-8 sm:w-10 sm:h-10"
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
          <h1 class="text-2xl sm:text-3xl font-bold mb-2">Ruang Tunggu</h1>
          <p class="text-sm sm:text-base text-blue-100">
            Menunggu dosen pembimbing untuk bergabung...
          </p>
        </div>

        <!-- Content -->
        <div class="p-5 sm:p-6 md:p-8">
          <!-- Animated Waiting Indicator -->
          <div
            class="flex justify-center items-center space-x-2 sm:space-x-3 mb-6 sm:mb-8"
          >
            <div
              class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 0s"
            ></div>
            <div
              class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 0.2s"
            ></div>
            <div
              class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-bounce"
              style="animation-delay: 0.4s"
            ></div>
          </div>

          <!-- Session Info -->
          <div
            class="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6"
          >
            <h3
              class="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4 flex items-center"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0"
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

            <div class="space-y-3 sm:space-y-4">
              <!-- Session ID Section -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs sm:text-sm font-medium text-gray-600"
                    >Session ID</span
                  >
                </div>
                <code
                  class="block text-xs sm:text-sm font-mono bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-gray-200 text-gray-900 break-all w-full"
                >
                  {{ sessionId }}
                </code>
                <button
                  @click="copySessionId"
                  class="w-full px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                >
                  📋 Salin Session ID
                </button>
              </div>

              <!-- Thesis Title -->
              <div
                v-if="session"
                class="pt-3 sm:pt-4 border-t border-gray-200 space-y-2"
              >
                <span class="text-xs sm:text-sm font-medium text-gray-600 block"
                  >Judul Skripsi</span
                >
                <p class="text-xs sm:text-sm text-gray-900 leading-relaxed">
                  {{ session.thesis.title }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tips -->
          <div
            class="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-5 sm:mb-6"
          >
            <p
              class="text-xs sm:text-sm text-blue-900 text-center leading-relaxed"
            >
              💡 <span class="font-medium">Tips:</span> Pastikan dosen
              pembimbing memiliki Session ID untuk bergabung
            </p>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3">
            <button
              @click="handleCancel"
              class="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
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

/* Custom breakpoint for extra small devices */
@media (min-width: 375px) {
  .xs\:inline {
    display: inline;
  }
  .xs\:hidden {
    display: none;
  }
}

/* Default for smaller than 375px */
@media (max-width: 374px) {
  .xs\:inline {
    display: none;
  }
  .xs\:hidden {
    display: inline;
  }
}
</style>
