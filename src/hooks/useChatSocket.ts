"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { ChatMessageDto, ChatMessageType } from "@/lib/api/chat";
import {
  getChatRealtimeConnected,
  getChatSocket,
  subscribeChatRealtimeConnected,
  subscribeChatSocket,
} from "@/lib/chat/realtime-bus";

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
type KeysRekeyedHandler = (payload: {
  conversationId: string;
  byUserId: string;
}) => void;

type GlobalOpts = {
  enabled?: boolean;
};

/**
 * Lightweight unread badge hook — uses shared ChatRealtimeHost socket.
 * (Do not open a second /chat connection; that masked disconnect bugs.)
 */
export function useChatSocketGlobal({ enabled = true }: GlobalOpts = {}) {
  const [connected, setConnected] = useState(getChatRealtimeConnected);
  const socketRef = useRef<Socket | null>(getChatSocket());
  const unreadHandlers = useRef(new Set<UnreadHandler>());

  useEffect(() => {
    if (!enabled) {
      socketRef.current = null;
      setConnected(false);
      return;
    }
    const unsubSock = subscribeChatSocket((socket) => {
      socketRef.current = socket;
    });
    const unsubConn = subscribeChatRealtimeConnected(setConnected);
    return () => {
      unsubSock();
      unsubConn();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const socket = getChatSocket();
    if (!socket) return;
    const onUnread = (payload: { unreadTotal?: number }) => {
      if (typeof payload?.unreadTotal === "number") {
        for (const h of unreadHandlers.current) h(payload.unreadTotal);
      }
    };
    socket.on("unread.changed", onUnread);
    return () => {
      socket.off("unread.changed", onUnread);
    };
  }, [enabled, connected]);

  const onUnreadChanged = useCallback((handler: UnreadHandler) => {
    unreadHandlers.current.add(handler);
    return () => {
      unreadHandlers.current.delete(handler);
    };
  }, []);

  return { connected, socket: socketRef.current, socketRef, onUnreadChanged };
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
  onKeysRekeyed?: KeysRekeyedHandler;
};

/**
 * Thread socket helpers on the shared app-wide /chat connection.
 */
export function useChatSocket({
  conversationId,
  enabled = true,
  onMessage,
  onRead,
  onTyping,
  onPresence,
  onDelivered,
  onUnreadChanged,
  onKeysRekeyed,
}: ConversationOpts) {
  const [connected, setConnected] = useState(getChatRealtimeConnected);
  const socketRef = useRef<Socket | null>(getChatSocket());
  const handlers = useRef({
    onMessage,
    onRead,
    onTyping,
    onPresence,
    onDelivered,
    onUnreadChanged,
    onKeysRekeyed,
  });
  handlers.current = {
    onMessage,
    onRead,
    onTyping,
    onPresence,
    onDelivered,
    onUnreadChanged,
    onKeysRekeyed,
  };
  const joinedConvRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      socketRef.current = null;
      setConnected(false);
      return;
    }
    const unsubSock = subscribeChatSocket((socket) => {
      socketRef.current = socket;
    });
    const unsubConn = subscribeChatRealtimeConnected(setConnected);
    return () => {
      unsubSock();
      unsubConn();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let activeSocket: Socket | null = null;

    const detach = (socket: Socket) => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message.new", onMessageNew);
      socket.off("message.read", onMessageRead);
      socket.off("typing", onTypingEv);
      socket.off("presence", onPresenceEv);
      socket.off("message.delivered", onDeliveredEv);
      socket.off("unread.changed", onUnread);
      socket.off("keys.rekeyed", onKeysRekeyedEv);
    };

    const leaveJoined = (socket: Socket) => {
      const prev = joinedConvRef.current;
      if (prev && socket.connected) {
        socket.emit("conversation.leave", { conversationId: prev });
      }
      joinedConvRef.current = null;
    };

    const join = (socket: Socket) => {
      if (!conversationId || !socket.connected) return;
      if (joinedConvRef.current === conversationId) return;
      if (joinedConvRef.current && joinedConvRef.current !== conversationId) {
        socket.emit("conversation.leave", {
          conversationId: joinedConvRef.current,
        });
      }
      socket.emit("conversation.join", { conversationId });
      joinedConvRef.current = conversationId;
    };

    const onConnect = () => {
      setConnected(true);
      if (activeSocket) join(activeSocket);
    };
    const onDisconnect = () => {
      setConnected(false);
      joinedConvRef.current = null;
    };

    const onMessageNew = (msg: ChatMessageDto) => {
      if (conversationId && msg.conversationId !== conversationId) return;
      handlers.current.onMessage?.(msg);
    };
    const onMessageRead = (payload: Parameters<ReadHandler>[0]) => {
      if (conversationId && payload.conversationId !== conversationId) return;
      handlers.current.onRead?.(payload);
    };
    const onTypingEv = (payload: Parameters<TypingHandler>[0]) => {
      if (conversationId && payload.conversationId !== conversationId) return;
      handlers.current.onTyping?.(payload);
    };
    const onPresenceEv = (payload: Parameters<PresenceHandler>[0]) => {
      handlers.current.onPresence?.(payload);
    };
    const onDeliveredEv = (payload: Parameters<DeliveredHandler>[0]) => {
      handlers.current.onDelivered?.(payload);
    };
    const onUnread = (payload: { unreadTotal?: number }) => {
      if (typeof payload?.unreadTotal === "number") {
        handlers.current.onUnreadChanged?.(payload.unreadTotal);
      }
    };
    const onKeysRekeyedEv = (payload: {
      conversationId?: string;
      byUserId?: string;
    }) => {
      if (!payload?.conversationId) return;
      if (conversationId && payload.conversationId !== conversationId) return;
      handlers.current.onKeysRekeyed?.({
        conversationId: payload.conversationId,
        byUserId: payload.byUserId ?? "",
      });
    };

    const attach = (socket: Socket | null) => {
      if (activeSocket) {
        leaveJoined(activeSocket);
        detach(activeSocket);
        activeSocket = null;
      }
      if (!socket) return;
      activeSocket = socket;
      socketRef.current = socket;
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("message.new", onMessageNew);
      socket.on("message.read", onMessageRead);
      socket.on("typing", onTypingEv);
      socket.on("presence", onPresenceEv);
      socket.on("message.delivered", onDeliveredEv);
      socket.on("unread.changed", onUnread);
      socket.on("keys.rekeyed", onKeysRekeyedEv);
      if (socket.connected) {
        setConnected(true);
        join(socket);
      }
    };

    const unsubSock = subscribeChatSocket(attach);

    return () => {
      unsubSock();
      if (activeSocket) {
        leaveJoined(activeSocket);
        detach(activeSocket);
      }
    };
  }, [enabled, conversationId]);

  const emitSend = useCallback(
    (payload: {
      conversationId: string;
      clientMsgId: string;
      type: ChatMessageType;
      body?: string;
      attachmentId?: string;
      replyToId?: string;
      durationMs?: number;
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
    (convId: string, lastReadMessageId: string) => {
      socketRef.current?.emit("message.read", {
        conversationId: convId,
        lastReadMessageId,
      });
    },
    [],
  );

  const emitTypingStart = useCallback((convId: string) => {
    socketRef.current?.emit("typing.start", { conversationId: convId });
  }, []);

  const emitTypingStop = useCallback((convId: string) => {
    socketRef.current?.emit("typing.stop", { conversationId: convId });
  }, []);

  return {
    connected,
    socket: socketRef.current,
    socketRef,
    emitSend,
    emitRead,
    emitTypingStart,
    emitTypingStop,
  };
}
