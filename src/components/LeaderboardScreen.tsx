"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  CheckSquare,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Flame,
  Medal,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  leaderboardMockData,
  type LeaderboardEntry,
  type LeaderboardMockData,
  type LeaderboardTab,
} from "@/lib/leaderboard/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const pageStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

const rowStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
};

const rowItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

const tabs: {
  id: LeaderboardTab;
  label: string;
  icon: typeof Trophy;
}[] = [
  { id: "board", label: "Board", icon: Trophy },
  { id: "quests", label: "Quests", icon: ClipboardCheck },
  { id: "divisions", label: "Divisions", icon: Award },
];

export default function LeaderboardScreen({
  data = leaderboardMockData,
}: {
  data?: LeaderboardMockData;
}) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("board");
  const you = data.entries.find((e) => e.isYou);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(ellipse_at_20%_0%,#ffe8b8_0%,transparent_55%),radial-gradient(ellipse_at_90%_10%,#d9ccff_0%,transparent_50%),linear-gradient(#efe7ff,#f3effc_70%)]"
      />

      <motion.div
        className={cn(
          "relative px-[18px] pt-[calc(env(safe-area-inset-top)+18px)]",
          you ? "pb-36" : "pb-8",
        )}
        variants={pageStagger}
        initial="hidden"
        animate="visible"
      >
        <LeagueHero data={data} />

        <motion.nav
          role="tablist"
          aria-label="Leaderboard sections"
          className="mt-5 mb-5 flex items-end gap-1 border-b border-[#e3dbf5]"
          variants={fadeUp}
        >
          <LayoutGroup id="league-tabs">
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
                    "relative -mb-px flex items-center gap-1.5 px-3.5 pb-3 pt-1",
                    "font-display text-[14px] font-semibold",
                    active ? "text-[#2b1b57]" : "text-[#a79fc4]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {tab.label}
                  {active ? (
                    <motion.span
                      layoutId="league-tab-underline"
                      className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-arc-purple-500"
                      transition={snappySpring}
                    />
                  ) : null}
                </button>
              );
            })}
          </LayoutGroup>
        </motion.nav>

        <AnimatePresence mode="wait">
          {activeTab === "board" ? (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <BoardPanel data={data} />
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
              <EmptyPanel
                icon={CheckSquare}
                title="Weekly quests"
                body="Cohort challenges unlock here. Keep learning — quests land soon."
              />
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
              <EmptyPanel
                icon={Award}
                title="Division ladder"
                body="Bronze → Silver → Gold. Map of tiers coming next."
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {you && activeTab === "board" ? (
          <YouDock key="you-dock" entry={you} daysLeft={data.stats.daysLeft} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function LeagueHero({ data }: { data: LeaderboardMockData }) {
  return (
    <motion.header
      className="relative overflow-hidden rounded-[28px] bg-[#1b1433] px-5 pt-5 pb-6 shadow-[0_18px_40px_rgba(27,20,51,0.28)]"
      variants={fadeUp}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-[#cd7f32]/25 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-arc-purple-500/30 blur-2xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.08em] text-[#f0d9a8] uppercase">
            <Medal className="h-3 w-3" strokeWidth={2.5} />
            {data.weekLabel}
          </div>
          <h1 className="mt-3 font-display text-[28px] leading-[1.05] font-bold tracking-[-0.03em] text-white">
            {data.leagueName}
          </h1>
          <p className="mt-1.5 text-[13px] font-bold text-white/55">
            {data.cohortLabel}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#f0c46a,#cd7f32)] shadow-[0_8px_0_#8a5a1a]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Award className="h-7 w-7 text-white" strokeWidth={2.25} />
          </motion.div>
          <motion.div
            className="flex items-center gap-1 rounded-full bg-[#ff8a3d] px-2.5 py-1 text-[11px] font-black text-white shadow-[0_3px_0_#d46520]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...snappySpring, delay: 0.2 }}
          >
            <Clock className="h-3 w-3" strokeWidth={2.75} />
            {data.stats.daysLeft}d left
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}

function BoardPanel({ data }: { data: LeaderboardMockData }) {
  const board = data.entries.filter((e) => !e.isYou);

  return (
    <div className="space-y-5">
      <RaceStrip stats={data.stats} />
      <LeaderboardTable
        entries={board}
        promoteTop={data.stats.promoteTop}
        footerNote={data.footerNote}
      />
    </div>
  );
}

function RaceStrip({
  stats,
}: {
  stats: LeaderboardMockData["stats"];
}) {
  const promotePct = Math.round((stats.promoteTop / stats.cohortSize) * 100);
  const demotePct = Math.round((stats.demoteBottom / stats.cohortSize) * 100);
  const midPct = 100 - promotePct - demotePct;

  return (
    <motion.div
      className="rounded-[22px] border border-[#ebe4f6] bg-white/80 p-3.5 shadow-[0_8px_22px_rgba(70,40,150,0.06)]"
      variants={fadeUp}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-black tracking-[0.05em] text-[#8a7cb8] uppercase">
          Week race
        </span>
        <span className="text-[11px] font-extrabold text-[#2b1b57]">
          {stats.cohortSize} learners
        </span>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full">
        <motion.div
          className="bg-[#16a56b]"
          initial={{ width: 0 }}
          animate={{ width: `${promotePct}%` }}
          transition={{ ...softSpring, delay: 0.15 }}
          title="Promote"
        />
        <motion.div
          className="bg-[#e3dbf5]"
          initial={{ width: 0 }}
          animate={{ width: `${midPct}%` }}
          transition={{ ...softSpring, delay: 0.22 }}
        />
        <motion.div
          className="bg-[#e5484d]"
          initial={{ width: 0 }}
          animate={{ width: `${demotePct}%` }}
          transition={{ ...softSpring, delay: 0.29 }}
          title="Demote"
        />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#eef9f3]">
            <ArrowUp className="h-3 w-3 text-[#16a56b]" strokeWidth={3} />
          </span>
          <div>
            <p className="font-display text-[15px] leading-none font-bold text-[#16a56b]">
              Top {stats.promoteTop}
            </p>
            <p className="mt-0.5 text-[10px] font-extrabold text-[#8a7cb8]">
              promote
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="font-display text-[15px] leading-none font-bold text-[#ff7a45]">
            {stats.daysLeft} days
          </p>
          <p className="mt-0.5 text-[10px] font-extrabold text-[#8a7cb8]">
            on the clock
          </p>
        </div>

        <div className="flex items-start justify-end gap-1.5 text-right">
          <div>
            <p className="font-display text-[15px] leading-none font-bold text-[#e5484d]">
              Bottom {stats.demoteBottom}
            </p>
            <p className="mt-0.5 text-[10px] font-extrabold text-[#8a7cb8]">
              demote
            </p>
          </div>
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#fdecef]">
            <ArrowDown className="h-3 w-3 text-[#e5484d]" strokeWidth={3} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardTable({
  entries,
  promoteTop,
  footerNote,
}: {
  entries: LeaderboardEntry[];
  promoteTop: number;
  footerNote: string;
}) {
  const aboveLine = entries.filter((e) => e.rank <= promoteTop);
  const belowLine = entries.filter((e) => e.rank > promoteTop);

  return (
    <motion.section aria-label="Leaderboard table" variants={fadeUp}>
      <div className="mb-3 flex items-baseline justify-between gap-3 px-0.5">
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-[#2b1b57]">
          Leaderboard
        </h2>
        <span className="text-[12px] font-bold text-[#8a7cb8]">This week</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ebe4f6] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#f0ecf7] text-[11px] font-bold text-[#8a7cb8]">
                <th scope="col" className="w-10 px-3 py-2.5 font-bold">
                  #
                </th>
                <th scope="col" className="px-2 py-2.5 font-bold">
                  Learner
                </th>
                <th
                  scope="col"
                  className="hidden w-16 px-2 py-2.5 text-center font-bold sm:table-cell"
                >
                  Streak
                </th>
                <th scope="col" className="w-14 px-3 py-2.5 text-right font-bold">
                  XP
                </th>
                <th scope="col" className="w-10 px-2 py-2.5">
                  <span className="sr-only">Cheer</span>
                </th>
              </tr>
            </thead>

            <motion.tbody
              variants={rowStagger}
              initial="hidden"
              animate="visible"
            >
              {aboveLine.map((entry) => (
                <TableRankRow key={entry.id} entry={entry} />
              ))}

              <motion.tr variants={rowItem}>
                <td colSpan={5} className="p-0">
                  <div className="flex items-center justify-center gap-1 border-y border-dashed border-[#d4eedf] bg-[#f6fbf8] px-3 py-2 text-[10px] font-bold tracking-[0.04em] text-[#16a56b]">
                    <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
                    Top {promoteTop} promote
                    <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
                  </div>
                </td>
              </motion.tr>

              {belowLine.map((entry) => (
                <TableRankRow key={entry.id} entry={entry} muted />
              ))}
            </motion.tbody>
          </table>
        </div>

        <p className="border-t border-[#f0ecf7] px-4 py-3 text-[12px] leading-snug font-medium text-[#8a7cb8]">
          {footerNote}
        </p>
      </div>
    </motion.section>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="font-display text-[14px] font-semibold text-[#c79a2e]">
        1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="font-display text-[14px] font-semibold text-[#8a9198]">
        2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="font-display text-[14px] font-semibold text-[#c08457]">
        3
      </span>
    );
  }

  return (
    <span className="font-display text-[14px] font-semibold text-[#b3a8d6]">
      {rank}
    </span>
  );
}

function TableRankRow({
  entry,
  muted = false,
}: {
  entry: LeaderboardEntry;
  muted?: boolean;
}) {
  const isFirst = entry.rank === 1;

  return (
    <motion.tr
      variants={rowItem}
      className={cn(
        "border-b border-[#f0ecf7] last:border-b-0",
        isFirst && "bg-[#fffbf0]",
        muted && "opacity-60",
      )}
    >
      <td className="px-3 py-3 text-center align-middle">
        <RankBadge rank={entry.rank} />
      </td>

      <td className="px-2 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: entry.avatarBg }}
          >
            <span
              className="font-display text-[14px] font-semibold"
              style={{ color: entry.avatarColor }}
            >
              {entry.initial}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[#2b1b57]">
              {entry.name}
            </p>
            {entry.streakWeeks != null ? (
              <p className="mt-0.5 flex items-center gap-0.5 text-[11px] font-semibold text-[#8a7cb8] sm:hidden">
                <Flame className="h-3 w-3" strokeWidth={2.25} />
                {entry.streakWeeks}w
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td className="hidden px-2 py-3 text-center align-middle sm:table-cell">
        {entry.streakWeeks != null ? (
          <span className="inline-flex items-center justify-center gap-0.5 text-[12px] font-semibold text-[#8a7cb8]">
            <Flame className="h-3.5 w-3.5" strokeWidth={2.25} />
            {entry.streakWeeks}w
          </span>
        ) : (
          <span className="text-[12px] font-medium text-[#d5cee8]">—</span>
        )}
      </td>

      <td className="px-3 py-3 text-right align-middle">
        <span className="text-[13px] font-semibold tabular-nums text-[#2b1b57]">
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
    </motion.tr>
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
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom)+8px)] z-20 mx-auto w-full max-w-md px-[18px]">
      <motion.div
        className="pointer-events-auto overflow-hidden rounded-[24px] border border-arc-purple-200 bg-[linear-gradient(120deg,#6b4eff,#8a5cff)] p-px shadow-[0_16px_40px_rgba(91,46,224,0.35)]"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ ...softSpring, delay: 0.25 }}
      >
        <div className="rounded-[23px] bg-[#1b1433] p-3.5">
          <div className="flex items-center gap-3">
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
              <motion.span
                className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-arc-purple-500 px-1 font-display text-[11px] font-bold text-white shadow-[0_3px_0_#4b2fd6]"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                #{entry.rank}
              </motion.span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-black text-white">{entry.name}</p>
              <p className="truncate text-[11.5px] font-bold text-[#bca8ff]">
                {entry.nudge ?? `${daysLeft} days left to climb`}
              </p>
            </div>

            <div className="text-right">
              <p className="font-display text-[18px] leading-none font-bold text-white">
                {entry.xp}
              </p>
              <p className="text-[10px] font-extrabold tracking-wide text-white/50 uppercase">
                XP
              </p>
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.98, y: 1 }} transition={snappySpring}>
            <Link
              href="/path"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-arc-purple-500 py-3 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
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
        </div>
      </motion.div>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Award;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      className="rounded-[28px] border border-dashed border-[#d5ccec] bg-white/70 px-6 py-12 text-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={snappySpring}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b1433] text-[#f0c46a]">
        <Icon className="h-7 w-7" strokeWidth={2} />
      </div>
      <h2 className="mt-4 font-display text-[20px] font-bold text-[#2b1b57]">
        {title}
      </h2>
      <p className="mt-2 text-[13px] font-semibold text-[#8a7cb8]">{body}</p>
    </motion.div>
  );
}
