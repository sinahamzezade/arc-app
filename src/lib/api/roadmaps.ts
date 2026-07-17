import { apiFetch } from "./client";
import type {
  ChooseNextResponse,
  ReEnrollmentJobDto,
  RoadmapCompletionSummaryDto,
  RoadmapCurrentResponse,
  RoadmapJobDto,
  RoadmapMapDto,
} from "./types";

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

  getCurrentMap(accessToken?: string | null) {
    return apiFetch<RoadmapMapDto>("/roadmaps/current/map", {
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

  getCompletionSummary(roadmapId: string, accessToken?: string | null) {
    return apiFetch<RoadmapCompletionSummaryDto>(
      `/roadmaps/${roadmapId}/completion-summary`,
      { accessToken },
    );
  },

  chooseNext(
    roadmapId: string,
    choice: "new_goal" | "same_goal_advanced" | "top_up",
    accessToken?: string | null,
  ) {
    return apiFetch<ChooseNextResponse>(`/roadmaps/${roadmapId}/choose-next`, {
      method: "POST",
      accessToken,
      body: { choice },
    });
  },

  getReEnrollmentJob(jobId: string, accessToken?: string | null) {
    return apiFetch<ReEnrollmentJobDto>(
      `/roadmaps/re-enrollment-jobs/${jobId}`,
      { accessToken },
    );
  },
};
