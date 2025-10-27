<script setup lang="ts">
import { ref } from "vue";
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
  send: [files?: File[]];
  cancelReply: [];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    emit(
      "send",
      selectedFiles.value.length > 0 ? selectedFiles.value : undefined
    );
  } else if (event.key === "Escape") {
    emit("cancelReply");
  }
};

const handleFileSelect = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);

  if (files.length === 0) return;

  // Validate file size (max 10MB per file)
  const maxSize = 10 * 1024 * 1024;
  const invalidFiles = files.filter((f) => f.size > maxSize);

  if (invalidFiles.length > 0) {
    alert(
      `File ${invalidFiles[0].name} terlalu besar. Maksimal 10MB per file.`
    );
    return;
  }

  selectedFiles.value = files;
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("excel") || fileType.includes("sheet")) return "📊";
  return "📎";
};

const handleSend = () => {
  emit(
    "send",
    selectedFiles.value.length > 0 ? selectedFiles.value : undefined
  );
  selectedFiles.value = [];
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
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

      <!-- Selected Files Preview -->
      <div
        v-if="selectedFiles.length > 0"
        class="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-gray-700">
            📎 {{ selectedFiles.length }} file dipilih
          </span>
          <button
            @click="selectedFiles = []"
            class="text-xs text-red-600 hover:text-red-800"
          >
            Hapus semua
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="flex items-center justify-between bg-white p-2 rounded-lg"
          >
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="text-lg">{{ getFileIcon(file.type) }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-900 truncate">
                  {{ file.name }}
                </p>
                <p class="text-[10px] text-gray-500">
                  {{ formatFileSize(file.size) }}
                </p>
              </div>
            </div>
            <button
              @click="removeFile(index)"
              class="p-1 hover:bg-gray-100 rounded"
            >
              <svg
                class="w-4 h-4 text-gray-500"
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
        </div>
      </div>

      <!-- Input area -->
      <div class="flex items-end space-x-2 sm:space-x-3">
        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          class="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          @change="handleFileChange"
        />

        <!-- Attach button -->
        <button
          @click="handleFileSelect"
          :disabled="sessionStatus === 'finished'"
          class="p-3 text-gray-600 hover:bg-gray-100 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Lampirkan file"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

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
          @click="handleSend"
          :disabled="
            (!modelValue.trim() && selectedFiles.length === 0) ||
            isSending ||
            sessionStatus === 'finished'
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
