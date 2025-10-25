<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useUser } from "../composables/useUser";
import { useNotifications } from "../composables/useNotification";
import { useNotificationDetail } from "../composables/useNotificationDetail";
import NotificationDetailModal from "../components/NotificationDetailModal.vue";
import type { NotificationResponse } from "../types/notification";

const router = useRouter();
const { userId, fetchUserProfile } = useUser();
const { notifications, isLoadingNotifications, fetchNotifications } =
  useNotifications(userId);
const { fetchNotificationDetail } = useNotificationDetail();

// State
const showDetailModal = ref(false);
const selectedNotification = ref<NotificationResponse | null>(null);
const isLoadingDetail = ref(false);
const filterType = ref<"all" | "unread" | "read">("all");
const searchQuery = ref("");
const isInitializing = ref(true);

// Computed
const validNotifications = computed(() => {
  return notifications.value.filter((n) => {
    if (!n.created_at) return false;
    const date = new Date(n.created_at);
    return date.getFullYear() > 1900;
  });
});

const filteredNotifications = computed(() => {
  let filtered = validNotifications.value;

  // Filter by read status
  if (filterType.value === "unread") {
    filtered = filtered.filter((n) => !n.is_read);
  } else if (filterType.value === "read") {
    filtered = filtered.filter((n) => n.is_read);
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const unreadCount = computed(() => {
  return validNotifications.value.filter((n) => !n.is_read).length;
});

const readCount = computed(() => {
  return validNotifications.value.filter((n) => n.is_read).length;
});

// Methods
const handleNotificationClick = async (notification: NotificationResponse) => {
  try {
    console.log("🔔 Fetching notification detail:", notification.id);

    // Fetch detail to mark as read
    await fetchNotificationDetail(notification.id);

    // Update local state
    if (!notification.is_read) {
      notification.is_read = true;
    }

    selectedNotification.value = notification;
    showDetailModal.value = true;

    console.log("✅ Notification detail fetched and marked as read");
  } catch (error) {
    console.error("❌ Failed to fetch notification detail:", error);
  }
};

const handleCloseModal = () => {
  showDetailModal.value = false;
  setTimeout(() => {
    selectedNotification.value = null;
  }, 300);
};

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    const now = new Date();

    if (isNaN(date.getTime())) return "-";

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    return "-";
  }
}

const goBack = () => {
  router.back();
};

const refreshNotifications = async () => {
  await fetchNotifications();
};

// Watch userId to fetch notifications when ready
watch(
  userId,
  async (newUserId) => {
    if (newUserId) {
      console.log("✅ UserId ready, fetching notifications:", newUserId);
      await fetchNotifications();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  console.log("=== 📬 NOTIFICATIONS PAGE MOUNTED ===");

  try {
    // Ensure user profile is loaded
    if (!userId.value) {
      console.log("⏳ Loading user profile...");
      await fetchUserProfile();
    }

    console.log("📊 UserId:", userId.value);

    // Fetch notifications
    console.log("📥 Fetching notifications...");
    await fetchNotifications();

    console.log("✅ Notifications loaded:", notifications.value.length);
  } catch (error) {
    console.error("❌ Failed to initialize notifications page:", error);
  } finally {
    isInitializing.value = false;
  }
});
</script>

<template>
  <!-- Notification Detail Modal -->
  <NotificationDetailModal
    :is-open="showDetailModal"
    :notification="selectedNotification"
    :is-loading="isLoadingDetail"
    @close="handleCloseModal"
  />

  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
  >
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="goBack"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Notifikasi</h1>
              <p class="text-sm text-gray-500 mt-1">
                {{ validNotifications.length }} total notifikasi
              </p>
            </div>
          </div>

          <button
            @click="refreshNotifications"
            :disabled="isLoadingNotifications"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg
              :class="{ 'animate-spin': isLoadingNotifications }"
              class="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Filters & Search -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
      >
        <!-- Filter Tabs -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            @click="filterType = 'all'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            Semua
            <span class="ml-1.5 text-xs opacity-90"
              >({{ validNotifications.length }})</span
            >
          </button>
          <button
            @click="filterType = 'unread'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              filterType === 'unread'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            Belum Dibaca
            <span
              v-if="unreadCount > 0"
              class="ml-1.5 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full"
            >
              {{ unreadCount }}
            </span>
            <span v-else class="ml-1.5 text-xs opacity-90">(0)</span>
          </button>
          <button
            @click="filterType = 'read'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              filterType === 'read'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            Sudah Dibaca
            <span class="ml-1.5 text-xs opacity-90">({{ readCount }})</span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari notifikasi..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="isInitializing || isLoadingNotifications"
        class="text-center py-12"
      >
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"
        ></div>
        <p class="text-sm text-gray-500">Memuat notifikasi...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredNotifications.length === 0"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
      >
        <div
          class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p class="text-lg font-medium text-gray-900 mb-2">
          {{ searchQuery ? "Tidak ada hasil" : "Belum ada notifikasi" }}
        </p>
        <p class="text-sm text-gray-500">
          {{
            searchQuery
              ? "Coba kata kunci lain"
              : "Notifikasi akan muncul di sini ketika ada aktivitas baru"
          }}
        </p>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-3">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          @click="handleNotificationClick(notification)"
          class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
          :class="{
            'ring-2 ring-blue-100 bg-blue-50/30': !notification.is_read,
          }"
        >
          <div class="p-5">
            <div class="flex items-start gap-4">
              <!-- Indicator -->
              <div class="flex-shrink-0 mt-1">
                <div
                  :class="[
                    'w-3 h-3 rounded-full transition-all',
                    !notification.is_read
                      ? 'bg-blue-500 ring-4 ring-blue-100'
                      : 'bg-gray-300',
                  ]"
                ></div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <h3
                    class="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
                    :class="{ 'font-bold': !notification.is_read }"
                  >
                    {{ notification.title }}
                  </h3>
                  <span
                    v-if="!notification.is_read"
                    class="flex-shrink-0 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                  >
                    Baru
                  </span>
                </div>

                <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                  {{ notification.message }}
                </p>

                <div class="flex items-center gap-2 text-xs text-gray-400">
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
                  <span>{{ formatRelativeTime(notification.created_at) }}</span>
                </div>
              </div>

              <!-- Arrow -->
              <div
                class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
* {
  transition-property: transform, opacity, box-shadow, background-color;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.space-y-3 > * {
  animation: fadeInUp 0.3s ease-out;
}
</style>
