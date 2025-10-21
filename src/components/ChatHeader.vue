<script setup lang="ts">
import { ref } from "vue";
import { getInitials, getAvatarColor } from "../utils";
import type { Participant } from "../types/message";

interface Props {
  sessionTitle: string;
  sessionStatus: string;
  allParticipants: Participant[];
  totalCount: number;
  userType: string;
  isSessionOwner: boolean;
  canLeave: boolean;
  canEnd: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  back: [];
  leave: [];
  end: [];
}>();

const showMobileMenu = ref(false);

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
</script>

<template>
  <div
    class="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm relative"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Left Section -->
        <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
          <!-- Back Button -->
          <button
            @click="emit('back')"
            class="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 flex-shrink-0"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <!-- Session Info -->
          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <!-- Avatars - Show up to 3 participants -->
            <div class="relative flex-shrink-0 flex -space-x-2">
              <div
                v-for="participant in allParticipants.slice(0, 3)"
                :key="participant.id"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white flex items-center justify-center shadow-md"
                :class="getAvatarColor(participant.name)"
                :title="participant.name"
              >
                <span class="text-white font-semibold text-xs sm:text-sm">
                  {{ getInitials(participant.name) }}
                </span>
              </div>
              <!-- Show +N if more than 3 -->
              <div
                v-if="allParticipants.length > 3"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white flex items-center justify-center shadow-md bg-gray-200"
                :title="`+${allParticipants.length - 3} lainnya`"
              >
                <span class="text-gray-700 font-semibold text-xs">
                  +{{ allParticipants.length - 3 }}
                </span>
              </div>
            </div>

            <!-- Title & Status -->
            <div class="min-w-0 flex-1">
              <h3
                class="font-semibold text-gray-900 text-sm sm:text-base truncate"
              >
                {{ sessionTitle }}
              </h3>
              <p class="text-xs text-gray-500 flex items-center space-x-1">
                <span>{{ totalCount }} peserta</span>
                <span>•</span>
                <span class="capitalize flex items-center space-x-1">
                  <span
                    v-if="sessionStatus === 'ongoing'"
                    class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"
                  ></span>
                  <span>{{ sessionStatus }}</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Right Section -->
        <div class="flex items-center space-x-2 flex-shrink-0">
          <!-- Desktop Actions -->
          <button
            v-if="canLeave"
            @click="emit('leave')"
            class="hidden sm:flex px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            title="Tinggalkan sesi ini"
          >
            Tinggalkan
          </button>

          <button
            v-if="canEnd"
            @click="emit('end')"
            class="hidden sm:flex px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all"
            title="Akhiri sesi untuk semua peserta"
          >
            Akhiri Sesi
          </button>

          <div
            v-if="isSessionOwner"
            class="hidden sm:flex px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg"
          >
            Owner
          </div>

          <!-- Mobile Menu Button -->
          <button
            v-if="canLeave || canEnd"
            @click="toggleMobileMenu"
            class="sm:hidden p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
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

          <!-- Mobile Badge -->
          <div
            v-if="isSessionOwner"
            class="sm:hidden px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg"
          >
            Owner
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showMobileMenu"
        class="sm:hidden absolute top-full right-0 left-0 bg-white border-b border-gray-200 shadow-lg z-50"
      >
        <div class="px-4 py-2 space-y-1">
          <button
            v-if="canLeave"
            @click="handleLeave"
            class="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
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
            class="w-full flex items-center px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-all"
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
        v-if="showMobileMenu"
        @click="closeMobileMenu"
        class="sm:hidden fixed inset-0 bg-black/20 z-40"
      ></div>
    </Transition>
  </div>
</template>
