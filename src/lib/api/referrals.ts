import { apiFetch } from "./client";

export type ReferralMeResponse = {
  code: string;
  defaultUrl: string;
  rewardPreview: {
    perQualifiedFriend: { coins: number };
    friendGets: { coins: number; lifetimeXp: number };
  };
  stats: {
    shares: number;
    eligibleClicks: number;
    signups: number;
    qualified: number;
    rewarded: number;
    coinsEarned: number;
  };
  nextMilestone: {
    qualifiedRequired: number;
    qualifiedCurrent: number;
    reward: { coins: number; gems?: number };
  } | null;
  recentInvites: Array<{
    id: string;
    displayName: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
};

export type CreateReferralLinkResponse = {
  linkId: string;
  referralCode: string;
  url: string;
  share: { title: string; text: string };
  rewardPreview: {
    inviterCoins: number;
    friendCoins: number;
    friendXp: number;
  };
};

export const referralsApi = {
  me(accessToken?: string | null) {
    return apiFetch<ReferralMeResponse>("/referrals/me", { accessToken });
  },

  invites(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{
      items: ReferralMeResponse["recentInvites"];
      nextCursor: string | null;
    }>(`/referrals/invites${q}`, { accessToken });
  },

  createLink(
    body: { channel: string; campaign?: string; locale?: string },
    accessToken?: string | null,
  ) {
    return apiFetch<CreateReferralLinkResponse>("/referrals/links", {
      method: "POST",
      body,
      accessToken,
    });
  },

  shareEvent(
    linkId: string,
    body: { clientEventId: string; eventType: string; channel?: string },
    accessToken?: string | null,
  ) {
    return apiFetch<{ ok: boolean; alreadyRecorded: boolean }>(
      `/referrals/links/${linkId}/share-events`,
      { method: "POST", body, accessToken },
    );
  },

  rotateCode(accessToken?: string | null) {
    return apiFetch<{ code: string }>("/referrals/code/rotate", {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  claimCode(code: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean; attributionId: string | null }>(
      "/referrals/claim-code",
      {
        method: "POST",
        body: { code },
        accessToken,
      },
    );
  },
};

export function referralStatusLabel(status: string): string {
  const map: Record<string, string> = {
    registered: "Signed up",
    email_verified: "Verified",
    onboarding_completed: "Learning started",
    almost_there: "Almost there",
    qualified: "Qualified",
    rewarded: "Rewarded",
    expired: "Expired",
    rejected: "Rejected",
    under_review: "Under review",
  };
  return map[status] ?? status;
}
