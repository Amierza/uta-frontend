import type { ErrorResponse, SuccessResponse } from "../types/api";
import type { ThesisResponse } from "../types/master";
import api from "./api";

export const getThesisDetail = async (
  thesisId: string
): Promise<SuccessResponse<ThesisResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get(`/theses/${thesisId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getAllThesesByLecturerID = async (
  lecturerId: string,
  page: number = 1,
  perPage: number = 10
): Promise<SuccessResponse<ThesisResponse[]> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get(`/theses/lecturer/${lecturerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
};

export const updateThesis = async (
  thesisId: string,
  payload: Partial<{
    title: string;
    description: string;
    progress: string;
    student_id: string;
  }>
): Promise<SuccessResponse<ThesisResponse> | ErrorResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await api.put(`/theses/${thesisId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
