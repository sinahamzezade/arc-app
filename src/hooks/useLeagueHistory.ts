"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { leaguesApi } from "@/lib/api/leagues";

export function useLeagueHistory() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["leagues", "history", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => leaguesApi.getHistory(undefined, accessToken),
    staleTime: 60_000,
  });
}

export function useHomeLeagueCard() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["leagues", "home-card", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const current = await leaguesApi.getCurrent(accessToken);
      const endsMs =
        new Date(current.season.endsAt).getTime() - Date.now();
      const days = Math.max(0, Math.ceil(endsMs / 86_400_000));
      const hours = Math.max(
        0,
        Math.floor((endsMs % 86_400_000) / 3_600_000),
      );
      const tier =
        current.cohort.tier.charAt(0).toUpperCase() +
        current.cohort.tier.slice(1);
      const ahead = current.surroundingUsers
        .filter((u) => u.position < current.me.position)
        .sort((a, b) => b.position - a.position)[0];
      const xpToNext = ahead
        ? Math.max(0, ahead.qualifiedXp - current.me.qualifiedXp + 1)
        : 0;

      return {
        league: `${tier} ${current.cohort.division}`,
        yourPlace: current.me.position,
        endsIn: days <= 0 ? `${hours}h left` : `${days}d left`,
        xpToNext,
        peers: current.topUsers.slice(0, 3).map((u, i) => ({
          initial: (u.displayName || "?").charAt(0).toUpperCase(),
          color: ["#6b4eff", "#ffc928", "#b35cff"][i] ?? "#8a7cb8",
          avatarUrl: u.avatarUrl,
        })),
      };
    },
    staleTime: 30_000,
    retry: (count, err) => {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "LEAGUE_NOT_ASSIGNED" || code === "UNAUTHORIZED") {
        return false;
      }
      return count < 1;
    },
  });
}
