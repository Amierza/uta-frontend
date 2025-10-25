<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import type { NotificationResponse } from "../types/notification";
import NotificationDetailModal from "./NotificationDetailModal.vue";

const router = useRouter();

interface Props {
  notifications: NotificationResponse[];
  isLoading?: boolean;
}

interface Emits {
  (e: "notificationClick", notificationId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Modal state
const showDetailModal = ref(false);
const selectedNotification = ref<NotificationResponse | null>(null);
const isLoadingDetail = ref(false);

// Filter out notifications with invalid dates
const validNotifications = computed(() => {
  return props.notifications.filter((n) => {
    if (!n.created_at) return false;
    const date = new Date(n.created_at);
    // Check if year is valid (not 0001)
    return date.getFullYear() > 1900;
  });
});

const unreadCount = computed(() => {
  return validNotifications.value.filter((n) => !n.is_read).length;
});

const handleNotificationClick = async (notification: NotificationResponse) => {
  // Emit event to fetch detail (akan otomatis mark as read di backend)
  emit("notificationClick", notification.id);

  // Update local state immediately for better UX
  if (!notification.is_read) {
    notification.is_read = true;
  }

  selectedNotification.value = notification;
  showDetailModal.value = true;
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

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "-";
    }

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    console.log("Date string:", dateString);
    console.log("Parsed date:", date.toString());
    console.log("Diff in seconds:", diffInSeconds);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;

    // For older dates, show formatted date
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
    console.error("Error formatting relative time:", error);
    return "-";
  }
}

const handleViewAll = () => {
  router.push("/notifications");
};
</script>

<template>
  <!-- Notification Detail Modal -->
  <NotificationDetailModal
    :is-open="showDetailModal"
    :notification="selectedNotification"
    :is-loading="isLoadingDetail"
    @close="handleCloseModal"
  />

  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
        <span
          v-if="unreadCount > 0"
          class="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold"
        >
          {{ unreadCount }}
        </span>
      </div>
      <button
        @click="handleViewAll"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        Lihat Semua
      </button>
    </h3>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"
      ></div>
      <p class="text-sm text-gray-500 mt-2">Memuat notifikasi...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="validNotifications.length === 0" class="text-center py-8">
      <div
        class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"
      >
        <svg
          class="w-8 h-8 text-gray-400"
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
      <p class="text-sm font-medium text-gray-900 mb-1">Belum ada notifikasi</p>
      <p class="text-xs text-gray-500">
        Notifikasi akan muncul di sini ketika ada aktivitas baru
      </p>
    </div>

    <!-- Notifications List -->
    <div v-else class="space-y-2">
      <div
        v-for="notification in validNotifications.slice(0, 3)"
        :key="notification.id"
        @click="handleNotificationClick(notification)"
        class="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
        :class="{
          'bg-blue-50/50 border border-blue-100 hover:bg-blue-50':
            !notification.is_read,
        }"
      >
        <!-- Indicator Dot -->
        <div class="flex-shrink-0 mt-1">
          <div
            :class="[
              'w-2.5 h-2.5 rounded-full transition-all',
              !notification.is_read
                ? 'bg-blue-500 ring-4 ring-blue-100'
                : 'bg-gray-300',
            ]"
          ></div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p
            class="text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors"
            :class="{ 'font-bold': !notification.is_read }"
          >
            {{ notification.title }}
          </p>
          <p class="text-sm text-gray-600 line-clamp-2">
            {{ notification.message }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatRelativeTime(notification.created_at) }}
          </p>
        </div>

        <!-- Arrow Icon -->
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

      <!-- Show more indicator -->
      <div v-if="validNotifications.length > 3" class="text-center pt-2">
        <button
          @click="handleViewAll"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Lihat {{ validNotifications.length - 3 }} notifikasi lainnya
        </button>
      </div>
    </div>
  </div>
</template>
