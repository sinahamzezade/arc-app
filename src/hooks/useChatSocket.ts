"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getWsBase, getWsPath } from "@/lib/api/ws";
import type { ChatMessageDto, ChatMessageType } from "@/lib/api/chat";

type UnreadHandler = (unreadTotal: number) => void;
type MessageHandler = (msg: ChatMessageDto) => void;
type ReadHandler = (payload: {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
}) => void;
type TypingHandler = (payload: {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}) => void;
type PresenceHandler = (payload: {
  userId: string;
  status: "online" | "offline";
  lastSeen: string;
}) => void;
type DeliveredHandler = (payload: {
  messageId: string;
  conversationId: string;
  userId: string;
}) => void;

type GlobalOpts = {
  enabled?: boolean;
};

/** Lightweight global socket for header unread badge. */
export function useChatSocketGlobal({ enabled = true }: GlobalOpts = {}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const unreadHandlers = useRef(new Set<UnreadHandler>());

  useEffect(() => {
    if (!enabled || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(`${getWsBase()}/chat`, {
      auth: { token },
      path: getWsPath(),
      transports: ["polling", "websocket"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("unread.changed", (payload: { unreadTotal?: number }) => {
      if (typeof payload?.unreadTotal === "number") {
        for (const h of unreadHandlers.current) h(payload.unreadTotal);
      }
    });

    const heartbeat = window.setInterval(() => {
      if (socket.connected) socket.emit("presence.heartbeat");
    }, 45_000);

    return () => {
      window.clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, token]);

  const onUnreadChanged = useCallback((handler: UnreadHandler) => {
    unreadHandlers.current.add(handler);
    return () => {
      unreadHandlers.current.delete(handler);
    };
  }, []);

  return { connected, onUnreadChanged };
}

type ConversationOpts = {
  conversationId: string | null;
  enabled?: boolean;
  onMessage?: MessageHandler;
  onRead?: ReadHandler;
  onTyping?: TypingHandler;
  onPresence?: PresenceHandler;
  onDelivered?: DeliveredHandler;
  onUnreadChanged?: UnreadHandler;
};

export function useChatSocket({
  conversationId,
  enabled = true,
  onMessage,
  onRead,
  onTyping,
  onPresence,
  onDelivered,
  onUnreadChanged,
}: ConversationOpts) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlers = useRef({
    onMessage,
    onRead,
    onTyping,
    onPresence,
    onDelivered,
    onUnreadChanged,
  });
  handlers.current = {
    onMessage,
    onRead,
    onTyping,
    onPresence,
    onDelivered,
    onUnreadChanged,
  };

  useEffect(() => {
    if (!enabled || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(`${getWsBase()}/chat`, {
      auth: { token },
      path: getWsPath(),
      transports: ["polling", "websocket"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("message.new", (msg: ChatMessageDto) => {
      if (
        conversationId &&
        msg.conversationId !== conversationId
      ) {
        return;
      }
      handlers.current.onMessage?.(msg);
    });
    socket.on("message.read", (payload: Parameters<ReadHandler>[0]) => {
      if (conversationId && payload.conversationId !== conversationId) return;
      handlers.current.onRead?.(payload);
    });
    socket.on("typing", (payload: Parameters<TypingHandler>[0]) => {
      if (conversationId && payload.conversationId !== conversationId) return;
      handlers.current.onTyping?.(payload);
    });
    socket.on("presence", (payload: Parameters<PresenceHandler>[0]) => {
      handlers.current.onPresence?.(payload);
    });
    socket.on("message.delivered", (payload: Parameters<DeliveredHandler>[0]) => {
      handlers.current.onDelivered?.(payload);
    });
    socket.on("unread.changed", (payload: { unreadTotal?: number }) => {
      if (typeof payload?.unreadTotal === "number") {
        handlers.current.onUnreadChanged?.(payload.unreadTotal);
      }
    });

    const heartbeat = window.setInterval(() => {
      if (socket.connected) socket.emit("presence.heartbeat");
    }, 45_000);

    return () => {
      window.clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, token, conversationId]);

  const emitSend = useCallback(
    (payload: {
      conversationId: string;
      clientMsgId: string;
      type: ChatMessageType;
      body?: string;
      attachmentId?: string;
      replyToId?: string;
    }) =>
      new Promise<ChatMessageDto | null>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve(null);
          return;
        }
        socket.emit("message.send", payload, (res: unknown) => {
          if (!res || typeof res !== "object") {
            resolve(null);
            return;
          }
          const obj = res as {
            ok?: boolean;
            message?: ChatMessageDto;
            error?: string;
          };
          resolve(obj.ok && obj.message ? obj.message : null);
        });
      }),
    [],
  );

  const emitRead = useCallback(
    (conversationId: string, lastReadMessageId: string) => {
      socketRef.current?.emit("message.read", {
        conversationId,
        lastReadMessageId,
      });
    },
    [],
  );

  const emitTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing.start", { conversationId });
  }, []);

  const emitTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing.stop", { conversationId });
  }, []);

  return {
    connected,
    emitSend,
    emitRead,
    emitTypingStart,
    emitTypingStop,
  };
}
