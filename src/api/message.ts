import type { ErrorResponse, SuccessResponse } from "../types/api";
import type { MessageResponse, SendMessageRequest } from "../types/message";
import type { SessionResponse } from "../types/session";
import api from "./api";

// Send message
export const sendMessage = async (
  sessionId: string,
  payload: SendMessageRequest
): Promise<SuccessResponse<MessageResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.post(`/sessions/${sessionId}/messages`, {
    payload,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get message list
export const getMessages = async (
  sessionId: string
): Promise<SuccessResponse<SessionResponse[]> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get(`/sessions/${sessionId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
