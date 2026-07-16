"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { chatApi } from "@/lib/api/chat";
import { CHAT_SUMMARY_QUERY_KEY } from "@/lib/chat/query-keys";
import {
  getChatRealtimeConnected,
  subscribeChatRealtimeConnected,
  subscribeChatUnreadChanged,
} from "@/lib/chat/realtime-bus";

export { CHAT_SUMMARY_QUERY_KEY } from "@/lib/chat/query-keys";

/**
 * Chat unread badge. Seeded by AppPulseHost + ChatRealtimeHost (WS).
 * No private global socket — shared host owns the connection.
 */
export function useUnreadChatCount() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const tokenKey = accessToken ?? "anon";
  const [connected, setConnected] = useState(getChatRealtimeConnected);

  const query = useQuery({
    queryKey: [...CHAT_SUMMARY_QUERY_KEY, tokenKey],
    enabled: false,
    queryFn: async () => 0,
  });

  useEffect(() => {
    return subscribeChatRealtimeConnected(setConnected);
  }, []);

  useEffect(() => {
    return subscribeChatUnreadChanged((total) => {
      queryClient.setQueryData([...CHAT_SUMMARY_QUERY_KEY, tokenKey], total);
    });
  }, [queryClient, tokenKey]);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !connected ||
      !accessToken
    ) {
      return;
    }
    let cancelled = false;
    void chatApi
      .summary(accessToken)
      .then((res) => {
        if (!cancelled) {
          queryClient.setQueryData(
            [...CHAT_SUMMARY_QUERY_KEY, tokenKey],
            res.unreadTotal,
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [connected, accessToken, tokenKey, queryClient, status]);

  return query;
}
