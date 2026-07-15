"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  battlesApi,
  type BattleDto,
  type BattleHistoryItemDto,
  type BattleStatsDto,
  type BattleStatusDto,
} from "@/lib/api/battles";

const LIVE_STATUSES: BattleStatusDto[] = [
  "accepted",
  "funding",
  "ready",
  "in_progress",
  "sudden_death",
];

export function battleHref(b: BattleDto): string {
  if (b.status === "invited") {
    return b.role === "challenger"
      ? `/battle/invite/${b.id}?sent=1`
      : `/battle/invite/${b.id}`;
  }
  if (
    b.status === "completed" ||
    b.status === "forfeited" ||
    b.status === "voided" ||
    b.status === "refunded"
  ) {
    return `/battle/result/${b.id}`;
  }
  return `/battle/play/${b.id}`;
}

export function battleStatusLabel(status: BattleStatusDto): string {
  switch (status) {
    case "invited":
      return "Invite";
    case "accepted":
    case "funding":
      return "Funding";
    case "ready":
      return "Waiting room";
    case "in_progress":
      return "Live";
    case "sudden_death":
      return "Sudden death";
    default:
      return status;
  }
}

export type BattleHubInitialData = {
  stats?: BattleStatsDto;
  history?: {
    items: BattleHistoryItemDto[];
    nextCursor: string | null;
  };
  invites?: { items: BattleDto[] };
};

export function useBattleHub(initialData?: BattleHubInitialData) {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const enabled = status === "authenticated" && Boolean(accessToken);
  const qc = useQueryClient();

  const stats = useQuery({
    queryKey: ["battles", "stats", accessToken ?? "anon"],
    queryFn: () => battlesApi.statsMe(accessToken),
    enabled,
    initialData: initialData?.stats,
    staleTime: 30_000,
  });

  const history = useQuery({
    queryKey: ["battles", "history", accessToken ?? "anon"],
    queryFn: () => battlesApi.history(undefined, accessToken),
    enabled,
    initialData: initialData?.history,
    staleTime: 30_000,
  });

  const invites = useQuery({
    queryKey: ["battles", "invites", accessToken ?? "anon"],
    queryFn: () => battlesApi.invites(accessToken),
    enabled,
    initialData: initialData?.invites,
    refetchInterval: 5_000,
  });

  const loadMore = useMutation({
    mutationFn: async () => {
      const cursor = history.data?.nextCursor;
      if (!cursor) return null;
      return battlesApi.history(cursor, accessToken);
    },
    onSuccess: (page) => {
      if (!page) return;
      qc.setQueryData(
        ["battles", "history", accessToken ?? "anon"],
        (prev: typeof history.data) => {
          if (!prev) return page;
          return {
            items: [...prev.items, ...page.items],
            nextCursor: page.nextCursor,
          };
        },
      );
    },
  });

  const openItems = invites.data?.items ?? [];

  const live = openItems.filter((b) => LIVE_STATUSES.includes(b.status));
  const incoming = openItems.filter(
    (b) => b.status === "invited" && b.role === "opponent",
  );
  const outgoing = openItems.filter(
    (b) => b.status === "invited" && b.role === "challenger",
  );
  const blocking = openItems[0] ?? null;

  return {
    stats,
    history,
    invites,
    live,
    incoming,
    outgoing,
    blocking,
    openItems,
    loadMore,
    invalidate: () => void qc.invalidateQueries({ queryKey: ["battles"] }),
  };
}

export function useBattleStats() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  return useQuery({
    queryKey: ["battles", "stats", accessToken ?? "anon"],
    queryFn: () => battlesApi.statsMe(accessToken),
    enabled: status === "authenticated" && Boolean(accessToken),
    staleTime: 60_000,
  });
}
