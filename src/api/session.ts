import type { SuccessResponse, ErrorResponse } from "../types/api";
import type { SessionResponse } from "../types/session";
import api from "./api";

interface SessionsParams {
  month?: string;
  status?: string;
  sort?: string;
}

export const getAllSessions = async (
  params?: SessionsParams
): Promise<SuccessResponse<SessionResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get("/sessions", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
  return response.data;
};

export const getSessionDetail = async (
  sessionId: string
): Promise<SuccessResponse<SessionResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get(`/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Start new session (for students)
export const startNewSession = async (
  thesisId: string
): Promise<SuccessResponse<SessionResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.post(`/sessions/start/${thesisId}`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Join existing session
export const joinSession = async (
  sessionId: string
): Promise<SuccessResponse<any> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.post(`/sessions/${sessionId}/join`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Leave session
export const leaveSession = async (
  sessionId: string
): Promise<SuccessResponse<any> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.post(`/sessions/${sessionId}/leave`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// End session
export const endSession = async (
  sessionId: string
): Promise<SuccessResponse<any> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.post(`/sessions/${sessionId}/end`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
