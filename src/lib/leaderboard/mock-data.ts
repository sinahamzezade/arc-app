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
      id: "leah",
      rank: 7,
      name: "Leah",
      initial: "L",
      xp: 60,
      avatarBg: "#d9f5e7",
      avatarColor: "#16a56b",
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
  ],
  footerNote:
    "Consistency beats cramming — ranks track progress, not raw hours.",
};
