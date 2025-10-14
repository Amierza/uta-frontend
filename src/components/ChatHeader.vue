<script setup lang="ts">
// import { computed } from "vue";
import { getInitials, getAvatarColor } from "../utils";
import type { Participant } from "../types/message";

interface Props {
  sessionTitle: string;
  sessionStatus: string;
  otherParticipants: Participant[];
  allParticipants: Participant[];
  onlineCount: number;
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

// // ✅ Conditional button visibility
// const showLeaveButton = computed(() => {
//   return true; // Bisa leave jika sudah computed di parent
// });

// const showEndButton = computed(() => {
//   return true; // Bisa end jika sudah computed di parent
// });
</script>

<template>
  <div
    class="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
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

          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <div class="relative flex-shrink-0 flex -space-x-2">
              <div
                v-for="(participant, idx) in otherParticipants.slice(0, 2)"
                :key="idx"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white flex items-center justify-center shadow-md relative"
                :class="getAvatarColor(participant.name)"
              >
                <span class="text-white font-semibold text-xs sm:text-sm">
                  {{ getInitials(participant.name) }}
                </span>
                <div
                  v-if="participant.online"
                  class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"
                ></div>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <h3
                class="font-semibold text-gray-900 text-sm sm:text-base truncate"
              >
                {{ sessionTitle }}
              </h3>
              <!-- ✅ PERBAIKAN 2: Fix online count display -->
              <p class="text-xs text-gray-500 flex items-center space-x-1">
                <span>{{ onlineCount }}/{{ totalCount }} peserta online</span>
                <span>•</span>
                <span class="capitalize">{{ sessionStatus }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2 flex-shrink-0">
          <!-- ✅ PERBAIKAN 1: Conditional leave/end buttons -->
          <!-- Leave button - hanya bisa jika bukan owner -->
          <button
            v-if="canLeave"
            @click="emit('leave')"
            class="hidden sm:flex px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            title="Tinggalkan sesi ini"
          >
            Tinggalkan
          </button>

          <!-- End button - hanya owner yang bisa end -->
          <button
            v-if="canEnd"
            @click="emit('end')"
            class="hidden sm:flex px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all"
            title="Akhiri sesi untuk semua peserta"
          >
            Akhiri Sesi
          </button>

          <!-- Show badge jika session owner -->
          <div
            v-if="isSessionOwner"
            class="hidden sm:flex px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg"
          >
            Owner
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
