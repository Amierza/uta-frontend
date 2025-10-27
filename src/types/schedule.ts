import type { ThesisResponse } from "./master";
import type { CustomUserResponse } from "./user";

export interface ScheduleResponse {
  id: string;
  proposed_at: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected";
  description?: string;
  location: string;
  thesis: ThesisResponse;
  created_by: CustomUserResponse;
  approved_by?: CustomUserResponse | null;
}
