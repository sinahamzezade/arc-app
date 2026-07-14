export type HomeDayStatus = "done" | "empty";

export type HomeData = {
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
    peers: { initial: string; color: string; xp: number; avatarUrl?: string | null }[];
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

/** Empty home desk shell — fill via mapHomeFromBackend / APIs. */
export function emptyHomeData(
  overrides: Partial<HomeData> = {},
): HomeData {
  return {
    userName: "",
    notificationCount: 0,
    mission: {
      title: "",
      track: "",
      type: "Lesson",
      minutes: 0,
      xp: 0,
      gems: 0,
      progressPercent: 0,
      href: "/learn",
    },
    weeklyProgress: {
      percent: 0,
      hoursDone: 0,
      hoursPlanned: 0,
      sessionsDone: 0,
      sessionsPlanned: 0,
      onTrack: true,
      lockRewardXp: 0,
      lockRewardGems: 0,
    },
    weeklyStreak: {
      weeks: 0,
      days: [
        { label: "Mon", status: "empty" },
        { label: "Tue", status: "empty" },
        { label: "Wed", status: "empty" },
        { label: "Thu", status: "empty" },
        { label: "Fri", status: "empty" },
        { label: "Sat", status: "empty" },
        { label: "Sun", status: "empty" },
      ],
    },
    milestone: {
      title: "",
      subtitle: "",
      stepsDone: 0,
      stepsTotal: 0,
      rewardXp: 0,
      rewardGems: 0,
      href: "/path",
    },
    dailyBonus: {
      title: "Lucky Wheel",
      subtitle: "Free spin",
      spinsLeft: 0,
      expiresIn: "",
      previewGems: 0,
    },
    arloSays: {
      quote: "",
      actions: [
        "Motivate me",
        "Explain today's task",
        "Make this easier",
        "Replan my week",
      ],
    },
    badges: {
      earned: 0,
      total: 0,
    },
    leaderboard: {
      league: "",
      endsIn: "",
      yourXp: 0,
      yourPlace: 0,
      xpToNext: 0,
      peers: [],
    },
    stats: {
      xp: 0,
      gems: 0,
      coins: 0,
      rank: "",
      nextRank: "",
      level: 1,
      xpIntoLevel: 0,
      xpForLevel: 1,
    },
    ...overrides,
  };
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
