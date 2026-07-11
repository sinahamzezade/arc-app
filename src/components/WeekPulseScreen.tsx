"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Flame,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { motion } from "motion/react";
import {
  weekPulseMockData,
  type WeekPulseMockData,
  type WeekTask,
} from "@/lib/week/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

/**
 * Week commitment stage — night hero family (Home).
 * Sessions-left first. Today ticket. Plan list. Replan dock.
 */
export default function WeekPulseScreen({
  data = weekPulseMockData,
}: {
  data?: WeekPulseMockData;
}) {
  const todayTask = data.tasks.find((t) => t.status === "today");
  const sessionsLeft =
    data.progress.sessionsPlanned - data.progress.sessionsDone;
  const doneDays = data.days.filter((d) => d.status === "done").length;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* NIGHT HERO */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
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
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {data.rangeLabel}
            </p>
            <h1 className="mt-0.5 font-display text-[24px] leading-none font-bold tracking-[-0.03em]">
              This week
            </h1>
          </div>
          {data.progress.onTrack ? (
            <span className="rounded-full bg-[#16a56b]/25 px-2.5 py-1 text-[11px] font-black text-[#7dffb5]">
              On track
            </span>
          ) : (
            <span className="rounded-full bg-[#ff8a3d]/25 px-2.5 py-1 text-[11px] font-black text-[#ffc9a0]">
              Catch up
            </span>
          )}
        </div>

        <div className="relative mt-7 grid grid-cols-[1.25fr_0.9fr] items-end gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              Commitment
            </p>
            {sessionsLeft > 0 ? (
              <>
                <p className="mt-1 font-display text-[56px] leading-[0.88] font-bold tracking-[-0.05em]">
                  {sessionsLeft}
                </p>
                <p className="mt-2 text-[14px] font-bold text-white/70">
                  session{sessionsLeft === 1 ? "" : "s"} to lock week{" "}
                  {data.streak.weeks + 1}
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-[48px] leading-[0.9] font-bold tracking-[-0.04em]">
                  Locked
                </p>
                <p className="mt-2 text-[14px] font-bold text-white/70">
                  Week {data.streak.weeks} commitment hit
                </p>
              </>
            )}
            <p className="mt-2 text-[12px] font-bold text-white/40">
              {data.progress.hoursDone}/{data.progress.hoursPlanned} hrs ·{" "}
              {data.progress.percent}%
            </p>
          </div>

          <div className="relative h-[120px]">
            <motion.div
              className="absolute top-0 right-0 z-[2] w-[92%] -rotate-2 rounded-2xl bg-[#ff8a3d] px-3 py-2.5 shadow-[0_5px_0_#d46520]"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-1 text-white/85">
                <Flame className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} />
                <span className="text-[9px] font-black tracking-wide uppercase">
                  Streak
                </span>
              </div>
              <p className="mt-1 font-display text-[28px] leading-none font-bold">
                {data.streak.weeks}
                <span className="text-[14px] font-semibold">w</span>
              </p>
            </motion.div>
            <div className="absolute right-2 bottom-0 z-[1] w-[80%] rotate-1 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[9px] font-black tracking-wide text-[#ffc928] uppercase">
                Days lit
              </p>
              <p className="mt-0.5 font-display text-[16px] font-bold">
                {doneDays}/7
              </p>
            </div>
          </div>
        </div>

        {/* Session meter */}
        <div className="relative mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-white/45">Sessions</span>
            <span className="text-[#ffc928]">
              {data.progress.sessionsDone}/{data.progress.sessionsPlanned}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: data.progress.sessionsPlanned }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  i < data.progress.sessionsDone
                    ? "bg-[#ffc928]"
                    : "bg-white/15",
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-[1] -mt-5 space-y-4 px-4 pb-[calc(env(safe-area-inset-bottom)+110px)]">
        {/* Day strip overhang */}
        <div className="rounded-[20px] border border-[#ebe4f6] bg-white p-2 shadow-[0_12px_28px_rgba(70,40,150,0.08)]">
          <DayRail days={data.days} />
        </div>

        {todayTask ? (
          <section>
            <p className="mb-2 px-0.5 text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
              Do this next
            </p>
            <TodayTicket task={todayTask} />
          </section>
        ) : null}

        <section>
          <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
            <h2 className="font-display text-[18px] font-bold text-[#1b1730]">
              Plan
            </h2>
            <span className="text-[11px] font-extrabold text-[#8a7cb8]">
              {data.weekLabel}
            </span>
          </div>
          <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
            {data.tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                last={i === data.tasks.length - 1}
              />
            ))}
          </ul>
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

      <ReplanDock todayHref={todayTask?.href} />
    </div>
  );
}

function DayRail({ days }: { days: WeekPulseMockData["days"] }) {
  return (
    <div className="flex gap-1">
      {days.map((day, i) => {
        const isToday = day.status === "today";
        const isDone = day.status === "done";

        return (
          <div
            key={day.label}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center rounded-xl px-0.5 py-2",
              isToday && "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]",
              isDone && "bg-[#eef9f3]",
              !isToday && !isDone && "bg-[#faf8ff]",
              i === 5 && !isToday && "ring-1 ring-arc-purple-200",
            )}
          >
            <span
              className={cn(
                "text-[9px] font-extrabold tracking-wide uppercase",
                isToday ? "text-white/75" : isDone ? "text-[#16a56b]" : "text-[#8a7cb8]",
              )}
            >
              {day.label}
            </span>
            <span
              className={cn(
                "mt-1 flex h-5 items-center justify-center font-display text-[13px] font-bold",
                isToday ? "text-white" : isDone ? "text-[#16a56b]" : "text-[#b3a8d6]",
              )}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
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

function TodayTicket({ task }: { task: WeekTask }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_14px_32px_rgba(70,40,150,0.1)]">
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
      <motion.div whileTap={{ scale: 0.985, y: 1 }} transition={snappySpring}>
        <Link
          href={task.href ?? "/path"}
          className="flex w-full items-center justify-center gap-2 bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
        >
          <Play className="h-4 w-4 fill-white" />
          Finish session · {task.minutes} min
        </Link>
      </motion.div>
    </div>
  );
}

function TaskRow({ task, last }: { task: WeekTask; last?: boolean }) {
  const done = task.status === "done";
  const today = task.status === "today";

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
      </div>
      {today ? (
        <ArrowRight
          className="h-4 w-4 shrink-0 text-arc-purple-500"
          strokeWidth={2.5}
        />
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

function ReplanDock({ todayHref }: { todayHref?: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
      <motion.div
        className="pointer-events-auto flex gap-2 rounded-[20px] border border-[#ebe4f6] bg-white/95 p-2 shadow-[0_12px_36px_rgba(70,40,150,0.14)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: 0.15 }}
      >
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ebe4f6] bg-[#f6f2ff] py-3.5 font-display text-[13px] font-semibold text-[#1b1730]"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          Replan
        </button>
        <motion.div
          className="flex-[1.25]"
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
