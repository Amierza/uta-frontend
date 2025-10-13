<script setup lang="ts">
import { computed } from "vue";
import type { CustomUserResponse } from "../types/user";

interface Props {
  participants: CustomUserResponse[];
  isActive?: boolean;
}

const props = defineProps<Props>();

// Get avatar URL
const getAvatarUrl = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&color=white&bold=true`;
};

// Show max 3 avatars
const displayedParticipants = computed(() => {
  return props.participants.slice(0, 3);
});

// Count remaining participants
const remainingCount = computed(() => {
  return Math.max(0, props.participants.length - 3);
});
</script>

<template>
  <div class="relative flex-shrink-0">
    <!-- Single Avatar -->
    <div v-if="participants.length === 1" class="relative">
      <img
        :src="getAvatarUrl(participants[0].name)"
        :alt="participants[0].name"
        class="w-12 h-12 rounded-full ring-2 ring-white"
      />
      <div
        v-if="isActive"
        class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"
      ></div>
    </div>

    <!-- Group Avatars (Stacked) -->
    <div v-else class="relative flex items-center">
      <!-- First 3 participants -->
      <div
        v-for="(participant, index) in displayedParticipants"
        :key="participant.id"
        class="relative"
        :style="{ marginLeft: index > 0 ? '-8px' : '0' }"
      >
        <img
          :src="getAvatarUrl(participant.name)"
          :alt="participant.name"
          :title="participant.name"
          class="w-10 h-10 rounded-full ring-2 ring-white hover:ring-blue-200 transition-all hover:scale-110 cursor-pointer"
          :style="{ zIndex: displayedParticipants.length - index }"
        />
      </div>

      <!-- Remaining count badge -->
      <div
        v-if="remainingCount > 0"
        class="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 ring-2 ring-white text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
        style="margin-left: -8px"
        :title="`+${remainingCount} lainnya`"
      >
        +{{ remainingCount }}
      </div>

      <!-- Active indicator on group -->
      <div
        v-if="isActive"
        class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse"
      ></div>
    </div>
  </div>
</template>
