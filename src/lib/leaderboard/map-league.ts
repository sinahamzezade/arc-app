import type {
  LeagueCurrentResponse,
  LeagueLeaderboardEntryDto,
  LeagueTier,
  LeagueUserResponse,
} from "@/lib/api/leagues";
import type {
  LeaderboardData,
  LeaderboardEntry,
  LeagueDivision,
  LeaguePeerProfile,
  LeagueQuest,
} from "@/lib/leaderboard/types";

const AVATAR_PALETTE = [
  { bg: "#ffe9a8", color: "#8a5a12" },
  { bg: "#dcebff", color: "#3b82c4" },
  { bg: "#e7dcff", color: "#6b4eff" },
  { bg: "#ffe0d4", color: "#c45a2e" },
  { bg: "#dff5ff", color: "#1a7a9c" },
  { bg: "#fde7f0", color: "#b8326a" },
  { bg: "#d9f5e7", color: "#16a56b" },
  { bg: "#efe9ff", color: "#5a45b0" },
] as const;

const YOU_AVATAR = { bg: "#6b4eff", color: "#ffffff" };

const TIER_LABEL: Record<LeagueTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  master: "Master",
};

const TIER_GATES: Record<LeagueTier, string> = {
  bronze: "Open to all learners",
  silver: "Rank level ≥ 3",
  gold: "Rank level ≥ 4",
  platinum: "Rank level ≥ 6",
  diamond: "Rank level ≥ 8",
  master: "Rank ≥ 10 · 12 weekly seals",
};

