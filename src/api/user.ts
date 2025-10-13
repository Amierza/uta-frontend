import type { SuccessResponse, ErrorResponse } from "../types/api";
import type { UserResponse } from "../types/user";
import api from "./api";

export const getUserProfile = async (): Promise<
  SuccessResponse<UserResponse> | ErrorResponse
> => {
  const token = localStorage.getItem("access_token");
  const response = await api.get("/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
