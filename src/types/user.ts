import type { StudentResponse, LecturerResponse } from "./master";

export interface UserResponse {
  id: string;
  identifier: string;
  role: string;
  thesis_id: string;
  student?: StudentResponse;
  lecturer?: LecturerResponse;
}

export interface CustomUserResponse {
  id: string;
  name: string;
  identifier: string;
  role: string;
}
