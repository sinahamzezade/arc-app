"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { roadmapsApi } from "@/lib/api/roadmaps";

export function useRoadmapCompletionSummary(roadmapId: string | null) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const startedAt = useRef(Date.now());
  const [softWait, setSoftWait] = useState(false);

  useEffect(() => {
    startedAt.current = Date.now();
    setSoftWait(false);
  }, [roadmapId]);

  const query = useQuery({
    queryKey: ["roadmaps", "completion-summary", roadmapId, accessToken ?? ""],
    enabled: Boolean(roadmapId && accessToken),
    queryFn: () =>
      roadmapsApi.getCompletionSummary(roadmapId!, accessToken),
    refetchInterval: (q) => {
      const ready = q.state.data?.coachAssessment?.ready;
      if (ready) return false;
      if (Date.now() - startedAt.current > 10_000) {
        setSoftWait(true);
      }
      return 1500;
    },
  });

  return {
    ...query,
    softWait: softWait && !query.data?.coachAssessment?.ready,
  };
}

export function useChooseNext(roadmapId: string | null) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (choice: "new_goal" | "same_goal_advanced" | "top_up") => {
      if (!roadmapId) throw new Error("Missing roadmap");
      return roadmapsApi.chooseNext(roadmapId, choice, session?.accessToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

export function useReEnrollmentJob(jobId: string | null) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["roadmaps", "re-enrollment-job", jobId, accessToken ?? ""],
    enabled: Boolean(jobId && accessToken),
    queryFn: () => roadmapsApi.getReEnrollmentJob(jobId!, accessToken),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === "ready" || status === "failed") return false;
      return 1500;
    },
  });
}
