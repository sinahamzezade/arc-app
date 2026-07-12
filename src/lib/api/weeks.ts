import { apiFetch } from "./client";
import type { WeekCurrentResponse } from "./types";

export type ReplanWeekBody = {
  mode?: "catch_up" | "reduce" | "rebuild";
  reduceHours?: boolean;
};

export const weeksApi = {
  getCurrent(accessToken?: string | null) {
    return apiFetch<WeekCurrentResponse>("/weeks/current", { accessToken });
  },

  replan(body: ReplanWeekBody = {}, accessToken?: string | null) {
    return apiFetch<WeekCurrentResponse>("/weeks/current/replan", {
      method: "POST",
      body,
      accessToken,
    });
  },

  updateTask(
    taskId: string,
    body: { dayIndex?: number; status?: string },
    accessToken?: string | null,
  ) {
    return apiFetch<WeekCurrentResponse>(
      `/weeks/current/tasks/${taskId}`,
      {
        method: "PATCH",
        body,
        accessToken,
      },
    );
  },
};
