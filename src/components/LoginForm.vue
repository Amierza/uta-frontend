<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "../api/auth";
import { useWebSocket } from "../composables/useWebsocket";
import Alert from "../components/ui/Alert.vue";

const identifier = ref("");
const password = ref("");
const isLoading = ref(false);
const showPassword = ref(false);
const router = useRouter();
const alertMessage = ref("");
const alertType = ref<"success" | "error" | "warning" | "info">("info");

const { connect } = useWebSocket();

const handleLogin = async () => {
  if (!identifier.value || !password.value) {
    alertMessage.value = "NIM/NIP dan password wajib diisi";
    alertType.value = "error";
    return;
  }

  isLoading.value = true;

  try {
    // Call actual login API
    const response = await login({
      identifier: identifier.value,
      password: password.value,
    });

    if (response.status) {
      // Store tokens
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      // Connect to WebSocket with token
      connect(response.data.access_token);

      alertMessage.value = "Login berhasil! Selamat datang di UTA 🎓";
      alertType.value = "success";

      console.log("✅ Login successful:", {
        identifier: identifier.value,
      });

      // Navigate to dashboard after success
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  } catch (error: any) {
    console.error("❌ Login gagal:", error.response?.data || error.message);

    // Handle different error scenarios
    if (error.response?.status === 401) {
      alertMessage.value = "NIM/NIP atau password salah";
    } else if (error.response?.status === 403) {
      alertMessage.value = "Akun Anda tidak memiliki akses";
    } else if (error.response?.status === 404) {
      alertMessage.value = "Pengguna tidak ditemukan";
    } else {
      alertMessage.value =
        error.response?.data?.message || "Login gagal, silakan coba lagi";
    }

    alertType.value = "error";
  } finally {
    isLoading.value = false;
  }
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="px-8 py-8">
    <!-- Alert Component -->
    <Transition
      enter-active-class="transition ease-out duration-500"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="alertMessage" class="fixed top-4 right-4 z-50">
        <Alert
          :message="alertMessage"
          :type="alertType"
          :duration="4000"
          class="shadow-lg"
          @close="alertMessage = ''"
        />
      </div>
    </Transition>
    <form @submit.prevent="handleLogin" class="space-y-6">
      <!-- NIM / NIP Input -->
      <div class="group">
        <label
          class="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600"
        >
          Identifier
        </label>
        <div class="relative">
          <div
            class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          >
            <svg
              class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            v-model="identifier"
            required
            placeholder="Masukkan nip / nim"
            autocomplete="username"
            class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white placeholder-gray-400"
          />
        </div>
      </div>

      <!-- Password Input -->
      <div class="group">
        <label
          class="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600"
        >
          Password
        </label>
        <div class="relative">
          <div
            class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          >
            <svg
              class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </div>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Masukkan password"
            required
            autocomplete="current-password"
            class="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white placeholder-gray-400"
          />
          <button
            type="button"
            @click="togglePassword"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
            :aria-label="
              showPassword ? 'Sembunyikan password' : 'Tampilkan password'
            "
          >
            <svg
              v-if="!showPassword"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              ></path>
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isLoading || !identifier || !password"
        class="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <div
          v-if="isLoading"
          class="flex items-center justify-center space-x-2"
        >
          <div
            class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></div>
          <span>Memproses...</span>
        </div>
        <div v-else class="flex items-center justify-center space-x-2 group">
          <span>Masuk ke UTA</span>
          <svg
            class="w-5 h-5 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            ></path>
          </svg>
        </div>
      </button>
    </form>
  </div>
</template>
