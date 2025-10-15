// ============================================
// useChatWebSocket.ts - FIXED
// ============================================

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

    // ============================================
    // Event: session_started
    // Fired when ANYONE (student or supervisor) starts the session
    // Others receive this event
    // ============================================
    on("session_started", (data: WebSocketEventData) => {
      console.log("🎬 Session started event:", {
        student_id: data.student_id,
        student_name: data.student_name,
        supervisors: data.supervisors?.length || 0,
      });

      // ✅ PERBAIKAN: Add student as online
      if (data.student_id) {
        console.log("✅ Adding student to online:", data.student_id);
        addOnlineParticipant(data.student_id);
      }

      // ✅ PERBAIKAN: Jika ada supervisors di event ini (supervisor yang start)
      // Add mereka yang sudah online/join saat start
      if (data.supervisors && data.supervisors.length > 0) {
        console.log("ℹ️ Supervisors already in session at start:");

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
    // Fired when primary supervisor joins
    // Others (student, secondary) receive this event
    // ============================================
    on("primary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("👤 Primary lecturer joined event:", {
        primary_id: data.supervisors?.[0]?.id,
        primary_name: data.supervisors?.[0]?.name,
        all_supervisors: data.supervisors?.length,
      });

      // ✅ PERBAIKAN: Add primary supervisor
      if (data.supervisors?.[0]?.id) {
        console.log(
          "✅ Adding primary supervisor to online:",
          data.supervisors[0].id
        );
        addOnlineParticipant(data.supervisors[0].id);
      }

      // If secondary is already in supervisors array, add them too
      if (data.supervisors?.[1]?.id) {
        console.log(
          "ℹ️ Secondary supervisor already in array but not yet joined"
        );
        // Don't add yet, wait for secondary_lecturer_joined event
      }
    });

    // ============================================
    // Event: secondary_lecturer_joined
    // Fired when secondary supervisor joins
    // Others (student, primary) receive this event
    // ============================================
    on("secondary_lecturer_joined", (data: WebSocketEventData) => {
      console.log("👤 Secondary lecturer joined event:", {
        secondary_id: data.supervisors?.[1]?.id,
        secondary_name: data.supervisors?.[1]?.name,
        all_supervisors: data.supervisors?.length,
      });

      // ✅ PERBAIKAN: Add secondary supervisor
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
    // Fired when student joins (untuk kasus di mana supervisor start)
    // ============================================
    on("student_joined", (data: WebSocketEventData) => {
      console.log("👤 Student joined event:", {
        student_id: data.student_id,
        student_name: data.student_name,
      });

      if (data.student_id) {
        console.log("✅ Adding student to online:", data.student_id);
        addOnlineParticipant(data.student_id);
      }
    });

    // ============================================
    // Event: new_message
    // ============================================
    on("new_message", (data: WebSocketEventData) => {
      console.log("📨 New message event received:", {
        id: data.id,
        sender: data.sender,
        text: data.text?.substring(0, 30),
      });

      if (!data.sender || !data.sender.id) {
        console.error("❌ Invalid sender data from WebSocket:", data);
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

      console.log("✅ Processing message:", {
        id: messageData.id,
        sender_name: messageData.sender.name,
      });

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
    webSocketInitialized.value = false;
  };

  return {
    setupWebSocketListeners,
    resetWebSocket,
  };
};
