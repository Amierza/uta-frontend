<script setup lang="ts">
import { computed } from "vue";
import type { NotificationResponse } from "../types/notification";

interface Props {
  isOpen: boolean;
  notification: NotificationResponse | null;
  isLoading?: boolean;
}

interface Emits {
  (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const notificationIcon = computed(() => {
  if (!props.notification) return "info";

  const title = props.notification.title.toLowerCase();

  if (title.includes("join")) return "user-plus";
  if (title.includes("left") || title.includes("leave")) return "user-minus";
  if (title.includes("end") || title.includes("finish")) return "check-circle";
  if (title.includes("start")) return "play-circle";
  if (title.includes("cancel")) return "x-circle";

  return "bell";
});

const iconColors = computed(() => {
  const iconType = notificationIcon.value;

  const colors = {
    "user-plus": {
      bg: "bg-green-100",
      text: "text-green-600",
      border: "border-green-200",
    },
    "user-minus": {
      bg: "bg-orange-100",
      text: "text-orange-600",
      border: "border-orange-200",
    },
    "check-circle": {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    "play-circle": {
      bg: "bg-purple-100",
      text: "text-purple-600",
      border: "border-purple-200",
    },
    "x-circle": {
      bg: "bg-red-100",
      text: "text-red-600",
      border: "border-red-200",
    },
    bell: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    },
  };

  return colors[iconType as keyof typeof colors] || colors.bell;
});

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";

  try {
    // Parse ISO 8601 date string with timezone
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "-";
    }

    // Format with Indonesian locale
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    return new Intl.DateTimeFormat("id-ID", options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

const handleClose = () => {
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style="background-color: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px)"
        @click.self="handleClose"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all"
          style="max-height: 90vh; overflow-y: auto"
          @click.stop
        >
          <!-- Loading State -->
          <div v-if="isLoading" class="p-8 text-center">
            <div
              class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"
            ></div>
            <p class="text-sm text-gray-500">Memuat detail notifikasi...</p>
          </div>

          <!-- Content -->
          <div v-else-if="notification" class="relative">
            <!-- Header -->
            <div
              class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10"
            >
              <h3 class="text-lg font-bold text-gray-900">Detail Notifikasi</h3>
              <button
                @click="handleClose"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  class="w-5 h-5 text-gray-500"
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
              </button>
            </div>

            <!-- Body -->
            <div class="p-6">
              <!-- Icon & Status -->
              <div class="flex items-start gap-4 mb-6">
                <div
                  :class="[
                    'w-16 h-16 rounded-full flex items-center justify-center border-2',
                    iconColors.bg,
                    iconColors.border,
                  ]"
                >
                  <!-- User Plus Icon -->
                  <svg
                    v-if="notificationIcon === 'user-plus'"
                    :class="['w-8 h-8', iconColors.text]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>

                  <!-- User Minus Icon -->
                  <svg
                    v-else-if="notificationIcon === 'user-minus'"
                    :class="['w-8 h-8', iconColors.text]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                    />
                  </svg>

                  <!-- Check Circle Icon -->
                  <svg
                    v-else-if="notificationIcon === 'check-circle'"
                    :class="['w-8 h-8', iconColors.text]"
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

                  <!-- Play Circle Icon -->
                  <svg
                    v-else-if="notificationIcon === 'play-circle'"
                    :class="['w-8 h-8', iconColors.text]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  <!-- X Circle Icon -->
                  <svg
                    v-else-if="notificationIcon === 'x-circle'"
                    :class="['w-8 h-8', iconColors.text]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  <!-- Bell Icon (default) -->
                  <svg
                    v-else
                    :class="['w-8 h-8', iconColors.text]"
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
                </div>

                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      v-if="!notification.is_read"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      Belum Dibaca
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      Sudah Dibaca
                    </span>
                  </div>
                  <h4 class="text-xl font-bold text-gray-900 mb-1">
                    {{ notification.title }}
                  </h4>
                  <p class="text-sm text-gray-500">
                    {{ formatDate(notification.created_at) }}
                  </p>
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-gray-200 my-6"></div>

              <!-- Message Content -->
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h5 class="text-sm font-semibold text-gray-700 mb-2">Pesan:</h5>
                <p class="text-gray-900 leading-relaxed">
                  {{ notification.message }}
                </p>
              </div>
            </div>

            <!-- Footer Actions -->
            <div
              class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl"
            >
              <button
                @click="handleClose"
                class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="p-8 text-center">
            <div
              class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
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
            <p class="text-sm text-gray-500">Notifikasi tidak ditemukan</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: all 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1, #94a3b8);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8, #64748b);
}
</style>
