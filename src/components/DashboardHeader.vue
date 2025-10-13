<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

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
}>();
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Title -->
        <div class="flex items-center space-x-4">
          <img
            src="/src/assets/logo-unair.png"
            alt="Unair Logo"
            class="h-8 w-8"
          />
          <div>
            <h1 class="text-xl font-bold text-gray-900">UTA Dashboard</h1>
            <p class="text-xs text-gray-500">Thesis Assistant System</p>
          </div>
        </div>

        <!-- User Profile -->
        <div class="flex items-center space-x-4">
          <!-- Online Status -->
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                isOnline ? 'bg-green-500' : 'bg-gray-400',
              ]"
            ></div>
            <span class="text-sm text-gray-600">{{
              isOnline ? "Online" : "Offline"
            }}</span>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-3">
            <div v-if="isLoading" class="text-right">
              <div
                class="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"
              ></div>
              <div class="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div v-else class="text-right">
              <p class="text-sm font-medium text-gray-900">
                {{ userName || "Loading..." }}
              </p>
              <p class="text-xs text-gray-500">
                {{ userType === "mahasiswa" ? "NIM" : "NIP" }}:
                {{ userIdentifier || "-" }}
              </p>
            </div>
            <div class="relative">
              <img
                :src="
                  userPhoto ||
                  `https://ui-avatars.com/api/?name=${
                    userName || 'User'
                  }&background=3b82f6&color=white`
                "
                alt="Profile"
                class="w-10 h-10 rounded-full border-2 border-gray-200"
              />
              <button
                @click="emit('logout')"
                class="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
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
      </div>
    </div>
  </header>
</template>
