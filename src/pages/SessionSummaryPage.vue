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

// Define section type
interface SummarySection {
  title: string;
  items: string[];
  icon: string;
  color: string;
}

// Parse summary content into structured sections
const parsedSummary = computed<SummarySection[] | null>(() => {
  if (!summary.value?.content) return null;

  const content = summary.value.content;
  const sections: SummarySection[] = [];

  // Gunakan 'let currentSection: SummarySection | null = null'
  // tapi tambahkan "as SummarySection | null" di assignment agar TypeScript yakin
  let currentSection: SummarySection | null = null;

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // === Header utama ===
    if (trimmedLine.startsWith("- **") && trimmedLine.includes("**")) {
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
      }

      const titleMatch = trimmedLine.match(/\*\*(.*?)\*\*/);
      const title = titleMatch ? titleMatch[1] : "";

      let icon = "document";
      let color = "blue";

      if (
        title.toLowerCase().includes("inti") ||
        title.toLowerCase().includes("pembahasan")
      ) {
        icon = "chat";
        color = "blue";
      } else if (
        title.toLowerCase().includes("arahan") ||
        title.toLowerCase().includes("masukan")
      ) {
        icon = "lightbulb";
        color = "yellow";
      } else if (
        title.toLowerCase().includes("tindak") ||
        title.toLowerCase().includes("progres")
      ) {
        icon = "check";
        color = "green";
      }

      currentSection = { title, items: [], icon, color } as SummarySection;

      const colonIndex = trimmedLine.indexOf("**:");
      if (colonIndex !== -1) {
        const contentAfterColon = trimmedLine.substring(colonIndex + 3).trim();
        if (contentAfterColon) {
          currentSection.items.push(contentAfterColon);
        }
      }
    }

    // === Sub-item ===
    else if (currentSection && trimmedLine.startsWith("- ")) {
      const item = trimmedLine.substring(2).trim();
      if (item && !item.startsWith("**")) {
        currentSection.items.push(item);
      }
    }

    // === Indented sub-item ===
    else if (currentSection && trimmedLine.startsWith("  - ")) {
      const item = trimmedLine.substring(4).trim();
      if (item) currentSection.items.push(item);
    }

    // === Kelanjutan dari item sebelumnya ===
    else if (
      currentSection &&
      currentSection.items.length > 0 &&
      !trimmedLine.startsWith("-")
    ) {
      const lastIdx = currentSection.items.length - 1;
      currentSection.items[lastIdx] += " " + trimmedLine;
    }
  }

  // === Tambahkan section terakhir ===
  if (currentSection && currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : null;
});

