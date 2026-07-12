"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { weeksApi, type ReplanWeekBody } from "@/lib/api/weeks";
import type { WeekCurrentResponse } from "@/lib/api/types";

export const weekQueryKey = (accessToken?: string | null) =>
  ["weeks", "current", accessToken ?? "anon"] as const;

export function useCurrentWeek() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: weekQueryKey(accessToken),
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => weeksApi.getCurrent(accessToken),
    retry: (count, err) => {
      // Roadmap not ready → don't spam
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "ROADMAP_NOT_READY" || code === "WEEK_NOT_FOUND") {
        return false;
      }
      return count < 2;
    },
  });

  const replan = useMutation({
    mutationFn: (body: ReplanWeekBody = {}) =>
      weeksApi.replan(body, accessToken),
    onSuccess: (data) => {
      queryClient.setQueryData(weekQueryKey(accessToken), data);
    },
  });

  return {
    ...query,
    week: query.data as WeekCurrentResponse | undefined,
    replan,
  };
}
