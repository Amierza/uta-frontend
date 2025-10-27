import { ref } from "vue";
import {
  getThesisDetail,
  getAllThesesByLecturerID,
  updateThesis,
} from "../api/thesis";
import type { ThesisResponse } from "../types/master";

interface PaginationMeta {
  page: number;
  per_page: number;
  max_page: number;
  count: number;
}

export function useThesis() {
  const thesis = ref<ThesisResponse | null>(null);
  const theses = ref<ThesisResponse[]>([]);
  const meta = ref<PaginationMeta>({
    page: 1,
    per_page: 10,
    max_page: 1,
    count: 0,
  });
  const isLoading = ref(false);
  const isUpdating = ref(false);
  const error = ref<string | null>(null);

  // Get thesis detail by ID
  const fetchThesisDetail = async (thesisId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await getThesisDetail(thesisId);

      if (response.status) {
        thesis.value = response.data;
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch thesis detail");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch thesis detail";
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      isLoading.value = false;
    }
  };

  // Get all theses by lecturer ID with pagination
  const fetchThesesByLecturer = async (
    lecturerId: string,
    page: number = 1
  ) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await getAllThesesByLecturerID(lecturerId, page);

      if (response.status) {
        theses.value = Array.isArray(response.data) ? response.data : [];

        // Update meta from API response
        if (response.meta) {
          meta.value = {
            page: response.meta.page || 1,
            per_page: response.meta.per_page || 10,
            max_page: response.meta.max_page || 1,
            count: response.meta.count || 0,
          };
        }

        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch theses");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch theses";
      error.value = errorMessage;
      theses.value = [];
      // Reset meta on error
      meta.value = {
        page: 1,
        per_page: 10,
        max_page: 1,
        count: 0,
      };
      throw new Error(errorMessage);
    } finally {
      isLoading.value = false;
    }
  };

  // Update thesis (student only)
  const updateThesisData = async (
    thesisId: string,
    data: Partial<{
      title: string;
      description: string;
      progress: string;
      student_id: string;
    }>
  ) => {
    isUpdating.value = true;
    error.value = null;
    try {
      const response = await updateThesis(thesisId, data);

      if (response.status) {
        thesis.value = response.data;
        return response.data;
      } else {
        throw new Error(response.message || "Failed to update thesis");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to update thesis";
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      isUpdating.value = false;
    }
  };

  return {
    thesis,
    theses,
    meta,
    isLoading,
    isUpdating,
    error,
    fetchThesisDetail,
    fetchThesesByLecturer,
    updateThesisData,
  };
}
