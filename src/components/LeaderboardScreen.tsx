"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  Check,
  ClipboardCheck,
  Clock,
  Flame,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  leaderboardMockData,
  type LeaderboardEntry,
  type LeaderboardMockData,
  type LeaderboardTab,
  type LeagueDivision,
  type LeagueQuest,
} from "@/lib/leaderboard/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const tabs: {
  id: LeaderboardTab;
  label: string;
  icon: typeof Trophy;
}[] = [
  { id: "board", label: "Board", icon: Trophy },
  { id: "quests", label: "Quests", icon: ClipboardCheck },
  { id: "divisions", label: "Tiers", icon: Award },
];

/**
 * Season stage — matches Battle/Wallet night-hero family.
 * Giant rank + overlapping race chips + soft standings table.
 */
export default function LeaderboardScreen({
  data = leaderboardMockData,
}: {
  data?: LeaderboardMockData;
}) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("board");
  const you = data.entries.find((e) => e.isYou);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* SEASON HERO — same grammar as Battle/Wallet */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-20 text-white">
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
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              <Trophy className="h-3 w-3" strokeWidth={2.5} />
              {data.weekLabel}
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-[0.92] font-bold tracking-[-0.04em]">
              {data.leagueName}
            </h1>
            <p className="mt-2 text-[12px] font-bold text-white/45">
              {data.cohortLabel}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff8a3d] px-2.5 py-1 text-[11px] font-black text-white shadow-[0_3px_0_#d46520]">
            <Clock className="h-3 w-3" strokeWidth={2.75} />
            {data.stats.daysLeft}d
          </span>
        </div>

        {you ? (
          <div className="relative mt-8 grid grid-cols-[1.25fr_1fr] items-end gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
                Your spot
              </p>
              <motion.p
                className="mt-1 font-display text-[64px] leading-[0.85] font-bold tracking-[-0.05em]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={softSpring}
              >
                #{you.rank}
              </motion.p>
              <p className="mt-2 text-[13px] font-bold text-white/45">
                of {data.stats.cohortSize} · {you.xp} XP
              </p>
            </div>

            {/* Overlapping chips — Wallet gem/XP pattern */}
            <div className="relative h-[128px]">
              <motion.div
                className="absolute top-0 right-0 z-[3] w-[95%] -rotate-2 rounded-2xl bg-[#16a56b] px-3 py-2.5 shadow-[0_6px_0_#0e7a4c]"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...softSpring, delay: 0.06 }}
              >
                <div className="flex items-center gap-1 text-white/85">
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={3} />
                  <span className="text-[10px] font-black tracking-wide uppercase">
                    Promote
                  </span>
                </div>
                <p className="mt-1 font-display text-[18px] leading-none font-bold">
                  Top {data.stats.promoteTop}
                </p>
              </motion.div>

              <motion.div
                className="absolute top-[42px] right-3 z-[2] w-[88%] rotate-1 rounded-2xl bg-[#ffc928] px-3 py-2 text-[#0f1220] shadow-[0_5px_0_#c79a2e]"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...softSpring, delay: 0.1 }}
              >
                <div className="flex items-center gap-1 opacity-70">
                  <Clock className="h-3 w-3" strokeWidth={2.75} />
                  <span className="text-[9px] font-black tracking-wide uppercase">
                    Clock
                  </span>
                </div>
                <p className="mt-0.5 font-display text-[16px] leading-none font-bold">
                  {data.stats.daysLeft} days
                </p>
              </motion.div>

              <motion.div
                className="absolute right-0 bottom-0 z-[1] w-[82%] -rotate-1 rounded-2xl bg-[#e5484d] px-3 py-2 shadow-[0_5px_0_#b43438]"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...softSpring, delay: 0.14 }}
              >
                <div className="flex items-center gap-1 text-white/85">
                  <ArrowDown className="h-3 w-3" strokeWidth={3} />
                  <span className="text-[9px] font-black tracking-wide uppercase">
                    Demote
                  </span>
                </div>
                <p className="mt-0.5 font-display text-[15px] leading-none font-bold">
                  Bot {data.stats.demoteBottom}
                </p>
              </motion.div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Tabs — Wallet overhang */}
      <div className="relative z-[1] -mt-5 px-4">
        <nav
          role="tablist"
          aria-label="League sections"
          className="flex gap-1 rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(70,40,150,0.1)]"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[14px] py-2.5 font-display text-[13px] font-semibold",
                  active
                    ? "bg-[#0f1220] text-[#ffc928]"
                    : "text-[#8a7cb8]",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className={cn(
          "relative px-4 pt-5",
          you && activeTab === "board"
            ? "pb-[calc(5.25rem+env(safe-area-inset-bottom)+128px)]"
            : "pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)]",
        )}
      >
        <AnimatePresence mode="wait">
          {activeTab === "board" ? (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <StandingsTable data={data} />
            </motion.div>
          ) : null}
          {activeTab === "quests" ? (
            <motion.div
              key="quests"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <QuestsPanel quests={data.quests} />
            </motion.div>
          ) : null}
          {activeTab === "divisions" ? (
            <motion.div
              key="divisions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <DivisionsPanel divisions={data.divisions} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {you && activeTab === "board" ? (
          <YouDock key="you-dock" entry={you} daysLeft={data.stats.daysLeft} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StandingsTable({ data }: { data: LeaderboardMockData }) {
  const sorted = [...data.entries].sort((a, b) => a.rank - b.rank);
  const promoteTop = data.stats.promoteTop;
  const demoteFloor = data.stats.cohortSize - data.stats.demoteBottom + 1;

  const promoteRows = sorted.filter((e) => e.rank <= promoteTop);
  const midRows = sorted.filter(
    (e) => e.rank > promoteTop && e.rank < demoteFloor,
  );
  const demoteRows = sorted.filter((e) => e.rank >= demoteFloor);

  return (
    <section aria-label="League standings table">
      <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
        <div>
          <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#1b1730]">
            Standings
          </h2>
          <p className="text-[11px] font-extrabold text-[#8a7cb8]">
            Weekly League XP · resets Monday
          </p>
        </div>
        <span className="rounded-full bg-[#0f1220] px-2.5 py-1 text-[10px] font-black tracking-wide text-[#ffc928] uppercase">
          Live
        </span>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#f0ecf7] bg-[#faf8ff] text-[10px] font-black tracking-[0.08em] text-[#8a7cb8] uppercase">
                <th scope="col" className="w-11 px-3 py-3 font-black">
                  #
                </th>
                <th scope="col" className="px-2 py-3 font-black">
                  Learner
                </th>
                <th scope="col" className="w-16 px-2 py-3 text-center font-black">
                  Streak
                </th>
                <th scope="col" className="w-14 px-3 py-3 text-right font-black">
                  XP
                </th>
                <th scope="col" className="w-11 px-2 py-3">
                  <span className="sr-only">Cheer</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {promoteRows.map((entry) => (
                <TableRow key={entry.id} entry={entry} zone="promote" />
              ))}

              <tr>
                <td colSpan={5} className="p-0">
                  <div className="flex items-center justify-center gap-1.5 border-y border-dashed border-[#d4eedf] bg-[#f6fbf8] px-3 py-2 text-[10px] font-black tracking-[0.06em] text-[#16a56b] uppercase">
                    <ArrowUp className="h-3 w-3" strokeWidth={3} />
                    Promote cut · top {promoteTop}
                    <ArrowUp className="h-3 w-3" strokeWidth={3} />
                  </div>
                </td>
              </tr>

              {midRows.map((entry) => (
                <TableRow key={entry.id} entry={entry} zone="mid" />
              ))}

              {demoteRows.length > 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="flex items-center justify-center gap-1.5 border-y border-dashed border-[#f5c4c6] bg-[#fff5f6] px-3 py-2 text-[10px] font-black tracking-[0.06em] text-[#e5484d] uppercase">
                      <ArrowDown className="h-3 w-3" strokeWidth={3} />
                      Demote zone · bottom {data.stats.demoteBottom}
                      <ArrowDown className="h-3 w-3" strokeWidth={3} />
                    </div>
                  </td>
                </tr>
              ) : null}

              {demoteRows.map((entry) => (
                <TableRow key={entry.id} entry={entry} zone="demote" />
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-[#f0ecf7] px-4 py-3 text-[12px] leading-snug font-medium text-[#8a7cb8]">
          {data.footerNote}
        </p>
      </div>
    </section>
  );
}

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="font-display text-[15px] font-bold text-[#c79a2e]">1</span>
    );
  }
  if (rank === 2) {
    return (
      <span className="font-display text-[15px] font-bold text-[#8a9198]">2</span>
    );
  }
  if (rank === 3) {
    return (
      <span className="font-display text-[15px] font-bold text-[#c08457]">3</span>
    );
  }
  return (
    <span className="font-display text-[15px] font-bold tabular-nums text-[#b3a8d6]">
      {rank}
    </span>
  );
}

function TableRow({
  entry,
  zone,
}: {
  entry: LeaderboardEntry;
  zone: "promote" | "mid" | "demote";
}) {
  const you = entry.isYou;

  return (
    <tr
      className={cn(
        "border-b border-[#f0ecf7] last:border-b-0",
        you && "bg-arc-purple-500/10",
        !you && zone === "promote" && entry.rank === 1 && "bg-[#fffbf0]",
        !you && zone === "demote" && "opacity-60",
      )}
    >
      <td className="px-3 py-3 text-center align-middle">
        <RankCell rank={entry.rank} />
      </td>

      <td className="px-2 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[14px] font-bold",
              you && "ring-2 ring-arc-purple-500 ring-offset-1",
            )}
            style={{ background: entry.avatarBg, color: entry.avatarColor }}
          >
            {entry.initial}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-[14px] font-semibold",
                you ? "text-arc-purple-500" : "text-[#1b1730]",
              )}
            >
              {entry.name}
              {you ? (
                <span className="ml-1.5 rounded-full bg-arc-purple-500 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white uppercase">
                  You
                </span>
              ) : null}
            </p>
            {entry.nudge && you ? (
              <p className="mt-0.5 truncate text-[10px] font-bold text-arc-purple-500/70">
                {entry.nudge}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td className="px-2 py-3 text-center align-middle">
        {entry.streakWeeks != null ? (
          <span className="inline-flex items-center justify-center gap-0.5 text-[12px] font-bold text-[#8a7cb8]">
            <Flame className="h-3.5 w-3.5 text-[#ff8a3d]" strokeWidth={2.25} />
            {entry.streakWeeks}w
          </span>
        ) : (
          <span className="text-[12px] font-medium text-[#d5cee8]">—</span>
        )}
      </td>

      <td className="px-3 py-3 text-right align-middle">
        <span
          className={cn(
            "font-display text-[15px] font-bold tabular-nums",
            you ? "text-arc-purple-500" : "text-[#1b1730]",
          )}
        >
          {entry.xp}
        </span>
      </td>

      <td className="px-2 py-3 align-middle">
        {entry.showLike ? (
          <motion.button
            type="button"
            aria-label={`Cheer ${entry.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#b3a8d6] hover:bg-[#f6f2ff]"
            whileTap={{ scale: 0.88 }}
            transition={snappySpring}
          >
            <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2} />
          </motion.button>
        ) : (
          <span className="block h-8 w-8" aria-hidden />
        )}
      </td>
    </tr>
  );
}

function QuestsPanel({ quests }: { quests: LeagueQuest[] }) {
  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h2 className="font-display text-[20px] font-bold text-[#1b1730]">
          Weekly quests
        </h2>
        <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
          Extra League XP · resets Monday
        </p>
      </div>

      {quests.map((q, i) => {
        const pct = Math.min(100, Math.round((q.progress / q.goal) * 100));
        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...softSpring, delay: i * 0.04 }}
            className={cn(
              "overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white",
              q.done && "border-[#d4eedf] bg-[#f6fbf8]",
              i === 1 && "ml-3",
            )}
          >
            <div className="flex items-stretch">
              <div
                className={cn(
                  "flex w-14 shrink-0 items-center justify-center",
                  q.done ? "bg-[#16a56b] text-white" : "bg-[#f6f2ff] text-arc-purple-500",
                )}
              >
                {q.done ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  <ClipboardCheck className="h-5 w-5" strokeWidth={2.25} />
                )}
              </div>
              <div className="min-w-0 flex-1 px-3.5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-semibold text-[#1b1730]">
                      {q.title}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                      {q.detail}
                    </p>
                  </div>
                  {!q.done ? (
                    <span className="shrink-0 rounded-full bg-[#0f1220] px-2.5 py-1 font-display text-[11px] font-bold text-[#ffc928]">
                      +{q.xpReward}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#ebe4f6]">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      q.done ? "bg-[#16a56b]" : "bg-arc-purple-500",
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...softSpring, delay: 0.1 + i * 0.04 }}
                  />
                </div>
                <p className="mt-1 text-[11px] font-extrabold text-[#8a7cb8]">
                  {q.progress}/{q.goal}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function DivisionsPanel({ divisions }: { divisions: LeagueDivision[] }) {
  const colors: Record<LeagueDivision["tier"], string> = {
    bronze: "#cd7f32",
    silver: "#8a9198",
    gold: "#ffc928",
  };

  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h2 className="font-display text-[20px] font-bold text-[#1b1730]">
          Division ladder
        </h2>
        <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
          Climb by weekly League XP
        </p>
      </div>

      <div className="relative pl-1">
        <div
          aria-hidden
          className="absolute top-5 bottom-5 left-[21px] w-0.5 bg-[#ebe4f6]"
        />
        {divisions.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: i * 0.08 }}
            className={cn(
              "relative mb-3 flex items-center gap-3 last:mb-0",
              i === 1 && "ml-5",
              i === 2 && "ml-2",
            )}
          >
            <span
              className={cn(
                "relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                d.active && "ring-2 ring-arc-purple-500 ring-offset-2",
              )}
              style={{ background: colors[d.tier] }}
            >
              <Award className="h-5 w-5 text-[#0f1220]" strokeWidth={2.25} />
            </span>
            <div
              className={cn(
                "min-w-0 flex-1 rounded-[18px] border px-3.5 py-3",
                d.active
                  ? "border-transparent bg-[#0f1220] text-white"
                  : "border-[#ebe4f6] bg-white",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[16px] font-bold">{d.name}</p>
                {d.active ? (
                  <span className="rounded-full bg-[#ffc928] px-2 py-0.5 text-[10px] font-black text-[#0f1220] uppercase">
                    You
                  </span>
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-0.5 text-[12px] font-semibold",
                  d.active ? "text-white/45" : "text-[#8a7cb8]",
                )}
              >
                {d.rangeLabel}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function YouDock({
  entry,
  daysLeft,
}: {
  entry: LeaderboardEntry;
  daysLeft: number;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom)+8px)] z-20 mx-auto w-full max-w-md px-4">
      <motion.div
        className="pointer-events-auto overflow-hidden rounded-[22px] bg-[#0f1220] shadow-[0_16px_40px_rgba(15,18,32,0.4)]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ ...softSpring, delay: 0.15 }}
      >
        <div className="flex items-center gap-3 p-3.5">
          <div className="relative">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: entry.avatarBg }}
            >
              <span
                className="font-display text-[18px] font-bold"
                style={{ color: entry.avatarColor }}
              >
                {entry.initial}
              </span>
            </div>
            <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ffc928] px-1 font-display text-[11px] font-bold text-[#0f1220]">
              #{entry.rank}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black text-white">{entry.name}</p>
            <p className="truncate text-[11.5px] font-bold text-[#ffc928]/80">
              {entry.nudge ?? `${daysLeft} days left to climb`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-[18px] leading-none font-bold text-white">
              {entry.xp}
            </p>
            <p className="text-[9px] font-extrabold tracking-wide text-white/40 uppercase">
              XP
            </p>
          </div>
        </div>

        <motion.div whileTap={{ scale: 0.98, y: 1 }} transition={snappySpring}>
          <Link
            href="/path"
            className="flex w-full items-center justify-center gap-2 bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
          >
            Climb the board
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
