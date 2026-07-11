"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Bell,
  ChevronRight,
  Coins,
  Flame,
  Gem,
  MessageCircle,
  Moon,
  Play,
  Sparkles,
  Star,
  Sun,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import {
  greetingForHour,
  homeMockData,
  type HomeMockData,
} from "@/lib/home/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Home — coach arena.
 * UX: one primary next action in 5s. Week commitment second. Rewards/social tertiary.
 * Composition: compact coach band → mission slug → week rail → offset tiles.
 */
export default function HomeScreen({
  data = homeMockData,
}: {
  data?: HomeMockData;
}) {
  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = useMemo(() => greetingForHour(hour), [hour]);
  const TimeIcon = hour < 12 ? Sun : hour < 17 ? Sparkles : Moon;

  const sessionsLeft =
    data.weeklyProgress.sessionsPlanned - data.weeklyProgress.sessionsDone;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* ── COACH ARENA ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0f1220] pt-[calc(env(safe-area-inset-top)+12px)] text-white">
        {/* Atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-16 h-80 w-80 rounded-full bg-arc-purple-500/40 blur-[72px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 -left-20 h-56 w-56 rounded-full bg-[#ffc928]/12 blur-[60px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 78% 12%, #fff, transparent), radial-gradient(1px 1px at 42% 48%, #fff, transparent), radial-gradient(1.5px 1.5px at 88% 62%, #fff, transparent)",
          }}
        />
        {/* Diagonal stage wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,transparent_40%,rgba(107,78,255,0.18)_72%,transparent_100%)]"
        />

        {/* Chrome */}
        <div className="relative flex items-center gap-2 px-4">
          <Link href="/home" className="flex min-w-0 items-center gap-2">
            <Image
              src={assets.brand.logoMark}
              alt="Arc"
              width={34}
              height={34}
              className="h-[34px] w-[34px] rounded-xl object-cover ring-1 ring-white/15"
              priority
            />
            <span className="font-display text-[18px] leading-none font-bold tracking-[-0.03em]">
              Arc
            </span>
          </Link>

          <div className="flex-1" />

          <Link
            href="/wallet"
            aria-label="Wallet"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pr-2.5 pl-1.5 ring-1 ring-white/15"
          >
            <Coins className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
            <span className="text-[11px] font-extrabold tabular-nums">
              {data.stats.coins.toLocaleString()}
            </span>
            <span className="h-3 w-px bg-white/20" aria-hidden />
            <Gem className="h-3.5 w-3.5 text-[#d4a0ff]" strokeWidth={2.5} />
            <span className="text-[11px] font-extrabold tabular-nums">
              {data.stats.gems.toLocaleString()}
            </span>
          </Link>

          <Link
            href="/notifications"
            aria-label={`Notifications, ${data.notificationCount} unread`}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"
          >
            <Bell className="h-5 w-5" strokeWidth={2.25} />
            {data.notificationCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#ff8a3d] px-[3px] text-[10px] font-extrabold text-white">
                {data.notificationCount}
              </span>
            ) : null}
          </Link>
        </div>

        {/* Compact coach band — greeting + goal + whisper; Arlo bust peeks right */}
        <div className="relative mt-3 grid grid-cols-[1fr_96px] items-center gap-1 px-4">
          <motion.div
            className="min-w-0"
            {...fadeUp}
            transition={{ ...softSpring, delay: 0.05 }}
          >
            <p className="inline-flex items-center gap-1 text-[10px] font-bold text-white/45">
              <TimeIcon
                className="h-3 w-3 text-[#ffc928]"
                strokeWidth={2.5}
              />
              {greeting}, {data.userName}
            </p>
            <p className="mt-1 truncate font-display text-[17px] leading-tight font-bold tracking-[-0.03em]">
              {data.outcomeLine}
            </p>

            {/* Whisper chip — not tall speech card */}
            <div className="relative z-[2] mt-2 -mr-8 max-w-[240px] rounded-[14px] rounded-br-sm bg-white/95 px-2.5 py-1.5 text-[#1b1730] shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
              <p className="line-clamp-2 text-[11px] leading-snug font-bold">
                {data.arloSays.quote}
              </p>
              <span
                aria-hidden
                className="absolute -right-1 bottom-2 h-2.5 w-2.5 rotate-45 bg-white/95"
              />
            </div>
          </motion.div>

          <motion.div
            className="relative -mr-3 h-[112px] justify-self-end"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              aria-hidden
              className="absolute bottom-1 left-1/2 h-6 w-16 -translate-x-1/2 rounded-full bg-arc-purple-500/45 blur-lg"
            />
            <Image
              src={assets.arlo.home}
              alt=""
              width={110}
              height={112}
              className="relative z-[1] h-full w-auto object-contain object-bottom drop-shadow-[0_12px_20px_rgba(0,0,0,0.4)]"
              priority
            />
          </motion.div>
        </div>

        {/* PRIMARY: compact mission slug */}
        <div className="relative z-[3] mt-3 px-4 pb-3">
          <MissionDock mission={data.mission} sessionsLeft={sessionsLeft} />
        </div>
      </section>

      {/* ── LIGHT SHEET ─────────────────────────────────────────── */}
      <div className="relative z-[1] space-y-3 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+110px)]">
        <motion.div {...fadeUp} transition={{ ...softSpring, delay: 0.12 }}>
          <WeekRail
            progress={data.weeklyProgress}
            streak={data.weeklyStreak}
            sessionsLeft={sessionsLeft}
          />
        </motion.div>

        {/* Offset reward tiles — rank heavy, wheel tilted */}
        <motion.div
          className="grid grid-cols-[1.35fr_1fr] items-stretch gap-2.5"
          {...fadeUp}
          transition={{ ...softSpring, delay: 0.18 }}
        >
          <Link
            href="/rank"
            className="relative flex items-center gap-3 overflow-hidden rounded-[22px] bg-[#0f1220] p-3.5 text-white shadow-[0_12px_28px_rgba(15,18,32,0.22)]"
          >
            <div
              aria-hidden
              className="absolute -right-6 -bottom-8 h-24 w-24 rounded-full bg-[#ffc928]/15 blur-2xl"
            />
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Image
                  src={assets.home.ninja}
                  alt=""
                  width={34}
                  height={38}
                  className="h-auto w-[34px]"
                />
              </div>
              <span className="absolute -right-1 -bottom-1 rounded-full bg-[#ffc928] px-1.5 text-[9px] font-black text-[#0f1220]">
                Lv {data.stats.level}
              </span>
            </div>
            <div className="relative min-w-0 flex-1">
              <p className="text-[9px] font-black tracking-wide text-[#ffc928] uppercase">
                Rank
              </p>
              <p className="truncate font-display text-[15px] font-bold">
                {data.stats.rank}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full rounded-full bg-[#ffc928]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.round(
                      (data.stats.xpIntoLevel / data.stats.xpForLevel) * 100,
                    )}%`,
                  }}
                  transition={{ ...softSpring, delay: 0.35 }}
                />
              </div>
              <p className="mt-1 text-[10px] font-bold text-white/45">
                {data.stats.xpIntoLevel}/{data.stats.xpForLevel} XP
              </p>
            </div>
          </Link>

          <Link
            href="/lucky-wheel"
            className="relative -mt-2 rotate-[2.5deg] overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white p-3.5 shadow-[0_10px_24px_rgba(70,40,150,0.1)]"
          >
            <div
              aria-hidden
              className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-[#fff1bf]/80"
            />
            <Image
              src={assets.home.wheel}
              alt=""
              width={36}
              height={36}
              className="relative h-9 w-9 object-contain"
            />
            <p className="relative mt-2 text-[9px] font-black tracking-wide text-[#8a7cb8] uppercase">
              Free spin
            </p>
            <p className="relative font-display text-[14px] leading-tight font-bold text-[#1b1730]">
              {data.dailyBonus.title}
            </p>
          </Link>
        </motion.div>

        {/* Milestone path — linear ticks, not another equal card */}
        <motion.div {...fadeUp} transition={{ ...softSpring, delay: 0.22 }}>
          <Link
            href={data.mission.href}
            className="relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-white px-3.5 py-3.5 shadow-[0_8px_20px_rgba(70,40,150,0.06)] ring-1 ring-[#ebe4f6]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f2ff]">
              <Image
                src={assets.home.chest}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black tracking-wide text-[#8a7cb8] uppercase">
                Milestone · {data.milestone.stepsDone}/
                {data.milestone.stepsTotal}
              </p>
              <p className="truncate font-display text-[14px] font-bold text-[#1b1730]">
                {data.milestone.subtitle}
              </p>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: data.milestone.stepsTotal }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        i < data.milestone.stepsDone
                          ? "bg-arc-purple-500"
                          : "bg-[#ebe4f6]",
                      )}
                    />
                  ),
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#c3badb]" />
          </Link>
        </motion.div>

        {/* League proof strip */}
        <motion.div {...fadeUp} transition={{ ...softSpring, delay: 0.26 }}>
          <Link
            href="/leaderboard"
            className="flex items-center gap-3 rounded-[18px] px-1 py-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff]">
              <Trophy className="h-5 w-5 text-[#2d8cff]" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[14px] font-bold text-[#1b1730]">
                {data.leaderboard.league}
              </p>
              <p className="text-[11px] font-bold text-[#8a7cb8]">
                {data.leaderboard.endsIn} · climb with today&apos;s lesson
              </p>
            </div>
            <div className="flex">
              {data.leaderboard.peers.map((peer, i) => (
                <div
                  key={peer.initial}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f3effc] text-[9px] font-extrabold text-white",
                    i > 0 && "-ml-2",
                  )}
                  style={{ background: peer.color }}
                >
                  {peer.initial}
                </div>
              ))}
            </div>
            <ChevronRight className="h-4 w-4 text-[#c3badb]" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function MissionDock({
  mission,
  sessionsLeft,
}: {
  mission: HomeMockData["mission"];
  sessionsLeft: number;
}) {
  const pct = mission.progressPercent;
  const circumference = 2 * Math.PI * 18;
  const arloHref = `${mission.href}/arlo`;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...softSpring, delay: 0.08 }}
    >
      {/* Compact mission slug — whole strip = primary CTA */}
      <div className="relative">
        <motion.div whileTap={{ scale: 0.985, y: 1 }} transition={snappySpring}>
          <Link
            href={mission.href}
            className="relative flex items-center gap-3 overflow-hidden rounded-[22px] bg-[#faf8ff] py-3 pr-3 pl-3 text-[#1b1730] shadow-[0_-6px_28px_rgba(0,0,0,0.32)] ring-1 ring-white/40"
          >
            {/* Progress-hugged play orb */}
            <div className="relative h-12 w-12 shrink-0">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                className="-rotate-90"
                aria-hidden
              >
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="#ebe4f6"
                  strokeWidth="3.5"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="#6B4EFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{
                    strokeDashoffset: circumference * (1 - pct / 100),
                  }}
                  transition={{ ...softSpring, delay: 0.12 }}
                />
              </svg>
              <span className="absolute inset-[7px] flex items-center justify-center rounded-full bg-arc-purple-500 shadow-[0_3px_0_#4b2fd6]">
                <Play className="h-3.5 w-3.5 fill-white text-white" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="-rotate-1 rounded bg-[#0f1220] px-1.5 py-0.5 text-[8px] font-black tracking-wide text-[#ffc928] uppercase">
                  Next
                </span>
                <span className="truncate text-[10px] font-bold text-[#8a7cb8]">
                  {mission.minutes}m · {mission.track}
                </span>
              </div>
              <h1 className="mt-0.5 truncate font-display text-[16px] leading-tight font-bold tracking-[-0.02em]">
                {mission.title}
              </h1>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#9a6a00]">
                  <Star className="h-2.5 w-2.5 fill-current" />+{mission.xp}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-arc-purple-500">
                  <Gem className="h-2.5 w-2.5" />+{mission.gems}
                </span>
                {sessionsLeft > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#ff8a3d]">
                    <Flame
                      className="h-2.5 w-2.5"
                      fill="currentColor"
                      strokeWidth={1.5}
                    />
                    {sessionsLeft} left
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-[#16a56b]">
                    Locked
                  </span>
                )}
                <span className="ml-auto text-[10px] font-black text-arc-purple-500 tabular-nums">
                  {pct}%
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Arlo chip — floats off strip */}
        <Link
          href={arloHref}
          aria-label="Ask Arlo about this lesson"
          className="absolute -top-2.5 -right-1 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-white text-arc-purple-500 shadow-[0_3px_10px_rgba(70,40,150,0.22)] ring-1 ring-[#ebe4f6]"
        >
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
        </Link>
      </div>
    </motion.div>
  );
}

function WeekRail({
  progress,
  streak,
  sessionsLeft,
}: {
  progress: HomeMockData["weeklyProgress"];
  streak: HomeMockData["weeklyStreak"];
  sessionsLeft: number;
}) {
  const nextEmpty = streak.days.findIndex((d) => d.status === "empty");

  return (
    <Link
      href="/week"
      className="relative block overflow-hidden rounded-[24px] border border-[#ebe4f6] bg-white shadow-[0_10px_24px_rgba(70,40,150,0.06)]"
    >
      {/* Flame badge — offset left, overlaps edge */}
      <div className="absolute -top-1 -left-1 z-[1] -rotate-6 rounded-[18px] bg-[#ff8a3d] px-3 py-2.5 text-center text-white shadow-[0_4px_0_#d46520]">
        <Flame
          className="mx-auto h-4 w-4"
          fill="currentColor"
          strokeWidth={1.5}
        />
        <p className="font-display text-[20px] leading-none font-bold">
          {streak.weeks}
        </p>
        <p className="text-[8px] font-extrabold tracking-wide uppercase opacity-90">
          weeks
        </p>
      </div>

      <div className="pl-[72px] pr-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black tracking-wide text-[#8a7cb8] uppercase">
            This week
          </p>
          {progress.onTrack ? (
            <span className="rounded-full bg-[#eef9f3] px-2 py-0.5 text-[10px] font-extrabold text-[#16a56b]">
              On track
            </span>
          ) : (
            <span className="rounded-full bg-[#fff1e6] px-2 py-0.5 text-[10px] font-extrabold text-[#ff8a3d]">
              Catch up
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-[16px] leading-snug font-bold text-[#1b1730]">
          {sessionsLeft > 0
            ? `${sessionsLeft} session${sessionsLeft === 1 ? "" : "s"} to lock week ${streak.weeks + 1}`
            : `Week ${streak.weeks} locked — nice work`}
        </p>
        <p className="mt-0.5 text-[12px] font-bold text-[#8a7cb8]">
          {progress.hoursDone}/{progress.hoursPlanned} hrs ·{" "}
          {progress.sessionsDone}/{progress.sessionsPlanned} sessions
        </p>
      </div>

      <div className="border-t border-[#f0ecf7] bg-[#faf8ff] px-3.5 py-2.5">
        <div className="flex gap-1.5">
          {streak.days.map((day, i) => {
            const isNext = i === nextEmpty;
            return (
              <div key={day.label} className="min-w-0 flex-1 text-center">
                <div
                  className={cn(
                    "mx-auto h-2 w-full max-w-[28px] rounded-full",
                    day.status === "done" && "bg-[#16a56b]",
                    day.status === "empty" && !isNext && "bg-[#ebe4f6]",
                    isNext &&
                      "bg-arc-purple-500 shadow-[0_0_0_3px_rgba(107,78,255,0.2)]",
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 text-[9px] font-extrabold",
                    day.status === "done" && "text-[#16a56b]",
                    isNext && "text-arc-purple-500",
                    day.status === "empty" && !isNext && "text-[#c3badb]",
                  )}
                >
                  {day.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
