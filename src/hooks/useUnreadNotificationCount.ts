"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { notificationsApi } from "@/lib/api/notifications";

export function useUnreadNotificationCount() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["notifications", "unread-count", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const res = await notificationsApi.unreadCount(accessToken);
      return res.unreadCount;
    },
    refetchInterval: 60_000,
  });
}
