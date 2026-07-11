"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  Award,
  Bell,
  ChevronRight,
  Clock,
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

const pageStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.065, delayChildren: 0.03 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

const fadeDown = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

export default function HomeScreen({ data = homeMockData }: { data?: HomeMockData }) {
  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = useMemo(() => greetingForHour(hour), [hour]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-[#f4f1fa] font-rounded">
      <AppHeader
        notificationCount={data.notificationCount}
        xp={data.stats.xp}
        gems={data.stats.gems}
      />

      <motion.div
        className="px-[18px] pt-3 pb-4"
        variants={pageStagger}
        initial="hidden"
        animate="visible"
      >
        <HomeHero
          greeting={greeting}
          hour={hour}
          name={data.userName}
          tagline={data.tagline}
        />

        <TodaysMissionCard mission={data.mission} />

        <WeeklyPulseSection
          progress={data.weeklyProgress}
          streak={data.weeklyStreak}
        />

        <StatsBar stats={data.stats} />

        <RewardsRail milestone={data.milestone} bonus={data.dailyBonus} />

        <ArloSaysCard arloSays={data.arloSays} />

        <SocialRail badges={data.badges} leaderboard={data.leaderboard} />
      </motion.div>
    </div>
  );
}

function AppHeader({
  notificationCount,
  xp,
  gems,
}: {
  notificationCount: number;
  xp: number;
  gems: number;
}) {
  return (
    <motion.header
      className="sticky top-0 z-20 border-b border-[#ebe4f6]/bg-[#f4f1fa]/80 px-[18px] pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5 backdrop-blur-xl"
      initial="hidden"
      animate="visible"
      variants={fadeDown}
    >
      <div className="flex items-center gap-2">
        <Link href="/home" className="flex min-w-0 items-center gap-2">
          <Image
            src={assets.brand.logoMark}
            alt="Arc"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-cover shadow-[0_6px_14px_-4px_rgba(91,46,224,0.45)]"
            priority
          />
          <span className="font-display text-[22px] leading-none font-bold tracking-[-0.03em] text-[#1b1730]">
            Arc
          </span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 rounded-full border border-[#ebe4f6] bg-white/90 py-1 pr-2.5 pl-1.5 shadow-[0_4px_12px_rgba(70,40,150,0.06)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8f1ff]">
            <Star className="h-3.5 w-3.5 fill-[#2d8cff] text-[#2d8cff]" />
          </span>
          <span className="text-[12px] font-extrabold text-[#1b1730]">
            {xp.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[#ebe4f6] bg-white/90 py-1 pr-2.5 pl-1.5 shadow-[0_4px_12px_rgba(70,40,150,0.06)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3e8ff]">
            <Gem className="h-3.5 w-3.5 text-arc-gem-500" strokeWidth={2.5} />
          </span>
          <span className="text-[12px] font-extrabold text-[#1b1730]">
            {gems.toLocaleString()}
          </span>
        </div>

        <Link
          href="/notifications"
          aria-label={`Notifications, ${notificationCount} unread`}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#ebe4f6] bg-white shadow-[0_4px_12px_rgba(70,40,150,0.06)]"
        >
          <Bell className="h-5 w-5 text-[#1b1730]" strokeWidth={2.25} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-[#f4f1fa] bg-[#f0483e] px-[3px] text-[10px] font-extrabold text-white">
              {notificationCount}
            </span>
          )}
        </Link>
      </div>
    </motion.header>
  );
}

function HomeHero({
  greeting,
  hour,
  name,
  tagline,
}: {
  greeting: string;
  hour: number;
  name: string;
  tagline: string;
}) {
  const TimeIcon = hour < 12 ? Sun : hour < 17 ? Sparkles : Moon;
  const timeLabel =
    hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  return (
    <motion.section className="mb-3 flex items-center gap-3" variants={fadeUp}>
      <motion.div
        className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-arc-purple-100"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={assets.arlo.home}
          alt="Arlo"
          width={44}
          height={44}
          className="h-full w-full object-cover object-top"
          priority
        />
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-arc-lavender-600">
          <TimeIcon className="h-3 w-3" strokeWidth={2.5} />
          <span className="text-[11px] font-bold">
            {greeting.replace(/,$/, "")}
          </span>
          <span className="text-[10px] font-extrabold tracking-[0.4px] uppercase opacity-70">
            · {timeLabel}
          </span>
        </div>
        <h1 className="truncate font-display text-[26px] leading-tight font-bold tracking-[-0.03em] text-[#1b1730]">
          {name}
          <span className="text-arc-purple-500">.</span>
        </h1>
        <p className="truncate text-[12px] font-semibold text-[#7a7199]">
          {tagline}
        </p>
      </div>
    </motion.section>
  );
}

function TodaysMissionCard({
  mission,
}: {
  mission: HomeMockData["mission"];
}) {
  const pct = mission.progressPercent;
  const circumference = 2 * Math.PI * 22;
  const arloHref = `${mission.href}/arlo`;

  return (
    <motion.section
      className="relative mt-1 overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#35209d_0%,#5b3ee8_45%,#6b4eff_100%)] shadow-[0_16px_36px_-10px_rgba(75,47,214,0.55)]"
      variants={fadeUp}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-arc-gold-400/20 blur-2xl"
      />

      <div className="relative px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              className="-rotate-90"
              aria-hidden
            >
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="5"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="#ffc928"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{
                  strokeDashoffset: circumference * (1 - pct / 100),
                }}
                transition={{ ...softSpring, delay: 0.2 }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-[13px] font-bold text-white">
              {pct}%
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold tracking-[0.4px] text-white uppercase">
                Next up
              </span>
              <span className="flex items-center gap-1 text-[12px] font-bold text-white/75">
                <Clock className="h-3.5 w-3.5" />
                {mission.minutes}m left
              </span>
            </div>
            <h2 className="mt-1.5 font-display text-[22px] leading-[1.05] font-bold tracking-[-0.03em] text-white">
              {mission.title}
            </h2>
            <p className="mt-1 text-[13px] leading-snug font-bold text-white/85">
              {mission.nudge}
            </p>
          </div>

          <motion.div whileTap={{ scale: 0.9 }} transition={snappySpring}>
            <Link
              href={arloHref}
              aria-label="Ask Arlo about this lesson"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
            </Link>
          </motion.div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[12px] font-extrabold text-arc-gold-300">
            <Star className="h-3.5 w-3.5 fill-current" />+{mission.xp} XP
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[12px] font-extrabold text-white">
            <Gem className="h-3.5 w-3.5" />+{mission.gems}
          </span>
        </div>

        <motion.div
          className="mt-3.5"
          whileTap={{ scale: 0.98, y: 1 }}
          transition={snappySpring}
        >
          <Link
            href={mission.href}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-[16px] font-extrabold text-arc-purple-700 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.35)]"
          >
            <Play className="h-4 w-4 fill-arc-purple-700" />
            Keep going
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}

function WeeklyPulseSection({
  progress,
  streak,
}: {
  progress: HomeMockData["weeklyProgress"];
  streak: HomeMockData["weeklyStreak"];
}) {
  const sessionPct = Math.round(
    (progress.sessionsDone / progress.sessionsPlanned) * 100,
  );

  return (
    <motion.section
      className="relative mt-3.5 overflow-hidden rounded-[28px] border border-[#ebe4f6] bg-white shadow-[0_10px_28px_rgba(70,40,150,0.06)]"
      variants={fadeUp}
    >
      {/* soft wash — breaks flat white */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-arc-purple-500/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-20 h-44 w-44 rounded-full bg-arc-orange-400/15 blur-2xl"
      />

      <Link href="/week" className="relative block">
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.7px] text-arc-lavender-600">
              WEEK PULSE
            </p>
            <h2 className="mt-0.5 font-display text-[22px] leading-none font-bold tracking-[-0.02em] text-[#1b1730]">
              Your week so far
            </h2>
          </div>
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#efeaf7] bg-white/80"
          >
            <ChevronRight className="h-4 w-4 text-arc-lavender-600" />
          </span>
        </div>

        {/* asymmetric: big % + meter | ember streak chip */}
        <div className="relative mt-4 flex items-end gap-3 px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-end gap-3">
              <div className="relative shrink-0">
                <svg
                  width="88"
                  height="88"
                  viewBox="0 0 88 88"
                  className="-rotate-90"
                  aria-hidden
                >
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    fill="none"
                    stroke="#ede7f7"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="44"
                    cy="44"
                    r="36"
                    fill="none"
                    stroke="#6b4eff"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 36}
                    initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 36 * (1 - progress.percent / 100),
                    }}
                    transition={{ ...softSpring, delay: 0.25 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[26px] leading-none font-bold tracking-[-0.03em] text-[#1b1730]">
                    {progress.percent}
                  </span>
                  <span className="text-[10px] font-extrabold text-arc-lavender-600">
                    %
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[28px] leading-none font-bold tracking-[-0.03em] text-arc-purple-500">
                    {progress.hoursDone}
                  </span>
                  <span className="text-[15px] font-extrabold text-[#1b1730]">
                    / {progress.hoursPlanned} hrs
                  </span>
                </div>
                <p className="mt-1 text-[12px] font-bold text-arc-lavender-600">
                  planned this week
                </p>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-extrabold">
                    <span className="text-arc-lavender-600">Sessions</span>
                    <span className="text-[#1b1730]">
                      {progress.sessionsDone}/{progress.sessionsPlanned}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: progress.sessionsPlanned }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-2 flex-1 rounded-full",
                            i < progress.sessionsDone
                              ? "bg-arc-purple-500"
                              : "bg-[#ede7f7]",
                          )}
                        />
                      ),
                    )}
                  </div>
                  <p className="sr-only">{sessionPct}% of sessions done</p>
                </div>
              </div>
            </div>
          </div>

          {/* overlapping ember streak badge — breaks the grid */}
          <div className="relative -mb-2 shrink-0 translate-x-1 rotate-2">
            <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,#ff9a4d_0%,#ff6b3d_55%,#e84d2a_100%)] px-3.5 pt-3 pb-2.5 shadow-[0_12px_24px_-8px_rgba(232,77,42,0.55)]">
              <div
                aria-hidden
                className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-white/20"
              />
              <Flame
                className="mx-auto h-7 w-7 text-white"
                fill="currentColor"
                strokeWidth={1.5}
              />
              <div className="mt-0.5 text-center font-display text-[32px] leading-none font-bold text-white">
                {streak.weeks}
              </div>
              <div className="mt-0.5 text-center text-[10px] font-extrabold tracking-[0.4px] text-white/90 uppercase">
                weeks
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* compact week commitment — segment bar + nudge */}
      <WeekCommitmentStrip
        days={streak.days}
        onTrack={progress.onTrack}
      />
    </motion.section>
  );
}

