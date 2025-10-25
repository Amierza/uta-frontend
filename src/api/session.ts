import type { SuccessResponse, ErrorResponse } from "../types/api";
import type { SessionResponse } from "../types/session";
import api from "./api";

interface SessionsParams {
  month?: string;
  status?: string;
  sort?: string;
  pagination?: boolean;
  page?: number;
  per_page?: number;
  max_page?: number;
}

export const getAllSessions = async (
  params?: SessionsParams
): Promise<SuccessResponse<SessionResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");

  // Build query params - hanya kirim yang ada nilainya
  const queryParams: Record<string, any> = {
    pagination: params?.pagination ?? true,
  };

  // Tambahkan parameter opsional jika ada
  if (params?.month !== undefined) {
    queryParams.month = params.month;
  }
  if (params?.status !== undefined) {
    queryParams.status = params.status;
  }
  if (params?.sort !== undefined) {
    queryParams.sort = params.sort;
  }
  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }
  if (params?.per_page !== undefined) {
    queryParams.per_page = params.per_page;
  }

  const response = await api.get("/sessions", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: queryParams,
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
