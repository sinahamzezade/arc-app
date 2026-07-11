export type HomeDayStatus = "done" | "empty";

export type HomeMockData = {
  userName: string;
  notificationCount: number;
  /** Short outcome line under greeting */
  outcomeLine: string;
  mission: {
    title: string;
    track: string;
    type: string;
    minutes: number;
    xp: number;
    gems: number;
    progressPercent: number;
    /** Benefit-led why now */
    nudge: string;
    /** Button label — action + time */
    ctaLabel: string;
    href: string;
  };
  weeklyProgress: {
    percent: number;
    hoursDone: number;
    hoursPlanned: number;
    sessionsDone: number;
    sessionsPlanned: number;
    onTrack: boolean;
  };
  weeklyStreak: {
    weeks: number;
    days: { label: string; status: HomeDayStatus }[];
  };
  stats: {
    xp: number;
    gems: number;
    coins: number;
    rank: string;
    level: number;
    xpIntoLevel: number;
    xpForLevel: number;
  };
  milestone: {
    title: string;
    subtitle: string;
    stepsDone: number;
    stepsTotal: number;
  };
  dailyBonus: {
    title: string;
    subtitle: string;
  };
  arloSays: {
    quote: string;
    actions: string[];
  };
  badges: {
    earned: number;
    total: number;
  };
  leaderboard: {
    league: string;
    endsIn: string;
    yourXp: number;
    peers: { initial: string; color: string }[];
  };
};

export const homeMockData: HomeMockData = {
  userName: "Soheil",
  notificationCount: 3,
  outcomeLine: "Office worker → Data Analyst",
  mission: {
    title: "Filtering with WHERE",
    track: "SQL Basics",
    type: "Coding Practice",
    minutes: 25,
    xp: 25,
    gems: 5,
    progressPercent: 40,
    nudge: "One more session locks your week. SQL filter skills employers actually ask for.",
    ctaLabel: "Finish lesson · 25 min",
    href: "/learn/lesson-1",
  },
  weeklyProgress: {
    percent: 68,
    hoursDone: 5.5,
    hoursPlanned: 8,
    sessionsDone: 3,
    sessionsPlanned: 4,
    onTrack: true,
  },
  weeklyStreak: {
    weeks: 7,
    days: [
      { label: "Mon", status: "done" },
      { label: "Tue", status: "done" },
      { label: "Wed", status: "done" },
      { label: "Thu", status: "done" },
      { label: "Fri", status: "done" },
      { label: "Sat", status: "empty" },
      { label: "Sun", status: "empty" },
    ],
  },
  stats: {
    xp: 1250,
    gems: 350,
    coins: 2450,
    rank: "Semi Ninja",
    level: 5,
    xpIntoLevel: 250,
    xpForLevel: 500,
  },
  milestone: {
    title: "SQL Mini Challenge",
    subtitle: "1 step left · WHERE Practice",
    stepsDone: 2,
    stepsTotal: 3,
  },
  dailyBonus: {
    title: "Lucky Wheel",
    subtitle: "Free spin waiting",
  },
  arloSays: {
    quote:
      "You're 25 minutes away from keeping your week on track. Tiny SQL step, big career energy.",
    actions: [
      "Motivate me",
      "Explain today's task",
      "Make this easier",
      "Replan my week",
    ],
  },
  badges: {
    earned: 12,
    total: 24,
  },
  leaderboard: {
    league: "Silver League",
    endsIn: "Ends in 5d 12h",
    yourXp: 1250,
    peers: [
      { initial: "M", color: "#6B4EFF" },
      { initial: "J", color: "#2DB7F5" },
    ],
  },
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