function WeekCommitmentStrip({
  days,
  onTrack,
}: {
  days: HomeMockData["weeklyStreak"]["days"];
  onTrack: boolean;
}) {
  const done = days.filter((d) => d.status === "done").length;
  const left = days.length - done;
  const nextEmptyIndex = days.findIndex((d) => d.status === "empty");

  return (
    <div className="border-t border-[#f0ecf7] bg-[#fbfafe] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold tracking-[0.5px] text-arc-lavender-600 uppercase">
          This week
        </span>
        <span className="text-[11px] font-extrabold text-[#1b1730]">
          {done}/{days.length}
          {left > 0 ? (
            <span className="ml-1.5 text-arc-purple-500">· {left} left</span>
          ) : (
            <span className="ml-1.5 text-[#178a52]">· locked</span>
          )}
        </span>
      </div>

      <div className="mt-2.5 flex gap-1">
        {days.map((day, i) => {
          const isNext = i === nextEmptyIndex;
          return (
            <div key={day.label} className="min-w-0 flex-1 text-center">
              <div
                className={cn(
                  "h-2 w-full rounded-full transition-colors",
                  day.status === "done" && "bg-[#16c784]",
                  day.status === "empty" &&
                    !isNext &&
                    "bg-[#e8e0f4]",
                  isNext &&
                    "bg-arc-purple-500 shadow-[0_0_0_3px_rgba(107,78,255,0.2)]",
                )}
              />
              <div
                className={cn(
                  "mt-1.5 text-[9px] font-extrabold",
                  day.status === "done" && "text-[#178a52]",
                  isNext && "text-arc-purple-500",
                  day.status === "empty" &&
                    !isNext &&
                    "text-[#c3badb]",
                )}
              >
                {day.label}
              </div>
            </div>
          );
        })}
      </div>

      {left > 0 && (
        <p className="mt-2.5 text-[12px] font-bold text-[#5c5478]">
          {onTrack ? (
            <>
              On track — finish{" "}
              <span className="text-arc-purple-500">
                {days[nextEmptyIndex]?.label ?? "next"}
              </span>{" "}
              to keep the week hot.
            </>
          ) : (
            <>Catch a session today — {left} days still open.</>
          )}
        </p>
      )}
    </div>
  );
}

