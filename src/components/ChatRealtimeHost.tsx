"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getWsBase, getWsPath } from "@/lib/api/ws";
import type { NotificationDto } from "@/lib/api/types";
import { CHAT_SUMMARY_QUERY_KEY } from "@/lib/chat/query-keys";
import {
  publishChatRealtimeConnected,
  publishChatSocket,
  publishChatUnreadChanged,
  publishNotificationNew,
} from "@/lib/chat/realtime-bus";

const HEARTBEAT_MS = 45_000;

/**
 * App-wide /chat socket: notification.new, unread.changed, presence heartbeat.
 * Single connection so badges/toasts work on every screen.
 */
export function ChatRealtimeHost() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const socketRef = useRef<Socket | null>(null);
  const enabled = status === "authenticated" && Boolean(accessToken);
  const tokenKey = accessToken ?? "anon";

  useEffect(() => {
    if (!enabled || !accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      publishChatSocket(null);
      publishChatRealtimeConnected(false);
      return;
    }

    const qc = queryClientRef.current;
    const socket = io(`${getWsBase()}/chat`, {
      auth: { token: accessToken },
      path: getWsPath(),
      transports: ["polling", "websocket"],
      autoConnect: true,
    });
    socketRef.current = socket;
    publishChatSocket(socket);

    const onConnect = () => publishChatRealtimeConnected(true);
    const onDisconnect = () => publishChatRealtimeConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) onConnect();

    socket.on(
      "notification.new",
      (payload: {
        notification?: NotificationDto;
        unreadCount?: number;
      }) => {
        if (typeof payload?.unreadCount === "number") {
          qc.setQueryData(
            ["notifications", "unread-count", tokenKey],
            payload.unreadCount,
          );
        }
        if (payload?.notification) {
          publishNotificationNew({
            notification: payload.notification,
            unreadCount:
              typeof payload.unreadCount === "number"
                ? payload.unreadCount
                : 0,
          });
          void qc.invalidateQueries({
            queryKey: ["notifications"],
          });
        }
      },
    );

    socket.on(
      "notification.unread",
      (payload: { unreadCount?: number }) => {
        if (typeof payload?.unreadCount !== "number") return;
        qc.setQueryData(
          ["notifications", "unread-count", tokenKey],
          payload.unreadCount,
        );
      },
    );

    socket.on("unread.changed", (payload: { unreadTotal?: number }) => {
      if (typeof payload?.unreadTotal !== "number") return;
      qc.setQueryData(
        [...CHAT_SUMMARY_QUERY_KEY, tokenKey],
        payload.unreadTotal,
      );
      publishChatUnreadChanged(payload.unreadTotal);
    });

    void import("@/lib/chat/e2e")
      .then(({ ensureIdentityPublished, setE2eUserId }) => {
        const uid = session?.user?.id ?? null;
        setE2eUserId(uid);
        return ensureIdentityPublished(accessToken, uid);
      })
      .catch(() => undefined);

    const heartbeat = window.setInterval(() => {
      if (socket.connected) socket.emit("presence.heartbeat");
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
      publishChatSocket(null);
      publishChatRealtimeConnected(false);
    };
  }, [enabled, accessToken, tokenKey, session?.user?.id]);

  return null;
}
