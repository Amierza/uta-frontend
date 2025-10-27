<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUser } from "../composables/useUser";
import { useThesis } from "../composables/useThesis";
import { useNotificationToast } from "../composables/useNotificationToast";
import DashboardHeader from "../components/DashboardHeader.vue";
import ToastNotification from "../components/ToastNotification.vue";

const router = useRouter();

const {
  userType,
  userName,
  userLecturerId,
  userIdentifier,
  userThesisId,
  userPhoto,
  userStudyProgram,
  userFaculty,
  userTotalStudent,
  isLoadingProfile,
  fetchUserProfile,
} = useUser();

const {
  thesis,
  theses,
  meta,
  isLoading,
  isUpdating,
  fetchThesisDetail,
  fetchThesesByLecturer,
  updateThesisData,
} = useThesis();

const { show: showToast } = useNotificationToast();

const isEditing = ref(false);
const editForm = ref({
  title: "",
  description: "",
  progress: "",
  student_id: "",
});

const progressOptions = [
  { value: "bab1", label: "Bab 1" },
  { value: "bab2", label: "Bab 2" },
  { value: "bab3", label: "Bab 3" },
  { value: "bab4", label: "Bab 4" },
  { value: "bab5", label: "Bab 5" },
  { value: "seminar_proposal", label: "Seminar Proposal" },
  { value: "seminar_hasil", label: "Seminar Hasil" },
];

const progressLabel = computed(() => {
  const option = progressOptions.find(
    (opt) => opt.value === thesis.value?.progress
  );
  return option?.label || thesis.value?.progress || "-";
});

