import { ref } from "vue";
import type { ScheduleResponse } from "../types/schedule";
import type { ErrorResponse, SuccessResponse } from "../types/api";
import {
  getAllSchedules,
  getScheduleDetail,
  createSchedule,
  updateSchedule,
  approveSchedule,
  deleteSchedule,
} from "../api/schedule";

function isSuccessResponse<T>(
  res: SuccessResponse<T> | ErrorResponse
): res is SuccessResponse<T> {
  return (res as SuccessResponse<T>).status === true && "data" in res;
}

export function useSchedule() {
  const schedules = ref<ScheduleResponse[]>([]);
  const selectedSchedule = ref<ScheduleResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ✅ Fetch all schedules
  const fetchSchedules = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const res = await getAllSchedules();

      if (isSuccessResponse<ScheduleResponse[]>(res)) {
        schedules.value = res.data;
      } else {
        error.value = res.message;
        throw new Error(res.message);
      }
    } catch (err: any) {
      error.value = err.message || "Gagal memuat jadwal";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ✅ Fetch detail schedule
  const fetchScheduleDetail = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const res = await getScheduleDetail(id);
      if (isSuccessResponse<ScheduleResponse>(res)) {
        selectedSchedule.value = res.data;
        return res.data;
      } else {
        error.value = res.message;
        throw new Error(res.message);
      }
    } catch (err: any) {
      error.value = err.message || "Gagal memuat detail jadwal";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ✅ Create schedule - FIXED with better response handling
  const createNewSchedule = async (payload: {
    proposed_at: string;
    start_time: string;
    end_time: string;
    description?: string;
    location: string;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log("📝 Creating schedule:", payload);

      const res = await createSchedule(payload);

      console.log("📊 Create response:", res);

      // ✅ Check if response has status: true (success)
      if (res.status === true) {
        console.log("✅ Schedule created successfully");
        await fetchSchedules();
        return (res as any).data || { success: true };
      } else {
        console.error("❌ Failed to create schedule:", res.message);
        error.value = res.message;
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error("❌ Create schedule error:", err);
      error.value = err.message || "Gagal membuat jadwal";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ✅ Update schedule - FIXED with better response handling
  const updateExistingSchedule = async (
    id: string,
    payload: {
      proposed_at?: string;
      start_time?: string;
      end_time?: string;
      description?: string;
      location?: string;
    }
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log("✏️ Updating schedule:", id, payload);

      const res = await updateSchedule(id, payload);

      console.log("📊 Update response:", res);

      // ✅ Check if response has status: true (success)
      if (res.status === true) {
        console.log("✅ Schedule updated successfully");
        await fetchSchedules();
        return (res as any).data || { success: true };
      } else {
        console.error("❌ Failed to update schedule:", res.message);
        error.value = res.message;
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error("❌ Update schedule error:", err);
      error.value = err.message || "Gagal memperbarui jadwal";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ✅ Approve / Reject schedule - FIXED with better response handling
  const handleApproval = async (
    id: string,
    status: "approved" | "rejected" | "pending"
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log("🔄 Approving schedule:", { id, status });

      const res = await approveSchedule(id, { status });

      console.log("📊 Approval response:", res);

      // ✅ Check if response has status: true (success)
      if (res.status === true) {
        console.log("✅ Schedule approval successful");
        await fetchSchedules();
        // Return data if exists, otherwise return success indicator
        return (res as any).data || { success: true };
      } else {
        console.error("❌ Failed to approve schedule:", res.message);
        error.value = res.message;
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error("❌ Approval error:", err);
      error.value = err.message || "Gagal memperbarui status jadwal";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ✅ Delete schedule - FIXED with better response handling
  const deleteScheduleById = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log("🗑️ Deleting schedule:", id);

      const res = await deleteSchedule(id);

      console.log("📊 Delete response:", res);

      // ✅ Check if response has status: true (success)
      if (res.status === true) {
        console.log("✅ Schedule deleted successfully");
        schedules.value = schedules.value.filter((s) => s.id !== id);
        return true;
      } else {
        console.error("❌ Failed to delete schedule:", res.message);
        error.value = res.message;
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error("❌ Delete schedule error:", err);
      error.value = err.message || "Gagal menghapus jadwal";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    schedules,
    selectedSchedule,
    isLoading,
    error,
    fetchSchedules,
    fetchScheduleDetail,
    createNewSchedule,
    updateExistingSchedule,
    handleApproval,
    deleteScheduleById,
  };
}
