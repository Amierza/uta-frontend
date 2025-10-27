<!-- SchedulesPage.vue - Dedicated Schedule Management Page -->
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useSchedule } from "../composables/useSchedule";
import { useUser } from "../composables/useUser";
import { useNotificationToast } from "../composables/useNotificationToast";
import type { ScheduleResponse } from "../types/schedule";
import { formatDate, formatTime, parseISODateTime } from "../datetime";
import ToastNotification from "../components/ToastNotification.vue";

const router = useRouter();
const {
  schedules,
  isLoading,
  fetchSchedules,
  createNewSchedule,
  updateExistingSchedule,
  handleApproval,
  deleteScheduleById,
} = useSchedule();
const { userType, fetchUserProfile } = useUser();
const { show: showToast } = useNotificationToast();

// Modal states
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const selectedSchedule = ref<ScheduleResponse | null>(null);

// Form state
const scheduleForm = ref({
  proposed_at: "",
  start_time: "",
  end_time: "",
  description: "",
  location: "",
});

// Filter state
const statusFilter = ref<"all" | "pending" | "approved" | "rejected">("all");
const sortOrder = ref<"latest" | "oldest">("latest");

// Computed
const filteredSchedules = computed(() => {
  let result = [...schedules.value];

  // Filter by status
  if (statusFilter.value !== "all") {
    result = result.filter((s) => s.status === statusFilter.value);
  }

  // Sort
  result.sort((a, b) => {
    const dateA = new Date(a.proposed_at).getTime();
    const dateB = new Date(b.proposed_at).getTime();
    return sortOrder.value === "latest" ? dateB - dateA : dateA - dateB;
  });

  return result;
});

const pendingCount = computed(
  () => schedules.value.filter((s) => s.status === "pending").length
);
const approvedCount = computed(
  () => schedules.value.filter((s) => s.status === "approved").length
);

// Handlers
const openCreateModal = () => {
  resetForm();
  showCreateModal.value = true;
};

const normalizeToISO = (dateStr: string): string =>
  dateStr.replace(" ", "T").replace(" +0700", "+07:00");

const openEditModal = (schedule: ScheduleResponse) => {
  if (!schedule) return;
  selectedSchedule.value = schedule;

  // Parse ISO datetime untuk form
  const proposed = parseISODateTime(normalizeToISO(schedule.proposed_at));
  const start = new Date(normalizeToISO(schedule.start_time));
  const end = new Date(normalizeToISO(schedule.end_time));

  scheduleForm.value = {
    proposed_at: proposed.date,
    start_time: start.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }), // ✅ hasil "16:00"
    end_time: end.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }), // ✅ hasil "17:30"
    description: schedule.description || "",
    location: schedule.location,
  };
  showEditModal.value = true;
};

const openDeleteConfirm = (schedule: ScheduleResponse) => {
  selectedSchedule.value = schedule;
  showDeleteConfirm.value = true;
};

const resetForm = () => {
  scheduleForm.value = {
    proposed_at: "",
    start_time: "",
    end_time: "",
    description: "",
    location: "",
  };
  selectedSchedule.value = null;
};

const handleCreateSchedule = async () => {
  try {
    // Format payload dengan ISO 8601
    const payload = {
      proposed_at: `${scheduleForm.value.proposed_at}T00:00:00+07:00`,
      start_time: `${scheduleForm.value.proposed_at}T${scheduleForm.value.start_time}:00+07:00`,
      end_time: `${scheduleForm.value.proposed_at}T${scheduleForm.value.end_time}:00+07:00`,
      description: scheduleForm.value.description,
      location: scheduleForm.value.location,
    };

    await createNewSchedule(payload);
    showToast("Jadwal berhasil dibuat!", "success");
    showCreateModal.value = false;
    resetForm();
  } catch (error: any) {
    showToast(error.message || "Gagal membuat jadwal", "error");
  }
};

const handleUpdateSchedule = async () => {
  if (!selectedSchedule.value) return;

  try {
    // Format payload dengan ISO 8601
    const payload = {
      proposed_at: `${scheduleForm.value.proposed_at}T00:00:00+07:00`,
      start_time: `${scheduleForm.value.proposed_at}T${scheduleForm.value.start_time}:00+07:00`,
      end_time: `${scheduleForm.value.proposed_at}T${scheduleForm.value.end_time}:00+07:00`,
      description: scheduleForm.value.description,
      location: scheduleForm.value.location,
    };

    await updateExistingSchedule(selectedSchedule.value.id, payload);
    showToast("Jadwal berhasil diperbarui!", "success");
    showEditModal.value = false;
    resetForm();
  } catch (error: any) {
    showToast(error.message || "Gagal memperbarui jadwal", "error");
  }
};

const handleDeleteSchedule = async () => {
  if (!selectedSchedule.value) return;

  try {
    await deleteScheduleById(selectedSchedule.value.id);
    showToast("Jadwal berhasil dihapus!", "success");
    showDeleteConfirm.value = false;
    resetForm();
  } catch (error: any) {
    showToast(error.message || "Gagal menghapus jadwal", "error");
  }
};

