"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { luckyWheelApi } from "@/lib/api/lucky-wheel";

export const luckyWheelQueryKey = (token?: string | null) =>
  ["lucky-wheel", "current", token ?? "anon"] as const;

export function useLuckyWheel() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: luckyWheelQueryKey(accessToken),
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => luckyWheelApi.getCurrent(accessToken),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    wheel: query.data,
    accessToken,
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: ["lucky-wheel"],
      }),
  };
}
