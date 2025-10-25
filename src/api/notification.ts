import type { SuccessResponse, ErrorResponse } from "../types/api";
import type { NotificationResponse } from "../types/notification";
import api from "./api";

export const getAllNotifications = async (): Promise<
  SuccessResponse<NotificationResponse> | ErrorResponse
> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get("/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getNotificationDetail = async (
  notificationId: string
): Promise<SuccessResponse<NotificationResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get(`/notifications/${notificationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
