"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Flame,
  Lock,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { WeekPulseSkeleton } from "@/components/week/WeekPulseSkeleton";
import { motion, useReducedMotion } from "motion/react";
import { useCourseTiming } from "@/hooks/useCourseTiming";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import type { WeekCurrentResponse } from "@/lib/api/types";
import {
  formatEta,
  formatNextSession,
  paceMeta,
} from "@/lib/course-timing/format";
import {
  type WeekPulseData,
  type WeekTask,
  type WeekTaskStatus,
} from "@/lib/week/types";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

function mapWeekToPulse(week: WeekCurrentResponse): WeekPulseData {
  return {
    weekLabel: week.weekLabel,
    rangeLabel: week.rangeLabel,
    goalHours: week.progress.hoursPlanned,
    progress: week.progress,
    streak: week.streak,
    days: week.days.map((d) => ({
      label: d.label,
      full: d.full,
      status:
        d.status === "inactive"
          ? "inactive"
          : d.status === "current" || d.status === "today"
            ? "today"
            : d.status === "completed"
              ? "done"
              : d.status,
      minutesPlanned: d.minutesPlanned,
      minutesDone: d.minutesDone,
    })),
    tasks: week.tasks.map((t) => ({
      id: t.id,
      dayLabel: t.dayLabel,
      dayIndex: t.dayIndex,
      title: t.title,
      track: t.track,
      minutes: t.minutes,
      xp: t.xp,
      status: t.status as WeekTaskStatus,
      href: t.href ?? (t.lessonId ? `/learn/${t.lessonId}` : undefined),
    })),
    arloNudge: week.arloNudge,
  };
}

/**
 * Week pulse — night hero + light sheet.
 * Sessions-left → today ticket → day rail → plan → replan dock.
 */
