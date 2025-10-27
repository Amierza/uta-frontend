<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { getInitials, getAvatarColor } from "../utils";
import type { Participant } from "../types/message";

interface Props {
  sessionTitle: string;
  sessionStatus: string;
  sessionId: string;
  allParticipants: Participant[];
  totalCount: number;
  userType: string;
  isSessionOwner: boolean;
  canLeave: boolean;
  canEnd: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  back: [];
  leave: [];
  end: [];
}>();

const router = useRouter();
const showMobileMenu = ref(false);

// Check if session is finished
const isFinished = computed(() => props.sessionStatus === "finished");

// Show actions only if not finished and has permissions
const showActions = computed(
  () => !isFinished.value && (props.canLeave || props.canEnd)
);

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
};

const handleLeave = () => {
  closeMobileMenu();
  emit("leave");
};

const handleEnd = () => {
  closeMobileMenu();
  emit("end");
};

const goToSummary = () => {
  router.push(`/session/${props.sessionId}/summary`);
};

// Get status display config
const statusConfig = computed(() => {
  switch (props.sessionStatus) {
    case "ongoing":
      return {
        label: "sedang berlangsung",
        color: "text-emerald-600",
        animated: true,
      };
    case "finished":
      return {
        label: "selesai",
        color: "text-gray-600",
        animated: false,
      };
    case "waiting":
      return {
        label: "menunggu",
        color: "text-yellow-600",
        animated: true,
      };
    default:
      return {
        label: props.sessionStatus,
        color: "text-gray-600",
        animated: false,
      };
  }
});
</script>

<template>
  <div
    class="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-40"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14 sm:h-16">
        <!-- Left Section -->
        <div
          class="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0"
        >
          <!-- Back Button -->
          <button
            @click="emit('back')"
            class="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0"
          >
            <svg
              class="w-5 h-5 sm:w-5 sm:h-5 text-gray-600"
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

          <!-- Session Info -->
          <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <!-- Avatars - Show up to 3 participants -->
            <div class="relative flex-shrink-0 flex -space-x-2">
              <div
                v-for="participant in allParticipants.slice(0, 3)"
                :key="participant.id"
                class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center shadow-md"
                :class="getAvatarColor(participant.name)"
                :title="participant.name"
              >
                <span class="text-white font-semibold text-[10px] sm:text-xs">
                  {{ getInitials(participant.name) }}
                </span>
              </div>
              <!-- Show +N if more than 3 -->
              <div
                v-if="allParticipants.length > 3"
                class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center shadow-md bg-gray-200"
                :title="`+${allParticipants.length - 3} lainnya`"
              >
                <span
                  class="text-gray-700 font-semibold text-[10px] sm:text-xs"
                >
                  +{{ allParticipants.length - 3 }}
                </span>
              </div>
            </div>

            <!-- Title & Status -->
            <div class="min-w-0 flex-1">
              <h3
                class="font-semibold text-gray-900 text-xs sm:text-sm md:text-base truncate"
              >
                {{ sessionTitle }}
              </h3>
              <p
                class="text-[10px] sm:text-xs text-gray-500 flex items-center space-x-1"
              >
                <span>{{ totalCount }} peserta</span>
                <span>•</span>
                <span
                  class="capitalize flex items-center space-x-1"
                  :class="statusConfig.color"
                >
                  <span>{{ statusConfig.label }}</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Right Section -->
        <div
          class="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 ml-2"
        >
          <!-- Owner Badge -->
          <div
            v-if="isSessionOwner"
            class="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-blue-700 bg-blue-100 rounded-md sm:rounded-lg"
          >
            Owner
          </div>

          <!-- Summary Button (when finished) -->
          <button
            v-if="isFinished"
            @click="goToSummary"
            class="hidden md:flex items-center px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg lg:rounded-xl transition-all shadow-sm"
            title="Lihat ringkasan sesi"
          >
            <svg
              class="w-4 h-4 lg:mr-2"
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
            <span class="hidden lg:inline">Lihat Ringkasan</span>
          </button>

          <!-- Desktop Actions (Only if not finished) -->
          <template v-if="!isFinished">
            <button
              v-if="canLeave"
              @click="emit('leave')"
              class="hidden md:flex px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg lg:rounded-xl transition-all"
              title="Tinggalkan sesi ini"
            >
              <span class="hidden lg:inline">Tinggalkan</span>
              <span class="lg:hidden">
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </span>
            </button>

            <button
              v-if="canEnd"
              @click="emit('end')"
              class="hidden md:flex px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg lg:rounded-xl transition-all"
              title="Akhiri sesi untuk semua peserta"
            >
              <span class="hidden lg:inline">Akhiri Sesi</span>
              <span class="lg:hidden">Akhiri</span>
            </button>

            <!-- Mobile Menu Button (Only if has actions) -->
            <button
              v-if="showActions"
              @click="toggleMobileMenu"
              class="md:hidden p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </template>

          <!-- Mobile Summary Button (when finished) -->
          <button
            v-if="isFinished"
            @click="goToSummary"
            class="md:hidden p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm"
            title="Lihat ringkasan sesi"
          >
            <svg
              class="w-5 h-5 text-white"
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
          </button>
        </div>
      </div>
    </div>

    <teleport to="body">
      <!-- Mobile Dropdown Menu (Only show if not finished and has actions) -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="showMobileMenu && showActions"
          class="md:hidden fixed top-14 sm:top-16 right-0 left-0 bg-white border-b border-gray-200 shadow-xl z-[9999]"
        >
          <div class="px-3 sm:px-4 py-2 space-y-1">
            <button
              v-if="canLeave"
              @click="handleLeave"
              class="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <svg
                class="w-5 h-5 mr-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Tinggalkan Sesi
            </button>

            <button
              v-if="canEnd"
              @click="handleEnd"
              class="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-all"
            >
              <svg
                class="w-5 h-5 mr-3 text-red-500"
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
              Akhiri Sesi
            </button>
          </div>
        </div>
      </Transition>

      <!-- Backdrop Overlay -->
      <Transition
        enter-active-class="transition-opacity ease-linear duration-100"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity ease-linear duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showMobileMenu && showActions"
          @click="closeMobileMenu"
          class="md:hidden fixed inset-0 bg-black/30 z-[9998]"
        ></div>
      </Transition>
    </teleport>
  </div>
</template>
