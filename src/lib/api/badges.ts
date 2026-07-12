import { apiFetch } from "./client";

export type BadgeRarityDto =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type BadgeStatusDto = "locked" | "in_progress" | "earned";

export type BadgeItemDto = {
  code: string;
  name: string;
  description: string;
  category: string;
  rarity: BadgeRarityDto;
  iconAssetKey: string | null;
  isHidden: boolean;
  isSeasonal: boolean;
  sortOrder: number;
  version: number;
  status?: BadgeStatusDto;
  earnedAt?: string | null;
  progress?: {
    current: number;
    target: number;
    percent: number;
  };
  reward?: {
    coins: number;
    gems: number;
  };
};

export type MyBadgesResponse = {
  summary: {
    earned: number;
    totalCore: number;
    completionPercent: number;
  };
  featuredCodes: string[];
  visibility: {
    showOnProfile: boolean;
    showProgress: boolean;
  };
  badges: BadgeItemDto[];
};

export const badgesApi = {
  catalog(accessToken?: string | null) {
    return apiFetch<{ totalCore: number; items: BadgeItemDto[] }>("/badges", {
      accessToken,
    });
  },

  get(code: string, accessToken?: string | null) {
    return apiFetch<BadgeItemDto>(`/badges/${encodeURIComponent(code)}`, {
      accessToken,
    });
  },

  me(accessToken?: string | null) {
    return apiFetch<MyBadgesResponse>("/users/me/badges", { accessToken });
  },

  user(userId: string, accessToken?: string | null) {
    return apiFetch<{
      summary: MyBadgesResponse["summary"];
      featuredCodes: string[];
      badges: BadgeItemDto[];
    }>(`/users/${userId}/badges`, { accessToken });
  },

  setFeatured(codes: string[], accessToken?: string | null) {
    return apiFetch<MyBadgesResponse>("/users/me/badges/featured", {
      method: "PUT",
      body: { codes },
      accessToken,
    });
  },

  setVisibility(
    body: { showOnProfile?: boolean; showProgress?: boolean },
    accessToken?: string | null,
  ) {
    return apiFetch<{ showOnProfile: boolean; showProgress: boolean }>(
      "/users/me/badges/visibility",
      { method: "PUT", body, accessToken },
    );
  },
};