export default function WeekPulseScreen({
  data: dataProp,
}: {
  data?: WeekPulseData;
}) {
  const reduceMotion = useReducedMotion();
  const { week, replan, moveTask, skipTask, isLoading } = useCurrentWeek();
  const { timing, feasibility, replan: pathReplan } = useCourseTiming();
  const data = week ? mapWeekToPulse(week) : dataProp;

  if (isLoading && !data) {
    return <WeekPulseSkeleton />;
  }

  if (!data) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f2eefb] font-rounded">
        <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-12 text-white">
          <BackButton tone="dark" fallbackHref="/home" />
          <p className="mt-5 text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
            Commitment
          </p>
          <h1 className="mt-1 font-display text-[32px] font-bold tracking-[-0.04em]">
            This week
          </h1>
        </header>
        <div className="relative z-10 -mt-6 rounded-t-[28px] bg-[#f2eefb] px-4 pt-8 pb-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ecf7] text-arc-purple-500">
            <Lock className="h-6 w-6" strokeWidth={2.25} />
          </span>
          <p className="mt-4 font-display text-[20px] font-bold text-[#1b1730]">
            No week plan yet
          </p>
          <p className="mt-1.5 text-[13px] font-bold text-[#8a7cb8]">
            Build your path first — then seal a week.
          </p>
          <Link
            href="/path"
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-[18px] bg-arc-purple-500 px-5 py-3.5 font-display text-[14px] font-semibold text-white shadow-[0_5px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
          >
            Open Path
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    );
  }

  const timingPace = timing ? paceMeta(timing.pace) : null;
  const etaLabel = formatEta(timing?.estimatedCompletionDate);
  const nextBlock = formatNextSession(timing);

  const todayTask =
    (week?.todayMission
      ? data.tasks.find((t) => t.id === week.todayMission?.taskId)
      : null) ?? data.tasks.find((t) => t.status === "today");
  const sessionsLeft =
    week?.sessionsLeft ??
    Math.max(0, data.progress.sessionsPlanned - data.progress.sessionsDone);
  const targetWeek =
    week?.targetWeek ?? data.streak.weeks + (sessionsLeft > 0 ? 1 : 0);

  const progressLabel =
    timingPace?.label ??
    (week?.progress.status === "ahead"
      ? "Ahead"
      : week?.progress.status === "at_risk"
        ? "At risk"
        : week?.progress.status === "catch_up" || !data.progress.onTrack
          ? "Catch up"
          : week?.sealed
            ? "Sealed"
            : "On track");
  const progressHot =
    timingPace?.tone === "warn" ||
    timingPace?.tone === "risk" ||
    week?.progress.status === "catch_up" ||
    week?.progress.status === "at_risk" ||
    (!timingPace && !data.progress.onTrack);

  const todayHref =
    week?.todayMission?.href ?? todayTask?.href ?? nextBlock?.href;

  const doneDays = data.days.filter((d) => d.status === "done").length;

  const replanning = replan.isPending || pathReplan.isPending;
  const onReplan = week
    ? () => {
        if (timing?.pace === "at_risk" || timing?.pace === "slightly_behind") {
          pathReplan.mutate({
            reason: "user_request",
            expectedVersion: timing.scheduleVersion,
          });
        }
        replan.mutate({ mode: "catch_up" });
      }
    : timing
      ? () =>
          pathReplan.mutate({
            reason: "user_request",
            expectedVersion: timing.scheduleVersion,
          })
      : undefined;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 48% 58%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton tone="dark" fallbackHref="/home" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {data.rangeLabel}
            </p>
            <h1 className="mt-0.5 font-display text-[28px] leading-none font-bold tracking-[-0.03em]">
              This week
            </h1>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black",
              week?.sealed || !progressHot
                ? "bg-[#16a56b]/25 text-[#7dffb5]"
                : "bg-[#ff8a3d]/25 text-[#ffc9a0]",
            )}
          >
            {progressLabel}
          </span>
        </div>

        <div className="relative mt-6 grid grid-cols-[1.2fr_0.85fr] items-end gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              Seal Week {targetWeek}
            </p>
            {sessionsLeft > 0 ? (
              <>
                <p className="mt-1 font-display text-[56px] leading-[0.88] font-bold tracking-[-0.05em] tabular-nums">
                  {sessionsLeft}
                </p>
                <p className="mt-2 text-[14px] font-bold text-white/65">
                  session{sessionsLeft === 1 ? "" : "s"} left to lock
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 flex items-center gap-2 font-display text-[40px] leading-[0.9] font-bold tracking-[-0.04em]">
                  <Lock className="h-8 w-8 text-[#7dffb5]" strokeWidth={2.5} />
                  Locked
                </p>
                <p className="mt-2 text-[14px] font-bold text-white/65">
                  Week {data.streak.weeks} sealed
                </p>
              </>
            )}
            <p className="mt-2 text-[12px] font-bold text-white/40">
              {data.progress.hoursDone}/{data.progress.hoursPlanned} hrs ·{" "}
              {data.progress.percent}%{etaLabel ? ` · ETA ${etaLabel}` : ""}
            </p>
          </div>

          <div className="relative flex flex-col gap-2">
            <motion.div
              className="rounded-2xl border-2 border-[#0f1220] bg-[#ffc928] px-3 py-2.5 text-[#0f1220] shadow-[0_4px_0_#c79a2e]"
              animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="flex items-center gap-1 text-[#0f1220]/60">
                <Flame
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  strokeWidth={1.5}
                />
                <span className="text-[9px] font-black tracking-wide uppercase">
                  Streak
                </span>
              </div>
              <p className="mt-0.5 font-display text-[26px] leading-none font-bold tabular-nums">
                {data.streak.weeks}
                <span className="text-[13px] font-semibold">w</span>
              </p>
            </motion.div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[9px] font-black tracking-wide text-[#ffc928] uppercase">
                Days lit
              </p>
              <p className="mt-0.5 font-display text-[16px] font-bold tabular-nums">
                {doneDays}/7
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-white/45">Sessions</span>
            <span className="text-[#ffc928] tabular-nums">
              {data.progress.sessionsDone}/{data.progress.sessionsPlanned}
            </span>
          </div>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-valuenow={data.progress.sessionsDone}
            aria-valuemin={0}
            aria-valuemax={data.progress.sessionsPlanned}
            aria-label="Sessions completed"
          >
            {Array.from({
              length: Math.max(1, data.progress.sessionsPlanned),
            }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2.5 flex-1 rounded-full",
                  i < data.progress.sessionsDone
                    ? "bg-[#ffc928]"
                    : "bg-white/15",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-6 space-y-3.5 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+110px)]">
        <div className="rounded-[20px] border-2 border-[#ebe4f6] bg-white p-2 shadow-[0_4px_0_#ebe4f6]">
          <DayRail days={data.days} />
        </div>

        {timing ? (
          <section className="rounded-[20px] border-2 border-[#ebe4f6] bg-white px-4 py-3.5 shadow-[0_4px_0_#ebe4f6]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.12em] text-arc-purple-500 uppercase">
                  Path timing
                </p>
                <p className="mt-1 font-display text-[18px] font-bold text-[#1b1730]">
                  {etaLabel ?? "Schedule building"}
                </p>
                <p className="mt-1 text-[12px] font-semibold text-[#8a7cb8]">
                  {Math.round(timing.effectiveMinutesPerWeek)}m/wk ·{" "}
                  {timing.remainingMinutes}m remaining
                </p>
              </div>
              <Link
                href="/week/plan"
                className="shrink-0 cursor-pointer rounded-xl bg-[#f0ecf7] px-2.5 py-1.5 text-[11px] font-extrabold text-arc-purple-500 transition-colors hover:bg-[#e8e0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
              >
                Seal plan
              </Link>
            </div>
            {feasibility.data?.feasibilityState === "unrealistic" ||
            feasibility.data?.feasibilityState === "compressed" ? (
              <p className="mt-2.5 rounded-xl bg-[#fff4ec] px-3 py-2 text-[12px] font-semibold text-[#b85a1a]">
                Deadline feels{" "}
                {feasibility.data.feasibilityState === "unrealistic"
                  ? "unrealistic"
                  : "tight"}
                . Replan or extend hours.
              </p>
            ) : null}
            {nextBlock && !todayTask ? (
              <Link
                href={nextBlock.href}
                className="mt-3 flex cursor-pointer items-center justify-between rounded-xl bg-[#f0ecf7] px-3 py-2.5 transition-colors hover:bg-[#e8e0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
              >
                <div>
                  <p className="text-[10px] font-black tracking-wide text-arc-purple-500 uppercase">
                    Next block
                  </p>
                  <p className="text-[13px] font-bold text-[#1b1730]">
                    {nextBlock.title ?? nextBlock.when}
                  </p>
                </div>
                <span className="text-[12px] font-black text-arc-purple-500">
                  {nextBlock.minutes}m
                </span>
              </Link>
            ) : null}
          </section>
        ) : null}

        {todayTask ? (
          <section>
            <p className="mb-2 px-0.5 text-[10px] font-black tracking-[0.12em] text-[#8a7cb8] uppercase">
              Do this next
            </p>
            <TodayTicket
              task={todayTask}
              href={week?.todayMission?.href ?? todayTask.href}
              reduceMotion={!!reduceMotion}
            />
          </section>
        ) : null}

        <section>
          <div className="mb-2 flex items-end justify-between gap-2 px-0.5">
            <h2 className="font-display text-[18px] font-bold text-[#1b1730]">
              Plan
            </h2>
            <span className="text-[11px] font-extrabold text-[#8a7cb8]">
              {data.weekLabel}
            </span>
          </div>
          {data.tasks.length === 0 ? (
            <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-5 py-8 text-center">
              <p className="font-display text-[16px] font-semibold text-[#1b1730]">
                Empty plan
              </p>
              <p className="mt-1 text-[13px] font-bold text-[#8a7cb8]">
                Replan to fill this week&apos;s sessions.
              </p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6]">
              {data.tasks.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  last={i === data.tasks.length - 1}
                  sealed={Boolean(week?.sealed)}
                  onSkip={
                    week && !week.sealed
                      ? () => skipTask.mutate({ taskId: task.id })
                      : undefined
                  }
                  onMoveTomorrow={
                    week && !week.sealed
                      ? () => {
                          const idx =
                            typeof task.dayIndex === "number"
                              ? task.dayIndex
                              : (week.tasks.find((t) => t.id === task.id)
                                  ?.dayIndex ?? 0);
                          moveTask.mutate({
                            taskId: task.id,
                            dayIndex: Math.min(6, idx + 1),
                          });
                        }
                      : undefined
                  }
                  busy={moveTask.isPending || skipTask.isPending}
                />
              ))}
            </ul>
          )}
        </section>

        {data.arloNudge ? (
          <div className="rounded-[18px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-arc-purple-500"
                strokeWidth={2.5}
              />
              <p className="text-[13px] leading-snug font-semibold text-[#4a3d78]">
                {data.arloNudge}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <ReplanDock
        todayHref={todayHref}
        onReplan={onReplan}
        replanning={replanning}
        sealed={week?.sealed}
        reduceMotion={!!reduceMotion}
      />
    </div>
  );
}

