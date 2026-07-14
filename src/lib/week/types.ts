import type { HomeDayStatus, HomeData } from "@/lib/home/types";

export type WeekTaskStatus =
  | "done"
  | "today"
  | "upcoming"
  | "missed"
  | "skipped"
  | "moved";

export type WeekTask = {
  id: string;
  dayLabel: string;
  dayIndex?: number;
  title: string;
  track: string;
  minutes: number;
  xp: number;
  status: WeekTaskStatus;
  href?: string;
};

export type WeekPulseData = {
  weekLabel: string;
  rangeLabel: string;
  goalHours: number;
  progress: HomeData["weeklyProgress"];
  streak: HomeData["weeklyStreak"];
  days: {
    label: string;
    full: string;
    status: HomeDayStatus | "today" | "inactive";
    minutesPlanned: number;
    minutesDone: number;
  }[];
  tasks: WeekTask[];
  arloNudge: string;
};
