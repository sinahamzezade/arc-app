"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  ChevronRight,
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
import { isRankUploadSrc, rankAvatarSrc, rankImageFor } from "@/lib/rank/icons";
import { cn } from "@/lib/utils";
import { useEconomyStore } from "@/store/useEconomyStore";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import type { RankMeResponse } from "@/lib/api/ranks";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Profile — clay passport plate + quiet action sheet.
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
  const identityLine =
    fromRole || becoming
      ? [fromRole, becoming].filter(Boolean).join(" → ")
      : "Keep climbing with Arlo";

  const [followerCount, setFollowerCount] = useState<number | null>(
    initialSocial?.followers ?? null,
  );
  const [followingCount, setFollowingCount] = useState<number | null>(
    initialSocial?.following ?? null,
  );
  const [badgesEarned, setBadgesEarned] = useState<number | null>(
    initialBadges?.earned ?? null,
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
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-7 text-white">
        <div className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-arc-purple-500 shadow-[0_7px_0_#35209d]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 -right-6 h-28 w-28 rounded-full bg-[#ffc928]/25 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-[#0f1220]/35 blur-2xl"
          />

          <div className="relative flex items-start justify-between gap-3 px-3.5 pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold tracking-[0.16em] text-white/55 uppercase">
                Your Arlo
              </p>
              <p className="mt-0.5 truncate text-[12px] font-bold text-white/70">
                Day {day} · LVL {level}
              </p>
            </div>
            <Link
              href="/settings"
              aria-label="Open settings"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-[3px] border-[#0a0c16] bg-[#0f1220] text-white shadow-[0_3px_0_#0a0c16] transition-[transform,box-shadow] duration-200 hover:translate-y-px hover:shadow-[0_2px_0_#0a0c16] active:translate-y-[2px] active:shadow-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
            >
              <Settings className="h-5 w-5" strokeWidth={2.5} />
            </Link>
          </div>

          <div className="relative mt-3 flex gap-3 px-3.5">
            <Link
              href="/identity"
              aria-label={`Edit identity for ${userName}`}
              className="relative shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-arc-purple-500"
            >
              <div className="rounded-[22px] border-[3px] border-[#0a0c16] bg-[#0f1220] p-1.5 shadow-[0_4px_0_#0a0c16]">
                <XpRing
                  percent={xpPercent}
                  level={level}
                  iconAssetKey={rankMe?.current.iconAssetKey}
                  avatarUrl={session?.profile?.avatarUrl}
                  size={72}
                />
              </div>
              <span className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#0a0c16] bg-white text-arc-purple-500 shadow-[0_2px_0_#0a0c16]">
                <Pencil className="h-3 w-3" strokeWidth={2.5} />
              </span>
            </Link>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-extrabold tracking-[0.18em] text-white/55 uppercase">
                Callsign
              </p>
              <h1 className="mt-0.5 truncate font-display text-[26px] leading-[0.95] font-bold tracking-[-0.045em]">
                {userName}
              </h1>
              <div className="mt-2 inline-flex max-w-full items-center rounded-full border-[3px] border-[#0a0c16] bg-[#0f1220] px-2.5 py-1 shadow-[0_3px_0_#0a0c16]">
                <span className="truncate font-display text-[11px] font-bold text-[#ffc928]">
                  {identityLine}
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-3.5 mt-3.5">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold text-white/45 uppercase">
              <span className="inline-flex items-center gap-1">
                <Zap
                  className="h-3 w-3 text-[#ffc928]"
                  strokeWidth={2.5}
                  fill="currentColor"
                />
                Level
              </span>
              <span className="tabular-nums text-white/60">
                {xpIntoLevel}/{xpForNextLevel}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full border-[2px] border-[#0a0c16] bg-[#0f1220]">
              <motion.div
                className="h-full rounded-full bg-[#ffc928]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={softSpring}
              />
            </div>
          </div>

          {/* Equal economy stamps */}
          <div className="relative mx-3.5 mt-3 mb-3.5 grid grid-cols-4 gap-1.5">
            <StatStamp
              label="Streak"
              value={`${weekStreak}w`}
              icon={
                <Flame
                  className="h-3.5 w-3.5 text-[#ff8a3d]"
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              }
            />
            <StatStamp
              label="XP"
              value={visibleXp.toLocaleString()}
              icon={
                <Zap
                  className="h-3.5 w-3.5 text-[#7eb8ff]"
                  strokeWidth={2.5}
                  fill="currentColor"
                />
              }
            />
            <StatStamp
              href="/profile/followers?tab=following"
              label="Following"
              value={followingCount == null ? "…" : String(followingCount)}
              icon={
                <Users
                  className="h-3.5 w-3.5 text-[#e4c4ff]"
                  strokeWidth={2.5}
                />
              }
            />
            <StatStamp
              href="/wallet"
              label="Coins"
              value={visibleCoins.toLocaleString()}
              icon={
                <Coins
                  className="h-3.5 w-3.5 text-[#ffc928]"
                  strokeWidth={2.5}
                />
              }
            />
          </div>
        </div>

        <nav
          aria-label="Quick signals"
          className="mt-3 flex items-center justify-between gap-1 px-0.5"
        >
          <QuietPort
            href="/profile/followers"
            title="Followers"
            icon={<Users className="h-3.5 w-3.5" strokeWidth={2.25} />}
            count={followerCount ?? 0}
          />
          <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
          <QuietPort
            href="/wallet"
            title="Gems"
            icon={<Gem className="h-3.5 w-3.5" strokeWidth={2.25} />}
            count={visibleGems}
          />
          <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
          <QuietPort
            href="/badges"
            title="Badges"
            icon={<Award className="h-3.5 w-3.5" strokeWidth={2.25} />}
            count={badgesEarned ?? 0}
          />
        </nav>
      </header>

      <div className="relative z-10 -mt-6 space-y-4 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+88px)]">
        <section className="space-y-2" aria-label="Compete">
          <SectionLabel>Compete</SectionLabel>
          <div className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
            <SheetLink
              href="/leaderboard"
              icon={Trophy}
              title="League"
              sub="Season standings and divisions"
            />
            <BattleArenaCard />
          </div>
        </section>

        <section className="space-y-2" aria-label="Social">
          <SectionLabel>Social</SectionLabel>
          <div className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
            <SheetLink
              href="/profile/followers"
              icon={Users}
              title={
                followerCount == null
                  ? "Followers"
                  : `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`
              }
              sub={
                followingCount == null
                  ? "Manage followers"
                  : `${followingCount} following · tap to manage`
              }
              last
            />
          </div>
          <div
            className={cn(
              "grid gap-2",
              flags.avatar_studio_enabled ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {flags.avatar_studio_enabled ? (
              <ActionTile
                href="/avatar-studio"
                icon={WandSparkles}
                title="Avatar Studio"
                sub={`${visibleCoins.toLocaleString()} coins`}
              />
            ) : null}
            <ActionTile
              href="/friends"
              icon={UserPlus}
              title="Invite friends"
              sub="+50 coins each"
            />
          </div>
        </section>

        <section className="space-y-2" aria-label="Account">
          <SectionLabel>Account</SectionLabel>
          <div className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
            <SheetLink
              href="/settings"
              icon={Settings}
              title="Settings"
              sub="Account, privacy, calls & language"
              last
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-0.5 text-[10px] font-extrabold tracking-[0.14em] text-arc-lavender-600 uppercase">
      {children}
    </p>
  );
}

function SheetLink({
  href,
  icon: Icon,
  title,
  sub,
  last,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  sub: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 px-3 py-3 transition-colors hover:bg-[#faf8ff]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500",
        !last && "border-b border-[#f0ecf7]",
      )}
    >
      <Icon
        className="h-4 w-4 shrink-0 text-arc-lavender-500"
        strokeWidth={2.25}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-[#0f1220]">
          {title}
        </span>
        <span className="block truncate text-[10px] font-semibold text-arc-lavender-600">
          {sub}
        </span>
      </span>
      <ChevronRight
        className="h-3.5 w-3.5 shrink-0 text-arc-lavender-400"
        strokeWidth={2.5}
      />
    </Link>
  );
}

function ActionTile({
  href,
  icon: Icon,
  title,
  sub,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[96px] cursor-pointer flex-col justify-between rounded-[18px] border border-[#ebe4f6] bg-white px-3 py-3",
        "transition-colors hover:border-arc-purple-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
      )}
    >
      <Icon className="h-4 w-4 text-arc-lavender-500" strokeWidth={2.25} />
      <span>
        <span className="block truncate font-display text-[14px] font-bold tracking-[-0.02em] text-[#0f1220]">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-semibold text-arc-lavender-600">
          {sub}
        </span>
      </span>
    </Link>
  );
}

function StatStamp({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <p className="flex items-center gap-0.5 text-[8px] font-extrabold tracking-[0.08em] text-white/45 uppercase">
        {icon}
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1 truncate font-display text-[14px] leading-none font-bold text-white tabular-nums">
        {value}
      </p>
    </>
  );
  const className = cn(
    "min-w-0 rounded-lg border-[3px] border-[#0a0c16] bg-[#0f1220] px-1.5 py-2 shadow-[0_4px_0_#0a0c16]",
    href &&
      "cursor-pointer transition-[transform,box-shadow] duration-200 hover:translate-y-px hover:shadow-[0_3px_0_#0a0c16] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-arc-purple-500",
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${label} ${value}`} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function QuietPort({
  href,
  title,
  icon,
  count,
}: {
  href: string;
  title: string;
  icon: ReactNode;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-label={`${title}, ${count}`}
      className={cn(
        "relative flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-1 py-1.5",
        "text-white/45 transition-colors duration-200",
        "hover:bg-white/5 hover:text-white/75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]/60",
      )}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="truncate text-[11px] font-semibold tracking-tight">
        {title}
      </span>
      <span className="shrink-0 rounded-md bg-white/10 px-1 py-px text-[9px] font-bold tabular-nums text-white/70">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}

function XpRing({
  percent,
  level,
  iconAssetKey,
  avatarUrl,
  size = 108,
}: {
  percent: number;
  level: number;
  iconAssetKey?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  const stroke = size >= 100 ? 6 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const photoSrc = rankAvatarSrc(avatarUrl);
  const src = photoSrc ?? rankImageFor(iconAssetKey);
  const inset = Math.round(size * 0.09);

  return (
    <div className="relative" style={{ width: size, height: size }}>
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
      <div
        className="absolute overflow-hidden rounded-full bg-arc-purple-500 ring-2 ring-white/15"
        style={{ inset }}
      >
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized={isRankUploadSrc(src)}
          className="h-full w-full object-cover object-top"
          priority
        />
      </div>
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full border-[2px] border-[#0a0c16] bg-[#ffc928] px-1.5 py-px font-display text-[10px] font-bold text-[#0f1220] shadow-[0_2px_0_#c79a2e]">
        {level}
      </span>
    </div>
  );
}

function BattleArenaCard() {
  const { data: stats } = useBattleStats();

  if (!stats || stats.played === 0) {
    return (
      <SheetLink
        href="/battle"
        icon={Swords}
        title="Battle arena"
        sub="Challenge friends · wager coins"
        last
      />
    );
  }

  return (
    <Link
      href="/battle"
      className={cn(
        "block cursor-pointer px-3 py-3 transition-colors hover:bg-[#faf8ff]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Swords
          className="h-4 w-4 shrink-0 text-arc-lavender-500"
          strokeWidth={2.25}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-[#0f1220]">
            Battle record
          </span>
          <span className="block truncate text-[10px] font-semibold text-arc-lavender-600">
            {stats.favoriteSubject} · {stats.winStreak} streak
          </span>
        </span>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-arc-lavender-400"
          strokeWidth={2.5}
        />
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        <MiniStat label="Played" value={String(stats.played)} />
        <MiniStat label="Won" value={String(stats.wins)} />
        <MiniStat label="Lost" value={String(stats.losses)} />
        <MiniStat label="Rate" value={`${stats.winRate}%`} />
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-[#faf8ff] px-1 py-1.5 text-center">
      <p className="truncate font-display text-[13px] font-bold tabular-nums text-[#0f1220]">
        {value}
      </p>
      <p className="truncate text-[8px] font-extrabold tracking-[0.08em] text-arc-lavender-600 uppercase">
        {label}
      </p>
    </div>
  );
}
