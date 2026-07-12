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
  UserPlus,
  Users,
  WandSparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "next-auth/react";
import { assets } from "@/lib/assets";
import { socialApi } from "@/lib/api/social";
import { badgesApi } from "@/lib/api/badges";
import { useBattleStats } from "@/hooks/useBattles";
import { useArcDay } from "@/hooks/useArcDay";
import { useRankMe } from "@/hooks/useRanks";
import {
  profileMockData,
  type ProfileMockData,
} from "@/lib/profile/mock-data";
import { cn } from "@/lib/utils";
import { useEconomyStore } from "@/store/useEconomyStore";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

/**
 * Profile — night hero family.
 * Giant identity + overlapping stats chips.
 */
export default function ProfileScreen({
  data = profileMockData,
}: {
  data?: ProfileMockData;
}) {
  const { data: session } = useSession();
  const { data: rankMe } = useRankMe();
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const weekStreak =
    session?.profile?.weeklyStreak ?? data.weekStreak;
  const day = useArcDay(data.day);
  const userName =
    session?.profile?.displayName ||
    session?.user?.name ||
    data.userName;

  const level = rankMe?.current.level ?? data.level;
  const xpIntoLevel =
    rankMe?.next?.xp.intoLevel ?? data.xpIntoLevel;
  const xpForNextLevel =
    rankMe?.next?.xp.forLevel ?? data.xpForNextLevel;
  const xpPercent = Math.min(
    100,
    Math.round((xpIntoLevel / Math.max(1, xpForNextLevel)) * 100),
  );

  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [badgesEarned, setBadgesEarned] = useState<number | null>(null);
  const [badgesTotal, setBadgesTotal] = useState<number>(data.badgesTotal);

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

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* PASSPORT HERO */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 55% 60%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Your Arc
            </p>
            <h1 className="mt-2 font-display text-[40px] leading-[0.92] font-bold tracking-[-0.04em]">
              {userName}
            </h1>
            <p className="mt-2.5 max-w-[15rem] text-[13px] leading-snug font-bold text-white/50">
              <span>{data.fromRole}</span>
              <span className="mx-1.5 text-[#ffc928]">→</span>
              <span className="text-white">{data.becoming}</span>
            </p>
          </div>

          <Link
            href="/identity"
            aria-label={`Edit identity for ${userName}`}
            className="relative shrink-0"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <XpRing percent={xpPercent} level={level} />
            </motion.div>
            <span className="absolute -right-0.5 -bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-arc-purple-500 shadow-[0_3px_0_#c3badb]">
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </Link>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-wide ring-1 ring-white/15">
            LVL {level}
          </span>
          <span className="rounded-full bg-[#ffc928]/20 px-3 py-1 text-[11px] font-black tracking-wide text-[#ffc928]">
            DAY {day}
          </span>
          <Link
            href="/profile/followers"
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-wide ring-1 ring-white/15"
          >
            <Users className="h-3 w-3 text-[#ffc928]" strokeWidth={2.5} />
            {followerCount == null
              ? "…"
              : `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`}
          </Link>
          <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-extrabold text-white/70">
            <Zap className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
            {xpIntoLevel}
            <span className="text-white/30">/</span>
            {xpForNextLevel}
          </span>
        </div>
      </section>

      {/* Clay stamps — Rank seam pattern, equal 4-col, no absolute crush */}
      <div className="relative z-20 -mt-7 px-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="-rotate-1 rounded-2xl bg-[#ff8a3d] px-2.5 py-2.5 shadow-[0_4px_0_#d46520]">
            <p className="text-[9px] font-black tracking-wide text-white/80 uppercase">
              Streak
            </p>
            <p className="mt-1 inline-flex items-center gap-1 font-display text-[17px] leading-none font-bold text-white tabular-nums">
              <Flame className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              {weekStreak}w
            </p>
          </div>
          <div className="rotate-1 rounded-2xl bg-[#2d8cff] px-2.5 py-2.5 shadow-[0_4px_0_#1a5fad]">
            <p className="text-[9px] font-black tracking-wide text-white/80 uppercase">
              XP
            </p>
            <p className="mt-1 font-display text-[17px] leading-none font-bold text-white tabular-nums">
              {xp.toLocaleString()}
            </p>
          </div>
          <Link
            href="/profile/followers?tab=following"
            className="-rotate-1 rounded-2xl bg-[#b35cff] px-2.5 py-2.5 shadow-[0_4px_0_#7a2fc4]"
          >
            <p className="text-[9px] font-black tracking-wide text-white/80 uppercase">
              Follow
            </p>
            <p className="mt-1 font-display text-[17px] leading-none font-bold text-white tabular-nums">
              {followingCount == null ? "…" : followingCount}
            </p>
          </Link>
          <Link
            href="/wallet"
            className="rotate-1 rounded-2xl bg-[#ffc928] px-2.5 py-2.5 text-[#0f1220] shadow-[0_4px_0_#c79a2e]"
          >
            <p className="text-[9px] font-black tracking-wide opacity-60 uppercase">
              Coins
            </p>
            <p className="mt-1 inline-flex min-w-0 items-center gap-0.5 font-display text-[15px] leading-none font-bold tabular-nums">
              <Coins className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{coins.toLocaleString()}</span>
            </p>
          </Link>
        </div>
      </div>

      <div className="relative z-10 bg-[#f3effc] px-4 pt-4 pb-8">
        <div className="relative space-y-4">
        {/* Badges + gems */}
        <div className="flex gap-2.5">
          <Link
            href="/badges"
            className="flex flex-1 items-center gap-3 rounded-[20px] border border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_12px_28px_rgba(70,40,150,0.08)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff3c4] text-[#c98a00]">
              <Award className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div>
              <p className="font-display text-[18px] leading-none font-bold text-[#1b1730]">
                {badgesEarned == null ? "…" : badgesEarned}
                <span className="text-[#8a7cb8]">/{badgesTotal}</span>
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
                Badges
              </p>
            </div>
          </Link>
          <Link
            href="/wallet"
            className="flex flex-1 items-center gap-3 rounded-[20px] border border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_12px_28px_rgba(70,40,150,0.08)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6f2ff] text-[#b35cff]">
              <Gem className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div>
              <p className="font-display text-[18px] leading-none font-bold text-[#1b1730]">
                {gems.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
                Gems
              </p>
            </div>
          </Link>
        </div>

        <Link
          href="/profile/followers"
          className="flex items-center gap-3 rounded-[20px] border border-[#ebe4f6] bg-white px-3.5 py-3.5 shadow-[0_12px_28px_rgba(70,40,150,0.08)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0ebff] text-arc-purple-500">
            <Users className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[16px] leading-none font-bold text-[#1b1730]">
              {followerCount == null
                ? "…"
                : `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`}
            </p>
            <p className="mt-1 text-[11px] font-bold text-[#8a7cb8]">
              {followingCount == null ? "…" : followingCount} following · tap to
              manage
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#b3a8d6]" strokeWidth={2.5} />
        </Link>

        <ActionTwinRow coins={coins} />

        <BattleArenaCard />

        <UtilityList plan={data.plan} />
        </div>
      </div>
    </div>
  );
}

function XpRing({ percent, level }: { percent: number; level: number }) {
  const size = 108;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

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
          src={assets.arlo.thumbsUp}
          alt=""
          width={96}
          height={96}
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

function ActionTwinRow({ coins }: { coins: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <motion.div whileTap={{ scale: 0.98 }} transition={snappySpring}>
        <Link
          href="/avatar-studio"
          className="flex min-h-[132px] flex-col items-start justify-between overflow-hidden rounded-[22px] bg-[#0f1220] p-4 text-left text-white shadow-[0_10px_24px_rgba(15,18,32,0.25)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-arc-purple-500">
            <WandSparkles className="h-5 w-5" strokeWidth={2.3} />
          </span>
          <span>
            <span className="block font-display text-[15px] font-semibold">
              Avatar Studio
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] font-bold text-white/50">
              <Coins className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
              {coins.toLocaleString()} coins
            </span>
          </span>
        </Link>
      </motion.div>

      <motion.div whileTap={{ scale: 0.98 }} transition={snappySpring}>
        <Link
          href="/friends"
          className="flex min-h-[132px] flex-col items-start justify-between rounded-[22px] border border-[#ebe4f6] bg-white p-4 text-left shadow-[0_8px_20px_rgba(70,40,150,0.08)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff8a3d] text-white">
            <UserPlus className="h-5 w-5" strokeWidth={2.3} />
          </span>
          <span>
            <span className="block font-display text-[15px] font-semibold text-[#1b1730]">
              Invite friends
            </span>
            <span className="mt-0.5 block text-[12px] font-bold text-[#c08359]">
              +50 coins each
            </span>
          </span>
        </Link>
      </motion.div>
    </div>
  );
}

function BattleArenaCard() {
  const { data: stats } = useBattleStats();
  if (!stats || stats.played === 0) {
    return (
      <Link
        href="/battle"
        className="flex items-center gap-3 rounded-[22px] border border-dashed border-[#d5ccec] bg-white px-4 py-3.5"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4eeff] text-[#2d8cff]">
          <Swords className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-semibold text-[#1b1730]">
            Battle arena
          </span>
          <span className="block text-[12px] font-bold text-[#8a7cb8]">
            Challenge friends · wager coins
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-[#c3badb]" strokeWidth={2.5} />
      </Link>
    );
  }

  return (
    <Link
      href="/battle"
      className="block overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_24px_rgba(70,40,150,0.06)]"
    >
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e4eeff] text-[#2d8cff]">
          <Swords className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold text-[#1b1730]">
            Battle record
          </p>
          <p className="text-[12px] font-bold text-[#8a7cb8]">
            {stats.favoriteSubject} · {stats.winStreak} streak
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-[#c3badb]" strokeWidth={2.5} />
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
          !tone && "text-[#1b1730]",
        )}
      >
        {value}
      </p>
      <p className="text-[9px] font-black tracking-wide text-[#8a7cb8] uppercase">
        {label}
      </p>
    </div>
  );
}

function UtilityList({ plan: _plan }: { plan: ProfileMockData["plan"] }) {
  const items: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    href: string;
  }[] = [
    // TEMP: hide Core plan row until billing ships
    // {
    //   icon: CreditCard,
    //   title: `${_plan.name} · ${_plan.price}`,
    //   subtitle: _plan.teaser,
    //   href: "/plan",
    // },
    {
      icon: Settings,
      title: "Settings",
      subtitle: "Account, privacy & language",
      href: "/settings",
    },
  ];

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_24px_rgba(70,40,150,0.06)]">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-[#faf8ff]",
              i < items.length - 1 && "border-b border-[#f0ecf7]",
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f2ff] text-arc-purple-500">
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[15px] font-semibold text-[#1b1730]">
                {item.title}
              </span>
              <span className="block text-[12px] font-bold text-[#8a7cb8]">
                {item.subtitle}
              </span>
            </span>
            <ArrowRight
              className="h-[18px] w-[18px] shrink-0 text-[#c3badb]"
              strokeWidth={2.5}
            />
          </Link>
        );
      })}
    </div>
  );
}
