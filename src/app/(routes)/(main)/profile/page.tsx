import { auth } from "@/auth";
import ProfileScreen from "@/components/ProfileScreen";
import type { MyBadgesResponse } from "@/lib/api/badges";
import type { RankMeResponse } from "@/lib/api/ranks";
import { tryServerApiFetch } from "@/lib/api/server";
import type { SocialProfileDto } from "@/lib/api/social";
import { emptyProfileData } from "@/lib/profile/types";

export default async function ProfilePage() {
  const session = await auth();
  const accessToken = session?.accessToken;
  const userId = session?.user?.id;
  const [rank, social, badges] =
    accessToken && userId
      ? await Promise.all([
          tryServerApiFetch<RankMeResponse>("/ranks/me", accessToken),
          tryServerApiFetch<SocialProfileDto>(
            `/social/users/${encodeURIComponent(userId)}`,
            accessToken,
          ),
          tryServerApiFetch<MyBadgesResponse>(
            "/users/me/badges",
            accessToken,
          ),
        ])
      : [undefined, undefined, undefined];
  const profile = session?.profile;
  const data = emptyProfileData({
    userName:
      social?.displayName ||
      social?.name ||
      profile?.displayName ||
      profile?.username ||
      session?.user?.name ||
      "",
    level: rank?.current.level ?? social?.level ?? 1,
    day: Math.max(1, rank?.current.activeDays ?? 1),
    xp: profile?.totalXp ?? rank?.current.lifetimeXp ?? 0,
    xpIntoLevel:
      rank?.next?.xp.intoLevel ?? rank?.current.lifetimeXp ?? 0,
    xpForNextLevel: rank?.next?.xp.forLevel ?? 1,
    weekStreak: profile?.weeklyStreak ?? 0,
    badgesEarned: badges?.summary.earned ?? social?.stats?.badgesEarned ?? 0,
    badgesTotal: badges?.summary.totalCore ?? social?.stats?.badgesTotal ?? 0,
    followers: social?.counters.followers ?? 0,
    following: social?.counters.following ?? 0,
    coins: profile?.coins ?? 0,
    gems: profile?.gems ?? 0,
  });

  return (
    <ProfileScreen
      data={data}
      initialRank={rank}
      initialSocial={
        social
          ? {
              followers: social.counters.followers,
              following: social.counters.following,
            }
          : undefined
      }
      initialBadges={
        badges
          ? { earned: badges.summary.earned, total: badges.summary.totalCore }
          : undefined
      }
    />
  );
}
