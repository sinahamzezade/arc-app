"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  Coins,
  Flame,
  Gem,
  Pencil,
  Settings,
  Swords,
  Trophy,
  UserPlus,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "next-auth/react";
import { socialApi } from "@/lib/api/social";
import { badgesApi } from "@/lib/api/badges";
import { useBattleStats } from "@/hooks/useBattles";
import { useArcDay } from "@/hooks/useArcDay";
import { useRankMe } from "@/hooks/useRanks";
import { emptyProfileData, type ProfileData } from "@/lib/profile/types";
import { isRankUploadSrc, rankImageFor } from "@/lib/rank/icons";
import { cn } from "@/lib/utils";
import { useEconomyStore } from "@/store/useEconomyStore";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import type { RankMeResponse } from "@/lib/api/ranks";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

/**
 * Profile — night passport hero + grouped action sheet.
 */
export default function ProfileScreen({
  data: dataProp,
  initialRank,
  initialSocial,
  initialBadges,
}: {
  data?: ProfileData;
  initialRank?: RankMeResponse;
  initialSocial?: { followers: number; following: number };
  initialBadges?: { earned: number; total: number };
}) {
  const data = dataProp ?? emptyProfileData();
  const { data: session, status: sessionStatus } = useSession();
  const { flags } = useSystemFlags();
  const { data: rankMe, isLoading: rankLoading } = useRankMe(initialRank);
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const economyHydrated = useEconomyStore((s) => s.hydrated);
  const visibleXp = economyHydrated ? xp : data.xp;
  const visibleGems = economyHydrated ? gems : data.gems;
  const visibleCoins = economyHydrated ? coins : data.coins;
  const weekStreak = session?.profile?.weeklyStreak ?? data.weekStreak;
  const day = useArcDay(data.day);
  const userName =
    session?.profile?.displayName ||
    session?.user?.name ||
    data.userName ||
    "—";

  const level = rankMe?.current.level ?? data.level;
  const xpIntoLevel = rankMe?.next?.xp.intoLevel ?? data.xpIntoLevel;
  const xpForNextLevel = rankMe?.next?.xp.forLevel ?? data.xpForNextLevel;
  const xpPercent = Math.min(
    100,
    Math.round((xpIntoLevel / Math.max(1, xpForNextLevel)) * 100),
  );

  const fromRole = data.fromRole;
  const becoming = data.becoming;

  const [followerCount, setFollowerCount] = useState<number | null>(
    initialSocial?.followers ?? null,
  );
  const [followingCount, setFollowingCount] = useState<number | null>(
    initialSocial?.following ?? null,
  );
  const [badgesEarned, setBadgesEarned] = useState<number | null>(
    initialBadges?.earned ?? null,
  );
  const [badgesTotal, setBadgesTotal] = useState<number>(
    initialBadges?.total ?? data.badgesTotal,
  );

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let cancelled = false;
    void socialApi
      .getProfile(userId)
      .then((p) => {
        if (cancelled) return;
        setFollowerCount(p.counters.followers);
        setFollowingCount(p.counters.following);
      })
      .catch(() => {
        if (cancelled) return;
        setFollowerCount(0);
        setFollowingCount(0);
      });
    void badgesApi
      .me()
      .then((b) => {
        if (cancelled) return;
        setBadgesEarned(b.summary.earned);
        setBadgesTotal(b.summary.totalCore);
      })
      .catch(() => {
        if (cancelled) return;
        setBadgesEarned(data.badgesEarned);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, data.badgesEarned]);

  const waitingOnSocial =
    Boolean(session?.user?.id) &&
    (followerCount == null || badgesEarned == null);

  const profileLoading =
    (!dataProp && sessionStatus === "loading") ||
    (!dataProp &&
      sessionStatus === "authenticated" &&
      ((rankLoading && !rankMe) || waitingOnSocial));

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-28px] h-36 w-36 rounded-full bg-[#ffc928]/14 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Your Arc
            </p>
            <p className="mt-0.5 truncate text-[13px] font-bold text-white/45">
              Day {day} · LVL {level}
            </p>
          </div>
          <Link
            href="/settings"
            aria-label="Open settings"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/16 focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
          >
            <Settings className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Centered passport */}
        <div className="relative mt-5 flex flex-col items-center text-center">
          <Link
            href="/identity"
            aria-label={`Edit identity for ${userName}`}
            className="relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220]"
          >
            <XpRing
              percent={xpPercent}
              level={level}
              iconAssetKey={rankMe?.current.iconAssetKey}
            />
            <span className="absolute -right-0.5 -bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-arc-purple-500 shadow-[0_3px_0_#c3badb]">
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </Link>

          <h1 className="mt-4 max-w-[18rem] font-display text-[32px] leading-[0.95] font-bold tracking-[-0.04em] text-balance">
            {userName}
          </h1>
          <p className="mt-2 max-w-[18rem] text-[13px] leading-snug font-bold text-white/55">
            {fromRole || becoming ? (
              <>
                {fromRole ? <span>{fromRole}</span> : null}
                {fromRole && becoming ? (
                  <span className="mx-1.5 text-[#ffc928]">→</span>
                ) : null}
                {becoming ? <span className="text-white">{becoming}</span> : null}
              </>
            ) : (
              <span>Keep climbing your Arc</span>
            )}
          </p>

          {/* XP bar */}
          <div className="mt-4 w-full max-w-[18rem]">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold text-white/40 uppercase">
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#ffc928]" strokeWidth={2.5} />
                Level progress
              </span>
              <span className="tabular-nums text-white/55">
                {xpIntoLevel}/{xpForNextLevel}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#ffc928]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={softSpring}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/profile/followers"
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold ring-1 ring-white/15 transition-colors hover:bg-white/16 focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
            >
              <Users className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
              {followerCount == null
                ? "…"
                : `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`}
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ff8a3d]/20 px-3 py-1.5 text-[11px] font-extrabold text-[#ff8a3d]">
              <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
              {weekStreak}w streak
            </span>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-6 space-y-4 rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+88px)] shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        {/* Stats board */}
        <div className="grid grid-cols-4 gap-2">
          <StatTile
            label="Streak"
            value={`${weekStreak}w`}
            icon={<Flame className="h-3.5 w-3.5" strokeWidth={2.5} />}
            tone="orange"
          />
          <StatTile
            label="XP"
            value={visibleXp.toLocaleString()}
            tone="blue"
          />
          <Link
            href="/profile/followers?tab=following"
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-2"
          >
            <StatTile
              label="Following"
              value={followingCount == null ? "…" : String(followingCount)}
              tone="purple"
            />
          </Link>
          <Link
            href="/wallet"
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2"
          >
            <StatTile
              label="Coins"
              value={visibleCoins.toLocaleString()}
              icon={<Coins className="h-3.5 w-3.5" strokeWidth={2.5} />}
              tone="gold"
            />
          </Link>
        </div>

        {/* Progress row */}
        <div className="grid grid-cols-2 gap-2.5">
          <NavCard
            href="/badges"
            icon={Award}
            iconClass="bg-[#fff3c4] text-[#c98a00]"
            title={
              badgesEarned == null ? "…" : `${badgesEarned}/${badgesTotal}`
            }
            subtitle="Badges"
          />
          <NavCard
            href="/wallet"
            icon={Gem}
            iconClass="bg-[#f6f2ff] text-[#b35cff]"
            title={visibleGems.toLocaleString()}
            subtitle="Gems"
          />
        </div>

        <SectionLabel>Compete</SectionLabel>
        <div className="space-y-2.5">
          <NavRow
            href="/leaderboard"
            icon={Trophy}
            iconClass="bg-[#fff3c4] text-[#c98a00]"
            title="League"
            subtitle="Season standings and divisions"
          />
          <BattleArenaCard />
        </div>

        <SectionLabel>Social</SectionLabel>
        <div className="space-y-2.5">
          <NavRow
            href="/profile/followers"
            icon={Users}
            iconClass="bg-[#f0ebff] text-arc-purple-500"
            title={
              followerCount == null
                ? "Followers"
                : `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`
            }
            subtitle={
              followingCount == null
                ? "Manage followers"
                : `${followingCount} following · tap to manage`
            }
          />
          <div
            className={cn(
              "grid gap-2.5",
              flags.avatar_studio_enabled ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {flags.avatar_studio_enabled ? (
              <motion.div whileTap={{ scale: 0.98 }} transition={snappySpring}>
                <Link
                  href="/avatar-studio"
                  className="flex min-h-[120px] cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[20px] bg-[#0f1220] p-4 text-left text-white shadow-[0_5px_0_#2a2f45] focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-arc-purple-500">
                    <WandSparkles className="h-5 w-5" strokeWidth={2.3} />
                  </span>
                  <span>
                    <span className="block font-display text-[15px] font-semibold">
                      Avatar Studio
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[12px] font-bold text-white/50">
                      <Coins
                        className="h-3.5 w-3.5 text-[#ffc928]"
                        strokeWidth={2.5}
                      />
                      {visibleCoins.toLocaleString()} coins
                    </span>
                  </span>
                </Link>
              </motion.div>
            ) : null}

            <motion.div whileTap={{ scale: 0.98 }} transition={snappySpring}>
              <Link
                href="/friends"
                className="flex min-h-[120px] cursor-pointer flex-col items-start justify-between rounded-[20px] border-2 border-[#ebe4f6] bg-white p-4 text-left shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff8a3d] text-white">
                  <UserPlus className="h-5 w-5" strokeWidth={2.3} />
                </span>
                <span>
                  <span className="block font-display text-[15px] font-semibold text-[#0f1220]">
                    Invite friends
                  </span>
                  <span className="mt-0.5 block text-[12px] font-bold text-[#c08359]">
                    +50 coins each
                  </span>
                </span>
              </Link>
            </motion.div>
          </div>
        </div>

        <SectionLabel>Account</SectionLabel>
        <div className="overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6]">
          <Link
            href="/settings"
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#faf8ff] focus-visible:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f2ff] text-arc-purple-500">
              <Settings className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[15px] font-semibold text-[#0f1220]">
                Settings
              </span>
              <span className="block text-[12px] font-bold text-arc-lavender-600">
                Account, privacy & language
              </span>
            </span>
            <ArrowRight
              className="h-[18px] w-[18px] shrink-0 text-arc-lavender-400"
              strokeWidth={2.5}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-0.5 text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
      {children}
    </p>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone: "orange" | "blue" | "purple" | "gold";
}) {
  const tones = {
    orange: "bg-[#ff8a3d] text-white shadow-[0_3px_0_#d46520]",
    blue: "bg-[#2d8cff] text-white shadow-[0_3px_0_#1a5fad]",
    purple: "bg-[#b35cff] text-white shadow-[0_3px_0_#7a2fc4]",
    gold: "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]",
  };
  return (
    <div className={cn("rounded-[16px] px-2 py-2.5", tones[tone])}>
      <p
        className={cn(
          "text-[9px] font-black tracking-wide uppercase",
          tone === "gold" ? "opacity-60" : "text-white/80",
        )}
      >
        {label}
      </p>
      <p className="mt-1 inline-flex min-w-0 items-center gap-0.5 font-display text-[15px] leading-none font-bold tabular-nums">
        {icon}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function NavCard({
  href,
  icon: Icon,
  iconClass,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[18px] leading-none font-bold text-[#0f1220]">
          {title}
        </p>
        <p className="mt-0.5 text-[10px] font-extrabold tracking-wide text-arc-lavender-600 uppercase">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

function NavRow({
  href,
  icon: Icon,
  iconClass,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3.5 shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[16px] leading-none font-bold text-[#0f1220]">
          {title}
        </p>
        <p className="mt-1 text-[11px] font-bold text-arc-lavender-600">
          {subtitle}
        </p>
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-arc-lavender-400"
        strokeWidth={2.5}
      />
    </Link>
  );
}

function XpRing({
  percent,
  level,
  iconAssetKey,
}: {
  percent: number;
  level: number;
  iconAssetKey?: string | null;
}) {
  const size = 108;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const rankSrc = rankImageFor(iconAssetKey);

  return (
    <div className="relative h-[108px] w-[108px]">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FFC928"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ ...softSpring, delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-[10px] overflow-hidden rounded-full bg-arc-purple-500 ring-2 ring-white/15">
        <Image
          src={rankSrc}
          alt=""
          width={96}
          height={96}
          unoptimized={isRankUploadSrc(rankSrc)}
          className="h-full w-full object-cover object-top"
          priority
        />
      </div>
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-[#ffc928] px-2 py-0.5 font-display text-[10px] font-bold text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
        {level}
      </span>
    </div>
  );
}

function BattleArenaCard() {
  const { data: stats } = useBattleStats();
  if (!stats || stats.played === 0) {
    return (
      <Link
        href="/battle"
        className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-dashed border-[#d5ccec] bg-white px-3.5 py-3.5 transition-colors hover:border-arc-purple-500/40 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4eeff] text-[#2d8cff]">
          <Swords className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-semibold text-[#0f1220]">
            Battle arena
          </span>
          <span className="block text-[12px] font-bold text-arc-lavender-600">
            Challenge friends · wager coins
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 text-arc-lavender-400"
          strokeWidth={2.5}
        />
      </Link>
    );
  }

  return (
    <Link
      href="/battle"
      className="block cursor-pointer overflow-hidden rounded-[18px] border-2 border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3 px-3.5 pt-3.5 pb-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e4eeff] text-[#2d8cff]">
          <Swords className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold text-[#0f1220]">
            Battle record
          </p>
          <p className="text-[12px] font-bold text-arc-lavender-600">
            {stats.favoriteSubject} · {stats.winStreak} streak
          </p>
        </div>
        <ArrowRight
          className="h-4 w-4 text-arc-lavender-400"
          strokeWidth={2.5}
        />
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-[#f0ecf7] px-2 py-2.5 text-center">
        <StatChip label="Played" value={String(stats.played)} />
        <StatChip label="Won" value={String(stats.wins)} tone="good" />
        <StatChip label="Lost" value={String(stats.losses)} />
        <StatChip label="Rate" value={`${stats.winRate}%`} tone="accent" />
      </div>
    </Link>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "accent";
}) {
  return (
    <div className="rounded-xl bg-[#faf8ff] px-1 py-2">
      <p
        className={cn(
          "font-display text-[15px] font-bold",
          tone === "good" && "text-[#178a52]",
          tone === "accent" && "text-arc-purple-500",
          !tone && "text-[#0f1220]",
        )}
      >
        {value}
      </p>
      <p className="text-[9px] font-black tracking-wide text-arc-lavender-600 uppercase">
        {label}
      </p>
    </div>
  );
}
