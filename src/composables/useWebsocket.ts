import { ref, onUnmounted } from "vue";

let wsInstance: WebSocket | null = null;
let reconnectTimeout: number | null = null;
let isConnecting = false;

// Centralized event listeners
const eventListeners: Map<string, Set<Function>> = new Map();

export function useWebSocket() {
  const isConnected = ref(false);
  const latestMessage = ref<any>(null);

  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
  const RECONNECT_DELAY = 3000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  let reconnectAttempts = 0;

  const connect = (token: string) => {
    // Jika sudah connected dan OPEN, return langsung
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      console.log("✅ WebSocket already connected");
      isConnected.value = true;
      return wsInstance;
    }

    // Jika sedang connecting, jangan create koneksi baru
    if (isConnecting) {
      console.log("⏳ WebSocket connection in progress...");
      return null;
    }

    // Jika sudah exist tapi bukan OPEN (CONNECTING, CLOSING, CLOSED)
    // Close dulu sebelum create baru
    if (wsInstance && wsInstance.readyState !== WebSocket.OPEN) {
      try {
        wsInstance.close();
      } catch (e) {
        console.warn("Error closing old WebSocket:", e);
      }
      wsInstance = null;
    }

    isConnecting = true;

    try {
      console.log(`🔌 Connecting to WebSocket: ${WS_URL}`);
      wsInstance = new WebSocket(`${WS_URL}?token=${token}`);

      wsInstance.onopen = () => {
        console.log("✅ WebSocket connected successfully");
        isConnected.value = true;
        isConnecting = false;
        reconnectAttempts = 0;

        // Clear any pending reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      wsInstance.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📨 WebSocket message:", message.event, message);

          latestMessage.value = message;

          // Trigger event listeners
          triggerEventListeners(message.event || message.type, message);
        } catch (err) {
          console.error("❌ Error parsing WebSocket message:", err);
        }
      };

      wsInstance.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        isConnected.value = false;
        isConnecting = false;
      };

      wsInstance.onclose = () => {
        console.log("🔌 WebSocket connection closed");
        isConnected.value = false;
        isConnecting = false;
        wsInstance = null;

        // Auto-reconnect dengan exponential backoff
        const token = localStorage.getItem("access_token");
        if (token && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);
          console.log(
            `🔄 Reconnecting in ${
              delay / 1000
            }s... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
          );
          reconnectTimeout = window.setTimeout(() => {
            connect(token);
          }, delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error("❌ Max reconnection attempts reached");
        }
      };

      return wsInstance;
    } catch (err) {
      console.error("❌ Failed to create WebSocket connection:", err);
      isConnected.value = false;
      isConnecting = false;
      return null;
    }
  };

  const disconnect = () => {
    console.log("🛑 Disconnecting WebSocket...");
    if (wsInstance) {
      try {
        wsInstance.close();
      } catch (e) {
        console.warn("Error closing WebSocket:", e);
      }
      wsInstance = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    isConnected.value = false;
    isConnecting = false;
    reconnectAttempts = 0;
  };

  const send = (message: any) => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(message));
      return true;
    } else {
      console.error(
        "❌ WebSocket is not connected, state:",
        wsInstance?.readyState
      );
      return false;
    }
  };

  const on = (eventName: string, callback: Function) => {
    if (!eventListeners.has(eventName)) {
      eventListeners.set(eventName, new Set());
    }
    eventListeners.get(eventName)!.add(callback);

    console.log(
      `👂 Listener registered for event: ${eventName}`,
      `(Total: ${eventListeners.get(eventName)!.size})`
    );

    // Return unsubscribe function
    return () => {
      const listeners = eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
        console.log(`🔇 Listener unregistered for event: ${eventName}`);
      }
    };
  };

  const off = (eventName: string, callback?: Function) => {
    if (!callback) {
      eventListeners.delete(eventName);
      console.log(`🔇 All listeners removed for event: ${eventName}`);
    } else {
      const listeners = eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
      }
    }
  };

  // Trigger all listeners untuk sebuah event
  const triggerEventListeners = (eventName: string, data: any) => {
    const listeners = eventListeners.get(eventName);
    if (listeners) {
      console.log(
        `🔥 Triggering ${listeners.size} listener(s) for event: ${eventName}`
      );
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`❌ Error in event listener for ${eventName}:`, err);
        }
      });
    } else {
      console.warn(`⚠️ No listeners found for event: ${eventName}`);
    }
  };

  const getInstance = () => wsInstance;

  onUnmounted(() => {
    // Don't disconnect on component unmount
  });

  return {
    isConnected,
    latestMessage,
    connect,
    disconnect,
    send,
    on,
    off,
    getInstance,
  };
}
