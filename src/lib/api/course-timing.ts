import { apiFetch } from "./client";

export type CourseTimingCurrent = {
  scheduleId: string;
  scheduleVersion: number;
  plannedMinutesPerWeek: number;
  effectiveMinutesPerWeek: number;
  pace: string;
  feasibility: string;
  feasibilityRatio: number;
  requestedCompletionDate: string | null;
  estimatedCompletionDate: string | null;
  remainingMinutes: number;
  completedMinutes: number;
  activeWindow: { start: string; end: string };
  nextSession: {
    slotId: string;
    startsAt: string;
    endsAt: string;
    lessonId: string | null;
    minutes: number;
    title: string | null;
  } | null;
};

export type CourseTimingFeasibility = {
  hoursPerWeek: number;
  targetWeeks: number;
  usableWeeklyMinutes: number;
  deadlineCapacity: number;
  requiredContentMinutes: number;
  feasibilityRatio: number;
  feasibilityState: string;
  plannedMinutesPerWeek: number;
  requestedCompletionDate: string | null;
  commitmentId: string;
  roadmapId: string | null;
};

export type CourseTimingCalendar = {
  scheduleId: string;
  scheduleVersion: number;
  from: string;
  to: string;
  slots: Array<{
    slotId: string;
    localDate: string;
    startLocalTime: string;
    endLocalTime: string;
    startsAt: string;
    endsAt: string;
    minutes: number;
    lessonId: string | null;
    title: string | null;
    status: string;
  }>;
};

export const courseTimingApi = {
  getCurrent(accessToken?: string | null) {
    return apiFetch<CourseTimingCurrent>("/course-timing/current", {
      accessToken,
    });
  },

  getCalendar(from?: string, to?: string, accessToken?: string | null) {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const q = qs.toString();
    return apiFetch<CourseTimingCalendar>(
      `/course-timing/calendar${q ? `?${q}` : ""}`,
      { accessToken },
    );
  },

  getFeasibility(accessToken?: string | null) {
    return apiFetch<CourseTimingFeasibility>("/course-timing/feasibility", {
      accessToken,
    });
  },

  patchCommitment(
    body: Record<string, unknown>,
    accessToken?: string | null,
  ) {
    return apiFetch<CourseTimingCurrent>("/course-timing/commitment", {
      method: "PATCH",
      body,
      accessToken,
    });
  },

  replan(
    body: { reason?: string; expectedVersion?: number } = {},
    accessToken?: string | null,
  ) {
    return apiFetch<CourseTimingCurrent>("/course-timing/replan", {
      method: "POST",
      body,
      accessToken,
    });
  },

  moveSlot(
    slotId: string,
    body: { localDate: string; startLocalTime?: string },
    accessToken?: string | null,
  ) {
    return apiFetch<CourseTimingCalendar>(
      `/course-timing/slots/${slotId}/move`,
      { method: "POST", body, accessToken },
    );
  },

  skipSlot(
    slotId: string,
    body: { reason?: string } = {},
    accessToken?: string | null,
  ) {
    return apiFetch<CourseTimingCurrent>(
      `/course-timing/slots/${slotId}/skip`,
      { method: "POST", body, accessToken },
    );
  },
};
