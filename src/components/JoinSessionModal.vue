<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
  isOpen: boolean;
  isJoining?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  join: [sessionId: string];
}>();

const sessionId = ref("");
const error = ref("");

// Watch for modal open/close to reset form
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      sessionId.value = "";
      error.value = "";
    }
  }
);

const handleJoin = () => {
  // Validate session ID
  if (!sessionId.value.trim()) {
    error.value = "Session ID tidak boleh kosong";
    return;
  }

  // Basic UUID format validation (optional)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId.value.trim())) {
    error.value = "Format Session ID tidak valid";
    return;
  }

  error.value = "";
  emit("join", sessionId.value.trim());
};

const handleClose = () => {
  if (!props.isJoining) {
    emit("close");
  }
};

const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    sessionId.value = text.trim();
    error.value = "";
  } catch (err) {
    console.error("Failed to read clipboard:", err);
  }
};
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity ease-linear duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        @click="handleClose"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
      ></div>
    </Transition>

    <!-- Modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[101] flex items-center justify-center p-4"
      >
        <div
          @click.stop
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <!-- Header -->
          <div
            class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold">Bergabung ke Sesi</h3>
                  <p class="text-sm text-blue-100">
                    Masukkan Session ID dari mahasiswa
                  </p>
                </div>
              </div>
              <button
                @click="handleClose"
                :disabled="isJoining"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Session ID Input -->
            <div>
              <label
                for="session-id"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Session ID
              </label>
              <div class="relative">
                <input
                  id="session-id"
                  v-model="sessionId"
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  :disabled="isJoining"
                  @keyup.enter="handleJoin"
                  class="w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
                  :class="{
                    'border-red-300 focus:ring-red-500': error,
                    'border-gray-300': !error,
                  }"
                />
                <button
                  @click="handlePaste"
                  :disabled="isJoining"
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tempel dari clipboard"
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </button>
              </div>
              <!-- Error Message -->
              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 -translate-y-1"
                enter-to-class="transform opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 translate-y-0"
                leave-to-class="transform opacity-0 -translate-y-1"
              >
                <p
                  v-if="error"
                  class="mt-2 text-sm text-red-600 flex items-center"
                >
                  <svg
                    class="w-4 h-4 mr-1.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {{ error }}
                </p>
              </Transition>
            </div>

            <!-- Info Box -->
            <div class="bg-blue-50 rounded-xl p-4">
              <div class="flex">
                <svg
                  class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div class="ml-3">
                  <p class="text-sm text-blue-900">
                    Session ID biasanya diberikan oleh mahasiswa yang memulai
                    sesi bimbingan. Pastikan Anda memasukkan ID yang benar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3"
          >
            <button
              @click="handleClose"
              :disabled="isJoining"
              class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              @click="handleJoin"
              :disabled="isJoining || !sessionId.trim()"
              class="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <div
                v-if="isJoining"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              <svg
                v-else
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <span>{{ isJoining ? "Bergabung..." : "Bergabung" }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
