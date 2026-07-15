"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { roadmapsApi } from "@/lib/api/roadmaps";
import type { RoadmapCurrentResponse } from "@/lib/api/types";

export function useCurrentRoadmap(initialData?: RoadmapCurrentResponse) {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const queryKey = ["roadmaps", "current", accessToken ?? "anon"] as const;
  const qStatus = session?.profile?.questionnaireStatus;

  const query = useQuery({
    queryKey,
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => roadmapsApi.getCurrent(accessToken),
    initialData,
    staleTime: 15_000,
    refetchInterval: (q) => {
      const job = q.state.data?.job;
      if (!job) return false;
      if (job.status === "queued" || job.status === "processing") return 1500;
      return false;
    },
  });

  // Admin questionnaire reset clears path — drop stale roadmap cache once.
  const prevQStatusRef = useRef(qStatus);
  useEffect(() => {
    const prev = prevQStatusRef.current;
    prevQStatusRef.current = qStatus;
    if (prev === "completed" && qStatus !== "completed") {
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "current"] });
    }
  }, [qStatus, queryClient]);

  const retry = useMutation({
    mutationFn: () => roadmapsApi.retry(accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    retry,
  };
}
