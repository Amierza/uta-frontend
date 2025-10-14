import { ref } from "vue";
import { useRouter } from "vue-router";
import type { Message, WebSocketEventData } from "../types/message";

type WebSocketEventCallback = (data: WebSocketEventData) => void;
type ToastType = "info" | "success" | "warning" | "error";

export const useChatWebSocket = (
  sessionId: string,
  on: (event: string, callback: WebSocketEventCallback) => void,
  addNewMessage: (message: Message) => void,
  addOnlineParticipant: (id: string) => void,
  removeOnlineParticipant: (id: string) => void,
  showToast: (message: string, type?: ToastType, duration?: number) => void
) => {
  const router = useRouter();
  const webSocketInitialized = ref<boolean>(false);

  const setupWebSocketListeners = (): void => {
    if (webSocketInitialized.value) return;
    webSocketInitialized.value = true;

    console.log("Setting up WebSocket listeners for session:", sessionId);

    on("new_message", (data: WebSocketEventData) => {
      console.log("New message event received:", {
        id: data.id,
        sender: data.sender,
        text: data.text?.substring(0, 30),
      });

      const messageData: Message = {
        id: data.id || "",
        event: data.event,
        is_text: data.is_text || false,
        text: data.text || "",
        file_url: data.file_url || null,
        file_type: data.file_type || null,
        sender: data.sender,
        session_id: data.session_id || "",
        parent_message_id: data.parent_message_id || null,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      addNewMessage(messageData);
    });

    on("session_started", (data: WebSocketEventData) => {
      console.log("Session started event");
      if (data.student_id) {
        addOnlineParticipant(data.student_id);
      }
    });

    on("primary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("Primary lecturer joined event");
      if (data.supervisors?.[0]?.id) {
        addOnlineParticipant(data.supervisors[0].id);
      }
    });

    on("secondary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("Secondary lecturer joined event");
      if (data.supervisors?.[1]?.id) {
        addOnlineParticipant(data.supervisors[1].id);
      }
    });

    on("student_joined", (data: WebSocketEventData) => {
      console.log("Student joined event");
      if (data.student_id) {
        addOnlineParticipant(data.student_id);
      }
    });

    on("primary_lecturer_leaved", (data: WebSocketEventData) => {
      console.log("Primary lecturer left event");
      if (data.supervisors?.[0]?.id) {
        removeOnlineParticipant(data.supervisors[0].id);
      }
      showToast("Pembimbing utama telah meninggalkan sesi.", "warning");
    });

    on("secondary_lecturer_leaved", (data: WebSocketEventData) => {
      console.log("Secondary lecturer left event");
      if (data.supervisors?.[1]?.id) {
        removeOnlineParticipant(data.supervisors[1].id);
      }
      showToast("Pembimbing kedua telah meninggalkan sesi.", "warning");
    });

    on("student_leaved", (data: WebSocketEventData) => {
      console.log("Student left event");
      if (data.student_id) {
        removeOnlineParticipant(data.student_id);
      }
      showToast("Mahasiswa telah meninggalkan sesi.", "warning");
    });

    on("user_ended", () => {
      console.log("Session ended event");
      showToast("Sesi bimbingan telah diakhiri.", "info");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    });
  };

  const resetWebSocket = (): void => {
    webSocketInitialized.value = false;
  };

  return {
    setupWebSocketListeners,
    resetWebSocket,
  };
};
