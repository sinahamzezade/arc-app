"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { battlesApi } from "@/lib/api/battles";

export function useBattleHub() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const enabled = status === "authenticated" && Boolean(accessToken);
  const qc = useQueryClient();

  const stats = useQuery({
    queryKey: ["battles", "stats", accessToken ?? "anon"],
    queryFn: () => battlesApi.statsMe(accessToken),
    enabled,
    staleTime: 30_000,
  });

  const history = useQuery({
    queryKey: ["battles", "history", accessToken ?? "anon"],
    queryFn: () => battlesApi.history(undefined, accessToken),
    enabled,
    staleTime: 30_000,
  });

  const invites = useQuery({
    queryKey: ["battles", "invites", accessToken ?? "anon"],
    queryFn: () => battlesApi.invites(accessToken),
    enabled,
    refetchInterval: 8_000,
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

  const incoming = (invites.data?.items ?? []).filter(
    (b) => b.status === "invited" && b.role === "opponent",
  );
  const outgoing = (invites.data?.items ?? []).filter(
    (b) => b.status === "invited" && b.role === "challenger",
  );

  return {
    stats,
    history,
    invites,
    incoming,
    outgoing,
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
