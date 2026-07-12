import { apiFetch } from "./client";
import type { RoadmapCurrentResponse, RoadmapJobDto } from "./types";

export type RoadmapRetryResult = {
  status: "queued" | "processing" | "ready" | "failed";
  jobId: string;
  roadmapId: string | null;
};

export const roadmapsApi = {
  getCurrent(accessToken?: string | null) {
    return apiFetch<RoadmapCurrentResponse>("/roadmaps/current", {
      accessToken,
    });
  },

  retry(accessToken?: string | null) {
    return apiFetch<RoadmapRetryResult>("/roadmaps/current/retry", {
      method: "POST",
      accessToken,
    });
  },

  getJob(jobId: string, accessToken?: string | null) {
    return apiFetch<RoadmapJobDto>(`/roadmaps/jobs/${jobId}`, {
      accessToken,
    });
  },
};
