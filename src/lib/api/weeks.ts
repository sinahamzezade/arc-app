import { apiFetch } from "./client";
import type { WeekCurrentResponse } from "./types";

export type ReplanWeekBody = {
  mode?:
    | "catch_up"
    | "reduce"
    | "rebuild"
    | "user_request"
    | "missed_sessions"
    | "reduce_workload"
    | "increase_pace"
    | "availability_changed"
    | "coach_recommendation";
  reason?: string;
  reduceHours?: boolean;
};

export const weeksApi = {
  getCurrent(accessToken?: string | null) {
    return apiFetch<WeekCurrentResponse>("/weeks/current", { accessToken });
  },

  getByWeekStart(weekStart: string, accessToken?: string | null) {
    return apiFetch<WeekCurrentResponse>(`/weeks/${weekStart}`, {
      accessToken,
    });
  },

  replan(body: ReplanWeekBody = {}, accessToken?: string | null) {
    return apiFetch<WeekCurrentResponse>("/weeks/current/replan", {
      method: "POST",
      body,
      accessToken,
    });
  },

  moveTask(
    taskId: string,
    dayIndex: number,
    accessToken?: string | null,
  ) {
    return apiFetch<WeekCurrentResponse>(
      `/weeks/current/tasks/${taskId}/move`,
      {
        method: "POST",
        body: { dayIndex },
        accessToken,
      },
    );
  },

  skipTask(
    taskId: string,
    body: { reason?: string } = {},
    accessToken?: string | null,
  ) {
    return apiFetch<WeekCurrentResponse>(
      `/weeks/current/tasks/${taskId}/skip`,
      {
        method: "POST",
        body,
        accessToken,
      },
    );
  },

  /** @deprecated prefer moveTask / skipTask */
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
