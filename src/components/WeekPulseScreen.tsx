"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  Flame,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import {
  weekPulseMockData,
  type WeekPulseMockData,
  type WeekTask,
} from "@/lib/week/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const pageStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

export default function WeekPulseScreen({
  data = weekPulseMockData,
}: {
  data?: WeekPulseMockData;
}) {
  const router = useRouter();
  const todayTask = data.tasks.find((t) => t.status === "today");
  const doneDays = data.days.filter((d) => d.status === "done").length;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(ellipse_at_15%_0%,rgba(107,78,255,0.18)_0%,transparent_55%),radial-gradient(ellipse_at_90%_10%,rgba(255,138,61,0.16)_0%,transparent_50%)]"
      />

      <motion.div
        className="relative px-[18px] pt-[calc(env(safe-area-inset-top)+14px)] pb-[calc(env(safe-area-inset-bottom)+100px)]"
        variants={pageStagger}
        initial="hidden"
        animate="visible"
      >
        <motion.header
          className="mb-5 flex items-center gap-3"
          variants={fadeUp}
        >
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ebe4f6] bg-white text-[#1b1730] shadow-[0_4px_12px_rgba(70,40,150,0.06)]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-arc-lavender-600 uppercase">
              {data.weekLabel}
            </p>
            <h1 className="font-display text-[24px] leading-none font-bold tracking-[-0.03em] text-[#1b1730]">
              Week Pulse
            </h1>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#8a7cb8] shadow-[0_4px_12px_rgba(70,40,150,0.05)]">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.25} />
            {data.rangeLabel}
          </span>
        </motion.header>

        <ScoreHero data={data} />

        <motion.section className="mt-5" variants={fadeUp}>
          <div className="mb-3 flex items-end justify-between gap-2">
            <h2 className="font-display text-[18px] font-semibold text-[#1b1730]">
              Day rail
            </h2>
            <span className="text-[12px] font-bold text-[#8a7cb8]">
              {doneDays}/7 days lit
            </span>
          </div>
          <DayRail days={data.days} />
        </motion.section>

        {todayTask ? (
          <motion.section className="mt-6" variants={fadeUp}>
            <p className="mb-2 text-[11px] font-extrabold tracking-[0.06em] text-arc-purple-500 uppercase">
              Up next today
            </p>
            <TodayMissionCard task={todayTask} />
          </motion.section>
        ) : null}

        <motion.section className="mt-6" variants={fadeUp}>
          <h2 className="mb-3 font-display text-[18px] font-semibold text-[#1b1730]">
            Plan
          </h2>
          <ul className="space-y-2.5">
            {data.tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </motion.section>

        <motion.div
          className="mt-6 rounded-2xl border border-arc-purple-200 bg-[#f6f2ff] px-4 py-3.5"
          variants={fadeUp}
        >
          <div className="flex items-start gap-2.5">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-arc-purple-500"
              strokeWidth={2.5}
            />
            <p className="text-[13px] leading-snug font-semibold text-[#4a3d78]">
              {data.arloNudge}
            </p>
          </div>
        </motion.div>
      </motion.div>

      <ReplanDock />
    </div>
  );
}

