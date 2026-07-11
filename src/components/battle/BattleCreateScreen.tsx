"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import {
  Clock,
  Coins,
  HelpCircle,
  Swords,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import {
  battleFriends,
  battleSubjects,
  battleTopics,
  type BattleDifficulty,
  type BattleMode,
} from "@/lib/battle/mock-data";
import { useBattleStore } from "@/store/useBattleStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const difficulties: BattleDifficulty[] = ["easy", "medium", "hard", "mixed"];
const questionCounts = [5, 10, 15, 20];
const secondsOptions = [15, 30, 45, 60];
const stakes = [50, 100, 250, 500];

/**
 * Fight-card builder. Face-off hero + dials + pot.
 * Not a labeled chip form.
 */
export default function BattleCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setup = useBattleStore((s) => s.setup);
  const setSetup = useBattleStore((s) => s.setSetup);
  const resetPlay = useBattleStore((s) => s.resetPlay);
  const coins = useEconomyStore((s) => s.coins);
  const spendCoins = useEconomyStore((s) => s.spendCoins);

  useEffect(() => {
    const opponent = searchParams.get("opponent");
    if (opponent) setSetup({ opponentId: opponent });
  }, [searchParams, setSetup]);

  const opponent =
    battleFriends.find((f) => f.id === setup.opponentId) ?? battleFriends[0];
  const topics = battleTopics[setup.subject] ?? [];
  const canStake = coins >= setup.stake;
  const pot = setup.stake * 2;

  const challenge = () => {
    if (!canStake) return;
    spendCoins(setup.stake);
    resetPlay();
    router.push(`/battle/invite/inv-out?sent=1`);
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* DUEL HERO */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[#ffc928]/15 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Match setup
            </p>
            <h1 className="mt-0.5 font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              Write the challenge
            </h1>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-white/80">
            {coins.toLocaleString()}c
          </span>
        </div>

        {/* Face-off */}
        <div className="relative mt-7 flex items-center justify-between gap-2">
          <Fighter
            initial="Y"
            name="You"
            sub="Challenger"
            color="#6B4EFF"
            align="left"
          />

          <motion.div
            className="relative z-[1] flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffc928] text-[#1b1730] shadow-[0_6px_0_#c79a2e]"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Swords className="h-6 w-6" strokeWidth={2.5} />
          </motion.div>

          <Fighter
            initial={opponent.initial}
            name={opponent.name.split(" ")[0]}
            sub={`Lv ${opponent.level} · ${opponent.league}`}
            color={opponent.color}
            align="right"
          />
        </div>

        {/* Opponent switcher — tiny avatars under */}
        <div className="relative mt-5 flex justify-center gap-2">
          {battleFriends.map((f) => {
            const active = setup.opponentId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-label={`Pick ${f.name}`}
                onClick={() => setSetup({ opponentId: f.id })}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl font-display text-[12px] font-bold text-white transition-transform",
                  active
                    ? "scale-110 ring-2 ring-[#ffc928] ring-offset-2 ring-offset-[#0f1220]"
                    : "opacity-45",
                )}
                style={{ background: f.color }}
              >
                {f.initial}
              </button>
            );
          })}
        </div>
      </section>

      <div className="relative -mt-6 px-4 pb-[calc(env(safe-area-inset-bottom)+110px)]">
        {/* Subject strip */}
        <div className="overflow-hidden rounded-[24px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.08)]">
          <div className="border-b border-[#f0ecf7] px-4 py-3">
            <p className="text-[10px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
              Subject
            </p>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
              {battleSubjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setSetup({
                      subject: s,
                      topic: battleTopics[s]?.[0] ?? "",
                    })
                  }
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-2 font-display text-[13px] font-semibold",
                    setup.subject === s
                      ? "bg-[#1b1433] text-white"
                      : "bg-[#f6f2ff] text-[#8a7cb8]",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
              Topic
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSetup({ topic: t })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-extrabold",
                    setup.topic === t
                      ? "bg-arc-purple-500 text-white"
                      : "bg-[#f0ecf7] text-[#8a7cb8]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dials */}
        <div className="mt-3 space-y-2.5">
          <DialRow
            icon={<Zap className="h-4 w-4" strokeWidth={2.5} />}
            label="Difficulty"
            value={setup.difficulty}
          >
            {difficulties.map((d) => (
              <DialBtn
                key={d}
                active={setup.difficulty === d}
                onClick={() => setSetup({ difficulty: d })}
                label={d}
              />
            ))}
          </DialRow>

          <DialRow
            icon={<HelpCircle className="h-4 w-4" strokeWidth={2.5} />}
            label="Questions"
            value={`${setup.questions}`}
          >
            {questionCounts.map((n) => (
              <DialBtn
                key={n}
                active={setup.questions === n}
                onClick={() => setSetup({ questions: n })}
                label={`${n}`}
              />
            ))}
          </DialRow>

          <DialRow
            icon={<Clock className="h-4 w-4" strokeWidth={2.5} />}
            label="Seconds / Q"
            value={`${setup.seconds}s`}
          >
            {secondsOptions.map((n) => (
              <DialBtn
                key={n}
                active={setup.seconds === n}
                onClick={() => setSetup({ seconds: n })}
                label={`${n}`}
              />
            ))}
          </DialRow>
        </div>

        {/* Mode split */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {(["live", "async"] as BattleMode[]).map((m) => {
            const active = setup.mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSetup({ mode: m })}
                className={cn(
                  "rounded-[22px] border px-3 py-4 text-left",
                  active
                    ? "border-arc-purple-500 bg-arc-purple-500 text-white shadow-[0_5px_0_#4b2fd6]"
                    : "border-[#ebe4f6] bg-white text-[#1b1730]",
                )}
              >
                <p className="font-display text-[15px] font-bold">
                  {m === "live" ? "Live" : "Async"}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[11px] font-bold",
                    active ? "text-white/75" : "text-[#8a7cb8]",
                  )}
                >
                  {m === "live" ? "Same Q, same time" : "24h to finish"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Stake pot */}
        <div className="mt-3 overflow-hidden rounded-[24px] bg-[#1b1433] p-4 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.1em] text-[#ffc928] uppercase">
                Coin pot
              </p>
              <p className="mt-1 font-display text-[40px] leading-none font-bold tracking-[-0.04em]">
                {pot}
              </p>
              <p className="mt-1.5 text-[12px] font-bold text-white/50">
                Each puts in {setup.stake}
              </p>
            </div>
            <Coins className="h-12 w-12 text-[#ffc928]" strokeWidth={1.75} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {stakes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSetup({ stake: s })}
                className={cn(
                  "rounded-xl py-2.5 font-display text-[14px] font-bold",
                  setup.stake === s
                    ? "bg-[#ffc928] text-[#1b1730]"
                    : "bg-white/10 text-white/70",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {!canStake ? (
            <p className="mt-3 text-[12px] font-bold text-[#ff8a3d]">
              Not enough coins for this stake.
            </p>
          ) : null}
        </div>
      </div>

      {/* Dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <motion.button
          type="button"
          disabled={!canStake}
          onClick={challenge}
          whileTap={{ scale: 0.98, y: 2 }}
          className={cn(
            "pointer-events-auto flex w-full items-center justify-center gap-2 rounded-[20px] py-4 font-display text-[16px] font-semibold text-white",
            canStake
              ? "bg-arc-purple-500 shadow-[0_6px_0_#4b2fd6]"
              : "bg-[#c6bce0]",
          )}
        >
          <Swords className="h-5 w-5" strokeWidth={2.5} />
          Challenge {opponent.name.split(" ")[0]} · {setup.stake}c
        </motion.button>
      </div>
    </div>
  );
}

function Fighter({
  initial,
  name,
  sub,
  color,
  align,
}: {
  initial: string;
  name: string;
  sub: string;
  color: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1",
        align === "right" && "text-right",
      )}
    >
      <span
        className={cn(
          "inline-flex h-16 w-16 items-center justify-center rounded-[20px] font-display text-[24px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]",
          align === "right" && "ml-auto",
        )}
        style={{ background: color }}
      >
        {initial}
      </span>
      <p className="mt-2 truncate font-display text-[16px] font-bold">{name}</p>
      <p className="truncate text-[11px] font-bold text-white/45">{sub}</p>
    </div>
  );
}

function DialRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[#ebe4f6] bg-white px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[#8a7cb8]">
          <span className="text-arc-purple-500">{icon}</span>
          {label}
        </span>
        <span className="font-display text-[13px] font-bold capitalize text-[#1b1730]">
          {value}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto">{children}</div>
    </div>
  );
}

function DialBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[3.25rem] flex-1 rounded-xl py-2 text-[12px] font-extrabold capitalize",
        active
          ? "bg-[#1b1433] text-white"
          : "bg-[#f6f2ff] text-[#8a7cb8]",
      )}
    >
      {label}
    </button>
  );
}
