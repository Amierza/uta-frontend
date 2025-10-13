import { ref, onUnmounted } from "vue";

// Singleton WebSocket instance
let wsInstance: WebSocket | null = null;
let reconnectTimeout: number | null = null;

// Event listeners registry
const eventListeners: Map<string, Set<Function>> = new Map();

export function useWebSocket() {
  const isConnected = ref(false);
  const latestMessage = ref<any>(null);

  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
  const RECONNECT_DELAY = 3000;

  // Connect to WebSocket
  const connect = (token: string) => {
    // If already connected, don't create new connection
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      console.log("✅ WebSocket already connected");
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

          // Trigger event listeners
          triggerEventListeners(message.event, message);
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
    eventListeners.clear();
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

  // Register event listener
  const on = (eventName: string, callback: Function) => {
    if (!eventListeners.has(eventName)) {
      eventListeners.set(eventName, new Set());
    }
    eventListeners.get(eventName)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  };

  // Trigger event listeners
  const triggerEventListeners = (eventName: string, data: any) => {
    const listeners = eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in event listener for ${eventName}:`, err);
        }
      });
    }
  };

  // Remove event listener
  const off = (eventName: string, callback?: Function) => {
    if (!callback) {
      // Remove all listeners for this event
      eventListeners.delete(eventName);
    } else {
      // Remove specific listener
      const listeners = eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
      }
    }
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
    latestMessage,
    connect,
    disconnect,
    send,
    on,
    off,
    getInstance,
  };
}
