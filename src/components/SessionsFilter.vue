<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
  selectedMonth: number | null;
  selectedStatus: string;
  sortOrder: "latest" | "oldest";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  filterChange: [
    filters: { month: number | null; status: string; sort: "latest" | "oldest" }
  ];
  clearFilters: [];
}>();

// Local state
const localMonth = ref(props.selectedMonth);
const localStatus = ref(props.selectedStatus);
const localSort = ref(props.sortOrder);

// Month options
const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

// Status options
const statuses = [
  { value: "all", label: "Semua Status", icon: "◉" },
  { value: "active", label: "Berlangsung", icon: "🟢" },
  { value: "finished", label: "Selesai", icon: "⚪" },
  { value: "pending", label: "Menunggu", icon: "🟡" },
];

// Sort options
const sortOptions = [
  { value: "latest", label: "Terbaru", icon: "↓" },
  { value: "oldest", label: "Terlama", icon: "↑" },
];

// Watch for changes and emit
watch([localMonth, localStatus, localSort], () => {
  emit("filterChange", {
    month: localMonth.value,
    status: localStatus.value,
    sort: localSort.value as "latest" | "oldest",
  });
});

// Clear all filters
const handleClearFilters = () => {
  localMonth.value = null;
  localStatus.value = "all";
  localSort.value = "latest";
  emit("clearFilters");
};

// Check if any filter is active
const hasActiveFilters = () => {
  return (
    localMonth.value !== null ||
    localStatus.value !== "all" ||
    localSort.value !== "latest"
  );
};
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24"
  >
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-semibold text-gray-900 flex items-center">
        <svg
          class="w-5 h-5 mr-2 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filter
      </h3>
      <button
        v-if="hasActiveFilters()"
        @click="handleClearFilters"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        Reset
      </button>
    </div>

    <div class="space-y-6">
      <!-- Month Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Bulan
        </label>
        <div class="space-y-2">
          <button
            @click="localMonth = null"
            :class="[
              'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              localMonth === null
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100',
            ]"
          >
            📅 Semua Bulan
          </button>
          <select
            v-model="localMonth"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option :value="null">Pilih Bulan</option>
            <option
              v-for="month in months"
              :key="month.value"
              :value="month.value"
            >
              {{ month.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Status Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Status
        </label>
        <div class="space-y-2">
          <button
            v-for="status in statuses"
            :key="status.value"
            @click="localStatus = status.value"
            :class="[
              'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center',
              localStatus === status.value
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100',
            ]"
          >
            <span class="mr-2">{{ status.icon }}</span>
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- Sort Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Urutkan
        </label>
        <div class="space-y-2">
          <button
            v-for="sort in sortOptions"
            :key="sort.value"
            @click="localSort = sort.value as 'latest' | 'oldest'"
            :class="[
              'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center',
              localSort === sort.value
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100',
            ]"
          >
            <span class="mr-2">{{ sort.icon }}</span>
            {{ sort.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters()" class="mt-6 pt-6 border-t border-gray-100">
      <p class="text-xs font-medium text-gray-500 mb-2">Filter Aktif:</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-if="localMonth"
          class="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium"
        >
          {{ months.find((m) => m.value === localMonth)?.label }}
        </span>
        <span
          v-if="localStatus !== 'all'"
          class="inline-flex items-center px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium"
        >
          {{ statuses.find((s) => s.value === localStatus)?.label }}
        </span>
        <span
          v-if="localSort !== 'latest'"
          class="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-medium"
        >
          {{ sortOptions.find((s) => s.value === localSort)?.label }}
        </span>
      </div>
    </div>
  </div>
</template>
