<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { getAllSessions } from "../api/session";
import type { SessionResponse } from "../types/session";
import SessionsFilter from "../components/SessionsFilter.vue";
import { useUser } from "../composables/useUser";
import { useSessions } from "../composables/useSession";
import { useNotificationToast } from "../composables/useNotificationToast";

const router = useRouter();

// User data
const { userId, userType, userIdentifier, userThesisId, fetchUserProfile } =
  useUser();

// Sessions composable for starting new session and joining
const { startSession, isStartingSession, joinActiveSession } = useSessions(
  userId,
  userType,
  userIdentifier
);

// Toast notifications
const { show: showToast } = useNotificationToast();

// State
const sessions = ref<SessionResponse[]>([]);
const isLoading = ref(false);

// Pagination state
const currentPage = ref(1);
const perPage = ref(10);
const maxPage = ref(1);
const totalCount = ref(0);

// Filter states
const selectedMonth = ref<number | null>(null);
const selectedStatus = ref<string>("all");
const sortOrder = ref<"latest" | "oldest">("latest");

// Fetch sessions with filters
const fetchSessions = async () => {
  try {
    isLoading.value = true;

    console.log("🔄 Fetching sessions - Page:", currentPage.value);

    // Store the requested page number
    const requestedPage = currentPage.value;

    // Build query params - sesuai dengan SessionsParams interface
    const params = {
      pagination: true,
      month: selectedMonth.value ? selectedMonth.value.toString() : undefined,
      status: selectedStatus.value !== "all" ? selectedStatus.value : undefined,
      sort: sortOrder.value,
      page: requestedPage,
      per_page: perPage.value,
    };

    const response = await getAllSessions(params);

    console.log("📊 API Response:", response);

    if (response.status && Array.isArray(response.data)) {
      // Filter based on user role
      sessions.value = response.data.filter((s) => {
        if (userType.value === "mahasiswa") {
          return s.user_owner.id === userId.value;
        } else if (userType.value === "dosen") {
          return s.thesis.supervisors.some(
            (supervisor: { identifier: string }) =>
              supervisor.identifier === userIdentifier.value
          );
        }
        return false;
      });

      // Update pagination meta
      if (response.meta) {
        // Keep the requested page instead of using meta.page which might be incorrect
        // currentPage.value stays as is (already set by goToPage)
        perPage.value = response.meta.per_page || 10;
        maxPage.value = response.meta.max_page || 1;
        totalCount.value = response.meta.count || 0;

        console.log("📄 Pagination:", {
          currentPage: currentPage.value,
          maxPage: maxPage.value,
          totalCount: totalCount.value,
        });
      }
    } else {
      sessions.value = [];
    }
  } catch (error) {
    console.error("❌ Error fetching sessions:", error);
    sessions.value = [];
    showToast("Gagal memuat data sesi", "error");
  } finally {
    isLoading.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
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
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
  return `${diff} menit`;
};

const getStatusBadge = (status: string) => {
  const badges = {
    waiting: {
      class: "bg-gray-100 text-gray-800 border border-gray-300",
      label: "Menunggu",
    },
    ongoing: {
      class: "bg-blue-100 text-blue-800 border border-blue-300",
      label: "Berlangsung",
    },
    processing_summary: {
      class: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      label: "Summary Sedang Diproses",
    },
    finished: {
      class: "bg-green-100 text-green-800 border border-green-300",
      label: "Selesai",
    },
    failed: {
      class: "bg-red-100 text-red-800 border border-red-300",
      label: "Gagal",
    },
  };

  return badges[status as keyof typeof badges] || badges.waiting;
};

// Handlers
const handleFilterChange = (filters: {
  month: number | null;
  status: string;
  sort: "latest" | "oldest";
}) => {
  selectedMonth.value = filters.month;
  selectedStatus.value = filters.status;
  sortOrder.value = filters.sort;
  currentPage.value = 1; // Reset to first page
  fetchSessions();
};

const handleSessionClick = async (session: SessionResponse) => {
  try {
    const status = session.status.toLowerCase();

    // If session is waiting or ongoing, need to join first
    if (status === "waiting" || status === "ongoing") {
      console.log("🚪 Joining active session");
      await joinActiveSession(session.id);
      router.push(`/session/${session.id}`);
      return;
    }

    router.push(`/session/${session.id}`);
  } catch (error: any) {
    console.error("❌ Failed to handle session click:", error);
    showToast(
      error.message || "Gagal mengakses sesi. Silakan coba lagi.",
      "error"
    );
  }
};

// Handler untuk melihat summary
const viewSummary = (sessionId: string) => {
  router.push(`/session/${sessionId}/summary`);
};

const handleNewSession = async () => {
  if (!userThesisId.value) {
    console.error("❌ Thesis ID not found");
    showToast("Thesis ID tidak ditemukan. Silakan hubungi admin.", "error");
    return;
  }

  try {
    console.log("🚀 Starting new session for thesis:", userThesisId.value);
    const sessionData = await startSession(userThesisId.value);

    if (sessionData && sessionData.id) {
      showToast("Sesi baru telah dibuat!", "success");
      router.push(`/waiting-room/${sessionData.id}`);
    } else {
      throw new Error("Session ID tidak ditemukan dalam response");
    }
  } catch (error: any) {
    console.error("❌ Failed to start session:", error);
    showToast(
      error.message || "Gagal memulai sesi bimbingan. Silakan coba lagi.",
      "error"
    );
  }
};

const clearFilters = () => {
  selectedMonth.value = null;
  selectedStatus.value = "all";
  sortOrder.value = "latest";
  currentPage.value = 1;
  fetchSessions();
};

// Pagination handlers
const goToPage = (page: number) => {
  if (page >= 1 && page <= maxPage.value && page !== currentPage.value) {
    console.log("📄 Going to page:", page);
    currentPage.value = page;
    // fetchSessions will be called by watcher
  }
};

const nextPage = () => {
  if (currentPage.value < maxPage.value) {
    goToPage(currentPage.value + 1);
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
};

// Watch currentPage changes to fetch new data
watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage && !isLoading.value) {
    console.log("📄 Page changed:", oldPage, "→", newPage);
    fetchSessions();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

onMounted(async () => {
  console.log("=== 📋 SESSIONS PAGE MOUNTED ===");
  await fetchUserProfile();
  await fetchSessions();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="router.back()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                Semua Sesi Bimbingan
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                {{ totalCount }} sesi ditemukan
              </p>
            </div>
          </div>
          <button
            v-if="userType === 'mahasiswa'"
            @click="handleNewSession"
            :disabled="isStartingSession"
            class="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              v-if="isStartingSession"
              class="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <svg
              v-else
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
            <span>{{
              isStartingSession ? "Memulai sesi..." : "Sesi Baru"
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar - Filters -->
        <aside class="lg:col-span-1">
          <SessionsFilter
            :selected-month="selectedMonth"
            :selected-status="selectedStatus"
            :sort-order="sortOrder"
            @filter-change="handleFilterChange"
            @clear-filters="clearFilters"
          />
        </aside>

        <!-- Sessions Table -->
        <div class="lg:col-span-3">
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-16">
            <div
              class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"
            ></div>
            <p class="text-sm text-gray-500 mt-4">Memuat sesi bimbingan...</p>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="sessions.length === 0"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
          >
            <div
              class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg
                class="w-12 h-12 text-gray-400"
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
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada sesi ditemukan
            </h3>
            <p class="text-sm text-gray-500 mb-6">
              {{
                userType === "mahasiswa"
                  ? "Coba ubah filter atau mulai sesi bimbingan baru"
                  : "Coba ubah filter untuk menemukan sesi bimbingan"
              }}
            </p>
            <div class="flex items-center justify-center gap-3">
              <button
                @click="clearFilters"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Filter
              </button>
              <button
                v-if="userType === 'mahasiswa'"
                @click="handleNewSession"
                :disabled="isStartingSession"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isStartingSession ? "Memulai..." : "Mulai Sesi Baru" }}
              </button>
            </div>
          </div>

          <!-- Table View -->
          <div
            v-else
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <!-- Desktop Table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Tanggal & Waktu
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Judul Tugas Akhir
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Durasi
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="session in sessions"
                    :key="session.id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {{ formatDate(session.start_time) }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ formatTime(session.start_time) }} -
                        {{ formatTime(session.end_time) }}
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900 max-w-xs">
                        {{ session.thesis.title }}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        {{ session.thesis.student.name }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {{ getDuration(session.start_time, session.end_time) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusBadge(session.status).class,
                        ]"
                      >
                        {{ getStatusBadge(session.status).label }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="flex items-center gap-2">
                        <button
                          @click="handleSessionClick(session)"
                          class="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {{
                            session.status.toLowerCase() === "waiting" ||
                            session.status.toLowerCase() === "ongoing"
                              ? "Gabung"
                              : "Detail"
                          }}
                        </button>
                        <button
                          v-if="session.status.toLowerCase() === 'finished'"
                          @click.stop="viewSummary(session.id)"
                          class="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                        >
                          <svg
                            class="w-3.5 h-3.5 mr-1"
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
                          Ringkasan
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Card View -->
            <div class="md:hidden divide-y divide-gray-200">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 mb-1">
                      {{ formatDate(session.start_time) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ formatTime(session.start_time) }} -
                      {{ formatTime(session.end_time) }}
                      <span class="mx-1">•</span>
                      {{ getDuration(session.start_time, session.end_time) }}
                    </div>
                  </div>
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusBadge(session.status).class,
                    ]"
                  >
                    {{ getStatusBadge(session.status).label }}
                  </span>
                </div>
                <div class="text-sm text-gray-900 font-medium mb-1">
                  {{ session.thesis.title }}
                </div>
                <div class="text-xs text-gray-500 mb-3">
                  {{ session.thesis.student.name }}
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="handleSessionClick(session)"
                    class="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {{
                      session.status.toLowerCase() === "waiting" ||
                      session.status.toLowerCase() === "ongoing"
                        ? "Gabung"
                        : "Detail"
                    }}
                  </button>
                  <button
                    v-if="session.status.toLowerCase() === 'finished'"
                    @click="viewSummary(session.id)"
                    class="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <svg
                      class="w-4 h-4 mr-1.5"
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
                    Ringkasan
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="!isLoading && sessions.length > 0 && maxPage > 1"
            class="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl"
          >
            <!-- Mobile Pagination -->
            <div class="flex flex-1 justify-between sm:hidden">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div class="flex items-center text-sm text-gray-700">
                <span class="font-medium">{{ currentPage }}</span>
                <span class="mx-1">/</span>
                <span class="font-medium">{{ maxPage }}</span>
              </div>
              <button
                @click="nextPage"
                :disabled="currentPage === maxPage"
                class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

            <!-- Desktop Pagination -->
            <div
              class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between"
            >
              <div>
                <p class="text-sm text-gray-700">
                  Menampilkan
                  <span class="font-medium">{{
                    (currentPage - 1) * perPage + 1
                  }}</span>
                  sampai
                  <span class="font-medium">{{
                    Math.min(currentPage * perPage, totalCount)
                  }}</span>
                  dari
                  <span class="font-medium">{{ totalCount }}</span>
                  hasil
                </p>
              </div>
              <div>
                <nav
                  class="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Previous</span>
                    <svg
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>

                  <template v-for="page in maxPage" :key="page">
                    <button
                      v-if="
                        page === 1 ||
                        page === maxPage ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      "
                      @click="goToPage(page)"
                      :class="[
                        'relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20',
                        page === currentPage
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0',
                      ]"
                    >
                      {{ page }}
                    </button>
                    <span
                      v-else-if="
                        page === currentPage - 2 || page === currentPage + 2
                      "
                      class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                    >
                      ...
                    </span>
                  </template>

                  <button
                    @click="nextPage"
                    :disabled="currentPage === maxPage"
                    class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Next</span>
                    <svg
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