const ALL_TIERS: LeagueTier[] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "master",
];

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function avatarFor(seed: string, isYou: boolean) {
  if (isYou) return YOU_AVATAR;
  return AVATAR_PALETTE[hashHue(seed) % AVATAR_PALETTE.length];
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function daysLeftUntil(endsAt: string, now = new Date()): number {
  const ms = new Date(endsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function endsInLabel(endsAt: string, now = new Date()): string {
  const ms = Math.max(0, new Date(endsAt).getTime() - now.getTime());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days <= 0) return `${hours}h left`;
  if (days === 1) return `1d ${hours}h`;
  return `${days}d ${hours}h`;
}

export function mapLeaderboardEntry(
  dto: LeagueLeaderboardEntryDto,
  meUserId?: string | null,
): LeaderboardEntry {
  const isYou =
    Boolean(meUserId && dto.userId === meUserId) ||
    (!dto.anonymized && dto.displayName === "You");
  const name = isYou ? "You" : dto.displayName || "Learner";
  const seed = dto.userId ?? `anon-${dto.position}`;
  const avatar = avatarFor(seed, isYou);

  return {
    id: dto.userId ?? `anon-${dto.position}`,
    rank: dto.position,
    name,
    initial: isYou ? "Y" : initialOf(name),
    xp: dto.qualifiedXp,
    isYou,
    anonymized: dto.anonymized,
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
    nudge: isYou && dto.qualifiedXp === 0
      ? "Finish today's lesson to climb!"
      : undefined,
    showLike: !isYou && !dto.anonymized && dto.position <= 5,
  };
}

function buildQuests(
  current: LeagueCurrentResponse,
): LeagueQuest[] {
  const breakdown = current.scoreSourceBreakdown ?? {};
  const lessonXp = breakdown.lesson ?? 0;
  const battleXp = breakdown.battle ?? 0;
  const activeDays = current.me.activeDays;

  return [
    {
      id: "lessons",
      title: "Three lessons",
      detail: "Earn League XP from any 3 lessons this week",
      progress: Math.min(3, Math.floor(lessonXp / 20)),
      goal: 3,
      xpReward: 40,
      done: lessonXp >= 60,
    },
    {
      id: "battle",
      title: "Battle once",
      detail: "Finish 1 friend Battle (capped League XP)",
      progress: battleXp > 0 ? 1 : 0,
      goal: 1,
      xpReward: 25,
      done: battleXp > 0,
    },
    {
      id: "active-days",
      title: "Weekly commit",
      detail: "Learn on 5 distinct days this season",
      progress: Math.min(5, activeDays),
      goal: 5,
      xpReward: 50,
      done: activeDays >= 5,
    },
  ];
}

function buildDivisions(
  activeTier: LeagueTier,
  division: string,
): LeagueDivision[] {
  return ALL_TIERS.map((tier) => ({
    id: tier,
    name: TIER_LABEL[tier],
    tier,
    rangeLabel:
      tier === activeTier
        ? `Your division ${division} · ${TIER_GATES[tier]}`
        : TIER_GATES[tier],
    active: tier === activeTier,
  }));
}

export function mapLeagueToLeaderboardData(
  current: LeagueCurrentResponse,
  entries: LeagueLeaderboardEntryDto[],
  meUserId?: string | null,
): LeaderboardData {
  const tier = current.cohort.tier;
  const demoteBottom =
    current.cohort.maxMembers - current.zones.demoteFrom + 1;

  // Ensure "you" appears even if pagination missed (late join / empty board).
  const mapped = entries.map((e) => mapLeaderboardEntry(e, meUserId));
  const hasYou = mapped.some((e) => e.isYou);
  if (!hasYou && meUserId) {
    mapped.push(
      mapLeaderboardEntry(
        {
          userId: meUserId,
          position: current.me.position,
          qualifiedXp: current.me.qualifiedXp,
          displayName: "You",
          username: null,
          avatarUrl: null,
          anonymized: false,
        },
        meUserId,
      ),
    );
  }

  return {
    leagueName: `${TIER_LABEL[tier]} League`,
    leagueTier: tier,
    cohortLabel: `${current.cohort.division} · cohort of ${current.cohort.maxMembers}`,
    weekLabel: `Season · ${current.cohort.division}`,
    seasonEndsAt: current.season.endsAt,
    endsInLabel: endsInLabel(current.season.endsAt),
    stats: {
      promoteTop: current.zones.promoteThrough,
      daysLeft: daysLeftUntil(current.season.endsAt),
      demoteBottom: Math.max(1, demoteBottom),
      cohortSize: current.cohort.maxMembers,
    },
    me: {
      position: current.me.position,
      qualifiedXp: current.me.qualifiedXp,
      proofWeightedXp: current.me.proofWeightedXp,
      activeDays: current.me.activeDays,
      hideFromProfile: current.me.hideFromProfile,
    },
    scoreSourceBreakdown: current.scoreSourceBreakdown ?? {},
    entries: mapped.sort((a, b) => a.rank - b.rank),
    quests: buildQuests(current),
    divisions: buildDivisions(tier, current.cohort.division),
    footerNote:
      "League XP: lessons · challenges · projects. Ties break on proof XP, then active days.",
  };
}

export function mapLeagueUserToPeer(
  user: LeagueUserResponse,
  board?: LeaderboardData | null,
): LeaguePeerProfile | null {
  if (user.hidden || !user.league) {
    return null;
  }

  const boardEntry = board?.entries.find((e) => e.id === user.userId);
  const tier = user.league.tier;
  const position = user.league.position ?? boardEntry?.rank ?? 0;
  const xp = user.league.qualifiedXp ?? boardEntry?.xp ?? 0;
  const name = boardEntry?.name ?? "Learner";
  const avatar = boardEntry
    ? { bg: boardEntry.avatarBg, color: boardEntry.avatarColor }
    : avatarFor(user.userId, false);

  return {
    id: user.userId,
    rank: position,
    name,
    initial: boardEntry?.initial ?? initialOf(name),
    xp,
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
    showLike: boardEntry?.showLike,
    anonymized: false,
    leagueName: `${TIER_LABEL[tier]} League`,
    leagueTier: tier,
    weekLabel: board?.weekLabel ?? "Current season",
    cohortLabel: board?.cohortLabel ?? `${user.league.division}`,
    cohortSize: board?.stats.cohortSize ?? 30,
    promoteTop: board?.stats.promoteTop ?? 7,
    demoteBottom: board?.stats.demoteBottom ?? 5,
    daysLeft: user.league.seasonEndsAt
      ? daysLeftUntil(user.league.seasonEndsAt)
      : (board?.stats.daysLeft ?? 0),
    fromRole: "Learner",
    becoming: "On Arc",
    rankTitle: `${TIER_LABEL[tier]} ${user.league.division}`,
    bio: "Climbing the weekly league.",
    badgesEarned: 0,
    badgesTotal: 24,
    lessonsThisWeek: Math.max(0, Math.round(xp / 25)),
    battlesWon: 0,
    joinedLabel: "This season",
    recent: [{ id: "r1", label: "Active in league", when: "This week" }],
  };
}
