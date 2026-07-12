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
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (
        code === "ROADMAP_NOT_READY" ||
        code === "WEEK_NOT_FOUND" ||
        code === "WEEK_PLAN_BUILDING"
      ) {
        return false;
      }
      return count < 2;
    },
  });

  const setWeek = (data: WeekCurrentResponse) => {
    queryClient.setQueryData(weekQueryKey(accessToken), data);
  };

  const replan = useMutation({
    mutationFn: (body: ReplanWeekBody = {}) =>
      weeksApi.replan(body, accessToken),
    onSuccess: setWeek,
  });

  const moveTask = useMutation({
    mutationFn: (input: { taskId: string; dayIndex: number }) =>
      weeksApi.moveTask(input.taskId, input.dayIndex, accessToken),
    onSuccess: setWeek,
  });

  const skipTask = useMutation({
    mutationFn: (input: { taskId: string; reason?: string }) =>
      weeksApi.skipTask(input.taskId, { reason: input.reason }, accessToken),
    onSuccess: setWeek,
  });

  return {
    ...query,
    week: query.data as WeekCurrentResponse | undefined,
    replan,
    moveTask,
    skipTask,
  };
}
