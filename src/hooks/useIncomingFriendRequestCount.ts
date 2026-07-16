"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

/**
 * Incoming friend-request badge count. Seeded by AppPulseHost.
 * Friends screen still loads the full incoming list itself.
 */
export function useIncomingFriendRequestCount() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["social", "friend-requests", "incoming", accessToken ?? "anon"],
    enabled: false,
    queryFn: async () => 0,
  });
}
