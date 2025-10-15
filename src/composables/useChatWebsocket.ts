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

    let userOnlineMap: {
      id: string;
      role: string;
      name: string;
      event: string;
    }[] = [];

    const handleUserLeave = (role: string) => {
      const user = userOnlineMap.find((u) => u.role === role);
      if (user) {
        console.log(`❌ ${user.role} left:`, user.id);
        userOnlineMap = userOnlineMap.filter((u) => u.id !== user.id);
        removeOnlineParticipant(user.id);
        showToast(`${user.name} telah meninggalkan sesi.`, "warning");
      } else {
        console.log(`No ${role} found in userOnlineMap`);
      }
    };

    // ============================================
    // Event: session_started
    // ============================================
    on("session_started", (data: WebSocketEventData) => {
      try {
        console.log("🎬 session_started event:", data);
        if (data.student_id || data.supervisors) {
          if (data.student_id) {
            console.log(
              "✅ Student is online (started session):",
              data.student_id
            );
            userOnlineMap.push({
              id: data.student_id,
              role: "student",
              name: data.student_name || "Unknown",
              event: "session_started",
            });
            addOnlineParticipant(data.student_id);
            showToast(
              `${data.student_name} telah memulai sesi bimbingan.`,
              "info"
            );
          }

          if (data.supervisors) {
            console.log(
              "✅ Supervisors is online (started session):",
              data.supervisors[0].name
            );
            userOnlineMap.push({
              id: data.supervisors[0].id,
              role: data.supervisors[0].role,
              name: data.supervisors[0].name,
              event: "session_started",
            });
            addOnlineParticipant(data.supervisors[0].id);
            showToast(
              `${data.supervisors[0].name} telah memulai sesi bimbingan.`,
              "info"
            );
          }
        } else {
          console.log("Unknown user start the session");
        }
      } catch (err) {
        console.log("Error handling event session_started:", err);
      }
    });

    // ============================================
    // Event: primary_lecturer_joined
    // Primary supervisor joined
    // Recipients: Student & Secondary Supervisor (if any)
    // ============================================
    on("primary_lecturer_joined", (data: WebSocketEventData) => {
      try {
        console.log("👤 primary_lecturer_joined event:", data);
        if (data.supervisors && data.supervisors.length > 0) {
          const primary = data.supervisors.find(
            (s) => s.role === "primary_lecturer"
          );
          if (primary) {
            console.log(
              "✅ Primary lecturer is online (just joined):",
              primary.name
            );
            if (!userOnlineMap.some((u) => u.id === primary.id)) {
              userOnlineMap.push({
                id: primary.id,
                role: primary.role,
                name: primary.name,
                event: "primary_lecturer_joined",
              });
              addOnlineParticipant(primary.id);
              showToast(`${primary.name} telah bergabung ke sesi.`, "info");
            } else {
              console.log("No primary supervisor found in userOnlineMap");
            }
          } else {
            console.log("No primary supervisor found in data.supervisors");
          }
        } else {
          console.log("primary lecturer not joined the session (not found)");
        }
      } catch (err) {
        console.log("Error handling event primary_lecturer_joined:", err);
      }
    });

    // ============================================
    // Event: secondary_lecturer_joined
    // Secondary supervisor joined
    // Recipients: Student & Primary Supervisor
    // ============================================
    on("secondary_lecturer_joined", (data: WebSocketEventData) => {
      try {
        console.log("👤 secondary_lecturer_joined event:", data);
        if (data.supervisors && data.supervisors.length > 0) {
          const secondary = data.supervisors.find(
            (s) => s.role === "secondary_lecturer"
          );
          if (secondary) {
            console.log(
              "✅ Secondary lecturer is online (just joined):",
              secondary.name
            );
            if (!userOnlineMap.some((u) => u.id === secondary.id)) {
              userOnlineMap.push({
                id: secondary.id,
                role: secondary.role,
                name: secondary.name,
                event: "secondary_lecturer_joined",
              });
              addOnlineParticipant(secondary.id);
              showToast(`${secondary.name} telah bergabung ke sesi.`, "info");
            } else {
              console.log("No secondary supervisor found in userOnlineMap");
            }
          } else {
            console.log("No secondary supervisor found in data.supervisors");
          }
        } else {
          console.log("secondary lecturer not joined the session (not found)");
        }
      } catch (err) {
        console.log("Error handling event secondary_lecturer_joined:", err);
      }
    });

    // ============================================
    // Event: student_joined
    // Student joined (when supervisor started)
    // Recipients: Supervisors
    // ============================================
    on("student_joined", (data: WebSocketEventData) => {
      try {
        console.log("👤 student_joined event:", data);
        if (data.student_id) {
          console.log("✅ Student is online (just joined):", data.student_name);
          if (!userOnlineMap.some((u) => u.id === data.student_id)) {
            userOnlineMap.push({
              id: data.student_id,
              role: "student",
              name: data.student_name || "Unknown",
              event: "student_joined",
            });
            addOnlineParticipant(data.student_id);
            showToast(`${data.student_name} telah bergabung ke sesi.`, "info");
          } else {
            console.log("No student found in userOnlineMap");
          }
        } else {
          console.log("No student found in data.supervisors");
        }
      } catch (err) {
        console.log("Error handling event student_joined:", err);
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
        is_text: data.is_text || true,
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
    on("primary_lecturer_leaved", () => handleUserLeave("primary_lecturer"));

    // ============================================
    // Event: secondary_lecturer_leaved
    // Secondary supervisor left
    // Recipients: Student & Primary
    // ============================================
    on("secondary_lecturer_leaved", () =>
      handleUserLeave("secondary_lecturer")
    );

    // ============================================
    // Event: student_leaved
    // Student left
    // Recipients: Supervisors
    // ============================================
    on("student_leaved", () => handleUserLeave("student"));

    // ============================================
    // Event: user_ended
    // Session ended by owner
    // Recipients: All participants
    // ============================================
    on("user_ended", (data: WebSocketEventData) => {
      try {
        console.log("🔚 user_ended event:", data);
        const userOwner = userOnlineMap.find(
          (u) => u.event === "session_started"
        );
        if (userOwner) {
          console.log("❌ User ended:", userOwner.id);
          // empty online participant
          userOnlineMap.forEach((u) => {
            removeOnlineParticipant(u.id);
          });
          // empty userOnlineMap
          userOnlineMap = [];
          showToast(`${userOwner.name} telah meninggalkan sesi.`, "warning");
        } else {
          console.log("No user owner found in userOnlineMap");
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err) {
        console.log("Error handling event user_ended:", err);
      }
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
