export type LeaderboardTab = "board" | "quests" | "divisions";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  initial: string;
  xp: number;
  isYou?: boolean;
  streakWeeks?: number;
  nudge?: string;
  showLike?: boolean;
  avatarBg: string;
  avatarColor: string;
};

export type LeagueQuest = {
  id: string;
  title: string;
  detail: string;
  progress: number;
  goal: number;
  xpReward: number;
  done: boolean;
};

export type LeagueDivision = {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold";
  rangeLabel: string;
  active: boolean;
};

export type LeaderboardMockData = {
  leagueName: string;
  leagueTier: "bronze" | "silver" | "gold";
  cohortLabel: string;
  weekLabel: string;
  stats: {
    promoteTop: number;
    daysLeft: number;
    demoteBottom: number;
    cohortSize: number;
  };
  entries: LeaderboardEntry[];
  quests: LeagueQuest[];
  divisions: LeagueDivision[];
  footerNote: string;
};

export const leaderboardMockData: LeaderboardMockData = {
  leagueName: "Bronze League",
  leagueTier: "bronze",
  cohortLabel: "Matched cohort · ~8 hrs/week",
  weekLabel: "Week 3 of season",
  stats: {
    promoteTop: 7,
    daysLeft: 7,
    demoteBottom: 5,
    cohortSize: 30,
  },
  entries: [
    {
      id: "priya",
      rank: 1,
      name: "Priya",
      initial: "P",
      xp: 140,
      streakWeeks: 5,
      avatarBg: "#ffe9a8",
      avatarColor: "#8a5a12",
    },
    {
      id: "marcus",
      rank: 2,
      name: "Marcus",
      initial: "M",
      xp: 120,
      showLike: true,
      avatarBg: "#dcebff",
      avatarColor: "#3b82c4",
    },
    {
      id: "dani",
      rank: 3,
      name: "Dani",
      initial: "D",
      xp: 110,
      showLike: true,
      avatarBg: "#e7dcff",
      avatarColor: "#6b4eff",
    },
    {
      id: "noah",
      rank: 4,
      name: "Noah",
      initial: "N",
      xp: 98,
      avatarBg: "#ffe0d4",
      avatarColor: "#c45a2e",
    },
    {
      id: "sam",
      rank: 5,
      name: "Sam",
      initial: "S",
      xp: 84,
      showLike: true,
      avatarBg: "#dff5ff",
      avatarColor: "#1a7a9c",
    },
    {
      id: "kira",
      rank: 6,
      name: "Kira",
      initial: "K",
      xp: 72,
      streakWeeks: 2,
      avatarBg: "#fde7f0",
      avatarColor: "#b8326a",
    },
    {
      id: "leah",
      rank: 7,
      name: "Leah",
      initial: "L",
      xp: 60,
      avatarBg: "#d9f5e7",
      avatarColor: "#16a56b",
    },
    {
      id: "owen",
      rank: 8,
      name: "Owen",
      initial: "O",
      xp: 48,
      avatarBg: "#efe9ff",
      avatarColor: "#5a45b0",
    },
    {
      id: "jade",
      rank: 12,
      name: "Jade",
      initial: "J",
      xp: 22,
      avatarBg: "#fff3d6",
      avatarColor: "#9a6b10",
    },
    {
      id: "you",
      rank: 18,
      name: "You",
      initial: "Y",
      xp: 0,
      isYou: true,
      nudge: "Finish today's lesson to climb!",
      avatarBg: "#6b4eff",
      avatarColor: "#ffffff",
    },
    {
      id: "ben",
      rank: 27,
      name: "Ben",
      initial: "B",
      xp: 0,
      avatarBg: "#ece8f5",
      avatarColor: "#6a5a90",
    },
    {
      id: "rita",
      rank: 28,
      name: "Rita",
      initial: "R",
      xp: 0,
      avatarBg: "#f5e8e8",
      avatarColor: "#9a5050",
    },
  ],
  quests: [
    {
      id: "q1",
      title: "Three lessons",
      detail: "Complete any 3 lessons this week",
      progress: 1,
      goal: 3,
      xpReward: 40,
      done: false,
    },
    {
      id: "q2",
      title: "Battle once",
      detail: "Finish 1 friend Battle",
      progress: 0,
      goal: 1,
      xpReward: 25,
      done: false,
    },
    {
      id: "q3",
      title: "Weekly commit",
      detail: "Hit your weekly hour goal",
      progress: 1,
      goal: 1,
      xpReward: 50,
      done: true,
    },
  ],
  divisions: [
    {
      id: "bronze",
      name: "Bronze",
      tier: "bronze",
      rangeLabel: "0–499 XP / week",
      active: true,
    },
    {
      id: "silver",
      name: "Silver",
      tier: "silver",
      rangeLabel: "500–999 XP / week",
      active: false,
    },
    {
      id: "gold",
      name: "Gold",
      tier: "gold",
      rangeLabel: "1000+ XP / week",
      active: false,
    },
  ],
  footerNote:
    "Consistency beats cramming — ranks track progress, not raw hours.",
};

