"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getWsBase } from "@/lib/api/ws";
import type {
  StudyMessageDto,
  StudySessionDto,
  StudyStepDto,
} from "@/lib/api/study";

type UseStudySocketOpts = {
  sessionId: string | null;
  enabled?: boolean;
  onState?: (state: StudySessionDto) => void;
  onStep?: (step: StudyStepDto) => void;
  onMessage?: (msg: StudyMessageDto) => void;
  onPartnerTyping?: (userId: string) => void;
  onPartnerPresence?: (payload: { online: boolean; userId?: string }) => void;
  /** Fired when server says room state changed (re-fetch personalized DTO). */
  onStateDirty?: () => void;
};

function asMessage(res: unknown): StudyMessageDto | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;
  const data =
    obj.data && typeof obj.data === "object"
      ? (obj.data as Record<string, unknown>)
      : obj;
  if (typeof data.id === "string" && typeof data.body === "string") {
    return data as unknown as StudyMessageDto;
  }
  return null;
}

function joinOk(res: unknown): boolean {
  if (res == null) return false;
  if (typeof res !== "object") return false;
  const obj = res as Record<string, unknown>;
  if (obj.error) return false;
  if (obj.ok === true) return true;
  // Nest may wrap: { data: { ok: true } }
  if (obj.data && typeof obj.data === "object") {
    const inner = obj.data as Record<string, unknown>;
    if (inner.error) return false;
    if (inner.ok === true) return true;
  }
  return false;
}

export function useStudySocket({
  sessionId,
  enabled = true,
  onState,
  onStep,
  onMessage,
  onPartnerTyping,
  onPartnerPresence,
  onStateDirty,
}: UseStudySocketOpts) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const handlersRef = useRef({
    onState,
    onStep,
    onMessage,
    onPartnerTyping,
    onPartnerPresence,
    onStateDirty,
  });
  useEffect(() => {
    handlersRef.current = {
      onState,
      onStep,
      onMessage,
      onPartnerTyping,
      onPartnerPresence,
      onStateDirty,
    };
  });

  const emitHeartbeat = useCallback(
    (payload?: { appVisible?: boolean; focusActive?: boolean }) => {
      if (!sessionId || !socketRef.current?.connected || !joined) return;
      socketRef.current.emit(
        "heartbeat",
        {
          sessionId,
          appVisible: payload?.appVisible ?? true,
          focusActive: payload?.focusActive ?? true,
        },
        (state: StudySessionDto | { error?: string } | undefined) => {
          if (state && typeof state === "object" && "id" in state) {
            handlersRef.current.onState?.(state as StudySessionDto);
          }
        },
      );
    },
    [sessionId, joined],
  );

  const emitAckRead = useCallback(
    (soloAdvance?: boolean) => {
      if (!sessionId || !socketRef.current?.connected || !joined)
        return Promise.resolve(null);
      return new Promise<unknown>((resolve) => {
        socketRef.current?.emit(
          "ack_read",
          { sessionId, soloAdvance },
          (res: unknown) => resolve(res),
        );
      });
    },
    [sessionId, joined],
  );

  const emitChatSend = useCallback(
    (body: string) => {
      if (!sessionId || !socketRef.current?.connected || !joined)
        return Promise.resolve(null);
      return new Promise<StudyMessageDto | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), 4000);
        socketRef.current?.emit(
          "chat:send",
          { sessionId, body },
          (res: unknown) => {
            clearTimeout(timer);
            resolve(asMessage(res));
          },
        );
      });
    },
    [sessionId, joined],
  );

  const emitTyping = useCallback(() => {
    if (!sessionId || !socketRef.current?.connected || !joined) return;
    socketRef.current.emit("typing", { sessionId });
  }, [sessionId, joined]);

  useEffect(() => {
    const token = session?.accessToken;
    if (!enabled || !sessionId || !token) {
      setConnected(false);
      setJoined(false);
      return;
    }

    const wsBase = getWsBase();
    const socket = io(`${wsBase}/study`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 800,
    });
    socketRef.current = socket;

    let joinAttempt = 0;
    let joinTimer: ReturnType<typeof setTimeout> | null = null;

    const joinRoom = () => {
      if (!socket.connected) return;
      socket.emit("join", { sessionId }, (res: unknown) => {
        if (joinOk(res)) {
          setJoined(true);
          joinAttempt = 0;
          return;
        }
        setJoined(false);
        if (joinAttempt < 8) {
          joinAttempt += 1;
          joinTimer = setTimeout(joinRoom, 200 * joinAttempt);
        }
      });
    };

    socket.on("connect", () => {
      setConnected(true);
      joinAttempt = 0;
      joinRoom();
    });
    socket.on("disconnect", () => {
      setConnected(false);
      setJoined(false);
    });
    socket.on("connect_error", () => {
      setConnected(false);
      setJoined(false);
    });
    socket.on("state", (state: StudySessionDto) =>
      handlersRef.current.onState?.(state),
    );
    socket.on("state_dirty", () => handlersRef.current.onStateDirty?.());
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
      if (joinTimer) clearTimeout(joinTimer);
      socket.emit("leave", { sessionId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setJoined(false);
    };
  }, [enabled, sessionId, session?.accessToken]);

  return {
    connected: connected && joined,
    emitHeartbeat,
    emitAckRead,
    emitChatSend,
    emitTyping,
  };
}
