import { useEffect, useRef, useCallback } from "react";
import { getWsUrl } from "@/api/client";

export interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
  queueId?: number;
}

interface UseWebSocketOptions {
  queueId: number;
  onMessage: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function useWebSocket({
  queueId,
  onMessage,
  onConnect,
  onDisconnect,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${getWsUrl()}/ws?queueId=${queueId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        onMessage(message);
      } catch (error) {
        console.error("Failed to parse WS message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      onDisconnect?.();
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  }, [queueId, onMessage, onConnect, onDisconnect]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    // Ping every 25 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect, enabled]);

  return wsRef;
}