// Pagination computed
const paginationPages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, meta.value.page - half);
  let end = Math.min(meta.value.max_page, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const startEdit = () => {
  if (thesis.value) {
    editForm.value = {
      title: thesis.value.title,
      description: thesis.value.description,
      progress: thesis.value.progress,
      student_id: thesis.value.student.id,
    };
    isEditing.value = true;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editForm.value = {
    title: "",
    description: "",
    progress: "",
    student_id: "",
  };
};

const saveEdit = async () => {
  if (!thesis.value) return;

  editForm.value.student_id = thesis.value.student.id;

  try {
    await updateThesisData(thesis.value.id, editForm.value);
    showToast("Thesis berhasil diperbarui", "success");
    isEditing.value = false;
    await fetchThesisDetail(thesis.value.id);
  } catch (error: any) {
    showToast(error.message || "Gagal memperbarui thesis", "error");
  }
};

const getProgressBadgeColor = (progress: string) => {
  const progressMap: { [key: string]: string } = {
    bab1: "bg-blue-100 text-blue-800",
    bab2: "bg-indigo-100 text-indigo-800",
    bab3: "bg-purple-100 text-purple-800",
    bab4: "bg-pink-100 text-pink-800",
    bab5: "bg-orange-100 text-orange-800",
    seminar_proposal: "bg-green-100 text-green-800",
    seminar_hasil: "bg-emerald-100 text-emerald-800",
  };

  return progressMap[progress] || "bg-gray-100 text-gray-800";
};

const changePage = async (page: number) => {
  if (page < 1 || page > meta.value.max_page) return;

  try {
    if (userType.value === "dosen" && userLecturerId.value) {
      await fetchThesesByLecturer(userLecturerId.value, page);
    }
  } catch (error: any) {
    showToast(error.message || "Gagal memuat data", "error");
  }
};

const logout = () => {
  localStorage.clear();
  router.push("/");
};

const refreshData = async () => {
  try {
    if (userType.value === "mahasiswa" && userThesisId.value) {
      await fetchThesisDetail(userThesisId.value);
      showToast("Data berhasil diperbarui", "success");
    } else if (userType.value === "dosen" && userLecturerId.value) {
      await fetchThesesByLecturer(userLecturerId.value);
      showToast("Data berhasil diperbarui", "success");
    }
  } catch (error: any) {
    showToast(error.message || "Gagal memperbarui data", "error");
  }
};

onMounted(async () => {
  try {
    await fetchUserProfile();

    if (userType.value === "mahasiswa" && userThesisId.value) {
      await fetchThesisDetail(userThesisId.value);
    } else if (userType.value === "dosen" && userLecturerId.value) {
      await fetchThesesByLecturer(userLecturerId.value);
    }
  } catch (error: any) {
    showToast(error.message || "Gagal memuat data profil", "error");
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
  >
    <ToastNotification />

    <DashboardHeader
      :user-name="userName"
      :user-identifier="userIdentifier"
      :user-type="userType"
      :is-online="true"
      :user-photo="userPhoto"
      :is-loading="isLoadingProfile"
      @logout="logout"
      @refresh="refreshData"
    />

    <!-- Loading Overlay -->
    <div
      v-if="isLoadingProfile"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"
        ></div>
        <p class="text-gray-700 font-medium">Memuat profil...</p>
      </div>
    </div>

    <main
      class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
    >
      <!-- Back Button -->
      <button
        @click="router.push('/dashboard')"
        class="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
      >
        <svg
          class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
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
        <span class="text-sm font-medium">Kembali ke Dashboard</span>
      </button>

      <!-- Profile Header -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6"
      >
        <!-- Gradient Header Background -->
        <div class="relative">
          <div
            :class="[
              'h-32 sm:h-40',
              userType === 'mahasiswa'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
                : 'bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900',
            ]"
          >
            <!-- Decorative Pattern -->
            <div class="absolute inset-0 opacity-10">
              <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="white"
                      stroke-width="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>
        </div>

        <div class="px-4 sm:px-6 pb-6">
          <div
            class="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20"
          >
            <!-- Profile Picture -->
            <div class="relative">
              <img
                :src="
                  userPhoto ||
                  `https://ui-avatars.com/api/?name=${
                    userName || 'User'
                  }&background=${
                    userType === 'mahasiswa' ? '3b82f6' : '4b5563'
                  }&color=ffffff&size=160`
                "
                alt="Profile"
                class="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl"
              />
              <!-- Role Badge on Avatar -->
              <div
                :class="[
                  'absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap',
                  userType === 'mahasiswa'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-white',
                ]"
              >
                {{ userType === "mahasiswa" ? "Mahasiswa" : "Dosen" }}
              </div>
            </div>

            <!-- User Info -->
            <div class="mt-8 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
                {{ userName }}
              </h1>
              <p
                class="text-gray-600 mt-1 flex items-center justify-center sm:justify-start"
              >
                <svg
                  class="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
                <span class="font-medium"
                  >{{ userType === "mahasiswa" ? "NIM" : "NIP" }}:</span
                >
                <span class="ml-1 text-gray-900">{{ userIdentifier }}</span>
              </p>

              <!-- Mahasiswa Info -->
              <div v-if="userType === 'mahasiswa'" class="mt-4">
                <div
                  class="flex flex-wrap gap-4 justify-center sm:justify-start"
                >
                  <div
                    class="flex items-center px-4 py-2 bg-blue-50 rounded-lg"
                  >
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
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span class="text-sm font-medium text-gray-700">{{
                      userStudyProgram
                    }}</span>
                  </div>
                  <div
                    class="flex items-center px-4 py-2 bg-indigo-50 rounded-lg"
                  >
                    <svg
                      class="w-5 h-5 mr-2 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span class="text-sm font-medium text-gray-700">{{
                      userFaculty
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Dosen Info -->
              <div v-else class="mt-4">
                <div
                  class="flex flex-wrap gap-4 justify-center sm:justify-start"
                >
                  <div
                    class="flex items-center px-4 py-2 bg-gray-100 rounded-lg"
                  >
                    <svg
                      class="w-5 h-5 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span class="text-sm font-medium text-gray-700">
                      <span class="text-gray-900 font-semibold">{{
                        userTotalStudent
                      }}</span>
                      Mahasiswa Bimbingan
                    </span>
                  </div>
                  <div
                    class="flex items-center px-4 py-2 bg-gray-100 rounded-lg"
                  >
                    <svg
                      class="w-5 h-5 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span class="text-sm font-medium text-gray-700">{{
                      userFaculty
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mahasiswa: Thesis Detail -->
      <div v-if="userType === 'mahasiswa'" class="space-y-6">
        <!-- Thesis Info Card -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0"
          >
            <h2 class="text-xl font-bold text-gray-900 flex items-center">
              <svg
                class="w-6 h-6 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Thesis Saya
            </h2>
            <button
              v-if="!isEditing && thesis"
              @click="startEdit"
              class="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Edit Thesis</span>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="space-y-4">
            <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-24 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div class="space-y-2">
              <div class="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <!-- No Thesis -->
          <div v-else-if="!thesis" class="text-center py-12">
            <svg
              class="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p class="text-gray-600 text-lg font-medium mb-2">
              Belum ada thesis
            </p>
            <p class="text-gray-500 text-sm">
              Anda belum terdaftar dalam thesis manapun
            </p>
          </div>

          <!-- View Mode -->
          <div v-else-if="!isEditing" class="space-y-6">
            <div>
              <label class="text-sm font-medium text-gray-500 block mb-2"
                >Judul Thesis</label
              >
              <p class="text-lg font-semibold text-gray-900 leading-relaxed">
                {{ thesis.title }}
              </p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-500 block mb-2"
                >Deskripsi</label
              >
              <p class="text-gray-700 leading-relaxed">
                {{ thesis.description }}
              </p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-500 block mb-2"
                >Progress</label
              >
              <span
                :class="[
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                  getProgressBadgeColor(thesis.progress),
                ]"
              >
                <svg
                  class="w-4 h-4 mr-1.5"
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
                {{ progressLabel }}
              </span>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-500 block mb-3"
                >Dosen Pembimbing</label
              >
              <div class="space-y-3">
                <div
                  v-for="(supervisor, index) in thesis.supervisors"
                  :key="supervisor.id"
                  class="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
                >
                  <div
                    class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <span class="text-white font-bold text-sm">{{
                      index + 1
                    }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">
                      {{ supervisor.name }}
                    </p>
                    <p class="text-sm text-gray-600 mt-0.5">
                      NIP: {{ supervisor.identifier }}
                    </p>
                    <span
                      class="inline-flex items-center text-xs text-blue-700 mt-1"
                    >
                      <svg
                        class="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"
                        ></path>
                      </svg>
                      Dosen Pembimbing {{ index === 0 ? "Utama" : index + 1 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="space-y-6">
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-2">
                Judul Thesis <span class="text-red-500">*</span>
              </label>
              <input
                v-model="editForm.title"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Masukkan judul thesis"
                :disabled="isUpdating"
              />
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-2">
                Deskripsi <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="editForm.description"
                rows="5"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Masukkan deskripsi thesis"
                :disabled="isUpdating"
              ></textarea>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-2">
                Progress <span class="text-red-500">*</span>
              </label>
              <select
                v-model="editForm.progress"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                :disabled="isUpdating"
              >
                <option value="" disabled>Pilih progress</option>
                <option
                  v-for="option in progressOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div
              class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200"
            >
              <button
                @click="saveEdit"
                :disabled="
                  isUpdating ||
                  !editForm.title ||
                  !editForm.description ||
                  !editForm.progress
                "
                class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
              >
                <svg
                  v-if="isUpdating"
                  class="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{{
                  isUpdating ? "Menyimpan..." : "Simpan Perubahan"
                }}</span>
              </button>
              <button
                @click="cancelEdit"
                :disabled="isUpdating"
                class="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
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
                <span>Batal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dosen: Theses List -->
      <div v-else class="space-y-6">
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <h2 class="text-xl font-bold text-gray-900 flex items-center mb-6">
            <svg
              class="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Daftar Thesis Mahasiswa Bimbingan
          </h2>

          <!-- Loading State -->
          <div v-if="isLoading" class="space-y-4">
            <div
              v-for="i in 3"
              :key="i"
              class="h-32 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          </div>

          <!-- No Theses -->
          <div v-else-if="theses.length === 0" class="text-center py-12">
            <svg
              class="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p class="text-gray-600 text-lg font-medium mb-2">
              Belum ada mahasiswa bimbingan
            </p>
            <p class="text-gray-500 text-sm">
              Anda belum memiliki mahasiswa yang terdaftar sebagai bimbingan
            </p>
          </div>

          <!-- Theses Table -->
          <div v-else class="overflow-x-auto -mx-4 sm:mx-0">
            <div class="inline-block min-w-full align-middle">
              <div class="overflow-hidden border border-gray-200 sm:rounded-lg">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        No
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        Mahasiswa
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Judul Thesis
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        Progress
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Pembimbing
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr
                      v-for="(item, index) in theses"
                      :key="item.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <!-- No -->
                      <td
                        class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"
                      >
                        {{ (meta.page - 1) * meta.per_page + index + 1 }}
                      </td>

                      <!-- Mahasiswa -->
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                            <div
                              class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
                            >
                              <span class="text-sm font-medium text-blue-600">
                                {{ item.student.name.charAt(0).toUpperCase() }}
                              </span>
                            </div>
                          </div>
                          <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">
                              {{ item.student.name }}
                            </div>
                            <div class="text-xs text-gray-500">
                              {{ item.student.identifier }}
                            </div>
                          </div>
                        </div>
                      </td>

                      <!-- Judul Thesis -->
                      <td class="px-4 py-4">
                        <div class="text-sm text-gray-900 font-medium">
                          {{ item.title }}
                        </div>
                        <div class="text-xs text-gray-500 mt-1 line-clamp-2">
                          {{ item.description }}
                        </div>
                      </td>

                      <!-- Progress -->
                      <td class="px-4 py-4 whitespace-nowrap">
                        <span
                          :class="[
                            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                            getProgressBadgeColor(item.progress),
                          ]"
                        >
                          <svg
                            class="w-3 h-3 mr-1.5"
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
                          {{
                            progressOptions.find(
                              (opt) => opt.value === item.progress
                            )?.label || item.progress
                          }}
                        </span>
                      </td>

                      <!-- Pembimbing -->
                      <td class="px-4 py-4">
                        <div class="space-y-1.5">
                          <div
                            v-for="(supervisor, idx) in item.supervisors"
                            :key="supervisor.id"
                            class="flex items-center text-sm"
                          >
                            <div
                              class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2"
                            >
                              <span class="text-xs font-semibold text-blue-600">
                                {{ idx + 1 }}
                              </span>
                            </div>
                            <span
                              class="text-gray-700 truncate max-w-xs"
                              :title="supervisor.name"
                            >
                              {{ supervisor.name }}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Table Footer Info with Pagination -->
          <div
            v-if="theses.length > 0"
            class="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-600 px-2"
          >
            <!-- Left side: Info -->
            <div class="flex flex-col gap-1">
              <p>
                Menampilkan
                <span class="font-medium text-gray-900">
                  {{ (meta.page - 1) * meta.per_page + 1 }} -
                  {{ Math.min(meta.page * meta.per_page, meta.count) }}
                </span>
                dari
                <span class="font-medium text-gray-900">{{ meta.count }}</span>
                thesis
              </p>
              <p class="flex items-center text-xs text-gray-500">
                <svg
                  class="w-3.5 h-3.5 mr-1.5 text-green-600"
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
                Total {{ userTotalStudent }} mahasiswa bimbingan
              </p>
            </div>

            <!-- Right side: Pagination -->
            <div class="flex items-center gap-2">
              <!-- Previous Button -->
              <button
                @click="changePage(meta.page - 1)"
                :disabled="meta.page <= 1"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <!-- Page Numbers -->
              <div class="flex items-center gap-1">
                <button
                  v-for="page in paginationPages"
                  :key="page"
                  @click="changePage(page)"
                  :class="[
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    page === meta.page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
                  ]"
                >
                  {{ page }}
                </button>
              </div>

              <!-- Next Button -->
              <button
                @click="changePage(meta.page + 1)"
                :disabled="meta.page >= meta.max_page"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  /* -webkit-line-clamp: 2; */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

table {
  border-collapse: collapse;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #cbd5e1, #94a3b8);
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #94a3b8, #64748b);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1, #94a3b8);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8, #64748b);
}

button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

button:active:not(:disabled) {
  transform: scale(0.98);
}

tbody tr {
  transition: background-color 0.15s ease-in-out;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input:disabled,
textarea:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #f9fafb;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 640px) {
  table {
    font-size: 0.875rem;
  }

  th,
  td {
    padding: 0.75rem 0.5rem;
  }
}

.hover\:shadow-md {
  transition: box-shadow 0.3s ease-in-out;
}

.group:hover svg {
  transition: transform 0.2s ease-in-out;
}
</style>
