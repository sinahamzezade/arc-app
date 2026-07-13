"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { socialApi } from "@/lib/api/social";

export function useIncomingFriendRequestCount() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["social", "friend-requests", "incoming", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const res = await socialApi.incomingRequests(accessToken);
      return res.items.length;
    },
    refetchInterval: 20_000,
  });
}
