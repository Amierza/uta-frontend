import type { SuccessResponse, ErrorResponse } from "../types/api";
import type { LoginRequest, LoginResponse } from "../types/auth";
import api from "./api";

export const login = async (
  payload: LoginRequest
): Promise<SuccessResponse<LoginResponse> | ErrorResponse> => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};
