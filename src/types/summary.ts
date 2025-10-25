import type { CustomSessionResponse } from "./session";

export interface SummaryResponse {
  id: string;
  content: string;
  session: CustomSessionResponse;
}
