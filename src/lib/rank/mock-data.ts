import { homeMockData } from "@/lib/home/mock-data";

export type RankTier = {
  id: string;
  name: string;
  levelRequired: number;
  blurb: string;
  status: "locked" | "current" | "earned";
};

export type RankMockData = {
  stats: typeof homeMockData.stats;
  nextRank: string;
  xpToNextRank: number;
  howToEarn: { label: string; xp: string }[];
  tiers: RankTier[];
  walletTips: { currency: "XP" | "Gems" | "Coins"; tip: string }[];
};

const RANK_NAMES = [
  "Curious Egg",
  "Brave Hatchling",
  "Rookie Eagle",
  "Data Scout",
  "Semi Ninja",
  "Full Ninja",
  "Query Warrior",
  "Chart Wizard",
  "Insight Hunter",
  "Portfolio Hero",
  "Interview Ranger",
  "Job-Ready Eagle",
] as const;

const currentIndex = RANK_NAMES.indexOf("Semi Ninja");

export const rankMockData: RankMockData = {
  stats: homeMockData.stats,
  nextRank: "Full Ninja",
  xpToNextRank: 250,
  howToEarn: [
    { label: "Finish a lesson", xp: "+20–40 XP" },
    { label: "Pass a quiz", xp: "+25 XP" },
    { label: "Hit weekly commitment", xp: "+50 XP" },
    { label: "Milestone clear", xp: "+80 XP" },
  ],
  tiers: RANK_NAMES.map((name, i) => ({
    id: `r${i + 1}`,
    name,
    levelRequired: i + 1,
    blurb:
      i === currentIndex
        ? "You’re here — halfway to Full Ninja energy."
        : i < currentIndex
          ? "Cleared. Keep the streak alive."
          : i === currentIndex + 1
            ? "Next unlock — finish level XP + a milestone."
            : "Locked until XP + milestones catch up.",
    status:
      i < currentIndex ? "earned" : i === currentIndex ? "current" : "locked",
  })),
  walletTips: [
    {
      currency: "XP",
      tip: "Levels the rank ladder. Lessons, quizzes, weekly goals.",
    },
    {
      currency: "Gems",
      tip: "Premium flex — chests, cosmetics, streak freeze later.",
    },
    {
      currency: "Coins",
      tip: "Everyday spend — spins, small boosts, shop fluff.",
    },
  ],
};
