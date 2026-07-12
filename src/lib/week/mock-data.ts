import {
  homeMockData,
  type HomeDayStatus,
  type HomeMockData,
} from "@/lib/home/mock-data";

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

export type WeekPulseMockData = {
  weekLabel: string;
  rangeLabel: string;
  goalHours: number;
  progress: HomeMockData["weeklyProgress"];
  streak: HomeMockData["weeklyStreak"];
  days: {
    label: string;
    full: string;
    status: HomeDayStatus | "today";
    minutesPlanned: number;
    minutesDone: number;
  }[];
  tasks: WeekTask[];
  arloNudge: string;
};

export const weekPulseMockData: WeekPulseMockData = {
  weekLabel: "Week commitment",
  rangeLabel: "Jul 6 – Jul 12",
  goalHours: homeMockData.weeklyProgress.hoursPlanned,
  progress: homeMockData.weeklyProgress,
  streak: {
    ...homeMockData.weeklyStreak,
    days: homeMockData.weeklyStreak.days.map((d, i) =>
      i === 5 ? { ...d, status: "empty" as const } : d,
    ),
  },
  days: [
    { label: "Mon", full: "Monday", status: "done", minutesPlanned: 60, minutesDone: 65 },
    { label: "Tue", full: "Tuesday", status: "done", minutesPlanned: 60, minutesDone: 55 },
    { label: "Wed", full: "Wednesday", status: "done", minutesPlanned: 90, minutesDone: 90 },
    { label: "Thu", full: "Thursday", status: "done", minutesPlanned: 60, minutesDone: 70 },
    { label: "Fri", full: "Friday", status: "done", minutesPlanned: 45, minutesDone: 50 },
    { label: "Sat", full: "Saturday", status: "today", minutesPlanned: 60, minutesDone: 0 },
    { label: "Sun", full: "Sunday", status: "empty", minutesPlanned: 50, minutesDone: 0 },
  ],
  tasks: [
    {
      id: "t1",
      dayLabel: "Mon",
      title: "SELECT basics drill",
      track: "SQL Basics",
      minutes: 25,
      xp: 20,
      status: "done",
    },
    {
      id: "t2",
      dayLabel: "Tue",
      title: "Filter rows with WHERE",
      track: "SQL Basics",
      minutes: 30,
      xp: 25,
      status: "done",
    },
    {
      id: "t3",
      dayLabel: "Wed",
      title: "Practice: multi-condition WHERE",
      track: "Coding Practice",
      minutes: 40,
      xp: 30,
      status: "done",
    },
    {
      id: "t4",
      dayLabel: "Thu",
      title: "Arlo review — query patterns",
      track: "Coach",
      minutes: 20,
      xp: 15,
      status: "done",
    },
    {
      id: "t5",
      dayLabel: "Fri",
      title: "ORDER BY & LIMIT",
      track: "SQL Basics",
      minutes: 25,
      xp: 20,
      status: "done",
    },
    {
      id: "t6",
      dayLabel: "Sat",
      title: "Filtering with WHERE",
      track: "Coding Practice",
      minutes: 25,
      xp: 25,
      status: "today",
      href: "/learn/lesson-1",
    },
    {
      id: "t7",
      dayLabel: "Sun",
      title: "Mini quiz — SQL filters",
      track: "Assessment",
      minutes: 20,
      xp: 30,
      status: "upcoming",
    },
  ],
  arloNudge:
    "Five days locked. Finish Saturday to lock week 8 — Sunday can flex. No guilt.",
};
