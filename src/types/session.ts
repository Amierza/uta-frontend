import type { UserResponse } from "./user";
import type { ThesisResponse } from "./master";

export interface SessionResponse {
  id: string;
  start_time?: string;
  end_time?: string;
  status: string;
  thesis: ThesisResponse;
  user_owner: UserResponse;
}
export interface CustomSessionResponse {
  id: string;
  start_time?: string;
  end_time?: string;
  status: string;
}
