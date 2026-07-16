"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { meApi } from "@/lib/api/auth";
import { CHAT_SUMMARY_QUERY_KEY } from "@/lib/chat/query-keys";

const PULSE_MS = 120_000;

/**
 * Single background Nest poll: badge counts + presence heartbeat.
 * Seeds existing React Query keys so Home badges stay shared.
 * Slower fallback while ChatRealtimeHost owns live updates.
 */
export function AppPulseHost() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const enabled = status === "authenticated" && Boolean(accessToken);
  const tokenKey = accessToken ?? "anon";

  const { data } = useQuery({
    queryKey: ["me", "pulse", tokenKey],
    enabled,
    queryFn: () => meApi.pulse(accessToken),
    refetchInterval: PULSE_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!data || !accessToken) return;
    queryClient.setQueryData(
      ["notifications", "unread-count", tokenKey],
      data.notificationsUnread,
    );
    queryClient.setQueryData(
      [...CHAT_SUMMARY_QUERY_KEY, tokenKey],
      data.chatUnreadTotal,
    );
    queryClient.setQueryData(
      ["social", "friend-requests", "incoming", tokenKey],
      data.friendRequestsIncoming,
    );
  }, [data, accessToken, tokenKey, queryClient]);

  return null;
}
