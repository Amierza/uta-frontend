import { ref, type Ref } from "vue";
import { getAllNotifications } from "../api/notification";
import type { NotificationResponse } from "../types/notification";

export function useNotifications(userId: Ref<string>) {
  const notifications = ref<NotificationResponse[]>([]);
  const isLoadingNotifications = ref(false);

  const fetchNotifications = async () => {
    try {
      isLoadingNotifications.value = true;
      const response = await getAllNotifications();

      if (response.status) {
        if (Array.isArray(response.data)) {
          notifications.value = response.data.filter(
            (n) => n.user_id === userId.value
          );
        }
      } else {
        console.warn("Unexpected notification response format:", response);
        notifications.value = [];
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      notifications.value = [];
    } finally {
      isLoadingNotifications.value = false;
    }
  };

  return {
    notifications,
    isLoadingNotifications,
    fetchNotifications,
  };
}
