import type { ErrorResponse, SuccessResponse } from "../types/api";
import type { SummaryResponse } from "../types/summary";
import api from "./api";

export const getNotificationDetail = async (
  sessionId: string
): Promise<SuccessResponse<SummaryResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get(`/sessions/${sessionId}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
