"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { badgesApi } from "@/lib/api/badges";

export const badgesMeQueryKey = (token?: string | null) =>
  ["badges", "me", token ?? "anon"] as const;

export function useMyBadges() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: badgesMeQueryKey(accessToken),
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => badgesApi.me(accessToken),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useHomeBadgesCard() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["badges", "home-card", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const me = await badgesApi.me(accessToken);
      return {
        earned: me.summary.earned,
        total: me.summary.totalCore,
      };
    },
    staleTime: 30_000,
  });
}
