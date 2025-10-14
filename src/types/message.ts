export interface SendMessageRequest {
  is_text: boolean;
  text?: string;
  file_url?: string;
  file_type?: string;
  parent_message_id?: string;
}

export interface MessageResponse {
  id: string;
  session_id: string;
  sender_id: string;
  sender_role: string;
  is_text: boolean;
  text?: string;
  file_url?: string;
  timestamp: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role: "student" | "lecturer";
  is_text: boolean;
  text: string;
  file_url: string | null;
  file_type: string | null;
  parent_message_id: string | null;
  timestamp: string;
  is_sending?: boolean;
  event?: string;
}

export interface Participant {
  id: string;
  name: string;
  identifier: string;
  role: "student" | "primary_supervisor" | "secondary_supervisor";
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
  file_type?: string | null;
  sender_role?: string;
  sender_id?: string;
  sender_name?: string;
  session_id?: string;
  parent_message_id?: string | null;
  timestamp?: string;
  student_id?: string;
  supervisors?: Array<{ id: string; name?: string }>;
}
