<script setup lang="ts">
import type { Message } from "../types/message";

interface Props {
  modelValue: string;
  replyingTo: Message | null;
  replyToSenderName: string;
  isSending: boolean;
  sessionStatus: string;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [];
  cancelReply: [];
}>();

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    emit("send");
  } else if (event.key === "Escape") {
    emit("cancelReply");
  }
};
</script>

<template>
  <div
    class="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 shadow-lg"
  >
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <!-- Reply preview -->
      <div
        v-if="replyingTo"
        class="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-200/50 flex items-start justify-between"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <svg
              class="w-4 h-4 text-blue-600"
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
            <span class="text-xs font-semibold text-blue-700">
              Membalas {{ replyToSenderName }}
            </span>
          </div>
          <p class="text-sm text-gray-700 truncate">{{ replyingTo.text }}</p>
        </div>
        <button
          @click="emit('cancelReply')"
          class="ml-2 p-1 hover:bg-blue-100 rounded transition"
        >
          <svg
            class="w-4 h-4 text-blue-600"
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

      <!-- Input area -->
      <div class="flex items-end space-x-2 sm:space-x-3">
        <div class="flex-1">
          <textarea
            :value="modelValue"
            @input="
              emit(
                'update:modelValue',
                ($event.target as HTMLTextAreaElement).value
              )
            "
            @keypress="handleKeyPress"
            placeholder="Ketik pesan..."
            rows="1"
            :disabled="sessionStatus === 'finished'"
            class="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm"
            style="max-height: 120px; min-height: 44px"
          ></textarea>
        </div>
        <button
          @click="emit('send')"
          :disabled="
            !modelValue.trim() || isSending || sessionStatus === 'finished'
          "
          class="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
        >
          <svg
            v-if="!isSending"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          <div
            v-else
            class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></div>
        </button>
      </div>

      <div class="mt-2 text-xs text-gray-500 px-1">
        <span v-if="replyingTo" class="font-medium">
          ESC untuk batal balas •
        </span>
        Enter untuk kirim • Shift+Enter untuk baris baru
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  font-family: inherit;
  line-height: 1.5;
}
</style>
