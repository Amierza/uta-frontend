<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getNotificationDetail } from "../api/summary";
import type { SummaryResponse } from "../types/summary";
import { useNotificationToast } from "../composables/useNotificationToast";

const router = useRouter();
const route = useRoute();
const { show: showToast } = useNotificationToast();

// State
const summary = ref<SummaryResponse | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Get session ID from route params
const sessionId = computed(() => route.params.session_id as string);

// Fetch summary detail
const fetchSummary = async () => {
  if (!sessionId.value) {
    error.value = "Session ID tidak ditemukan";
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    console.log("📄 Fetching summary for session:", sessionId.value);

    const response = await getNotificationDetail(sessionId.value);

    if (response.status && response.data) {
      const data = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      summary.value = data;
      console.log("✅ Summary loaded:", data);
    } else {
      throw new Error("Summary tidak ditemukan");
    }
  } catch (err: any) {
    console.error("❌ Error fetching summary:", err);
    error.value = err.response?.data?.message || "Gagal memuat ringkasan sesi";
    showToast(error.value ? error.value : "", "error");
  } finally {
    isLoading.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDuration = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
) => {
  if (!startTime || !endTime) return "-";
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMinutes = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes} menit`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours} jam ${minutes} menit`;
};

// Copy summary to clipboard
const copySummary = async () => {
  if (!summary.value?.content) return;

  try {
    await navigator.clipboard.writeText(summary.value.content);
    showToast("Ringkasan berhasil disalin!", "success");
  } catch (err) {
    console.error("Failed to copy:", err);
    showToast("Gagal menyalin ringkasan", "error");
  }
};

// Download summary as text file
const downloadSummary = () => {
  if (!summary.value?.content) return;

  const blob = new Blob([summary.value.content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ringkasan-sesi-${sessionId.value}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Ringkasan berhasil diunduh!", "success");
};

// Print summary
const printSummary = () => {
  window.print();
};

onMounted(() => {
  fetchSummary();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div
      class="bg-white border-b border-gray-200 sticky top-0 z-10 print:static"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="router.back()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
            >
              <svg
                class="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Ringkasan Sesi Bimbingan
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Detail hasil diskusi dan kesimpulan
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 print:hidden">
            <button
              @click="copySummary"
              :disabled="!summary?.content"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Salin ringkasan"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Salin
            </button>
            <button
              @click="downloadSummary"
              :disabled="!summary?.content"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Unduh ringkasan"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Unduh
            </button>
            <button
              @click="printSummary"
              :disabled="!summary?.content"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cetak ringkasan"
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Cetak
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
      >
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"
        ></div>
        <p class="text-sm text-gray-500 mt-4">Memuat ringkasan sesi...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
      >
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-red-600"
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
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Gagal Memuat Ringkasan
        </h3>
        <p class="text-sm text-gray-500 mb-6">{{ error }}</p>
        <button
          @click="fetchSummary"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>

      <!-- Summary Content -->
      <div v-else-if="summary" class="space-y-6">
        <!-- Session Info Card -->
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-sm p-6 text-white"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span class="text-sm font-medium opacity-90">
                  Informasi Sesi
                </span>
              </div>
              <h2 class="text-xl font-bold mb-3">
                {{ formatDate(summary.session.start_time) }}
              </h2>
              <div class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-2">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {{ formatTime(summary.session.start_time) }} -
                    {{ formatTime(summary.session.end_time) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>
                    Durasi:
                    {{
                      getDuration(
                        summary.session.start_time,
                        summary.session.end_time
                      )
                    }}
                  </span>
                </div>
              </div>
            </div>
            <div
              class="px-3 py-1.5 bg-white bg-opacity-20 text-black rounded-lg text-xs font-medium backdrop-blur-sm"
            >
              {{ summary.session.status.toUpperCase() }}
            </div>
          </div>
        </div>

        <!-- Summary Content Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div
            class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200"
          >
            <div
              class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">
                Ringkasan Pembahasan
              </h3>
              <p class="text-sm text-gray-500">
                Hasil diskusi dan kesimpulan sesi bimbingan
              </p>
            </div>
          </div>

          <!-- Summary Text -->
          <div class="prose prose-gray max-w-none">
            <div
              class="text-gray-700 leading-relaxed whitespace-pre-wrap"
              v-html="summary.content.replace(/\n/g, '<br>')"
            ></div>
          </div>
        </div>

        <!-- Action Cards (Print Hidden) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <button
            @click="copySummary"
            class="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"
          >
            <div
              class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors"
            >
              <svg
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 class="font-semibold text-gray-900 mb-1">Salin Ringkasan</h4>
            <p class="text-sm text-gray-500">
              Salin ke clipboard untuk digunakan di tempat lain
            </p>
          </button>

          <button
            @click="downloadSummary"
            class="p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group text-left"
          >
            <div
              class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors"
            >
              <svg
                class="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <h4 class="font-semibold text-gray-900 mb-1">Unduh File</h4>
            <p class="text-sm text-gray-500">
              Simpan sebagai file teks (.txt) di perangkat Anda
            </p>
          </button>

          <button
            @click="printSummary"
            class="p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group text-left"
          >
            <div
              class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors"
            >
              <svg
                class="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
            </div>
            <h4 class="font-semibold text-gray-900 mb-1">Cetak Dokumen</h4>
            <p class="text-sm text-gray-500">
              Cetak ringkasan untuk arsip fisik
            </p>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@media print {
  body {
    background: white;
  }

  .print\:hidden {
    display: none !important;
  }

  .print\:static {
    position: static !important;
  }
}
</style>
