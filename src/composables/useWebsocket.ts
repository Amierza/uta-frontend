import { ref, onUnmounted } from "vue";

// Singleton WebSocket instance
let wsInstance: WebSocket | null = null;
let reconnectTimeout: number | null = null;

export function useWebSocket() {
  const isConnected = ref(false);
  const notifications = ref<any[]>([]);
  const latestMessage = ref<any>(null);

  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
  const RECONNECT_DELAY = 3000;

  // Connect to WebSocket
  const connect = (token: string) => {
    // If already connected, don't create new connection
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      isConnected.value = true;
      return wsInstance;
    }

    try {
      wsInstance = new WebSocket(`${WS_URL}?token=${token}`);

      wsInstance.onopen = () => {
        console.log("✅ WebSocket connected");
        isConnected.value = true;

        // Clear reconnect timeout if exists
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      wsInstance.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", message);

          latestMessage.value = message;

          // Handle different message types
          if (message.type === "notification") {
            notifications.value.unshift(message.data);
          } else if (message.type === "session_joined") {
            // Session joined notification
            console.log("👥 Someone joined the session:", message.data);
          } else if (message.type === "session_updated") {
            // Session updated notification
            console.log("🔄 Session updated:", message.data);
          } else if (message.type === "online_status") {
            // Online status update
            console.log("🟢 Online status update:", message.data);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      wsInstance.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        isConnected.value = false;
      };

      wsInstance.onclose = () => {
        console.log("🔌 WebSocket connection closed");
        isConnected.value = false;
        wsInstance = null;

        // Auto-reconnect after delay
        const token = localStorage.getItem("access_token");
        if (token) {
          console.log(`🔄 Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
          reconnectTimeout = window.setTimeout(() => {
            connect(token);
          }, RECONNECT_DELAY);
        }
      };

      return wsInstance;
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      isConnected.value = false;
      return null;
    }
  };

  // Disconnect WebSocket
  const disconnect = () => {
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    isConnected.value = false;
  };

  // Send message through WebSocket
  const send = (message: any) => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(message));
      return true;
    } else {
      console.error("WebSocket is not connected");
      return false;
    }
  };

  // Subscribe to a channel
  const subscribe = (channel: string) => {
    return send({
      type: "subscribe",
      channel: channel,
    });
  };

  // Unsubscribe from a channel
  const unsubscribe = (channel: string) => {
    return send({
      type: "unsubscribe",
      channel: channel,
    });
  };

  // Get WebSocket instance
  const getInstance = () => wsInstance;

  // Cleanup on component unmount
  onUnmounted(() => {
    // Don't disconnect on component unmount, keep connection alive
    // Only disconnect on explicit logout
  });

  return {
    isConnected,
    notifications,
    latestMessage,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    getInstance,
  };
}
