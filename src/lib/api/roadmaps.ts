import { apiFetch } from "./client";
import type { RoadmapCurrentResponse, RoadmapJobDto } from "./types";

export const roadmapsApi = {
  getCurrent(accessToken?: string | null) {
    return apiFetch<RoadmapCurrentResponse>("/roadmaps/current", {
      accessToken,
    });
  },

  getJob(jobId: string, accessToken?: string | null) {
    return apiFetch<RoadmapJobDto>(`/roadmaps/jobs/${jobId}`, {
      accessToken,
    });
  },
};
