<script setup lang="ts">
import { ref, onMounted } from "vue";
import LoginForm from "../components/LoginForm.vue";

const isVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4"
  >
    <!-- Floating shapes with Unair colors -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"
      ></div>
      <div
        class="absolute top-3/4 right-1/4 w-24 h-24 bg-indigo-200 rounded-full opacity-30 animate-bounce delay-1000"
      ></div>
      <div
        class="absolute top-1/2 left-3/4 w-20 h-20 bg-blue-300 rounded-full opacity-25 animate-pulse delay-2000"
      ></div>
      <div
        class="absolute top-1/6 right-1/3 w-16 h-16 bg-indigo-300 rounded-full opacity-20 animate-bounce delay-500"
      ></div>
    </div>

    <!-- Main container -->
    <div
      :class="[
        'w-full max-w-md transition-all duration-1000 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      ]"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm"
      >
        <!-- Header -->
        <div
          class="px-8 pt-8 pb-6 text-center flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-blue-600 to-indigo-700 text-white"
        >
          <img class="w-28" src="/src/assets/logo-unair.png" alt="logo" />
          <div>
            <h1 class="text-2xl font-bold mb-1">Unair Thesis Assistant</h1>
            <p class="text-blue-100 text-sm">
              Sistem Bimbingan Skripsi Terintegrasi
            </p>
          </div>
        </div>

        <!-- Form -->
        <LoginForm />
      </div>

      <!-- Bottom accent with Unair colors -->
      <div
        class="mt-2 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-full opacity-80"
      ></div>

      <!-- Copyright -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-500">
          © 2025 Universitas Airlangga. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delay-500 {
  animation-delay: 0.5s;
}

.delay-1000 {
  animation-delay: 1s;
}

.delay-2000 {
  animation-delay: 2s;
}
</style>
