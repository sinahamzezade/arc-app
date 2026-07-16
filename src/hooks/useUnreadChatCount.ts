"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { chatApi } from "@/lib/api/chat";
import { useChatSocketGlobal } from "@/hooks/useChatSocket";

export const CHAT_SUMMARY_QUERY_KEY = ["chat", "summary"] as const;

export function useUnreadChatCount() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const { connected, onUnreadChanged } = useChatSocketGlobal({
    enabled: status === "authenticated" && Boolean(accessToken),
  });

  const query = useQuery({
    queryKey: [...CHAT_SUMMARY_QUERY_KEY, accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const res = await chatApi.summary(accessToken);
      return res.unreadTotal;
    },
    refetchInterval: connected ? 60_000 : 20_000,
  });

  useEffect(() => {
    return onUnreadChanged((total) => {
      queryClient.setQueryData(
        [...CHAT_SUMMARY_QUERY_KEY, accessToken ?? "anon"],
        total,
      );
    });
  }, [onUnreadChanged, queryClient, accessToken]);

  useEffect(() => {
    if (!connected || !accessToken) return;
    void query.refetch();
  }, [connected, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}
