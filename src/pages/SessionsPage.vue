<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAllSessions } from "../api/session";
import type { SessionResponse } from "../types/session";
import SessionCard from "../components/SessionCard.vue";
import SessionsFilter from "../components/SessionsFilter.vue";
import { useUser } from "../composables/useUser";

const router = useRouter();

// User data
const { userId, userType, userIdentifier, fetchUserProfile } = useUser();

// State
const sessions = ref<SessionResponse[]>([]);
const isLoading = ref(false);

// Filter states
const selectedMonth = ref<number | null>(null);
const selectedStatus = ref<string>("all");
const sortOrder = ref<"latest" | "oldest">("latest");

// Fetch sessions with filters
const fetchSessions = async () => {
  try {
    isLoading.value = true;

    // Build query params
    const params: Record<string, string> = {};
    if (selectedMonth.value) params.month = selectedMonth.value.toString();
    if (selectedStatus.value !== "all") params.status = selectedStatus.value;
    params.sort = sortOrder.value;

    const response = await getAllSessions(params);

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
    } else {
      sessions.value = [];
    }
  } catch (error) {
    console.error("Error fetching sessions:", error);
    sessions.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Computed: Group sessions by date
const groupedSessions = computed(() => {
  const groups: Record<string, SessionResponse[]> = {};

  sessions.value.forEach((session) => {
    const date = new Date(session.start_time || "");
    const dateKey = date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
  });

  return groups;
});

// Handlers
const handleFilterChange = (filters: {
  month: number | null;
  status: string;
  sort: "latest" | "oldest";
}) => {
  selectedMonth.value = filters.month;
  selectedStatus.value = filters.status;
  sortOrder.value = filters.sort;
  fetchSessions();
};

const handleSessionClick = (sessionId: string) => {
  router.push(`/session/${sessionId}`);
};

const handleNewSession = () => {
  router.push("/chat");
};

const clearFilters = () => {
  selectedMonth.value = null;
  selectedStatus.value = "all";
  sortOrder.value = "latest";
  fetchSessions();
};

onMounted(async () => {
  await fetchUserProfile(); // Fetch user data first
  await fetchSessions(); // Then fetch sessions
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
                {{ sessions.length }} sesi ditemukan
              </p>
            </div>
          </div>
          <button
            @click="handleNewSession"
            class="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Sesi Baru
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

        <!-- Sessions List -->
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
              Coba ubah filter atau mulai sesi bimbingan baru
            </p>
            <div class="flex items-center justify-center gap-3">
              <button
                @click="clearFilters"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Filter
              </button>
              <button
                @click="handleNewSession"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mulai Sesi Baru
              </button>
            </div>
          </div>

          <!-- Grouped Sessions -->
          <div v-else class="space-y-8">
            <div
              v-for="(sessionGroup, dateKey) in groupedSessions"
              :key="dateKey"
              class="space-y-4"
            >
              <!-- Date Header -->
              <div class="flex items-center space-x-3">
                <div class="h-px flex-1 bg-gray-200"></div>
                <h2
                  class="text-sm font-semibold text-gray-600 uppercase tracking-wide"
                >
                  {{ dateKey }}
                </h2>
                <div class="h-px flex-1 bg-gray-200"></div>
              </div>

              <!-- Sessions in this date -->
              <div
                class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3"
              >
                <SessionCard
                  v-for="session in sessionGroup"
                  :key="session.id"
                  :session="session"
                  :user-type="userType"
                  :user-id="userId"
                  @click="handleSessionClick(session.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
