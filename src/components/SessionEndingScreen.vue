<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Props {
  sessionTitle: string;
  onComplete?: () => void;
}

const props = defineProps<Props>();
const progress = ref(0);
const currentStep = ref(0);

const steps = [
  { label: "Menyimpan percakapan", icon: "💾" },
  { label: "Menganalisis diskusi", icon: "🔍" },
  { label: "Membuat ringkasan", icon: "📝" },
];

onMounted(() => {
  // Simulate progress
  const interval = setInterval(() => {
    progress.value += 1;

    if (progress.value >= 33 && currentStep.value === 0) {
      currentStep.value = 1;
    } else if (progress.value >= 66 && currentStep.value === 1) {
      currentStep.value = 2;
    }

    if (progress.value >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        props.onComplete?.();
      }, 100);
    }
  }, 50);
});
</script>

<template>
  <div
    class="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 z-50 flex items-center justify-center p-4"
  >
    <div class="max-w-md w-full">
      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <!-- Icon Animation -->
        <div class="flex justify-center">
          <div class="relative">
            <div
              class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse"
            >
              <svg
                class="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div
              class="absolute inset-0 w-20 h-20 bg-blue-400 rounded-full animate-ping opacity-20"
            ></div>
          </div>
        </div>

        <!-- Title -->
        <div class="text-center space-y-2">
          <h3 class="text-xl font-bold text-gray-900">
            Sesi Bimbingan Berakhir
          </h3>
          <p class="text-sm text-gray-600">
            {{ sessionTitle }}
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-2">
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <p class="text-xs text-center text-gray-500">
            {{ Math.round(progress) }}%
          </p>
        </div>

        <!-- Steps -->
        <div class="space-y-3">
          <div
            v-for="(step, idx) in steps"
            :key="idx"
            class="flex items-center space-x-3 transition-all duration-300"
            :class="{
              'opacity-100': idx <= currentStep,
              'opacity-40': idx > currentStep,
            }"
          >
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300"
              :class="{
                'bg-blue-100': idx <= currentStep,
                'bg-gray-100': idx > currentStep,
              }"
            >
              <span v-if="idx < currentStep">✓</span>
              <span v-else-if="idx === currentStep" class="animate-bounce">{{
                step.icon
              }}</span>
              <span v-else>{{ step.icon }}</span>
            </div>
            <div class="flex-1">
              <p
                class="text-sm font-medium transition-colors"
                :class="{
                  'text-gray-900': idx <= currentStep,
                  'text-gray-400': idx > currentStep,
                }"
              >
                {{ step.label }}
              </p>
            </div>
            <div v-if="idx === currentStep" class="flex-shrink-0">
              <div
                class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm text-blue-900 font-medium mb-1">
                AI sedang memproses ringkasan
              </p>
              <p class="text-xs text-blue-700">
                Anda akan diarahkan ke dashboard. Ringkasan akan tersedia dalam
                beberapa saat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
