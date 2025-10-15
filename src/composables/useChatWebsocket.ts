import { useRouter } from "vue-router";
import type { Message, WebSocketEventData } from "../types/message";

type WebSocketEventCallback = (data: WebSocketEventData) => void;
type ToastType = "info" | "success" | "warning" | "error";

let webSocketListenersSetupPerformed = false;

export const useChatWebSocket = (
  sessionId: string,
  on: (event: string, callback: WebSocketEventCallback) => void,
  addNewMessage: (message: Message) => void,
  addOnlineParticipant: (id: string) => void,
  removeOnlineParticipant: (id: string) => void,
  showToast: (message: string, type?: ToastType, duration?: number) => void
) => {
  const router = useRouter();

  const setupWebSocketListeners = (): void => {
    if (webSocketListenersSetupPerformed) {
      console.log("⏭️ WebSocket listeners already setup, skipping");
      return;
    }

    webSocketListenersSetupPerformed = true;
    console.log("🔌 Setting up WebSocket listeners for session:", sessionId);

    // ============================================
    // Event: session_started
    // Student started the session
    // Recipients: Primary & Secondary Supervisors
    // ============================================
    on("session_started", (data: WebSocketEventData) => {
      console.log("🎬 session_started event:", data);

      // Student yang start sudah online (dia yg start)
      // Kita yang terima event ini berarti kita supervisor
      // Maka: student sudah online
      if (data.student_id) {
        console.log("✅ Student is online (started session):", data.student_id);
        addOnlineParticipant(data.student_id);
      }

      showToast(`${data.student_name} telah memulai sesi bimbingan.`, "info");
    });

    // ============================================
    // Event: primary_lecturer_joined
    // Primary supervisor joined
    // Recipients: Student & Secondary Supervisor (if any)
    // ============================================
    on("primary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("👤 primary_lecturer_joined event:", data);

      // Yang join = primary lecturer, dia sudah online
      // Student pasti sudah online (karena dia yang start atau sudah join)
      if (data.student_id) {
        addOnlineParticipant(data.student_id);
      }

      // Primary lecturer yang baru join
      if (data.supervisors && data.supervisors[0]?.id) {
        const primaryId = data.supervisors[0].id;
        const primaryName = data.supervisors[0].name;
        console.log("✅ Primary lecturer is online (just joined):", primaryId);
        addOnlineParticipant(primaryId);
        showToast(`${primaryName} telah bergabung ke sesi.`, "info");
      }
    });

    // ============================================
    // Event: secondary_lecturer_joined
    // Secondary supervisor joined
    // Recipients: Student & Primary Supervisor
    // ============================================
    on("secondary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("👤 secondary_lecturer_joined event:", data);

      // Student pasti online
      if (data.student_id) {
        addOnlineParticipant(data.student_id);
      }

      // Primary pasti sudah join sebelumnya (dari data supervisors array)
      if (data.supervisors && data.supervisors[0]?.id) {
        addOnlineParticipant(data.supervisors[0].id);
      }

      // Secondary yang baru join
      if (data.supervisors && data.supervisors[1]?.id) {
        const secondaryId = data.supervisors[1].id;
        const secondaryName = data.supervisors[1].name;
        console.log(
          "✅ Secondary lecturer is online (just joined):",
          secondaryId
        );
        addOnlineParticipant(secondaryId);
        showToast(`${secondaryName} telah bergabung ke sesi.`, "info");
      }
    });

    // ============================================
    // Event: student_joined
    // Student joined (when supervisor started)
    // Recipients: Supervisors
    // ============================================
    on("student_joined", (data: WebSocketEventData) => {
      console.log("👤 student_joined event:", data);

      // Student yang baru join
      if (data.student_id) {
        console.log("✅ Student is online (just joined):", data.student_id);
        addOnlineParticipant(data.student_id);
        showToast(`${data.student_name} telah bergabung ke sesi.`, "info");
      }

      // Supervisors yang ada di array pasti sudah online (mereka yang start/sudah join)
      if (data.supervisors) {
        data.supervisors.forEach((supervisor) => {
          if (supervisor.id) {
            addOnlineParticipant(supervisor.id);
          }
        });
      }
    });

    // ============================================
    // Event: new_message
    // ============================================
    on("new_message", (data: WebSocketEventData) => {
      console.log("📨 new_message event");

      if (!data.sender || !data.sender.id) {
        console.error("❌ Invalid sender data:", data);
        return;
      }

      const messageData: Message = {
        id: data.id || "",
        event: data.event,
        is_text: data.is_text || false,
        text: data.text || "",
        file_url: data.file_url || null,
        file_type: data.file_type || null,
        sender: {
          id: data.sender.id,
          name: data.sender.name || "Unknown",
          identifier: data.sender.identifier || "",
          role: data.sender.role || "student",
        },
        session_id: data.session_id || "",
        parent_message_id: data.parent_message_id || null,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      addNewMessage(messageData);
    });

    // ============================================
    // Event: primary_lecturer_leaved
    // Primary supervisor left
    // Recipients: Student & Secondary (if exists)
    // ============================================
    on("primary_lecturer_leaved", (data: WebSocketEventData) => {
      console.log("👋 primary_lecturer_leaved event:", data);

      // Primary yang leave
      if (data.supervisors && data.supervisors[0]?.id) {
        const primaryId = data.supervisors[0].id;
        const primaryName = data.supervisors[0].name;
        console.log("❌ Primary lecturer left:", primaryId);
        removeOnlineParticipant(primaryId);
        showToast(`${primaryName} telah meninggalkan sesi.`, "warning");
      }
    });

    // ============================================
    // Event: secondary_lecturer_leaved
    // Secondary supervisor left
    // Recipients: Student & Primary
    // ============================================
    on("secondary_lecturer_leaved", (data: WebSocketEventData) => {
      console.log("👋 secondary_lecturer_leaved event:", data);

      // Secondary yang leave (index 1)
      if (data.supervisors && data.supervisors[1]?.id) {
        const secondaryId = data.supervisors[1].id;
        const secondaryName = data.supervisors[1].name;
        console.log("❌ Secondary lecturer left:", secondaryId);
        removeOnlineParticipant(secondaryId);
        showToast(`${secondaryName} telah meninggalkan sesi.`, "warning");
      }
    });

    // ============================================
    // Event: student_leaved
    // Student left
    // Recipients: Supervisors
    // ============================================
    on("student_leaved", (data: WebSocketEventData) => {
      console.log("👋 student_leaved event:", data);

      if (data.student_id) {
        console.log("❌ Student left:", data.student_id);
        removeOnlineParticipant(data.student_id);
        showToast(`${data.student_name} telah meninggalkan sesi.`, "warning");
      }
    });

    // ============================================
    // Event: user_ended
    // Session ended by owner
    // Recipients: All participants
    // ============================================
    on("user_ended", (data: WebSocketEventData) => {
      console.log("🔚 user_ended event:", data);

      const enderName = data.student_name || "Pengguna";
      showToast(`${enderName} telah mengakhiri sesi bimbingan.`, "info");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    });

    console.log("✅ All WebSocket listeners registered");
  };

  const resetWebSocket = (): void => {
    webSocketListenersSetupPerformed = false;
    console.log("🧹 WebSocket listeners reset");
  };

  return {
    setupWebSocketListeners,
    resetWebSocket,
  };
};
