"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { courseTimingApi } from "@/lib/api/course-timing";

export function useCourseTiming() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const qc = useQueryClient();
  const enabled = status === "authenticated" && Boolean(accessToken);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["course-timing"] });
    void qc.invalidateQueries({ queryKey: ["weeks"] });
  };

  const current = useQuery({
    queryKey: ["course-timing", "current", accessToken ?? "anon"],
    queryFn: () => courseTimingApi.getCurrent(accessToken),
    enabled,
    staleTime: 30_000,
    retry: (count, err) => {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (
        code === "TIMING_SCHEDULE_NOT_FOUND" ||
        code === "TIMING_COMMITMENT_MISSING"
      ) {
        return false;
      }
      return count < 2;
    },
  });

  const feasibility = useQuery({
    queryKey: ["course-timing", "feasibility", accessToken ?? "anon"],
    queryFn: () => courseTimingApi.getFeasibility(accessToken),
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  const replan = useMutation({
    mutationFn: (body?: { reason?: string; expectedVersion?: number }) =>
      courseTimingApi.replan(body ?? {}, accessToken),
    onSuccess: invalidate,
  });

  const patchCommitment = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      courseTimingApi.patchCommitment(body, accessToken),
    onSuccess: invalidate,
  });

  const moveSlot = useMutation({
    mutationFn: (input: {
      slotId: string;
      localDate: string;
      startLocalTime?: string;
    }) =>
      courseTimingApi.moveSlot(
        input.slotId,
        {
          localDate: input.localDate,
          startLocalTime: input.startLocalTime,
        },
        accessToken,
      ),
    onSuccess: invalidate,
  });

  const skipSlot = useMutation({
    mutationFn: (input: { slotId: string; reason?: string }) =>
      courseTimingApi.skipSlot(
        input.slotId,
        { reason: input.reason },
        accessToken,
      ),
    onSuccess: invalidate,
  });

  return {
    current,
    feasibility,
    timing: current.data,
    replan,
    patchCommitment,
    moveSlot,
    skipSlot,
  };
}
