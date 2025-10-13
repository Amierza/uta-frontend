<script setup lang="ts">
import { useNotificationToast } from "../composables/useNotificationToast";

const { toasts, remove } = useNotificationToast();

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return "M5 13l4 4L19 7";
    case "error":
      return "M6 18L18 6M6 6l12 12";
    case "warning":
      return "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
    default:
      return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  }
};

const getColors = (type: string) => {
  switch (type) {
    case "success":
      return "bg-green-50 border-green-200 text-green-800";
    case "error":
      return "bg-red-50 border-red-200 text-red-800";
    case "warning":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    default:
      return "bg-blue-50 border-blue-200 text-blue-800";
  }
};

const getIconColors = (type: string) => {
  switch (type) {
    case "success":
      return "text-green-600";
    case "error":
      return "text-red-600";
    case "warning":
      return "text-yellow-600";
    default:
      return "text-blue-600";
  }
};
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-3 max-w-md">
    <TransitionGroup name="toast" tag="div" class="space-y-3">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-start p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm',
          getColors(toast.type),
        ]"
      >
        <div class="flex-shrink-0">
          <svg
            :class="['w-6 h-6', getIconColors(toast.type)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="getIcon(toast.type)"
            />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium">{{ toast.message }}</p>
        </div>
        <button
          @click="remove(toast.id)"
          class="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
