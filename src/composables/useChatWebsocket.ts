import { useRouter } from "vue-router";
import type { Message, WebSocketEventData } from "../types/message";

type WebSocketEventCallback = (data: WebSocketEventData) => void;
type ToastType = "info" | "success" | "warning" | "error";

// ✅ PERBAIKAN: Move flag OUTSIDE function scope
// Agar tetap persist antar component mount/unmount
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
    // ✅ PERBAIKAN: Check flag dengan unique key per session
    // const setupKey = `chat-ws-${sessionId}`;

    if (webSocketListenersSetupPerformed) {
      console.log(
        "⏭️ WebSocket listeners sudah di-setup untuk session ini, skipping"
      );
      return;
    }

    webSocketListenersSetupPerformed = true;
    console.log("Setting up WebSocket listeners for session:", sessionId);

    // ============================================
    // Event: session_started
    // ============================================
    on("session_started", (data: WebSocketEventData) => {
      console.log("🎬 Session started event:", {
        student_id: data.student_id,
        supervisors: data.supervisors?.length || 0,
      });

      if (data.student_id) {
        console.log("✅ Adding student to online:", data.student_id);
        addOnlineParticipant(data.student_id);
      }

      if (data.supervisors && data.supervisors.length > 0) {
        if (data.supervisors[0]?.id) {
          console.log(
            "✅ Adding primary supervisor to online:",
            data.supervisors[0].id
          );
          addOnlineParticipant(data.supervisors[0].id);
        }

        if (data.supervisors[1]?.id) {
          console.log(
            "✅ Adding secondary supervisor to online:",
            data.supervisors[1].id
          );
          addOnlineParticipant(data.supervisors[1].id);
        }
      }
    });

    // ============================================
    // Event: primary_lecturer_joined
    // ============================================
    on("primary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("👤 Primary lecturer joined event");

      // Ensure student is online
      if (data.student_id && !new Set([data.student_id]).has(data.student_id)) {
        addOnlineParticipant(data.student_id);
      }

      if (data.supervisors?.[0]?.id) {
        console.log(
          "✅ Adding primary supervisor to online:",
          data.supervisors[0].id
        );
        addOnlineParticipant(data.supervisors[0].id);
      }
    });

    // ============================================
    // Event: secondary_lecturer_joined
    // ============================================
    on("secondary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("👤 Secondary lecturer joined event");

      if (data.supervisors?.[1]?.id) {
        console.log(
          "✅ Adding secondary supervisor to online:",
          data.supervisors[1].id
        );
        addOnlineParticipant(data.supervisors[1].id);
      }
    });

    // ============================================
    // Event: student_joined
    // ============================================
    on("student_joined", (data: WebSocketEventData) => {
      console.log("👤 Student joined event");

      if (data.student_id) {
        console.log("✅ Adding student to online:", data.student_id);
        addOnlineParticipant(data.student_id);
      }
    });

    // ============================================
    // Event: new_message
    // ============================================
    on("new_message", (data: WebSocketEventData) => {
      console.log("📨 New message event received");

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
    // ============================================
    on("primary_lecturer_leaved", (data: WebSocketEventData) => {
      console.log("👋 Primary lecturer left event");

      if (data.supervisors?.[0]?.id) {
        console.log("❌ Removing primary supervisor:", data.supervisors[0].id);
        removeOnlineParticipant(data.supervisors[0].id);
      }

      showToast("Pembimbing utama telah meninggalkan sesi.", "warning");
    });

    // ============================================
    // Event: secondary_lecturer_leaved
    // ============================================
    on("secondary_lecturer_leaved", (data: WebSocketEventData) => {
      console.log("👋 Secondary lecturer left event");

      if (data.supervisors?.[1]?.id) {
        console.log(
          "❌ Removing secondary supervisor:",
          data.supervisors[1].id
        );
        removeOnlineParticipant(data.supervisors[1].id);
      }

      showToast("Pembimbing kedua telah meninggalkan sesi.", "warning");
    });

    // ============================================
    // Event: student_leaved
    // ============================================
    on("student_leaved", (data: WebSocketEventData) => {
      console.log("👋 Student left event");

      if (data.student_id) {
        console.log("❌ Removing student:", data.student_id);
        removeOnlineParticipant(data.student_id);
      }

      showToast("Mahasiswa telah meninggalkan sesi.", "warning");
    });

    // ============================================
    // Event: user_ended
    // ============================================
    on("user_ended", () => {
      console.log("🔚 Session ended event");
      showToast("Sesi bimbingan telah diakhiri.", "info");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    });
  };

  const resetWebSocket = (): void => {
    // ✅ PERBAIKAN: Reset flag saat component unmount
    webSocketListenersSetupPerformed = false;
    console.log("🧹 WebSocket listeners reset");
  };

  return {
    setupWebSocketListeners,
    resetWebSocket,
  };
};
