import { ref } from "vue";
import { getNotificationDetail } from "../api/notification";
import type { NotificationResponse } from "../types/notification";

export function useNotificationDetail() {
  const notificationDetail = ref<NotificationResponse | null>(null);
  const isLoadingDetail = ref(false);
  const error = ref<string | null>(null);

  const fetchNotificationDetail = async (notificationId: string) => {
    if (!notificationId) {
      error.value = "Notification ID tidak valid";
      return null;
    }

    try {
      isLoadingDetail.value = true;
      error.value = null;

      // GET request will automatically mark as read in backend
      const response = await getNotificationDetail(notificationId);

      if (response.status && response.data) {
        notificationDetail.value = response.data;
        return response.data;
      } else {
        throw new Error("Detail notifikasi tidak ditemukan");
      }
    } catch (err: any) {
      console.error("❌ Error fetching notification detail:", err);
      error.value =
        err.response?.data?.message || "Gagal memuat detail notifikasi";
      notificationDetail.value = null;
      return null;
    } finally {
      isLoadingDetail.value = false;
    }
  };

  return {
    notificationDetail,
    isLoadingDetail,
    error,
    fetchNotificationDetail,
  };
}