export type LeaguePeerProfile = LeaderboardEntry & {
  leagueName: string;
  leagueTier: LeaderboardMockData["leagueTier"];
  weekLabel: string;
  cohortLabel: string;
  cohortSize: number;
  promoteTop: number;
  demoteBottom: number;
  daysLeft: number;
  fromRole: string;
  becoming: string;
  rankTitle: string;
  bio: string;
  badgesEarned: number;
  badgesTotal: number;
  lessonsThisWeek: number;
  battlesWon: number;
  joinedLabel: string;
  recent: { id: string; label: string; when: string }[];
};

const peerExtras: Record<
  string,
  Pick<
    LeaguePeerProfile,
    | "fromRole"
    | "becoming"
    | "rankTitle"
    | "bio"
    | "badgesEarned"
    | "badgesTotal"
    | "lessonsThisWeek"
    | "battlesWon"
    | "joinedLabel"
    | "recent"
  >
> = {
  priya: {
    fromRole: "Ops analyst",
    becoming: "Data Analyst",
    rankTitle: "Full Ninja",
    bio: "SQL mornings before standup. Climbing for Silver.",
    badgesEarned: 18,
    badgesTotal: 24,
    lessonsThisWeek: 6,
    battlesWon: 4,
    joinedLabel: "Joined Week 1",
    recent: [
      { id: "r1", label: "Sealed week commit", when: "2h ago" },
      { id: "r2", label: "Won battle vs Marcus", when: "Yesterday" },
      { id: "r3", label: "Finished WHERE Practice", when: "2d ago" },
    ],
  },
  marcus: {
    fromRole: "Support lead",
    becoming: "Data Analyst",
    rankTitle: "Semi Ninja",
    bio: "Battles for fun. Lessons for the career arc.",
    badgesEarned: 11,
    badgesTotal: 24,
    lessonsThisWeek: 4,
    battlesWon: 7,
    joinedLabel: "Joined Week 1",
    recent: [
      { id: "r1", label: "Cheered 3 learners", when: "1h ago" },
      { id: "r2", label: "Completed SQL joins", when: "Yesterday" },
    ],
  },
  dani: {
    fromRole: "Marketer",
    becoming: "Data Analyst",
    rankTitle: "Semi Ninja",
    bio: "Weekend warrior. Charts > slides.",
    badgesEarned: 9,
    badgesTotal: 24,
    lessonsThisWeek: 3,
    battlesWon: 2,
    joinedLabel: "Joined Week 2",
    recent: [
      { id: "r1", label: "Hit 3-lesson quest", when: "Today" },
      { id: "r2", label: "Spun Lucky Wheel", when: "3d ago" },
    ],
  },
};

const defaultExtras: (typeof peerExtras)[string] = {
  fromRole: "Office worker",
  becoming: "Data Analyst",
  rankTitle: "Rookie",
  bio: "On the Arc — one lesson at a time.",
  badgesEarned: 4,
  badgesTotal: 24,
  lessonsThisWeek: 2,
  battlesWon: 0,
  joinedLabel: "Joined this season",
  recent: [
    { id: "r1", label: "Opened a lesson", when: "Today" },
    { id: "r2", label: "Checked the board", when: "Yesterday" },
  ],
};

/** Build peer passport from standings id. Null if missing. */
export function getLeaguePeerProfile(
  id: string,
): LeaguePeerProfile | null {
  const entry = leaderboardMockData.entries.find((e) => e.id === id);
  if (!entry) return null;

  const extras = peerExtras[id] ?? {
    ...defaultExtras,
    rankTitle:
      entry.rank <= 3
        ? "Full Ninja"
        : entry.rank <= 7
          ? "Semi Ninja"
          : entry.rank <= 15
            ? "Apprentice"
            : "Rookie",
    lessonsThisWeek: Math.max(0, Math.round(entry.xp / 25)),
    battlesWon: entry.showLike ? 3 : entry.rank < 10 ? 1 : 0,
    badgesEarned: Math.min(24, 2 + Math.floor(entry.xp / 15)),
  };

  return {
    ...entry,
    ...extras,
    leagueName: leaderboardMockData.leagueName,
    leagueTier: leaderboardMockData.leagueTier,
    weekLabel: leaderboardMockData.weekLabel,
    cohortLabel: leaderboardMockData.cohortLabel,
    cohortSize: leaderboardMockData.stats.cohortSize,
    promoteTop: leaderboardMockData.stats.promoteTop,
    demoteBottom: leaderboardMockData.stats.demoteBottom,
    daysLeft: leaderboardMockData.stats.daysLeft,
  };
}

