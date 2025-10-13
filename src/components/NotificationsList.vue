<script setup lang="ts">
import { defineProps, computed } from "vue";
import type { NotificationResponse } from "../types/notification";

interface Props {
  notifications: NotificationResponse[];
  isLoading?: boolean;
}

const props = defineProps<Props>();

const unreadCount = computed(() => {
  return props.notifications.filter((n) => !n.is_read).length;
});
</script>

<template>
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
          class="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5"
        >
          {{ unreadCount }}
        </span>
      </div>
      <button class="text-sm text-blue-600 hover:text-blue-800">
        Lihat Semua
      </button>
    </h3>

    <div v-if="isLoading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <p class="text-sm text-gray-500 mt-2">Memuat notifikasi...</p>
    </div>

    <div v-else-if="notifications.length === 0" class="text-center py-8">
      <svg
        class="w-16 h-16 mx-auto text-gray-300"
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
      <p class="text-sm text-gray-500 mt-2">Belum ada notifikasi</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        :class="{
          'bg-blue-50 border border-blue-100': !notification.is_read,
        }"
      >
        <div class="flex-shrink-0">
          <div
            :class="[
              'w-2 h-2 rounded-full mt-2',
              !notification.is_read ? 'bg-blue-500' : 'bg-gray-400',
            ]"
          ></div>
        </div>
        <div class="flex-1">
          <p
            class="text-sm font-semibold text-gray-900 mb-1"
            :class="{ 'font-bold': !notification.is_read }"
          >
            {{ notification.title }}
          </p>
          <p class="text-sm text-gray-700">
            {{ notification.message }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
