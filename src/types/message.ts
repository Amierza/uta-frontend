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
