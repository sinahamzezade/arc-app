import { apiFetch } from "./client";

export type RankRequirementDto = {
  key: string;
  current: number;
  required: number;
  complete: boolean;
};

export type RankMeResponse = {
  current: {
    level: number;
    slug: string;
    title: string;
    lifetimeXp: number;
    activeDays: number;
    iconAssetKey: string | null;
  };
  next: {
    level: number;
    slug: string;
    title: string;
    xp: {
      current: number;
      required: number;
      intoLevel: number;
      forLevel: number;
    };
    requirements: RankRequirementDto[];
  } | null;
  evaluationHeld: boolean;
  holdReason: string | null;
  hideFromProfile: boolean;
};

export type RankLadderTier = {
  level: number;
  slug: string;
  title: string;
  xpThreshold: number;
  minimumActiveDays: number;
  iconAssetKey: string | null;
  status: "locked" | "current" | "earned";
  blurb: string;
};

export type RankLadderResponse = {
  currentLevel: number;
  tiers: RankLadderTier[];
  me: RankMeResponse;
};

export type RankDefinitionDto = {
  level: number;
  slug: string;
  title: string;
  xpThreshold: number;
  minimumActiveDays: number;
  iconAssetKey: string | null;
};

export const ranksApi = {
  list(accessToken?: string | null) {
    return apiFetch<RankDefinitionDto[]>("/ranks", { accessToken });
  },

  getMe(accessToken?: string | null) {
    return apiFetch<RankMeResponse>("/ranks/me", { accessToken });
  },

  getLadder(accessToken?: string | null) {
    return apiFetch<RankLadderResponse>("/ranks/me/ladder", { accessToken });
  },

  getUser(userId: string, accessToken?: string | null) {
    return apiFetch<{
      userId: string;
      hidden: boolean;
      rank: {
        level: number;
        slug: string;
        title: string;
        iconAssetKey: string | null;
      } | null;
    }>(`/ranks/users/${userId}`, { accessToken });
  },
};

export function formatRequirementLabel(key: string): string {
  const map: Record<string, string> = {
    lifetime_xp: "Lifetime XP",
    active_days: "Active learning days",
    lessons_completed: "Lessons completed",
    quests_completed: "Quests completed",
    phases_completed: "Phases completed",
    assessments_passed: "Assessments passed",
    challenges_passed: "Challenges passed",
    boss_challenges_passed: "Boss challenges",
    projects_completed: "Projects completed",
    portfolio_capstone_completed: "Portfolio capstone",
    weekly_seals: "Weekly seals",
    interview_readiness: "Interview readiness",
  };
  if (map[key]) return map[key];
  if (key.startsWith("role_recipe:")) {
    return key.replace("role_recipe:", "").replace(/_/g, " ");
  }
  return key.replace(/_/g, " ");
}
