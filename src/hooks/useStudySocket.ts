"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getWsBase } from "@/lib/api/ws";
import type { StudyMessageDto, StudySessionDto, StudyStepDto } from "@/lib/api/study";

type UseStudySocketOpts = {
  sessionId: string | null;
  enabled?: boolean;
  onState?: (state: StudySessionDto) => void;
  onStep?: (step: StudyStepDto) => void;
  onMessage?: (msg: StudyMessageDto) => void;
  onPartnerTyping?: (userId: string) => void;
  onPartnerPresence?: (payload: { online: boolean; userId?: string }) => void;
};

export function useStudySocket({
  sessionId,
  enabled = true,
  onState,
  onStep,
  onMessage,
  onPartnerTyping,
  onPartnerPresence,
}: UseStudySocketOpts) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Callbacks live in refs so inline handlers don't tear down the socket
  // on every render (reconnect loop breaks chat/step delivery).
  const handlersRef = useRef({
    onState,
    onStep,
    onMessage,
    onPartnerTyping,
    onPartnerPresence,
  });
  useEffect(() => {
    handlersRef.current = {
      onState,
      onStep,
      onMessage,
      onPartnerTyping,
      onPartnerPresence,
    };
  });

  const emitHeartbeat = useCallback(
    (payload?: { appVisible?: boolean; focusActive?: boolean }) => {
      if (!sessionId || !socketRef.current?.connected) return;
      socketRef.current.emit("heartbeat", {
        sessionId,
        appVisible: payload?.appVisible ?? true,
        focusActive: payload?.focusActive ?? true,
      });
    },
    [sessionId],
  );

  const emitAckRead = useCallback(
    (soloAdvance?: boolean) => {
      if (!sessionId || !socketRef.current?.connected) return Promise.resolve(null);
      return new Promise<unknown>((resolve) => {
        socketRef.current?.emit(
          "ack_read",
          { sessionId, soloAdvance },
          (res: unknown) => resolve(res),
        );
      });
    },
    [sessionId],
  );

  const emitChatSend = useCallback(
    (body: string) => {
      if (!sessionId || !socketRef.current?.connected) return Promise.resolve(null);
      return new Promise<StudyMessageDto | null>((resolve) => {
        socketRef.current?.emit(
          "chat:send",
          { sessionId, body },
          (res: StudyMessageDto | { error?: string }) => {
            if (res && "id" in res) resolve(res);
            else resolve(null);
          },
        );
      });
    },
    [sessionId],
  );

  const emitTyping = useCallback(() => {
    if (!sessionId || !socketRef.current?.connected) return;
    socketRef.current.emit("typing", { sessionId });
  }, [sessionId]);

  useEffect(() => {
    const token = session?.accessToken;
    if (!enabled || !sessionId || !token) {
      setConnected(false);
      return;
    }

    const socket = io(`${getWsBase()}/study`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { sessionId }, () => undefined);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("state", (state: StudySessionDto) =>
      handlersRef.current.onState?.(state),
    );
    socket.on("step", (step: StudyStepDto) =>
      handlersRef.current.onStep?.(step),
    );
    socket.on("chat:message", (msg: StudyMessageDto) =>
      handlersRef.current.onMessage?.(msg),
    );
    socket.on("partner_typing", (p: { userId: string }) =>
      handlersRef.current.onPartnerTyping?.(p.userId),
    );
    socket.on("partner_presence", (p: { online: boolean; userId?: string }) =>
      handlersRef.current.onPartnerPresence?.(p),
    );

    return () => {
      socket.emit("leave", { sessionId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, sessionId, session?.accessToken]);

  return {
    connected,
    emitHeartbeat,
    emitAckRead,
    emitChatSend,
    emitTyping,
  };
}
