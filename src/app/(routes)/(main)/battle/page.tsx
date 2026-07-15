import { Suspense } from "react";
import { auth } from "@/auth";
import BattleHubScreen from "@/components/battle/BattleHubScreen";
import { BattleHubSkeleton } from "@/components/battle/BattleHubSkeleton";
import type {
  BattleDto,
  BattleHistoryItemDto,
  BattleStatsDto,
} from "@/lib/api/battles";
import { tryServerApiFetch } from "@/lib/api/server";

export default async function BattlePage() {
  const session = await auth();
  const accessToken = session?.accessToken;
  const [stats, history, invites] = accessToken
    ? await Promise.all([
        tryServerApiFetch<BattleStatsDto>("/battles/stats/me", accessToken),
        tryServerApiFetch<{
          items: BattleHistoryItemDto[];
          nextCursor: string | null;
        }>("/battles/history", accessToken),
        tryServerApiFetch<{ items: BattleDto[] }>(
          "/battles/invites",
          accessToken,
        ),
      ])
    : [undefined, undefined, undefined];
  const initialData =
    stats || history || invites ? { stats, history, invites } : undefined;

  return (
    <Suspense fallback={<BattleHubSkeleton />}>
      <BattleHubScreen initialData={initialData} />
    </Suspense>
  );
}
