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

const getProgressColor = (type: string) => {
  switch (type) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "warning":
      return "bg-yellow-500";
    default:
      return "bg-blue-500";
  }
};
</script>

<template>
  <!-- Toast Container - Fixed position, above header -->
  <div
    class="fixed top-16 sm:top-20 right-0 left-0 sm:left-auto sm:right-4 z-[60] pointer-events-none"
  >
    <div
      class="flex flex-col items-stretch sm:items-end space-y-2 sm:space-y-3 px-3 sm:px-0"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="space-y-2 sm:space-y-3 w-full sm:w-auto"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto',
            'flex flex-col p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm',
            'max-w-md w-full',
            'transform transition-all duration-300',
            'cursor-pointer hover:shadow-xl',
            getColors(toast.type),
          ]"
          @click="remove(toast.id)"
        >
          <!-- Main content -->
          <div class="flex items-start">
            <!-- Icon -->
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

            <!-- Message -->
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-medium break-words">
                {{ toast.message }}
              </p>
            </div>

            <!-- Close button -->
            <button
              @click.stop="remove(toast.id)"
              class="ml-3 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 p-1"
              aria-label="Close notification"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>

          <!-- Progress bar -->
          <div
            v-if="toast.duration"
            class="mt-3 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              :class="['h-full rounded-full', getProgressColor(toast.type)]"
              :style="{
                animation: `shrink ${toast.duration}ms linear`,
              }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* Toast enter/leave animations */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile: Slide from top instead of right */
@media (max-width: 640px) {
  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
}

/* Progress bar shrink animation */
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Pointer events management */
.pointer-events-none {
  pointer-events: none;
}

.pointer-events-auto {
  pointer-events: auto;
}

/* Smooth backdrop blur for supported browsers */
@supports (backdrop-filter: blur(8px)) {
  .backdrop-blur-sm {
    backdrop-filter: blur(8px);
  }
}

/* Hover effect */
.cursor-pointer:hover {
  transform: scale(1.02);
}

.cursor-pointer:active {
  transform: scale(0.98);
}
</style>
