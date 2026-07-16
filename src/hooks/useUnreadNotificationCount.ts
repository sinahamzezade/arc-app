"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

/**
 * Unread notification badge. Data seeded by AppPulseHost (`GET /me/pulse`).
 */
export function useUnreadNotificationCount() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["notifications", "unread-count", accessToken ?? "anon"],
    enabled: false,
    queryFn: async () => 0,
  });
}