// Fetch summary detail
const fetchSummary = async () => {
  if (!sessionId.value) {
    error.value = "Session ID tidak ditemukan";
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const response = await getNotificationDetail(sessionId.value);

    if (response.status && response.data) {
      const data = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      summary.value = data;
    } else {
      throw new Error("Summary tidak ditemukan");
    }
  } catch (err: any) {
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

// Actions
const copySummary = async () => {
  if (!summary.value?.content) return;

  try {
    await navigator.clipboard.writeText(summary.value.content);
    showToast("Ringkasan berhasil disalin!", "success");
  } catch (err) {
    showToast("Gagal menyalin ringkasan", "error");
  }
};

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

const printSummary = () => {
  window.print();
};

onMounted(() => {
  fetchSummary();
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
  >
    <!-- Header -->
    <div
      class="bg-white border-b border-gray-200 sticky top-0 z-10 print:static shadow-sm"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div class="flex items-center space-x-3 sm:space-x-4">
            <button
              @click="router.back()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden flex-shrink-0"
            >
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600"
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
            <div class="min-w-0">
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Ringkasan Sesi Bimbingan
              </h1>
              <p class="text-xs sm:text-sm text-gray-500 mt-1">
                Detail hasil diskusi dan kesimpulan
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            class="flex items-center gap-2 print:hidden overflow-x-auto pb-2 sm:pb-0"
          >
            <button
              @click="copySummary"
              :disabled="!summary?.content"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <svg
                class="w-4 h-4 sm:mr-2"
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
              <span class="hidden sm:inline">Salin</span>
            </button>
            <button
              @click="downloadSummary"
              :disabled="!summary?.content"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <svg
                class="w-4 h-4 sm:mr-2"
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
              <span class="hidden sm:inline">Unduh</span>
            </button>
            <button
              @click="printSummary"
              :disabled="!summary?.content"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <svg
                class="w-4 h-4 sm:mr-2"
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
              <span class="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center"
      >
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"
        ></div>
        <p class="text-sm text-gray-500 mt-4">Memuat ringkasan sesi...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center"
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
      <div v-else-if="summary" class="space-y-4 sm:space-y-6">
        <!-- Session Info Card -->
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-4 sm:p-6 text-white"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
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
                <span class="text-xs sm:text-sm font-medium opacity-90"
                  >Informasi Sesi</span
                >
              </div>
              <h2 class="text-lg sm:text-xl font-bold mb-2 sm:mb-3 truncate">
                {{ formatDate(summary.session.start_time) }}
              </h2>
              <div
                class="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm"
              >
                <div class="flex items-center gap-2">
                  <svg
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
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
                    >{{ formatTime(summary.session.start_time) }} -
                    {{ formatTime(summary.session.end_time) }}</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <svg
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
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
                  <span
                    >Durasi:
                    {{
                      getDuration(
                        summary.session.start_time,
                        summary.session.end_time
                      )
                    }}</span
                  >
                </div>
              </div>
            </div>
            <div
              class="px-3 py-1.5 bg-white bg-opacity-20 text-black rounded-lg text-xs font-medium backdrop-blur-sm self-start"
            >
              {{ summary.session.status.toUpperCase() }}
            </div>
          </div>
        </div>

        <!-- Parsed Summary Sections -->
        <div v-if="parsedSummary" class="space-y-4">
          <div
            v-for="(section, index) in parsedSummary"
            :key="index"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <!-- Section Header -->
            <div
              :class="[
                'px-4 sm:px-6 py-4 border-b border-gray-100',
                section.color === 'blue' && 'bg-blue-50',
                section.color === 'yellow' && 'bg-yellow-50',
                section.color === 'green' && 'bg-green-50',
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    section.color === 'blue' && 'bg-blue-100',
                    section.color === 'yellow' && 'bg-yellow-100',
                    section.color === 'green' && 'bg-green-100',
                  ]"
                >
                  <!-- Chat Icon -->
                  <svg
                    v-if="section.icon === 'chat'"
                    :class="[
                      'w-5 h-5',
                      section.color === 'blue' && 'text-blue-600',
                    ]"
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

                  <!-- Lightbulb Icon -->
                  <svg
                    v-else-if="section.icon === 'lightbulb'"
                    :class="[
                      'w-5 h-5',
                      section.color === 'yellow' && 'text-yellow-600',
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>

                  <!-- Check Icon -->
                  <svg
                    v-else-if="section.icon === 'check'"
                    :class="[
                      'w-5 h-5',
                      section.color === 'green' && 'text-green-600',
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <h3 class="text-base sm:text-lg font-bold text-gray-900 flex-1">
                  {{ section.title }}
                </h3>
              </div>
            </div>

            <!-- Section Content -->
            <div class="px-4 sm:px-6 py-4 sm:py-5">
              <ul class="space-y-3">
                <li
                  v-for="(item, itemIndex) in section.items"
                  :key="itemIndex"
                  class="flex items-start gap-3 text-sm sm:text-base text-gray-700 leading-relaxed"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0',
                      section.color === 'blue' && 'bg-blue-500',
                      section.color === 'yellow' && 'bg-yellow-500',
                      section.color === 'green' && 'bg-green-500',
                    ]"
                  ></span>
                  <span class="flex-1">{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Fallback: Original Content (if parsing fails) -->
        <div
          v-else
          class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8"
        >
          <div class="prose prose-gray max-w-none">
            <div
              class="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
              v-html="summary.content.replace(/\n/g, '<br>')"
            ></div>
          </div>
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

/* Better word breaking for long text */
.break-words {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}
</style>
