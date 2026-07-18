import { apiFetch } from "./client";

export type SocialFriendDto = {
  userId: string;
  displayName: string | null;
  username: string | null;
  name: string;
  initial: string;
  color: string;
  avatarUrl: string | null;
  level: number;
  league: string;
  online: boolean;
  canBattle: boolean;
};

export type FriendRequestDto = {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  message: string | null;
  expiresAt: string;
  createdAt: string;
  from?: {
    userId: string;
    displayName: string | null;
    username: string | null;
  };
  to?: {
    userId: string;
    displayName: string | null;
    username: string | null;
  };
};

export type SocialSearchHitDto = SocialFriendDto & {
  relationship: "friend" | "outgoing" | "incoming" | "none";
  pendingRequestId: string | null;
  isFollowing?: boolean;
  canAddFriend: boolean;
};

export type SocialPrivacyDto = {
  profileVisibility: string;
  showWeeklyXp: boolean;
  showStreak: boolean;
  showCurrentLesson: boolean;
  showBattleHistory: boolean;
  showStudyActivity: boolean;
  allowFriendRequests: boolean;
  allowFollows: boolean;
  allowVideoCalls: boolean;
  allowVoiceCalls: boolean;
  allowBattleInvitesFrom: string;
  allowStudyInvitesFrom: string;
  leaderboardVisible: boolean;
  hideFromSuggestions: boolean;
};

export type SocialProfileDto = {
  userId: string;
  displayName: string | null;
  username: string | null;
  name: string;
  initial: string;
  color: string;
  avatarUrl: string | null;
  level: number;
  league: string;
  online: boolean;
  relationship: {
    isFriend: boolean;
    isFollowing: boolean;
    isFollower: boolean;
    requestDirection: string | null;
  };
  counters: {
    friends: number;
    followers: number;
    following: number;
  };
  stats?: {
    lessonsThisWeek: number;
    battlesWon: number;
    badgesEarned: number;
    badgesTotal: number;
  };
  privacy: {
    showWeeklyXp: boolean;
    showStreak: boolean;
    showBattleHistory: boolean;
    showStudyActivity: boolean;
  };
  canFollow: boolean;
  canUnfollow: boolean;
  canBattle: boolean;
  canStudy: boolean;
  relationshipVersion: string;
};

export const socialApi = {
  friends(online?: boolean, accessToken?: string | null) {
    const q = online ? "?online=true" : "";
    return apiFetch<{ items: SocialFriendDto[]; nextCursor: string | null }>(
      `/social/friends${q}`,
      { accessToken },
    );
  },

  search(q: string, cursor?: string, accessToken?: string | null) {
    const params = new URLSearchParams({ q });
    if (cursor) params.set("cursor", cursor);
    return apiFetch<{
      items: SocialSearchHitDto[];
      nextCursor: string | null;
      query: string;
    }>(`/social/search?${params.toString()}`, { accessToken });
  },

  suggestions(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{ items: SocialFriendDto[]; nextCursor: string | null }>(
      `/social/suggestions${q}`,
      { accessToken },
    );
  },

  sendFriendRequest(
    receiverId: string,
    message?: string,
    accessToken?: string | null,
  ) {
    return apiFetch<{
      request: FriendRequestDto;
      relationship: {
        isFriend: boolean;
        isFollowing?: boolean;
        requestDirection: string | null;
      };
    }>("/social/friend-requests", {
      method: "POST",
      body: { receiverId, message },
      accessToken,
    });
  },

  incomingRequests(accessToken?: string | null) {
    return apiFetch<{ items: FriendRequestDto[] }>(
      "/social/friend-requests/incoming",
      { accessToken },
    );
  },

  outgoingRequests(accessToken?: string | null) {
    return apiFetch<{ items: FriendRequestDto[] }>(
      "/social/friend-requests/outgoing",
      { accessToken },
    );
  },

  acceptRequest(id: string, accessToken?: string | null) {
    return apiFetch<{
      friendshipId: string;
      relationship: { isFriend: boolean };
    }>(`/social/friend-requests/${id}/accept`, {
      method: "POST",
      accessToken,
    });
  },

  declineRequest(id: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(
      `/social/friend-requests/${id}/decline`,
      {
        method: "POST",
        accessToken,
      },
    );
  },

  cancelRequest(id: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(`/social/friend-requests/${id}`, {
      method: "DELETE",
      accessToken,
    });
  },

  removeFriend(
    userId: string,
    unfollow = false,
    accessToken?: string | null,
  ) {
    return apiFetch<{ ok: boolean }>(`/social/friends/${userId}`, {
      method: "DELETE",
      body: { unfollow },
      accessToken,
    });
  },

  follow(userId: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean; alreadyFollowing: boolean }>(
      `/social/follows/${userId}`,
      { method: "POST", accessToken },
    );
  },

  unfollow(userId: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(`/social/follows/${userId}`, {
      method: "DELETE",
      accessToken,
    });
  },

  followers(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{ items: SocialFriendDto[]; nextCursor: string | null }>(
      `/social/followers${q}`,
      { accessToken },
    );
  },

  following(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{ items: SocialFriendDto[]; nextCursor: string | null }>(
      `/social/following${q}`,
      { accessToken },
    );
  },

  block(userId: string, reasonCode?: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(`/social/blocks/${userId}`, {
      method: "POST",
      body: { reasonCode },
      accessToken,
    });
  },

  unblock(userId: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(`/social/blocks/${userId}`, {
      method: "DELETE",
      accessToken,
    });
  },

  blocks(accessToken?: string | null) {
    return apiFetch<{ items: SocialFriendDto[] }>("/social/blocks", {
      accessToken,
    });
  },

  getPrivacy(accessToken?: string | null) {
    return apiFetch<SocialPrivacyDto>("/social/privacy", { accessToken });
  },

  updatePrivacy(
    body: Partial<SocialPrivacyDto>,
    accessToken?: string | null,
  ) {
    return apiFetch<SocialPrivacyDto>("/social/privacy", {
      method: "PATCH",
      body,
      accessToken,
    });
  },

  heartbeat(accessToken?: string | null) {
    return apiFetch<{ online: boolean; ttlSec: number }>(
      "/social/presence/heartbeat",
      { method: "POST", accessToken },
    );
  },

  getProfile(userId: string, accessToken?: string | null) {
    return apiFetch<SocialProfileDto>(`/social/users/${userId}`, {
      accessToken,
    });
  },
};
