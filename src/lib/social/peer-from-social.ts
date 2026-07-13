import type { SocialProfileDto, SocialSearchHitDto } from "@/lib/api/social";
import type { LeaguePeerProfile } from "@/lib/leaderboard/types";

/** Minimal peer passport for social profile route (no league required). */
export function peerFromSocial(
  profile: SocialProfileDto | SocialSearchHitDto,
): LeaguePeerProfile {
  const name = profile.name || profile.displayName || "Learner";
  const stats =
    "stats" in profile && profile.stats
      ? profile.stats
      : {
          badgesEarned: 0,
          badgesTotal: 36,
          lessonsThisWeek: 0,
          battlesWon: 0,
        };
  return {
    id: profile.userId,
    rank: 0,
    name,
    initial: profile.initial || name.slice(0, 1).toUpperCase(),
    xp: 0,
    avatarBg: profile.color || "#7c5cbf",
    avatarColor: "#ffffff",
    leagueName: profile.league || "Arc",
    leagueTier: "bronze",
    weekLabel: "Social",
    cohortLabel: "Crew",
    cohortSize: 30,
    promoteTop: 7,
    demoteBottom: 5,
    daysLeft: 0,
    fromRole: "Learner",
    becoming: "On Arc",
    rankTitle: profile.league ? String(profile.league) : "Arc learner",
    bio: profile.username
      ? `@${profile.username}`
      : "Find them on Arc — follow or add as friend.",
    badgesEarned: stats.badgesEarned,
    badgesTotal: stats.badgesTotal,
    lessonsThisWeek: stats.lessonsThisWeek,
    battlesWon: stats.battlesWon,
    joinedLabel: profile.online ? "Online now" : "Offline",
    recent: [
      {
        id: "r1",
        label: profile.online ? "Active on Arc" : "Last seen recently",
        when: "Now",
      },
    ],
  };
}
