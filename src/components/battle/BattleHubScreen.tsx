"use client";

import Link from "next/link";
import {
  Coins,
  Flame,
  Gem,
  Swords,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import {
  battleFriends,
  battleHistory,
  battleHubStats,
  incomingInvite,
} from "@/lib/battle/mock-data";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

/**
 * Arena hub — night stage, ticket invite, rival orbit rail.
 * Not a stacked marketing card list.
 */
export default function BattleHubScreen() {
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const stats = battleHubStats;
  const online = battleFriends.filter((f) => f.online);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* ARENA HERO */}
      <section className="relative overflow-hidden bg-[#0f1220] px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-20 text-white">
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

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              <Swords className="h-3 w-3" strokeWidth={2.5} />
              Arena
            </p>
            <h1 className="mt-3 font-display text-[36px] leading-[0.92] font-bold tracking-[-0.04em]">
              Battle
            </h1>
          </div>
          <Link
            href="/wallet"
            className="flex flex-col items-end gap-1 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm"
          >
            <Wallet className="h-4 w-4 text-white/70" strokeWidth={2.25} />
            <span className="font-display text-[15px] font-bold tabular-nums">
              {coins.toLocaleString()}
            </span>
            <span className="text-[9px] font-extrabold tracking-wide text-white/45 uppercase">
              coins
            </span>
          </Link>
        </div>

        {/* Crossed score plate */}
        <motion.div
          className="relative mt-6 flex items-end justify-between gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white/45">Win streak</p>
            <p className="mt-1 flex items-center gap-2 font-display text-[42px] leading-none font-bold tracking-[-0.04em]">
              <Flame className="h-8 w-8 text-[#ff8a3d]" fill="currentColor" strokeWidth={1.5} />
              {stats.winStreak}
            </p>
            <p className="mt-2 text-[12px] font-bold text-white/55">
              {stats.wins}W · {stats.losses}L · {stats.winRate}%
            </p>
          </div>

          <div className="shrink-0 -rotate-3 rounded-[22px] border border-[#ffc928]/40 bg-[#ffc928] px-4 py-3 text-[#1b1730] shadow-[0_8px_0_#c79a2e]">
            <p className="text-[10px] font-black tracking-[0.08em] uppercase">
              Best subject
            </p>
            <p className="mt-1 font-display text-[18px] font-bold">
              {stats.favoriteSubject}
            </p>
          </div>
        </motion.div>

        {/* Currency ticks on hero floor */}
        <div className="relative mt-5 flex gap-3 text-[12px] font-extrabold text-white/70">
          <span className="inline-flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-[#ffc928]" />
            {xp.toLocaleString()} XP
          </span>
          <span className="inline-flex items-center gap-1">
            <Gem className="h-3.5 w-3.5 text-[#bca8ff]" />
            {gems} gems
          </span>
        </div>
      </section>

      {/* BODY — overlaps hero */}
      <div className="relative -mt-10 px-4 pb-8">
        {/* Challenge CTA — primary slab, not twin grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.08 }}
        >
          <Link
            href="/battle/create"
            className="flex items-center gap-4 overflow-hidden rounded-[26px] bg-arc-purple-500 p-4 text-white shadow-[0_10px_0_#4b2fd6,0_20px_40px_rgba(75,47,214,0.35)]"
          >
            <motion.span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Swords className="h-7 w-7" strokeWidth={2.25} />
            </motion.span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[20px] leading-tight font-bold tracking-[-0.02em]">
                Challenge a friend
              </span>
              <span className="mt-1 block text-[13px] font-bold text-white/75">
                Stake coins · timed quiz · winner takes pot
              </span>
            </span>
          </Link>
        </motion.div>

        {/* Incoming invite as TICKET — rotated, overlapping */}
        <motion.div
          className="relative z-[1] mt-4 -rotate-1"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...softSpring, delay: 0.14 }}
        >
          <Link
            href={`/battle/invite/${incomingInvite.id}`}
            className="block overflow-hidden rounded-[20px] border-2 border-dashed border-[#c79a2e] bg-[#fff8e8] shadow-[0_12px_28px_rgba(199,154,46,0.18)]"
          >
            <div className="flex items-stretch">
              <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-[#ffc928] px-2 py-4 text-[#1b1730]">
                <Coins className="h-5 w-5" strokeWidth={2.5} />
                <p className="mt-1 font-display text-[16px] font-bold">
                  {incomingInvite.stake}
                </p>
                <p className="text-[9px] font-black tracking-wide uppercase">
                  stake
                </p>
              </div>
              <div className="min-w-0 flex-1 px-3.5 py-3.5">
                <p className="text-[10px] font-black tracking-[0.1em] text-[#c79a2e] uppercase">
                  Incoming · {incomingInvite.expiresIn} left
                </p>
                <p className="mt-1 font-display text-[17px] font-bold text-[#1b1730]">
                  {incomingInvite.from.name}
                </p>
                <p className="mt-0.5 text-[12px] font-bold text-[#8a6a1e]">
                  {incomingInvite.subject} · {incomingInvite.topic} ·{" "}
                  {incomingInvite.questions}Q
                </p>
              </div>
              <div className="flex items-center pr-3">
                <span className="rounded-full bg-[#1b1730] px-3 py-1.5 text-[11px] font-extrabold text-white">
                  Open
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Rival orbit — horizontal, uneven sizes */}
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
            <h2 className="font-display text-[18px] font-semibold text-[#1b1730]">
              Rivals online
            </h2>
            <Link
              href="/friends"
              className="inline-flex items-center gap-1 text-[12px] font-extrabold text-arc-purple-500"
            >
              <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
              Friends
            </Link>
          </div>

          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            {online.map((f, i) => {
              const big = i === 0;
              return (
                <Link
                  key={f.id}
                  href={`/battle/create?opponent=${f.id}`}
                  className={cn(
                    "relative shrink-0 rounded-[22px] border border-[#ebe4f6] bg-white p-3 shadow-[0_8px_20px_rgba(70,40,150,0.08)]",
                    big ? "w-[148px] -rotate-2" : "w-[112px] rotate-1",
                    i === 1 && "translate-y-2",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-2xl font-display font-bold text-white",
                      big ? "h-14 w-14 text-[20px]" : "h-11 w-11 text-[16px]",
                    )}
                    style={{ background: f.color }}
                  >
                    {f.initial}
                  </span>
                  <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-[#16c784] ring-2 ring-white" />
                  <p
                    className={cn(
                      "mt-2 truncate font-display font-semibold text-[#1b1730]",
                      big ? "text-[15px]" : "text-[13px]",
                    )}
                  >
                    {f.name.split(" ")[0]}
                  </p>
                  <p className="text-[10px] font-bold text-[#8a7cb8]">
                    Lv {f.level} · {f.league}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-[#f6f2ff] px-2 py-0.5 text-[10px] font-extrabold text-arc-purple-500">
                    Fight
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Record stamps — horizontal tape, not rows */}
        <section className="mt-7">
          <h2 className="mb-3 font-display text-[18px] font-semibold text-[#1b1730]">
            Recent tape
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {battleHistory.map((h) => {
              const win = h.result === "win";
              return (
                <div
                  key={h.id}
                  className={cn(
                    "w-[150px] shrink-0 rounded-[18px] border px-3 py-3",
                    win
                      ? "border-[#b8ebce] bg-[#eef9f3]"
                      : "border-[#f5c9c9] bg-[#fff5f5]",
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-black tracking-wide uppercase",
                      win ? "text-[#178a52]" : "text-[#e5484d]",
                    )}
                  >
                    {win ? "Win" : "Loss"}
                  </p>
                  <p className="mt-1 truncate font-display text-[14px] font-semibold text-[#1b1730]">
                    vs {h.opponentName.split(" ")[0]}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                    {h.subject} · {h.yourScore}–{h.theirScore}
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-display text-[15px] font-bold",
                      h.coinsDelta >= 0 ? "text-[#178a52]" : "text-[#e5484d]",
                    )}
                  >
                    {h.coinsDelta > 0 ? "+" : ""}
                    {h.coinsDelta}c
                  </p>
                </div>
              );
            })}
            <Link
              href="/friends"
              className="flex w-[120px] shrink-0 flex-col items-center justify-center rounded-[18px] border border-dashed border-[#d5ccec] bg-white/80 px-3 py-3 text-center"
            >
              <Users className="h-5 w-5 text-arc-purple-500" strokeWidth={2.25} />
              <span className="mt-2 text-[12px] font-extrabold text-[#4a3d78]">
                Study or invite
              </span>
            </Link>
          </div>
        </section>

        {/* Tiny secondary dock */}
        <motion.div
          className="mt-6 flex gap-2"
          whileTap={{ scale: 0.99 }}
          transition={snappySpring}
        >
          <Link
            href="/study/invite"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#ebe4f6] bg-white py-3.5 font-display text-[13px] font-semibold text-[#1b1730]"
          >
            Study Together
          </Link>
          <Link
            href="/leaderboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1b1433] py-3.5 font-display text-[13px] font-semibold text-white"
          >
            League board
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