function StatsBar({ stats }: { stats: HomeMockData["stats"] }) {
  const levelPct = Math.round(
    (stats.xpIntoLevel / stats.xpForLevel) * 100,
  );

  return (
    <motion.div variants={fadeUp} whileTap={{ scale: 0.99 }} transition={snappySpring}>
      <Link
        href="/rank"
        className="relative mt-3.5 block w-full overflow-hidden rounded-[28px] border border-[#ebe4f6] bg-white text-left shadow-[0_10px_28px_rgba(70,40,150,0.06)]"
      >
        {/* navy rank plaque — asymmetric left mass */}
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#241a44_0%,#35209d_55%,#4b2fd6_100%)] px-4 pt-4 pb-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 -right-6 h-28 w-28 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/3 h-16 w-40 rounded-full bg-arc-gold-400/20 blur-2xl"
          />

          <div className="relative flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-white/15 ring-2 ring-white/25">
                <Image
                  src={assets.home.ninja}
                  alt=""
                  width={44}
                  height={50}
                  className="h-auto w-11"
                />
              </div>
              <span className="absolute -right-1.5 -bottom-1.5 rounded-full bg-arc-gold-400 px-1.5 py-0.5 text-[10px] font-black text-[#1b1730] shadow-[0_4px_10px_-2px_rgba(255,201,40,0.7)]">
                Lv {stats.level}
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[11px] font-extrabold tracking-[0.6px] text-white/65">
                YOUR RANK
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <h2 className="truncate font-display text-[22px] leading-none font-bold tracking-[-0.02em] text-white">
                  {stats.rank}
                </h2>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-white/70">Next level</span>
                  <span className="text-arc-gold-300">
                    {stats.xpIntoLevel}/{stats.xpForLevel} XP
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ffd34d,#ffc928)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelPct}%` }}
                    transition={{ ...softSpring, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* currency chips — overlapping / staggered, break equal columns */}
        <div className="relative -mt-3 flex items-end gap-2 px-3 pb-3">
          <CurrencyChip
            label="XP"
            value={stats.xp}
            className="z-[3] flex-[1.15] -rotate-1"
            icon={
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d8cff] shadow-[0_6px_12px_-4px_rgba(45,140,255,0.6)]">
                <Star className="h-4 w-4 fill-white text-white" />
              </span>
            }
          />
          <CurrencyChip
            label="Gems"
            value={stats.gems}
            className="z-[2] flex-1 translate-y-1 rotate-1"
            icon={
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-arc-gem-500 shadow-[0_6px_12px_-4px_rgba(169,76,255,0.55)]">
                <Gem className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
            }
          />
          <CurrencyChip
            label="Coins"
            value={stats.coins}
            className="z-[1] flex-1 -translate-y-0.5 -rotate-1"
            icon={
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(150deg,#ffd34d,#f0a81e)] shadow-[0_6px_12px_-4px_rgba(240,168,30,0.55)]">
                <Coins className="h-4 w-4 text-[#7a4a00]" strokeWidth={2.5} />
              </span>
            }
          />
        </div>
      </Link>
    </motion.div>
  );
}

function CurrencyChip({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#efeaf7] bg-white px-2.5 py-2.5 shadow-[0_8px_18px_-8px_rgba(70,40,150,0.18)]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="min-w-0">
          <div className="truncate font-display text-[17px] leading-none font-bold tracking-[-0.02em] text-[#1b1730]">
            {value.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] font-extrabold tracking-[0.4px] text-arc-lavender-600 uppercase">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardsRail({
  milestone,
  bonus,
}: {
  milestone: HomeMockData["milestone"];
  bonus: HomeMockData["dailyBonus"];
}) {
  return (
    <motion.section className="relative mt-3.5 overflow-visible" variants={fadeUp}>
      <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_22px_rgba(70,40,150,0.06)]">
        {/* Milestone row */}
        <button
          type="button"
          className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff6e0]">
            <Image
              src={assets.home.chest}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-[0.5px] text-arc-lavender-600 uppercase">
                Milestone
              </span>
              <span className="text-[10px] font-extrabold text-arc-purple-500">
                {milestone.stepsDone}/{milestone.stepsTotal}
              </span>
            </div>
            <h3 className="mt-0.5 truncate font-display text-[16px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
              {milestone.title}
            </h3>
            <p className="mt-0.5 truncate text-[12px] font-bold text-arc-lavender-600">
              {milestone.subtitle}
            </p>

            <div className="mt-2 flex gap-1">
              {Array.from({ length: milestone.stepsTotal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < milestone.stepsDone
                      ? "bg-arc-purple-500"
                      : "bg-[#ede7f7]",
                  )}
                />
              ))}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-[#c3badb]" />
        </button>

        <div className="h-px bg-[#f0ecf7]" />

        {/* Daily bonus row */}
        <div className="flex items-center gap-3 px-3.5 py-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0ebff]">
            <Image
              src={assets.home.wheel}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold tracking-[0.5px] text-arc-lavender-600 uppercase">
              Daily bonus
            </span>
            <h3 className="mt-0.5 font-display text-[16px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
              {bonus.title}
            </h3>
            <p className="mt-0.5 text-[12px] font-bold text-arc-lavender-600">
              {bonus.subtitle}
            </p>
          </div>

          <Link
            href="/lucky-wheel"
            className="shrink-0 -rotate-2 rounded-xl bg-[linear-gradient(145deg,#ffd34d,#f0a81e)] px-3.5 py-2 text-[13px] font-extrabold text-[#5c3d00] shadow-[0_8px_16px_-6px_rgba(240,168,30,0.55)]"
          >
            Spin
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

function ArloSaysCard({ arloSays }: { arloSays: HomeMockData["arloSays"] }) {
  return (
    <motion.section
      className="mt-3.5 overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_22px_rgba(70,40,150,0.06)]"
      variants={fadeUp}
    >
      <div className="flex items-start gap-3 px-3.5 pt-3.5 pb-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-arc-purple-100 ring-2 ring-arc-purple-100">
          <Image
            src={assets.arlo.wand}
            alt="Arlo"
            width={44}
            height={44}
            className="h-full w-full object-cover object-top"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[15px] font-bold text-[#1b1730]">
              Arlo
            </span>
            <span className="rounded-full bg-arc-purple-100 px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.4px] text-arc-purple-600">
              COACH
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-snug font-semibold text-[#4a4268]">
            {arloSays.quote}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-[#f0ecf7] bg-[#fbfafe] px-3.5 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {arloSays.actions.map((action) => (
          <button
            key={action}
            type="button"
            className="shrink-0 rounded-full border border-[#ebe4f6] bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#3a3357]"
          >
            {action}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function SocialRail({
  badges,
  leaderboard,
}: {
  badges: HomeMockData["badges"];
  leaderboard: HomeMockData["leaderboard"];
}) {
  return (
    <motion.section
      className="mt-3.5 overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_22px_rgba(70,40,150,0.06)]"
      variants={fadeUp}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff6e0]">
          <Award className="h-5 w-5 text-[#f0a81e]" strokeWidth={2.25} />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-extrabold tracking-[0.5px] text-arc-lavender-600 uppercase">
            Badges
          </span>
          <h3 className="mt-0.5 font-display text-[16px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
            <span className="text-arc-purple-500">{badges.earned}</span>
            <span className="text-arc-lavender-500"> / {badges.total}</span>
            <span className="ml-1.5 text-[13px] font-bold text-arc-lavender-600">
              earned
            </span>
          </h3>
          <div className="mt-2 flex -space-x-1.5">
            {[
              { bg: "#FFC928", icon: Star },
              { bg: "#6B4EFF", icon: Award },
              { bg: "#2DBE65", icon: Trophy },
            ].map((badge, i) => {
              const Icon = badge.icon;
              return (
                <span
                  key={i}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white"
                  style={{ background: badge.bg }}
                >
                  <Icon className="h-3.5 w-3.5 text-white" fill="white" />
                </span>
              );
            })}
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#ede7f7] text-[10px] font-extrabold text-arc-lavender-600">
              +{badges.earned - 3}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-[#c3badb]" />
      </button>

      <div className="h-px bg-[#f0ecf7]" />

      <Link
        href="/leaderboard"
        className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff]">
          <Trophy className="h-5 w-5 text-[#2d8cff]" strokeWidth={2.25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-[0.5px] text-arc-lavender-600 uppercase">
              Leaderboard
            </span>
            <span className="text-[10px] font-bold text-arc-lavender-500">
              {leaderboard.endsIn.replace(/^Ends in /i, "")}
            </span>
          </div>
          <h3 className="mt-0.5 font-display text-[16px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
            {leaderboard.league}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex">
              {leaderboard.peers.map((peer, i) => (
                <div
                  key={peer.initial}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-extrabold text-white",
                    i > 0 && "-ml-1.5",
                  )}
                  style={{ background: peer.color }}
                >
                  {peer.initial}
                </div>
              ))}
            </div>
            <div className="rounded-full bg-arc-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-arc-purple-600">
              You · {leaderboard.yourXp.toLocaleString()} XP
            </div>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-[#c3badb]" />
      </Link>
    </motion.section>
  );
}
