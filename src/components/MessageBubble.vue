<script setup lang="ts">
import { ref, computed } from "vue";
import { getInitials, getAvatarColor, formatTime } from "../utils";
import type { Message } from "../types/message";

interface Props {
  message: Message;
  isMyMessage: boolean;
  senderName: string;
  replyToMessage?: Message | null;
  replyToSenderName?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  reply: [message: Message];
}>();

// Swipe states for mobile
const touchStartX = ref(0);
const touchCurrentX = ref(0);
const isDragging = ref(false);
const swipeThreshold = 80;

const translateX = computed(() => {
  if (!isDragging.value) return 0;
  const diff = touchCurrentX.value - touchStartX.value;

  if (props.isMyMessage) {
    return Math.min(0, diff); // Swipe left
  } else {
    return Math.max(0, diff); // Swipe right
  }
});

const showReplyIcon = computed(() => {
  return Math.abs(translateX.value) > 30;
});

const shouldTriggerReply = computed(() => {
  return Math.abs(translateX.value) >= swipeThreshold;
});

// Touch handlers
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  touchCurrentX.value = e.touches[0].clientX;
  isDragging.value = true;
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return;
  touchCurrentX.value = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  if (shouldTriggerReply.value && !props.message.is_sending) {
    emit("reply", props.message);
  }
  isDragging.value = false;
  touchStartX.value = 0;
  touchCurrentX.value = 0;
};

// Check if file is an image based on URL extension
const isImage = computed(() => {
  if (!props.message.file_url) return false;
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ];
  const url = props.message.file_url.toLowerCase();
  return imageExtensions.some((ext) => url.includes(ext));
});
</script>

<template>
  <div :class="['flex group', isMyMessage ? 'justify-end' : 'justify-start']">
    <!-- Swipe reply indicator (mobile) -->
    <div
      v-if="showReplyIcon"
      :class="[
        'absolute top-1/2 -translate-y-1/2 z-0 transition-opacity md:hidden',
        isMyMessage ? 'right-full mr-4' : 'left-full ml-4',
      ]"
    >
      <div
        class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"
      >
        <svg
          class="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
      </div>
    </div>

    <div
      :class="[
        'flex items-end space-x-2 max-w-[85%] sm:max-w-lg relative',
        isMyMessage ? 'flex-row-reverse space-x-reverse' : '',
      ]"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      :style="{
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }"
    >
      <!-- Avatar -->
      <div
        v-if="!isMyMessage"
        class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
        :class="getAvatarColor(senderName)"
      >
        <span class="text-white font-semibold text-xs">
          {{ getInitials(senderName) }}
        </span>
      </div>

      <!-- Message bubble -->
      <div class="flex flex-col min-w-0 flex-1">
        <!-- Sender name -->
        <div
          v-if="!isMyMessage"
          class="text-xs font-medium text-gray-600 mb-1 px-1"
        >
          {{ senderName }}
        </div>

        <!-- Message content -->
        <div
          :class="[
            'rounded-2xl px-4 py-2.5 break-words shadow-sm relative',
            isMyMessage
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-white text-gray-900 border border-gray-200/50 rounded-tl-sm',
          ]"
        >
          <!-- Reply preview -->
          <div
            v-if="message.parent_message_id && replyToMessage"
            :class="[
              'mb-2 pb-2 border-l-3 pl-3 text-xs rounded-lg',
              isMyMessage
                ? 'border-white/50 bg-white/10'
                : 'border-blue-500/50 bg-gray-50',
            ]"
          >
            <div class="font-semibold mb-1">
              Membalas {{ replyToSenderName || "Unknown" }}
            </div>
            <div class="truncate opacity-90">
              {{ replyToMessage.text || "Pesan" }}
            </div>
          </div>

          <!-- File attachment -->
          <div v-if="message.file_url" class="mb-2">
            <!-- Image preview -->
            <a
              v-if="isImage"
              :href="message.file_url"
              target="_blank"
              class="block rounded-lg overflow-hidden"
            >
              <img
                :src="message.file_url"
                alt="Image"
                class="max-w-full h-auto rounded-lg"
                style="max-height: 300px"
              />
            </a>

            <!-- File download -->
            <a
              v-else
              :href="message.file_url"
              target="_blank"
              download
              :class="[
                'flex items-center gap-2 p-2 rounded-lg',
                isMyMessage ? 'bg-blue-500/20' : 'bg-gray-100',
              ]"
            >
              <div
                :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isMyMessage ? 'bg-blue-400' : 'bg-blue-500',
                ]"
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p
                  :class="[
                    'text-xs font-medium truncate',
                    isMyMessage ? 'text-white' : 'text-gray-900',
                  ]"
                >
                  {{ message.file_url.split("/").pop() }}
                </p>
                <p
                  :class="[
                    'text-[10px]',
                    isMyMessage ? 'text-blue-200' : 'text-gray-500',
                  ]"
                >
                  File
                </p>
              </div>
              <svg
                :class="[
                  'w-4 h-4',
                  isMyMessage ? 'text-blue-200' : 'text-gray-400',
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
          </div>

          <!-- Message text -->
          <p
            v-if="message.text && message.text !== '📎 File'"
            class="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap"
          >
            {{ message.text }}
          </p>

          <!-- Time -->
          <div
            :class="[
              'flex items-center space-x-1 mt-1',
              isMyMessage ? 'justify-end' : '',
            ]"
          >
            <span
              :class="[
                'text-[10px]',
                isMyMessage ? 'text-white/80' : 'text-gray-500',
              ]"
            >
              {{ formatTime(message.timestamp) }}
            </span>
            <svg
              v-if="isMyMessage && !message.is_sending"
              class="w-3.5 h-3.5 text-white/80"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              />
            </svg>
            <div
              v-if="message.is_sending"
              class="w-3 h-3 border-2 border-white/80 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>

          <!-- Reply button (desktop hover) -->
          <button
            v-if="!message.is_sending"
            @click="emit('reply', message)"
            :class="[
              'hidden md:block absolute -bottom-7 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg hover:scale-110',
              isMyMessage ? 'right-0' : 'left-0',
            ]"
            title="Balas pesan"
          >
            <svg
              class="w-3.5 h-3.5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