const handleApproveSchedule = async (
  scheduleId: string,
  status: "approved" | "rejected"
) => {
  try {
    await handleApproval(scheduleId, status);
    showToast(
      `Jadwal ${status === "approved" ? "disetujui" : "ditolak"}!`,
      "success"
    );
  } catch (error: any) {
    showToast(error.message || "Gagal memperbarui status jadwal", "error");
  }
};

const getStatusBadge = (status: string) => {
  const badges = {
    pending: {
      class: "bg-yellow-100 text-yellow-800 border-yellow-300",
      label: "Menunggu",
    },
    approved: {
      class: "bg-green-100 text-green-800 border-green-300",
      label: "Disetujui",
    },
    rejected: {
      class: "bg-red-100 text-red-800 border-red-300",
      label: "Ditolak",
    },
  };
  return badges[status as keyof typeof badges] || badges.pending;
};

onMounted(async () => {
  await fetchUserProfile();
  await fetchSchedules();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Toast Notifications -->
    <ToastNotification />
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="router.back()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                class="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Penjadwalan Bimbingan
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Kelola jadwal bimbingan tugas akhir
              </p>
            </div>
          </div>
          <button
            v-if="userType === 'mahasiswa'"
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Ajukan Jadwal
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Jadwal</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ schedules.length }}
              </p>
            </div>
            <div
              class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">
                Menunggu Persetujuan
              </p>
              <p class="text-3xl font-bold text-yellow-600 mt-2">
                {{ pendingCount }}
              </p>
            </div>
            <div
              class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Disetujui</p>
              <p class="text-3xl font-bold text-green-600 mt-2">
                {{ approvedCount }}
              </p>
            </div>
            <div
              class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-green-600"
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
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
      >
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="text-sm font-medium text-gray-700 mb-2 block"
              >Status</label
            >
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="text-sm font-medium text-gray-700 mb-2 block"
              >Urutkan</label
            >
            <select
              v-model="sortOrder"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="latest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Schedule List -->
      <div v-if="isLoading" class="text-center py-16">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"
        ></div>
        <p class="text-sm text-gray-500 mt-4">Memuat jadwal...</p>
      </div>

      <div
        v-else-if="filteredSchedules.length === 0"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"
      >
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Belum Ada Jadwal
        </h3>
        <p class="text-sm text-gray-500">
          Ajukan jadwal bimbingan untuk memulai
        </p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="schedule in filteredSchedules"
          :key="schedule.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ formatDate(schedule.proposed_at) }}
                </h3>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    getStatusBadge(schedule.status).class,
                  ]"
                >
                  {{ getStatusBadge(schedule.status).label }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-1">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span
                    >{{ formatTime(schedule.start_time) }} -
                    {{ formatTime(schedule.end_time) }}</span
                  >
                </div>
                <div class="flex items-center gap-1">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{{ schedule.location }}</span>
                </div>
              </div>
              <p v-if="schedule.description" class="text-sm text-gray-600 mt-2">
                {{ schedule.description }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 ml-4">
              <!-- Mahasiswa actions -->
              <template
                v-if="userType === 'mahasiswa' && schedule.status === 'pending'"
              >
                <button
                  @click="openEditModal(schedule)"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  @click="openDeleteConfirm(schedule)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </template>

              <!-- Dosen actions -->
              <template
                v-if="userType === 'dosen' && schedule.status === 'pending'"
              >
                <button
                  @click="handleApproveSchedule(schedule.id, 'approved')"
                  class="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Setujui
                </button>
                <button
                  @click="handleApproveSchedule(schedule.id, 'rejected')"
                  class="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Tolak
                </button>
              </template>
            </div>
          </div>

          <!-- Additional Info -->
          <div
            class="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500"
          >
            <span>Diajukan oleh: {{ schedule.created_by.name }}</span>
            <span v-if="schedule.approved_by">
              <template v-if="schedule.status === 'approved'">
                ✅ Disetujui oleh: {{ schedule.approved_by.name }}
              </template>
              <template v-else-if="schedule.status === 'rejected'">
                ❌ Ditolak oleh: {{ schedule.approved_by.name }}
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">
            {{ showCreateModal ? "Ajukan Jadwal Baru" : "Edit Jadwal" }}
          </h2>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Tanggal</label
            >
            <input
              v-model="scheduleForm.proposed_at"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Waktu Mulai</label
              >
              <input
                v-model="scheduleForm.start_time"
                type="time"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Waktu Selesai</label
              >
              <input
                v-model="scheduleForm.end_time"
                type="time"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Lokasi</label
            >
            <input
              v-model="scheduleForm.location"
              type="text"
              placeholder="Ruang dosen / Link meeting"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Deskripsi (opsional)</label
            >
            <textarea
              v-model="scheduleForm.description"
              rows="3"
              placeholder="Topik yang akan dibahas..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
          </div>
        </div>
        <div
          class="p-6 border-t border-gray-200 flex items-center justify-end gap-3"
        >
          <button
            @click="
              showCreateModal = false;
              showEditModal = false;
              resetForm();
            "
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            @click="
              showCreateModal ? handleCreateSchedule() : handleUpdateSchedule()
            "
            :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Hapus Jadwal?</h3>
          <p class="text-sm text-gray-600">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="
              showDeleteConfirm = false;
              resetForm();
            "
            class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            @click="handleDeleteSchedule()"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? "Menghapus..." : "Hapus" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
