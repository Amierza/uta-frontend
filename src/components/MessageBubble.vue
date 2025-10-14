<script setup lang="ts">
import { getInitials, getAvatarColor, formatTime } from "../utils";
import type { Message } from "../types/message";

interface Props {
  message: Message;
  isMyMessage: boolean;
  senderName: string;
  replyToMessage?: Message | null;
  replyToSenderName?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  reply: [message: Message];
}>();
</script>

<template>
  <div :class="['flex group', isMyMessage ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'flex items-end space-x-2 max-w-[85%] sm:max-w-lg',
        isMyMessage ? 'flex-row-reverse space-x-reverse' : '',
      ]"
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

          <!-- Message text -->
          <p class="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
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

          <!-- Reply button -->
          <button
            v-if="!message.is_sending"
            @click="emit('reply', message)"
            :class="[
              'absolute -bottom-7 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg hover:scale-110',
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
