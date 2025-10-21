<script setup lang="ts">
import { ref } from "vue";

interface Props {
  userName: string;
  userIdentifier: string;
  userType: "mahasiswa" | "dosen";
  isOnline: boolean;
  userPhoto?: string;
  isLoading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  logout: [];
  refresh: [];
}>();

const showMobileMenu = ref(false);

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const handleLogout = () => {
  showMobileMenu.value = false;
  emit("logout");
};
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
      <div class="flex items-center justify-between h-14 sm:h-16">
        <!-- Logo & Title -->
        <div class="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <img
            src="/src/assets/logo-unair.png"
            alt="Unair Logo"
            class="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
          />
          <div class="min-w-0 hidden sm:block">
            <h1 class="text-base sm:text-xl font-bold text-gray-900 truncate">
              UTA Dashboard
            </h1>
            <p class="text-xs text-gray-500 hidden md:block">
              Thesis Assistant System
            </p>
          </div>
          <!-- Mobile Title -->
          <div class="min-w-0 sm:hidden">
            <h1 class="text-sm font-bold text-gray-900 truncate">UTA</h1>
          </div>
        </div>

        <!-- Desktop: User Profile & Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- Online Status -->
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-2 h-2 rounded-full transition-colors',
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400',
              ]"
            ></div>
            <span class="text-sm text-gray-600">
              {{ isOnline ? "Online" : "Offline" }}
            </span>
          </div>

          <!-- User Info -->
          <div class="flex items-center space-x-3">
            <!-- Loading State -->
            <div v-if="isLoading" class="text-right">
              <div
                class="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"
              ></div>
              <div class="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>

            <!-- User Data -->
            <div v-else class="text-right">
              <p
                class="text-sm font-medium text-gray-900 truncate max-w-[200px]"
              >
                {{ userName || "Loading..." }}
              </p>
              <p class="text-xs text-gray-500">
                {{ userType === "mahasiswa" ? "NIM" : "NIP" }}:
                {{ userIdentifier || "-" }}
              </p>
            </div>

            <!-- Profile Picture with Logout -->
            <div class="relative group">
              <img
                :src="
                  userPhoto ||
                  `https://ui-avatars.com/api/?name=${
                    userName || 'User'
                  }&background=3b82f6&color=white`
                "
                alt="Profile"
                class="w-10 h-10 rounded-full border-2 border-gray-200 transition-all group-hover:border-blue-400"
              />
              <button
                @click="emit('logout')"
                class="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all hover:scale-110 shadow-md"
                title="Logout"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile & Tablet: Compact View -->
        <div class="flex md:hidden items-center space-x-2 sm:space-x-3">
          <!-- Online Status Indicator (Mobile) -->
          <div
            :class="[
              'w-2 h-2 rounded-full',
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400',
            ]"
            :title="isOnline ? 'Online' : 'Offline'"
          ></div>

          <!-- Profile Picture (Mobile) -->
          <img
            v-if="!isLoading"
            :src="
              userPhoto ||
              `https://ui-avatars.com/api/?name=${
                userName || 'User'
              }&background=3b82f6&color=white`
            "
            alt="Profile"
            class="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-gray-200"
          />
          <div
            v-else
            class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 animate-pulse"
          ></div>

          <!-- Mobile Menu Button -->
          <button
            @click="toggleMobileMenu"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              v-if="!showMobileMenu"
              class="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-gray-600"
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

    <!-- Mobile Menu Dropdown -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="showMobileMenu"
        class="md:hidden border-t border-gray-200 bg-white shadow-lg"
      >
        <div class="px-4 py-4 space-y-4">
          <!-- User Info Section -->
          <div class="flex items-start space-x-3 pb-4 border-b border-gray-200">
            <img
              :src="
                userPhoto ||
                `https://ui-avatars.com/api/?name=${
                  userName || 'User'
                }&background=3b82f6&color=white`
              "
              alt="Profile"
              class="w-12 h-12 rounded-full border-2 border-gray-200"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">
                {{ userName || "Loading..." }}
              </p>
              <p class="text-xs text-gray-500">
                {{ userType === "mahasiswa" ? "NIM" : "NIP" }}:
                {{ userIdentifier || "-" }}
              </p>
              <div class="flex items-center space-x-1 mt-1">
                <div
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    isOnline ? 'bg-green-500' : 'bg-gray-400',
                  ]"
                ></div>
                <span class="text-xs text-gray-600">
                  {{ isOnline ? "Online" : "Offline" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-2">
            <!-- Refresh Button -->
            <button
              @click="
                () => {
                  emit('refresh');
                  showMobileMenu = false;
                }
              "
              class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-gray-900">Refresh Data</p>
                <p class="text-xs text-gray-500">Perbarui data dashboard</p>
              </div>
            </button>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-left"
            >
              <svg
                class="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-red-600">Logout</p>
                <p class="text-xs text-red-500">Keluar dari sistem</p>
              </div>
            </button>
          </div>

          <!-- App Info -->
          <div class="pt-3 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
              UTA - Thesis Assistant System
            </p>
            <p class="text-xs text-gray-400 text-center mt-1">
              Universitas Airlangga
            </p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Mobile Menu Overlay -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showMobileMenu"
        @click="showMobileMenu = false"
        class="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        aria-hidden="true"
      ></div>
    </transition>
  </header>
</template>

<style scoped>
/* Ensure header is above other content */
header {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

/* Smooth transitions */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Active/hover states */
button:active {
  transform: scale(0.95);
}

/* Ensure mobile menu is above overlay */
.md\:hidden.border-t {
  position: relative;
  z-index: 50;
}
</style>
