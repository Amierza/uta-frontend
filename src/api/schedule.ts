import type { ErrorResponse, SuccessResponse } from "../types/api";
import type { ScheduleResponse } from "../types/schedule";
import api from "./api";

export const createSchedule = async (payload: {
  start_time: string;
  end_time: string;
  location: string;
  description?: string;
}): Promise<SuccessResponse<ScheduleResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.post("/schedules", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getAllSchedules = async (): Promise<
  SuccessResponse<ScheduleResponse[]> | ErrorResponse
> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get("/schedules", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getScheduleDetail = async (
  scheduleId: string
): Promise<SuccessResponse<ScheduleResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get(`/schedules/${scheduleId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateSchedule = async (
  scheduleId: string,
  payload: Partial<{
    start_time: string;
    end_time: string;
    location: string;
    description?: string;
  }>
): Promise<SuccessResponse<ScheduleResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.put(`/schedules/${scheduleId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const approveSchedule = async (
  scheduleId: string,
  payload: { status: "pending" | "approved" | "rejected" }
): Promise<SuccessResponse<ScheduleResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.post(
    `/schedules/${scheduleId}/approval`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

export const deleteSchedule = async (
  scheduleId: string
): Promise<SuccessResponse<null> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.delete(`/schedules/${scheduleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
