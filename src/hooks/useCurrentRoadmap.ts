"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { roadmapsApi } from "@/lib/api/roadmaps";

export function useCurrentRoadmap() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const queryKey = ["roadmaps", "current", accessToken ?? "anon"] as const;

  const query = useQuery({
    queryKey,
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => roadmapsApi.getCurrent(accessToken),
    refetchInterval: (q) => {
      const job = q.state.data?.job;
      if (!job) return false;
      if (job.status === "queued" || job.status === "processing") return 1500;
      return false;
    },
  });

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
