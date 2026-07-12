"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { leaguesApi } from "@/lib/api/leagues";
import {
  mapLeagueToLeaderboardData,
  mapLeagueUserToPeer,
} from "@/lib/leaderboard/map-league";

export const leagueQueryKey = (accessToken?: string | null) =>
  ["leagues", "current", accessToken ?? "anon"] as const;

export function useCurrentLeague() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const meUserId = session?.user?.id || null;

  const query = useQuery({
    queryKey: [...leagueQueryKey(accessToken), meUserId ?? ""],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const [current, board] = await Promise.all([
        leaguesApi.getCurrent(accessToken),
        leaguesApi.getFullLeaderboard(accessToken),
      ]);
      return mapLeagueToLeaderboardData(current, board.entries, meUserId);
    },
    retry: (count, err) => {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (
        code === "LEAGUE_NOT_ASSIGNED" ||
        code === "LEAGUE_SEASON_NOT_ACTIVE" ||
        code === "UNAUTHORIZED"
      ) {
        return false;
      }
      return count < 2;
    },
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  return {
    ...query,
    league: query.data,
  };
}

export function useLeagueUser(userId: string) {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const { league: board } = useCurrentLeague();

  return useQuery({
    queryKey: ["leagues", "user", userId, accessToken ?? "anon"],
    enabled:
      status === "authenticated" &&
      Boolean(accessToken) &&
      Boolean(userId) &&
      !userId.startsWith("anon-"),
    queryFn: async () => {
      const user = await leaguesApi.getUser(userId, accessToken);
      return mapLeagueUserToPeer(user, board);
    },
    staleTime: 30_000,
  });
}
