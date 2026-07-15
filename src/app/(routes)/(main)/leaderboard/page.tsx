import { auth } from "@/auth";
import LeaderboardScreen from "@/components/LeaderboardScreen";
import type {
  LeagueCurrentResponse,
  LeagueLeaderboardEntryDto,
  LeagueLeaderboardResponse,
} from "@/lib/api/leagues";
import { serverApiFetch } from "@/lib/api/server";
import { mapLeagueToLeaderboardData } from "@/lib/leaderboard/map-league";
import type { LeaderboardData } from "@/lib/leaderboard/types";

async function loadLeaderboard(
  accessToken: string,
  userId: string,
): Promise<LeaderboardData | undefined> {
  try {
    const [current, entries] = await Promise.all([
      serverApiFetch<LeagueCurrentResponse>("/leagues/current", accessToken),
      (async () => {
        const all: LeagueLeaderboardEntryDto[] = [];
        let cursor: string | undefined;

        for (let pageIndex = 0; pageIndex < 10; pageIndex++) {
          const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
          const page = await serverApiFetch<LeagueLeaderboardResponse>(
            `/leagues/current/leaderboard${query}`,
            accessToken,
          );
          all.push(...page.entries);
          if (!page.nextCursor) break;
          cursor = page.nextCursor;
        }

        return all;
      })(),
    ]);

    return mapLeagueToLeaderboardData(current, entries, userId);
  } catch {
    return undefined;
  }
}

export default async function LeaderboardPage() {
  const session = await auth();
  const data =
    session?.accessToken && session.user?.id
      ? await loadLeaderboard(session.accessToken, session.user.id)
      : undefined;

  return <LeaderboardScreen data={data} />;
}
