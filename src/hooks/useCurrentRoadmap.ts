"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { roadmapsApi } from "@/lib/api/roadmaps";

export function useCurrentRoadmap() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ["roadmaps", "current", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: () => roadmapsApi.getCurrent(accessToken),
    refetchInterval: (query) => {
      const job = query.state.data?.job;
      if (!job) return false;
      if (job.status === "queued" || job.status === "processing") return 1500;
      return false;
    },
  });
}
