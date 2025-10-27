import type { CustomUserResponse } from "./user";

export interface SendMessageRequest {
  is_text: boolean;
  text?: string;
  file_url?: string;
  parent_message_id?: string;
}

export interface MessageResponse {
  id: string;
  session_id: string;
  sender: CustomUserResponse;
  is_text: boolean;
  text?: string;
  file_url?: string;
  timestamp: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender: CustomUserResponse;
  is_text: boolean;
  text: string;
  file_url: string | null;
  parent_message_id: string | null;
  timestamp: string;
  is_sending?: boolean;
  event?: string;
}

export interface Participant {
  id: string;
  name: string;
  identifier: string;
  role: string;
  online: boolean;
}

export interface GroupedMessages {
  [date: string]: Message[];
}

export interface WebSocketEventData {
  id?: string;
  event?: string;
  is_text?: boolean;
  text?: string;
  file_url?: string | null;
  sender: CustomUserResponse;
  session_id?: string;
  parent_message_id?: string | null;
  timestamp?: string;
  student_id?: string;
  student_name?: string;
  supervisors?: Array<{ id: string; role: string; name: string }>;
}
