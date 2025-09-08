import type { LoginRequest, LoginResponse } from "../types/auth";
import api from "./api";

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  return response.data;
};