function DayRail({ days }: { days: WeekPulseData["days"] }) {
  return (
    <div className="flex gap-1" aria-label="Week days">
      {days.map((day) => {
        const isToday = day.status === "today";
        const isDone = day.status === "done";
        const isInactive = day.status === "inactive";

        return (
          <div
            key={day.label}
            title={isInactive ? "Before you joined — not counted" : day.full}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center rounded-xl px-0.5 py-2",
              isToday &&
                "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]",
              isDone && "bg-[#eef9f3]",
              isInactive && "bg-transparent opacity-40",
              !isToday && !isDone && !isInactive && "bg-[#faf8ff]",
            )}
          >
            <span
              className={cn(
                "text-[9px] font-extrabold tracking-wide uppercase",
                isToday
                  ? "text-white/75"
                  : isDone
                    ? "text-[#16a56b]"
                    : isInactive
                      ? "text-[#c6bce0]"
                      : "text-[#8a7cb8]",
              )}
            >
              {day.label}
            </span>
            <span
              className={cn(
                "mt-1 flex h-5 items-center justify-center font-display text-[13px] font-bold",
                isToday
                  ? "text-white"
                  : isDone
                    ? "text-[#16a56b]"
                    : isInactive
                      ? "text-[#d8ccff]"
                      : "text-[#b3a8d6]",
              )}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : isInactive ? (
                "—"
              ) : (
                day.minutesPlanned
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TodayTicket({
  task,
  href,
  reduceMotion,
}: {
  task: WeekTask;
  href?: string;
  reduceMotion: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border-2 border-[#0f1220] bg-white shadow-[0_6px_0_#0f1220]">
      <div className="flex items-stretch">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-[#0f1220] text-[#ffc928]">
          <span className="text-[10px] font-black tracking-wide uppercase">
            {task.dayLabel}
          </span>
          <Clock className="mt-1 h-4 w-4" strokeWidth={2.5} />
          <span className="mt-0.5 text-[11px] font-extrabold text-white">
            {task.minutes}m
          </span>
        </div>
        <div className="min-w-0 flex-1 px-3.5 py-3.5">
          <p className="text-[11px] font-bold text-arc-purple-500">
            {task.track}
          </p>
          <h3 className="mt-0.5 font-display text-[18px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
            {task.title}
          </h3>
          <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
            +{task.xp} XP · locks this week&apos;s commitment
          </p>
        </div>
      </div>
      <motion.div
        whileTap={reduceMotion ? undefined : { scale: 0.985, y: 1 }}
        transition={snappySpring}
      >
        <Link
          href={href ?? task.href ?? "/path"}
          className="flex w-full cursor-pointer items-center justify-center gap-2 bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffc928]"
        >
          <Play className="h-4 w-4 fill-white" />
          Finish session · {task.minutes} min
        </Link>
      </motion.div>
    </div>
  );
}

function TaskRow({
  task,
  last,
  sealed,
  onSkip,
  onMoveTomorrow,
  busy,
}: {
  task: WeekTask;
  last?: boolean;
  sealed?: boolean;
  onSkip?: () => void;
  onMoveTomorrow?: () => void;
  busy?: boolean;
}) {
  const done = task.status === "done";
  const today = task.status === "today";
  const skipped = task.status === "skipped";
  const actionable = !sealed && !done && !skipped && (onSkip || onMoveTomorrow);

  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 transition-colors",
        !last && "border-b border-[#f0ecf7]",
        today && "bg-[#faf8ff]",
        done && "opacity-65",
        skipped && "opacity-50",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold",
          done && "bg-[#eef9f3] text-[#16a56b]",
          today && "bg-arc-purple-500 text-white shadow-[0_2px_0_#4b2fd6]",
          skipped && "bg-[#f0ecf7] text-[#b3a8d6] line-through",
          !done && !today && !skipped && "bg-[#f0ecf7] text-[#8a7cb8]",
        )}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : task.dayLabel}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-display text-[14px] font-semibold",
            done || skipped ? "text-[#8a7cb8] line-through" : "text-[#1b1730]",
          )}
        >
          {task.title}
        </p>
        <p className="text-[11px] font-bold text-[#8a7cb8]">
          {task.track} · {task.minutes}m · +{task.xp} XP
          {skipped ? " · Skipped" : ""}
        </p>
        {actionable ? (
          <div className="mt-1.5 flex gap-3">
            {onMoveTomorrow ? (
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMoveTomorrow();
                }}
                className="cursor-pointer text-[10px] font-black tracking-wide text-arc-purple-500 uppercase transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move +1d
              </button>
            ) : null}
            {onSkip ? (
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSkip();
                }}
                className="cursor-pointer text-[10px] font-black tracking-wide text-[#8a7cb8] uppercase transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Skip
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {today ? (
        <ArrowRight
          className="h-4 w-4 shrink-0 text-arc-purple-500"
          strokeWidth={2.5}
        />
      ) : null}
    </div>
  );

  if (
    task.href &&
    (today || task.status === "upcoming" || task.status === "missed")
  ) {
    return (
      <li>
        <Link
          href={task.href}
          className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return <li>{inner}</li>;
}

function ReplanDock({
  todayHref,
  onReplan,
  replanning,
  sealed,
  reduceMotion,
}: {
  todayHref?: string;
  onReplan?: () => void;
  replanning?: boolean;
  sealed?: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
      <motion.div
        className="pointer-events-auto flex gap-2 rounded-[20px] border-2 border-[#ebe4f6] bg-white/95 p-2 shadow-[0_8px_32px_rgba(70,40,150,0.16)] backdrop-blur-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: 0.1 }}
      >
        <button
          type="button"
          onClick={onReplan}
          disabled={!onReplan || replanning || sealed}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#ebe4f6] bg-[#f0ecf7] py-3.5 font-display text-[13px] font-semibold text-[#1b1730] transition-colors hover:border-[#0f1220]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw
            className={cn("h-4 w-4", replanning && "animate-spin")}
            strokeWidth={2.5}
          />
          Replan
        </button>
        <motion.div
          className="flex-[1.25]"
          whileTap={reduceMotion ? undefined : { scale: 0.98, y: 1 }}
          transition={snappySpring}
        >
          <Link
            href={todayHref ?? "/path"}
            className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3.5 font-display text-[13px] font-semibold text-white shadow-[0_4px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
          >
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
