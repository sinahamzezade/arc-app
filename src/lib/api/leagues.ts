import { apiFetch } from "./client";

export type LeagueTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master";

export type LeagueDivision = "III" | "II" | "I";

export type LeagueLeaderboardEntryDto = {
  userId: string | null;
  position: number;
  qualifiedXp: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  anonymized: boolean;
};

export type LeagueCurrentResponse = {
  serverTimestamp: string;
  season: {
    id: string;
    status: string;
    startsAt: string;
    endsAt: string;
    regionalBucket: string;
    timezone: string;
  };
  cohort: {
    id: string;
    tier: LeagueTier;
    division: LeagueDivision;
    status: string;
    maxMembers: number;
  };
  me: {
    membershipId: string;
    position: number;
    qualifiedXp: number;
    proofWeightedXp: number;
    activeDays: number;
    hideFromProfile: boolean;
  };
  zones: {
    promoteThrough: number;
    remainFrom: number;
    remainThrough: number;
    demoteFrom: number;
  };
  topUsers: LeagueLeaderboardEntryDto[];
  surroundingUsers: LeagueLeaderboardEntryDto[];
  scoreSourceBreakdown: Record<string, number>;
  /** Weekly/seasonal quest progress from admin catalog (seeded defaults). */
  quests?: LeagueQuestDto[];
};

export type LeagueQuestDto = {
  id: string;
  code: string;
  title: string;
  detail: string;
  progress: number;
  goal: number;
  xpReward: number;
  done: boolean;
};

export type LeagueLeaderboardResponse = {
  serverTimestamp: string;
  seasonEndsAt: string;
  cohortId: string;
  entries: LeagueLeaderboardEntryDto[];
  nextCursor: string | null;
};

export type LeagueMeResponse = {
  serverTimestamp: string;
  seasonEndsAt: string;
  tier: LeagueTier;
  division: LeagueDivision;
  position: number;
  qualifiedXp: number;
  zone: "promote" | "remain" | "demote";
  rankLevel: number;
  weeklySeals: number;
  scoreSourceBreakdown: Record<string, number>;
};

export type LeagueHistoryResponse = {
  items: Array<{
    id: string;
    seasonId: string;
    cohortId: string;
    finalPosition: number;
    finalXp: number;
    oldLeague: { tier: LeagueTier; division: LeagueDivision };
    newLeague: { tier: LeagueTier; division: LeagueDivision };
    promotionResult: string;
    reward: Record<string, unknown>;
    createdAt: string;
  }>;
  nextCursor: string | null;
  total: number;
};

export type LeagueUserResponse = {
  userId: string;
  hidden: boolean;
  league: {
    tier: LeagueTier;
    division: LeagueDivision;
    position: number | null;
    qualifiedXp: number;
    seasonEndsAt: string | null;
  } | null;
};

export const leaguesApi = {
  getCurrent(accessToken?: string | null) {
    return apiFetch<LeagueCurrentResponse>("/leagues/current", {
      accessToken,
    });
  },

  getLeaderboard(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<LeagueLeaderboardResponse>(
      `/leagues/current/leaderboard${q}`,
      { accessToken },
    );
  },

  /** Fetch full cohort standings (paginated under the hood). */
  async getFullLeaderboard(accessToken?: string | null) {
    const all: LeagueLeaderboardEntryDto[] = [];
    let cursor: string | undefined;
    let seasonEndsAt = "";
    let cohortId = "";

    for (let i = 0; i < 10; i++) {
      const page = await leaguesApi.getLeaderboard(cursor, accessToken);
      seasonEndsAt = page.seasonEndsAt;
      cohortId = page.cohortId;
      all.push(...page.entries);
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }

    return { entries: all, seasonEndsAt, cohortId };
  },

  getMe(accessToken?: string | null) {
    return apiFetch<LeagueMeResponse>("/leagues/current/me", { accessToken });
  },

  getHistory(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<LeagueHistoryResponse>(`/leagues/history${q}`, {
      accessToken,
    });
  },

  getUser(userId: string, accessToken?: string | null) {
    return apiFetch<LeagueUserResponse>(`/leagues/users/${userId}`, {
      accessToken,
    });
  },

  setPrivacy(hideFromProfile: boolean, accessToken?: string | null) {
    return apiFetch<{ hideFromProfile: boolean }>("/leagues/privacy", {
      method: "PATCH",
      body: { hideFromProfile },
      accessToken,
    });
  },
};
