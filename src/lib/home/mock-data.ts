export type HomeDayStatus = "done" | "empty";

export type HomeMockData = {
  userName: string;
  notificationCount: number;
  mission: {
    title: string;
    track: string;
    type: string;
    minutes: number;
    xp: number;
    gems: number;
    progressPercent: number;
    href: string;
  };
  weeklyProgress: {
    percent: number;
    hoursDone: number;
    hoursPlanned: number;
    sessionsDone: number;
    sessionsPlanned: number;
    onTrack: boolean;
    lockRewardXp: number;
    lockRewardGems: number;
  };
  weeklyStreak: {
    weeks: number;
    days: { label: string; status: HomeDayStatus }[];
  };
  milestone: {
    title: string;
    subtitle: string;
    stepsDone: number;
    stepsTotal: number;
    rewardXp: number;
    rewardGems: number;
    /** Path / learn deep-link when live */
    href?: string;
  };
  dailyBonus: {
    title: string;
    subtitle: string;
    spinsLeft: number;
    expiresIn: string;
    previewGems: number;
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
    yourPlace: number;
    xpToNext: number;
    peers: { initial: string; color: string; xp: number }[];
  };
  stats: {
    xp: number;
    gems: number;
    coins: number;
    rank: string;
    nextRank: string;
    level: number;
    xpIntoLevel: number;
    xpForLevel: number;
  };
};

export const homeMockData: HomeMockData = {
  userName: "Soheil",
  notificationCount: 3,
  mission: {
    title: "Make a page mobile-friendly",
    track: "Front-end Developer Path",
    type: "Lesson",
    minutes: 40,
    xp: 35,
    gems: 5,
    progressPercent: 12.5,
    href: "/learn/lesson-1",
  },
  weeklyProgress: {
    percent: 68,
    hoursDone: 5.5,
    hoursPlanned: 8,
    sessionsDone: 3,
    sessionsPlanned: 4,
    onTrack: true,
    lockRewardXp: 50,
    lockRewardGems: 8,
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
    nextRank: "Full Ninja",
    level: 5,
    xpIntoLevel: 250,
    xpForLevel: 500,
  },
  milestone: {
    title: "First Webpage",
    subtitle: "Finish Hello World Rookie",
    stepsDone: 0,
    stepsTotal: 3,
    rewardXp: 40,
    rewardGems: 10,
    href: "/path",
  },
  dailyBonus: {
    title: "Lucky Wheel",
    subtitle: "Free spin",
    spinsLeft: 1,
    expiresIn: "4h",
    previewGems: 15,
  },
  arloSays: {
    quote:
      "Eighteen minutes. One tiny HTML page. Keep the week seal warm — I believe in dramatic tags.",
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
    yourPlace: 4,
    xpToNext: 80,
    peers: [
      { initial: "M", color: "#6B4EFF", xp: 1480 },
      { initial: "J", color: "#2DB7F5", xp: 1330 },
    ],
  },
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
