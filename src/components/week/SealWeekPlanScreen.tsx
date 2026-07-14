"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Gem,
  Lock,
  Play,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { motion } from "motion/react";
import { useCourseTiming } from "@/hooks/useCourseTiming";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import type { WeekCurrentResponse } from "@/lib/api/types";
import {
  formatEta,
  formatNextSession,
  paceMeta,
  type PaceTone,
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
 * Exclusive Seal Week Plan — vault expanded.
 * Destination for HomeWeekLockVault "Plan" CTA.
 */
export default function SealWeekPlanScreen({
  data: dataProp,
}: {
  data?: WeekPulseData;
}) {
  const { week, replan, moveTask, skipTask, isLoading } = useCurrentWeek();
  const { timing, feasibility, replan: pathReplan } = useCourseTiming();
  const data = week ? mapWeekToPulse(week) : dataProp;

  if (!data) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 bg-[#f3effc] px-6 font-rounded">
        <p className="font-display text-[18px] font-bold text-[#1b1730]">
          {isLoading ? "Loading week…" : "No week plan yet"}
        </p>
        {!isLoading ? (
          <Link
            href="/path"
            className="rounded-full bg-[#0f1220] px-5 py-2.5 text-[13px] font-black text-white"
          >
            Open Path
          </Link>
        ) : null}
      </div>
    );
  }

  const timingPace = timing ? paceMeta(timing.pace) : null;
  const etaLabel = formatEta(timing?.estimatedCompletionDate);
  const nextBlock = formatNextSession(timing);

  const sessionsLeft =
    week?.sessionsLeft ??
    Math.max(0, data.progress.sessionsPlanned - data.progress.sessionsDone);
  const sealed = week?.sealed ?? sessionsLeft <= 0;
  const targetWeek =
    week?.targetWeek ?? data.streak.weeks + (sealed ? 0 : 1);
  const estimateMinutes =
    week?.estimateMinutes ??
    data.tasks
      .filter((t) => t.status !== "done" && t.status !== "skipped")
      .reduce((sum, t) => sum + t.minutes, 0);

  const onTrack =
    timingPace != null
      ? timingPace.tone === "good"
      : data.progress.onTrack;
  const badgeLabel =
    timingPace?.label ??
    (week?.progress.status === "ahead"
      ? "Ahead"
      : week?.progress.status === "at_risk"
        ? "At risk"
        : week?.progress.status === "catch_up" || !data.progress.onTrack
          ? "Catch up"
          : sealed
            ? "Sealed"
            : "On track");
  const paceTone: PaceTone | undefined = timingPace?.tone;

  const todayTask =
    (week?.todayMission
      ? data.tasks.find((t) => t.id === week.todayMission?.taskId)
      : null) ?? data.tasks.find((t) => t.status === "today");
  const todayHref =
    week?.todayMission?.href ?? todayTask?.href ?? nextBlock?.href;

  const tasksByDay = data.days.map((day, dayIndex) => ({
    day,
    tasks: data.tasks.filter(
      (t) =>
        (typeof t.dayIndex === "number" && t.dayIndex === dayIndex) ||
        (typeof t.dayIndex !== "number" && t.dayLabel === day.label),
    ),
  }));

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
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-48px] h-72 w-72 rounded-full bg-arc-purple-500/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 left-[-36px] h-44 w-44 rounded-full bg-[#ffc928]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.2px 1.2px at 44% 68%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {data.rangeLabel}
            </p>
            <h1 className="mt-0.5 font-display text-[26px] leading-none font-bold tracking-[-0.03em]">
              Seal Week {targetWeek}
            </h1>
          </div>
          {onTrack ? (
            <span className="rounded-full bg-[#62d84e]/20 px-2.5 py-1 text-[10px] font-black tracking-wide text-[#7dffb5] uppercase">
              {badgeLabel}
            </span>
          ) : (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase",
                paceTone === "risk"
                  ? "bg-[#ff5a5a]/25 text-[#ffb0b0]"
                  : "bg-[#ff8a3d]/25 text-[#ffc9a0]",
              )}
            >
              {badgeLabel}
            </span>
          )}
        </div>

        <div className="relative mt-8 grid grid-cols-[1.2fr_0.95fr] items-end gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              Week plan
            </p>
            {sealed ? (
              <>
                <motion.p
                  className="mt-1 font-display text-[48px] leading-[0.88] font-bold tracking-[-0.05em]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={softSpring}
                >
                  Locked
                </motion.p>
                <p className="mt-2 text-[14px] font-bold text-white/65">
                  Commitment sealed · streak {data.streak.weeks}w
                </p>
              </>
            ) : (
              <>
                <motion.p
                  className="mt-1 font-display text-[56px] leading-[0.88] font-bold tracking-[-0.05em]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={softSpring}
                >
                  {sessionsLeft}
                </motion.p>
                <p className="mt-2 text-[14px] font-bold text-white/65">
                  session{sessionsLeft === 1 ? "" : "s"} left · ~{estimateMinutes}
                  m
                </p>
              </>
            )}
            <p className="mt-2 text-[12px] font-bold text-white/40">
              {data.progress.sessionsDone}/{data.progress.sessionsPlanned}{" "}
              sessions · {data.progress.hoursDone}/{data.progress.hoursPlanned}h
              {etaLabel ? ` · ETA ${etaLabel}` : ""}
            </p>
          </div>

          <div className="relative h-[128px]">
            <motion.div
              className="absolute top-0 right-0 z-[2] w-[94%] rotate-2 rounded-2xl bg-[#ffc928] px-3 py-2.5 text-[#0f1220] shadow-[0_5px_0_#c79a2e]"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="text-[9px] font-black tracking-wide uppercase">
                  Seal XP
                </span>
              </div>
              <p className="mt-1 font-display text-[26px] leading-none font-bold">
                +{data.progress.lockRewardXp}
              </p>
            </motion.div>
            <div className="absolute right-1 bottom-0 z-[1] w-[82%] -rotate-1 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <div className="flex items-center gap-1 text-[#c9b8ff]">
                <Gem className="h-3 w-3" strokeWidth={2.5} />
                <span className="text-[9px] font-black tracking-wide uppercase">
                  Gems
                </span>
              </div>
              <p className="mt-0.5 font-display text-[18px] font-bold">
                +{data.progress.lockRewardGems}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex gap-1.5" aria-hidden>
          {Array.from({ length: data.progress.sessionsPlanned }).map((_, i) => (
            <span
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
      </section>

      <div className="relative z-[1] -mt-7 space-y-4 px-4 pb-[calc(env(safe-area-inset-bottom)+110px)]">
        {/* Expanded vault ticket */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
          className="relative overflow-hidden rounded-[20px] bg-white text-[#1b1730] shadow-[0_14px_32px_rgba(70,40,150,0.12)] ring-1 ring-[#ebe4f6]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 right-[-16px] h-24 w-24 rounded-full bg-arc-purple-500/10 blur-2xl"
          />
          <div className="relative flex items-center gap-2 px-3.5 pt-3.5">
            <p className="font-display text-[15px] font-bold tracking-[-0.02em]">
              Vault status
            </p>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide uppercase",
                onTrack
                  ? "bg-[#62d84e]/15 text-[#2d9e45]"
                  : paceTone === "risk"
                    ? "bg-[#ff5a5a]/15 text-[#d63030]"
                    : "bg-[#ff8a3d]/15 text-[#e86500]",
              )}
            >
              {badgeLabel}
            </span>
            <Link
              href="/week"
              className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-black text-arc-purple-500"
            >
              Pulse
              <ChevronRight className="h-3 w-3" strokeWidth={2.75} />
            </Link>
          </div>

          <div className="relative mt-2.5 flex items-center gap-3 px-3.5 pb-1">
            {sealed ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#62d84e] text-white">
                <Lock className="h-5 w-5" strokeWidth={2.5} />
              </span>
            ) : (
              <p className="shrink-0 font-display text-[32px] leading-none font-bold tracking-[-0.05em]">
                {sessionsLeft}
              </p>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-[#8a7cb8]">
                {sealed
                  ? "Week locked in"
                  : `${sessionsLeft} left · ~${estimateMinutes}m`}
              </p>
              <div className="mt-1.5 flex gap-1">
                {Array.from({ length: data.progress.sessionsPlanned }).map(
                  (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-2 flex-1 rounded-full",
                        i < data.progress.sessionsDone
                          ? "bg-[#ffc928]"
                          : "bg-[#ebe4f6]",
                      )}
                    />
                  ),
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#ffc928] px-1.5 py-0.5 text-[10px] font-black text-[#0f1220]">
                <Zap className="h-3 w-3" strokeWidth={2.5} />+
                {data.progress.lockRewardXp}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#f0ecf7] px-1.5 py-0.5 text-[10px] font-black text-[#1b1730]">
                <Gem
                  className="h-3 w-3 text-arc-purple-500"
                  strokeWidth={2.5}
                />
                +{data.progress.lockRewardGems}
              </span>
            </div>
          </div>
          <p className="relative px-3.5 pt-2 pb-3.5 text-[10px] font-bold text-[#b3a8d6]">
            Finish sessions to seal week {targetWeek} · rewards grant on lock
          </p>
        </motion.section>

        {todayTask ? (
          <section>
            <p className="mb-2 px-0.5 text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
              Do this next
            </p>
            <TodayTicket
              task={todayTask}
              href={week?.todayMission?.href ?? todayTask.href}
            />
          </section>
        ) : null}

        {feasibility.data?.feasibilityState === "unrealistic" ||
        feasibility.data?.feasibilityState === "compressed" ? (
          <p className="rounded-xl bg-[#fff4ec] px-3.5 py-2.5 text-[12px] font-semibold text-[#b85a1a]">
            Deadline feels{" "}
            {feasibility.data.feasibilityState === "unrealistic"
              ? "unrealistic"
              : "tight"}
            . Replan or extend hours.
          </p>
        ) : null}

        <section>
          <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
            <h2 className="font-display text-[18px] font-bold text-[#1b1730]">
              Day lanes
            </h2>
            <span className="text-[11px] font-extrabold text-[#8a7cb8]">
              {data.weekLabel}
            </span>
          </div>

          <div className="space-y-2.5">
            {tasksByDay.map(({ day, tasks }, dayIdx) => {
              const isToday = day.status === "today";
              const isDone = day.status === "done";
              const isInactive = day.status === "inactive";
              if (isInactive && tasks.length === 0) return null;

              return (
                <motion.div
                  key={day.label}
                  initial={{ opacity: 0, x: dayIdx % 2 === 0 ? -10 : 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...softSpring, delay: 0.04 * dayIdx }}
                  className={cn(
                    "overflow-hidden rounded-[18px] border border-[#ebe4f6] bg-white shadow-[0_8px_20px_rgba(70,40,150,0.05)]",
                    isToday && "ring-2 ring-arc-purple-500/35",
                    dayIdx === 1 && "ml-2",
                    dayIdx === 4 && "-ml-1",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-3.5 py-2.5",
                      isToday && "bg-arc-purple-500 text-white",
                      isDone && !isToday && "bg-[#eef9f3]",
                      !isToday && !isDone && "bg-[#faf8ff]",
                    )}
                  >
                    <span
                      className={cn(
                        "font-display text-[15px] font-bold",
                        isToday
                          ? "text-white"
                          : isDone
                            ? "text-[#16a56b]"
                            : "text-[#1b1730]",
                      )}
                    >
                      {day.full}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        isToday
                          ? "text-white/70"
                          : isDone
                            ? "text-[#16a56b]/80"
                            : "text-[#8a7cb8]",
                      )}
                    >
                      {day.minutesDone}/{day.minutesPlanned}m
                    </span>
                    {isDone ? (
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          isToday ? "text-white" : "text-[#16a56b]",
                        )}
                        strokeWidth={3}
                      />
                    ) : isToday ? (
                      <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black tracking-wide uppercase">
                        Today
                      </span>
                    ) : null}
                  </div>

                  {tasks.length === 0 ? (
                    <p className="px-3.5 py-3 text-[12px] font-semibold text-[#b3a8d6]">
                      Rest / flex day
                    </p>
                  ) : (
                    <ul>
                      {tasks.map((task, i) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          last={i === tasks.length - 1}
                          sealed={sealed}
                          onSkip={
                            week && !sealed
                              ? () => skipTask.mutate({ taskId: task.id })
                              : undefined
                          }
                          onMoveTomorrow={
                            week && !sealed
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
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="rounded-[18px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-3.5">
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
      </div>

      <PlanDock
        todayHref={todayHref}
        onReplan={onReplan}
        replanning={replanning}
        sealed={sealed}
      />
    </div>
  );
}

function TodayTicket({
  task,
  href,
}: {
  task: WeekTask;
  href?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_14px_32px_rgba(70,40,150,0.1)]">
      <div className="flex items-stretch">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-[#0f1220] text-[#ffc928]">
          <Lock className="h-4 w-4" strokeWidth={2.5} />
          <span className="mt-1 text-[10px] font-black tracking-wide uppercase">
            {task.dayLabel}
          </span>
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
            +{task.xp} XP · feeds seal vault
          </p>
        </div>
      </div>
      <motion.div whileTap={{ scale: 0.985, y: 1 }} transition={snappySpring}>
        <Link
          href={href ?? task.href ?? "/path"}
          className="flex w-full items-center justify-center gap-2 bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
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
  const actionable =
    !sealed &&
    !done &&
    task.status !== "skipped" &&
    (onSkip || onMoveTomorrow);

  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 px-3.5 py-3",
        !last && "border-b border-[#f0ecf7]",
        today && "bg-[#faf8ff]",
        done && "opacity-65",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold",
          done && "bg-[#eef9f3] text-[#16a56b]",
          today && "bg-arc-purple-500 text-white",
          !done && !today && "bg-[#f0ecf7] text-[#8a7cb8]",
        )}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : task.dayLabel}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-display text-[14px] font-semibold",
            done ? "text-[#8a7cb8] line-through" : "text-[#1b1730]",
          )}
        >
          {task.title}
        </p>
        <p className="text-[11px] font-bold text-[#8a7cb8]">
          {task.track} · {task.minutes}m · +{task.xp} XP
        </p>
        {actionable ? (
          <div className="mt-1.5 flex gap-2">
            {onMoveTomorrow ? (
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMoveTomorrow();
                }}
                className="text-[10px] font-black tracking-wide text-arc-purple-500 uppercase disabled:opacity-40"
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
                className="text-[10px] font-black tracking-wide text-[#8a7cb8] uppercase disabled:opacity-40"
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
        <Link href={task.href}>{inner}</Link>
      </li>
    );
  }

  return <li>{inner}</li>;
}

function PlanDock({
  todayHref,
  onReplan,
  replanning,
  sealed,
}: {
  todayHref?: string;
  onReplan?: () => void;
  replanning?: boolean;
  sealed?: boolean;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
      <motion.div
        className="pointer-events-auto flex gap-2 rounded-[20px] border border-[#ebe4f6] bg-white/95 p-2 shadow-[0_12px_36px_rgba(70,40,150,0.14)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: 0.12 }}
      >
        <button
          type="button"
          onClick={onReplan}
          disabled={!onReplan || replanning || sealed}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ebe4f6] bg-[#f6f2ff] py-3.5 font-display text-[13px] font-semibold text-[#1b1730] disabled:opacity-40"
        >
          <RefreshCw
            className={cn("h-4 w-4", replanning && "animate-spin")}
            strokeWidth={2.5}
          />
          Replan
        </button>
        <motion.div
          className="flex-[1.35]"
          whileTap={{ scale: 0.98, y: 1 }}
          transition={snappySpring}
        >
          <Link
            href={todayHref ?? "/path"}
            className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3.5 font-display text-[13px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
          >
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
