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
  // Prevent body scroll when menu is open
  if (showMobileMenu.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

const handleLogout = () => {
  showMobileMenu.value = false;
  document.body.style.overflow = "";
  emit("logout");
};

const handleRefresh = () => {
  emit("refresh");
  showMobileMenu.value = false;
  document.body.style.overflow = "";
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
  </header>

  <!-- Mobile Menu - Using Teleport -->
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showMobileMenu"
        @click="toggleMobileMenu"
        class="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        aria-hidden="true"
      ></div>
    </Transition>

    <!-- Mobile Menu Panel -->
    <Transition
      enter-active-class="transition-all ease-out duration-300"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-full"
    >
      <div
        v-if="showMobileMenu"
        class="md:hidden fixed top-14 sm:top-16 left-0 right-0 bg-white shadow-2xl z-[70] max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto"
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
              class="w-12 h-12 rounded-full border-2 border-gray-200 flex-shrink-0"
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
              @click="handleRefresh"
              class="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div
                class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <svg
                  class="w-5 h-5 text-blue-600"
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
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Refresh Data</p>
                <p class="text-xs text-gray-500">Perbarui data dashboard</p>
              </div>
            </button>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors text-left"
            >
              <div
                class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"
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
              </div>
              <div class="flex-1">
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
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Header styling */
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

/* Custom scrollbar for mobile menu */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
