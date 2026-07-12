"use client";

import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Flame,
  Gem,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { socialApi, type SocialFriendDto } from "@/lib/api/social";
import { battlesApi, type BattleDto } from "@/lib/api/battles";
import {
  battleHref,
  battleStatusLabel,
  useBattleHub,
} from "@/hooks/useBattles";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

function rivalName(b: BattleDto) {
  return b.opponent.displayName || b.opponent.username || "Rival";
}

/**
 * Arena hub — night stage, live/pending matches, tape, rival orbit.
 */
export default function BattleHubScreen() {
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const searchParams = useSearchParams();
  const wasBlocked = searchParams.get("blocked") === "1";
  const { stats, history, live, incoming, outgoing, blocking, loadMore } =
    useBattleHub();
  const [friends, setFriends] = useState<SocialFriendDto[]>([]);
  const [forfeiting, setForfeiting] = useState(false);
  const online = friends.filter((f) => f.online);

  const forfeitBlocking = async () => {
    if (!blocking || forfeiting) return;
    setForfeiting(true);
    try {
      await battlesApi.forfeit(blocking.id);
    } catch {
      /* ignore — hub will re-poll */
    } finally {
      setForfeiting(false);
    }
  };

  const statsData = stats.data ?? {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    winStreak: 0,
    favoriteSubject: "—",
  };
  const historyItems = history.data?.items ?? [];
  const historyCursor = history.data?.nextCursor ?? null;
  const hasOpen = live.length + incoming.length + outgoing.length > 0;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        void socialApi.heartbeat().catch(() => undefined);
        const crew = await socialApi.friends();
        if (!cancelled) setFriends(crew.items);
      } catch {
        /* empty */
      }
    };
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
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

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              <Swords className="h-3 w-3" strokeWidth={2.5} />
              Arena
            </p>
            <h1 className="mt-3 font-display text-[36px] leading-[0.92] font-bold tracking-[-0.04em]">
              Battle
            </h1>
          </div>

          {/*
            DESIGN: brutally minimal stake chip — coin glyph + tally only
          */}
          <motion.div
            className="relative shrink-0"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={softSpring}
            whileTap={{ scale: 0.94 }}
          >
            <Link
              href="/wallet"
              aria-label={`${coins.toLocaleString()} coins — open wallet`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ffc928]/35 bg-[#ffc928]/12 py-1.5 pr-2.5 pl-1.5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffc928] text-[#0f1220] shadow-[0_2px_0_#c79a2e]">
                <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-[15px] leading-none font-bold tracking-[-0.02em] text-white tabular-nums">
                {coins.toLocaleString()}
              </span>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="relative mt-6 flex items-end justify-between gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white/45">Win streak</p>
            <p className="mt-1 flex items-center gap-2 font-display text-[42px] leading-none font-bold tracking-[-0.04em]">
              <Flame
                className="h-8 w-8 text-[#ff8a3d]"
                fill="currentColor"
                strokeWidth={1.5}
              />
              {statsData.winStreak}
            </p>
            <p className="mt-2 text-[12px] font-bold text-white/55">
              {statsData.wins}W · {statsData.losses}L · {statsData.draws}D ·{" "}
              {statsData.winRate}%
            </p>
          </div>

          <div className="shrink-0 rounded-[22px] border border-[#ffc928]/40 bg-[#ffc928] px-4 py-3 text-[#1b1730] shadow-[0_8px_0_#c79a2e]">
            <p className="text-[10px] font-black tracking-[0.08em] uppercase">
              Best subject
            </p>
            <p className="mt-1 font-display text-[18px] font-bold">
              {statsData.favoriteSubject}
            </p>
          </div>
        </motion.div>

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

      <div className="relative -mt-10 px-4 pb-8">
        {wasBlocked && !blocking && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={softSpring}
            className="mb-3 rounded-[18px] bg-[#ff8a3d]/40 px-4 py-3 text-[13px] font-bold text-[#d96420]"
          >
            You have an open match — resume it below before challenging someone
            new.
          </motion.div>
        )}

        {blocking ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={softSpring}
            className="mb-3"
          >
            {wasBlocked && (
              <p className="mb-1.5 text-[11px] font-black tracking-[0.1em] uppercase text-[#ffc928]">
                ↓ Finish this first
              </p>
            )}
            <Link
              href={battleHref(blocking)}
              className="flex items-center gap-3 overflow-hidden rounded-[22px] bg-[#ffc928] p-3.5 text-[#0f1220] shadow-[0_8px_0_#c79a2e,0_16px_32px_rgba(199,154,46,0.35)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928]">
                <Swords className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-black tracking-[0.1em] uppercase">
                  {battleStatusLabel(blocking.status)} · finish first
                </span>
                <span className="mt-0.5 block truncate font-display text-[16px] font-bold">
                  vs {rivalName(blocking).split(" ")[0]}
                </span>
                <span className="mt-0.5 block text-[12px] font-bold text-[#5c4810]">
                  {blocking.subject}
                  {blocking.topic ? ` · ${blocking.topic}` : ""} ·{" "}
                  {blocking.yourScore}–{blocking.theirScore}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            </Link>
            {(blocking.status === "invited" ||
              blocking.status === "accepted" ||
              blocking.status === "funding") && (
              <button
                type="button"
                onClick={() => void forfeitBlocking()}
                disabled={forfeiting}
                className="mt-1.5 w-full rounded-[14px] bg-[#0f1220]/8 py-2 text-[11px] font-black tracking-[0.08em] text-[#5c4810] uppercase"
              >
                {forfeiting ? "Leaving…" : "Cancel invite"}
              </button>
            )}
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.08 }}
        >
          <Link
            href="/battle/create"
            className={cn(
              "flex items-center gap-4 overflow-hidden rounded-[26px] p-4 text-white shadow-[0_10px_0_#4b2fd6,0_20px_40px_rgba(75,47,214,0.35)]",
              blocking ? "bg-arc-purple-500/55" : "bg-arc-purple-500",
            )}
          >
            <motion.span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Swords className="h-7 w-7" strokeWidth={2.25} />
            </motion.span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[20px] leading-tight font-bold tracking-[-0.02em]">
                Challenge a friend
              </span>
              <span className="mt-1 block text-[13px] font-bold text-white/75">
                {blocking
                  ? "Finish open match before new invite"
                  : "Stake coins · timed quiz · winner takes pot"}
              </span>
            </span>
          </Link>
        </motion.div>

        {hasOpen ? (
          <section className="mt-5 space-y-2.5">
            <h2 className="px-0.5 font-display text-[18px] font-semibold text-[#1b1730]">
              Open matches
            </h2>

            {live.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...softSpring, delay: 0.05 * i }}
              >
                <Link
                  href={battleHref(b)}
                  className="flex items-center gap-3 overflow-hidden rounded-[18px] border border-[#ebe4f6] bg-white p-3 shadow-[0_8px_20px_rgba(70,40,150,0.06)]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928]">
                    <Swords className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-[#ff5a5a]/15 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#d63030] uppercase">
                        {battleStatusLabel(b.status)}
                      </span>
                      <span className="text-[11px] font-bold text-[#8a7cb8]">
                        R{b.currentRound}/{b.questionCount}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate font-display text-[15px] font-bold text-[#1b1730]">
                      vs {rivalName(b)}
                    </span>
                    <span className="text-[12px] font-bold text-[#8a7cb8]">
                      {b.subject} · {b.yourScore}–{b.theirScore} · {b.pot}c pot
                    </span>
                  </span>
                  <span className="rounded-full bg-arc-purple-500 px-3 py-1.5 text-[11px] font-extrabold text-white">
                    Resume
                  </span>
                </Link>
              </motion.div>
            ))}

            {incoming.map((invite, i) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...softSpring, delay: 0.08 + i * 0.04 }}
              >
                <Link
                  href={battleHref(invite)}
                  className="block overflow-hidden rounded-[20px] border-2 border-dashed border-[#c79a2e] bg-[#fff8e8] shadow-[0_12px_28px_rgba(199,154,46,0.18)]"
                >
                  <div className="flex items-stretch">
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-[#ffc928] px-2 py-4 text-[#1b1730]">
                      <Coins className="h-5 w-5" strokeWidth={2.5} />
                      <p className="mt-1 font-display text-[16px] font-bold">
                        {invite.stakePerPlayer}
                      </p>
                      <p className="text-[9px] font-black tracking-wide uppercase">
                        stake
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 px-3.5 py-3.5">
                      <p className="text-[10px] font-black tracking-[0.1em] text-[#c79a2e] uppercase">
                        Incoming invite
                      </p>
                      <p className="mt-1 font-display text-[17px] font-bold text-[#1b1730]">
                        {rivalName(invite)}
                      </p>
                      <p className="mt-0.5 text-[12px] font-bold text-[#8a6a1e]">
                        {invite.subject}
                        {invite.topic ? ` · ${invite.topic}` : ""} ·{" "}
                        {invite.questionCount}Q
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
            ))}

            {outgoing.map((invite) => (
              <Link
                key={invite.id}
                href={battleHref(invite)}
                className="flex items-center justify-between rounded-[16px] border border-[#ebe4f6] bg-white px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-wide text-arc-purple-500 uppercase">
                    Waiting on reply
                  </p>
                  <p className="truncate font-display text-[14px] font-bold text-[#1b1730]">
                    {rivalName(invite)} · {invite.subject}
                  </p>
                </div>
                <span className="text-[12px] font-extrabold text-[#8a7cb8]">
                  {invite.stakePerPlayer}c
                </span>
              </Link>
            ))}
          </section>
        ) : null}

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
            {online.length === 0 ? (
              <Link
                href="/friends"
                className="rounded-[22px] border border-dashed border-[#d5ccec] bg-white px-4 py-3 text-[12px] font-extrabold text-[#8a7cb8]"
              >
                Invite crew to battle
              </Link>
            ) : (
              online.map((f, i) => {
                const big = i === 0;
                return (
                  <Link
                    key={f.userId}
                    href={
                      blocking
                        ? battleHref(blocking)
                        : `/battle/create?opponent=${f.userId}`
                    }
                    className={cn(
                      "relative shrink-0 rounded-[22px] border border-[#ebe4f6] bg-white p-3 shadow-[0_8px_20px_rgba(70,40,150,0.08)]",
                      big ? "w-[148px]" : "w-[112px]",
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
                      {blocking ? "Busy" : "Fight"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
            <h2 className="font-display text-[18px] font-semibold text-[#1b1730]">
              Previous results
            </h2>
            <p className="text-[11px] font-extrabold text-[#8a7cb8]">
              {statsData.played} played
            </p>
          </div>

          {historyItems.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#d5ccec] bg-white/80 px-4 py-5 text-center">
              <p className="font-display text-[15px] font-bold text-[#1b1730]">
                No battles yet
              </p>
              <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
                Challenge a friend — results land here
              </p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
              {historyItems.map((h, i) => {
                const win = h.result === "win";
                const draw = h.result === "draw";
                return (
                  <li
                    key={`${h.id}-${h.createdAt}`}
                    className={cn(
                      i < historyItems.length - 1 &&
                        "border-b border-[#f0ecf7]",
                    )}
                  >
                    <Link
                      href={`/battle/result/${h.id}`}
                      className="flex items-center gap-3 px-3.5 py-3.5"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black uppercase",
                          win && "bg-[#eef9f3] text-[#178a52]",
                          draw && "bg-[#f0ecf7] text-[#8a7cb8]",
                          !win && !draw && "bg-[#fff5f5] text-[#e5484d]",
                        )}
                      >
                        {win ? "W" : draw ? "D" : "L"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[14px] font-bold text-[#1b1730]">
                          vs {h.opponentName.split(" ")[0]}
                        </span>
                        <span className="text-[11px] font-bold text-[#8a7cb8]">
                          {h.subject}
                          {h.topic ? ` · ${h.topic}` : ""} · {h.yourScore}–
                          {h.theirScore}
                        </span>
                      </span>
                      <span className="text-right">
                        <span
                          className={cn(
                            "block font-display text-[14px] font-bold",
                            h.coinsDelta >= 0
                              ? "text-[#178a52]"
                              : "text-[#e5484d]",
                          )}
                        >
                          {h.coinsDelta > 0 ? "+" : ""}
                          {h.coinsDelta}c
                        </span>
                        <span className="text-[10px] font-bold text-[#b3a8d6]">
                          +{h.xpAwarded} XP
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-2.5 flex gap-2">
            {historyCursor ? (
              <button
                type="button"
                onClick={() => loadMore.mutate()}
                disabled={loadMore.isPending}
                className="flex-1 rounded-[14px] border border-dashed border-[#d5ccec] bg-white py-3 text-[12px] font-extrabold text-[#4a3d78] disabled:opacity-50"
              >
                {loadMore.isPending ? "Loading…" : "Load more results"}
              </button>
            ) : null}
            <Link
              href="/friends"
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#d5ccec] bg-white/80 py-3 text-[12px] font-extrabold text-[#4a3d78]"
            >
              <Users
                className="h-4 w-4 text-arc-purple-500"
                strokeWidth={2.25}
              />
              Study or invite
            </Link>
          </div>
        </section>

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