function ScoreHero({ data }: { data: WeekPulseMockData }) {
  const { progress, streak } = data;
  const circumference = 2 * Math.PI * 40;

  return (
    <motion.section
      className="relative overflow-hidden rounded-[28px] border border-[#ebe4f6] bg-white p-4 shadow-[0_12px_32px_rgba(70,40,150,0.08)]"
      variants={fadeUp}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 -left-10 h-36 w-36 rounded-full bg-arc-purple-500/12 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-16 h-40 w-40 rounded-full bg-arc-orange-400/14 blur-2xl"
      />

      <div className="relative flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-3">
            <div className="relative shrink-0">
              <svg
                width="96"
                height="96"
                viewBox="0 0 96 96"
                className="-rotate-90"
                aria-hidden
              >
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#ede7f7"
                  strokeWidth="9"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#6b4eff"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{
                    strokeDashoffset:
                      circumference * (1 - progress.percent / 100),
                  }}
                  transition={{ ...softSpring, delay: 0.2 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[28px] leading-none font-bold tracking-[-0.03em] text-[#1b1730]">
                  {progress.percent}
                </span>
                <span className="text-[10px] font-extrabold text-arc-lavender-600">
                  %
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[30px] leading-none font-bold tracking-[-0.03em] text-arc-purple-500">
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
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="relative -mb-1 shrink-0 translate-x-1 rotate-2"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,#ff9a4d_0%,#ff6b3d_55%,#e84d2a_100%)] px-3.5 pt-3 pb-2.5 shadow-[0_12px_24px_-8px_rgba(232,77,42,0.55)]">
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
        </motion.div>
      </div>

      <p
        className={cn(
          "relative mt-4 rounded-xl px-3 py-2 text-[12px] font-bold",
          progress.onTrack
            ? "bg-[#eef9f3] text-[#178a52]"
            : "bg-[#fff4ec] text-[#9a4a12]",
        )}
      >
        {progress.onTrack
          ? "On track — weekly commitment still alive."
          : "Behind plan — replan without guilt."}
      </p>
    </motion.section>
  );
}

function DayRail({ days }: { days: WeekPulseMockData["days"] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {days.map((day) => {
        const isToday = day.status === "today";
        const isDone = day.status === "done";

        return (
          <div
            key={day.label}
            className={cn(
              "flex min-w-[3.15rem] flex-1 flex-col items-center rounded-2xl border px-1.5 py-2.5",
              isToday &&
                "border-arc-purple-500 bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]",
              isDone && "border-[#c8f0dc] bg-[#eef9f3]",
              !isToday &&
                !isDone &&
                "border-[#ebe4f6] bg-white text-[#b3a8d6]",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-extrabold tracking-wide uppercase",
                isToday ? "text-white/80" : isDone ? "text-[#178a52]" : "",
              )}
            >
              {day.label}
            </span>
            <span
              className={cn(
                "mt-1 font-display text-[15px] font-bold",
                isToday ? "text-white" : isDone ? "text-[#178a52]" : "",
              )}
            >
              {isDone ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                day.minutesPlanned
              )}
            </span>
            <span
              className={cn(
                "mt-0.5 text-[9px] font-bold",
                isToday ? "text-white/70" : "text-[#c3badb]",
              )}
            >
              {isDone ? "done" : "min"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TodayMissionCard({ task }: { task: WeekTask }) {
  return (
    <Link
      href={task.href ?? "/path"}
      className="block overflow-hidden rounded-[24px] border border-arc-purple-200 bg-white p-4 shadow-[0_12px_28px_rgba(107,78,255,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-arc-purple-500">
            {task.track} · {task.dayLabel}
          </p>
          <h3 className="mt-1 font-display text-[20px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
            {task.title}
          </h3>
          <p className="mt-2 flex items-center gap-3 text-[12px] font-bold text-[#8a7cb8]">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
              {task.minutes}m
            </span>
            <span>+{task.xp} XP</span>
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]">
          <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}

function TaskRow({ task }: { task: WeekTask }) {
  const done = task.status === "done";
  const today = task.status === "today";

  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3.5 py-3",
        today && "border-arc-purple-200 bg-[#f6f2ff]",
        done && "border-[#ebe4f6] bg-white opacity-70",
        !today && !done && "border-[#ebe4f6] bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold",
          done && "bg-[#eef9f3] text-[#178a52]",
          today && "bg-arc-purple-500 text-white",
          !done && !today && "bg-[#f0ecf7] text-[#8a7cb8]",
        )}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : task.dayLabel}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-display text-[15px] font-semibold",
            done ? "text-[#8a7cb8] line-through" : "text-[#1b1730]",
          )}
        >
          {task.title}
        </p>
        <p className="text-[11px] font-bold text-[#8a7cb8]">
          {task.track} · {task.minutes}m · +{task.xp} XP
        </p>
      </div>
      {today ? (
        <ArrowRight className="h-4 w-4 shrink-0 text-arc-purple-500" strokeWidth={2.5} />
      ) : null}
    </div>
  );

  if (task.href && today) {
    return (
      <li>
        <Link href={task.href}>{inner}</Link>
      </li>
    );
  }

  return <li>{inner}</li>;
}

function ReplanDock() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-[18px] pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <motion.div
        className="pointer-events-auto flex gap-2 rounded-[22px] border border-[#ebe4f6] bg-white/95 p-2 shadow-[0_12px_36px_rgba(70,40,150,0.14)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: 0.2 }}
      >
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ebe4f6] bg-[#f6f2ff] py-3.5 font-display text-[14px] font-semibold text-[#2b1b57]"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          Replan week
        </button>
        <motion.div className="flex-[1.15]" whileTap={{ scale: 0.98, y: 1 }} transition={snappySpring}>
          <Link
            href="/path"
            className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3.5 font-display text-[14px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
          >
            Continue Path
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
