"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ranksApi, type RankMeResponse } from "@/lib/api/ranks";

export const ranksMeQueryKey = (token?: string | null) =>
  ["ranks", "me", token ?? "anon"] as const;

export const ranksLadderQueryKey = (token?: string | null) =>
  ["ranks", "ladder", token ?? "anon"] as const;

export function useRankMe(initialData?: RankMeResponse) {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ranksMeQueryKey(accessToken),
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => ranksApi.getMe(accessToken),
    initialData,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });
}

export function useRankLadder() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ranksLadderQueryKey(accessToken),
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => ranksApi.getLadder(accessToken),
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });
}

export function useHomeRankCard() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["ranks", "home-card", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const me = await ranksApi.getMe(accessToken);
      const into = me.next?.xp.intoLevel ?? me.current.lifetimeXp;
      const forLevel = me.next?.xp.forLevel ?? 1;
      return {
        rank: me.current.title,
        nextRank: me.next?.title ?? me.current.title,
        xpIntoLevel: into,
        xpForLevel: forLevel,
        level: me.current.level,
        requirements: me.next?.requirements ?? [],
      };
    },
    staleTime: 30_000,
  });
}
