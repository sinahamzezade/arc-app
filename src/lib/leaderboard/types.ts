export type LeaderboardTab = "board" | "quests" | "divisions" | "history";

export type LeagueTierName =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  initial: string;
  xp: number;
  isYou?: boolean;
  anonymized?: boolean;
  streakWeeks?: number;
  nudge?: string;
  showLike?: boolean;
  avatarBg: string;
  avatarColor: string;
  avatarUrl?: string | null;
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
  tier: LeagueTierName;
  rangeLabel: string;
  active: boolean;
};

export type LeaderboardData = {
  leagueName: string;
  leagueTier: LeagueTierName;
  cohortLabel: string;
  weekLabel: string;
  seasonEndsAt?: string;
  endsInLabel?: string;
  stats: {
    promoteTop: number;
    daysLeft: number;
    demoteBottom: number;
    cohortSize: number;
  };
  me?: {
    position: number;
    qualifiedXp: number;
    proofWeightedXp: number;
    activeDays: number;
    hideFromProfile: boolean;
  };
  scoreSourceBreakdown?: Record<string, number>;
  entries: LeaderboardEntry[];
  quests: LeagueQuest[];
  divisions: LeagueDivision[];
  footerNote: string;
};

export type LeaguePeerProfile = LeaderboardEntry & {
  leagueName: string;
  leagueTier: LeaderboardData["leagueTier"];
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
