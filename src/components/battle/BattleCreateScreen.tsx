"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Clock, Coins, HelpCircle, Swords, Zap } from "lucide-react";
import { motion } from "motion/react";
import { battlesApi } from "@/lib/api/battles";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { leaguesApi } from "@/lib/api/leagues";
import { socialApi, type SocialFriendDto } from "@/lib/api/social";
import {
  battleSubjects,
  battleTopics,
  type BattleDifficulty,
  type BattleMode,
} from "@/lib/battle/mock-data";
import {
  maxStakeForRankLevel,
  stakeOptionsForRank,
} from "@/lib/battle/stake-limits";
import { useBattleStore } from "@/store/useBattleStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const difficulties: BattleDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "mixed",
];
const questionCounts = [5, 10, 15, 20];
const secondsOptions = [15, 30, 45, 60];

const fallbackOpponent: SocialFriendDto = {
  userId: "",
  displayName: "Rival",
  username: null,
  name: "Rival",
  initial: "R",
  color: "#6B4EFF",
  avatarUrl: null,
  level: 1,
  league: "Bronze",
  online: false,
  canBattle: true,
};

/**
 * Fight-card builder. Face-off hero + dials + pot.
 * Opponent from crew (friends API) — Battle is friends-only.
 */
export default function BattleCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setup = useBattleStore((s) => s.setup);
  const setSetup = useBattleStore((s) => s.setSetup);
  const resetPlay = useBattleStore((s) => s.resetPlay);
  const coins = useEconomyStore((s) => s.coins);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<SocialFriendDto[]>([]);
  const [rankLevel, setRankLevel] = useState(1);
  const [customStake, setCustomStake] = useState("");

  useEffect(() => {
    const opponent = searchParams.get("opponent");
    if (opponent) setSetup({ opponentId: opponent });
  }, [searchParams, setSetup]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [crew, me] = await Promise.all([
          socialApi.friends(),
          leaguesApi.getMe().catch(() => null),
        ]);
        if (cancelled) return;
        setFriends(crew.items);
        if (me?.rankLevel) setRankLevel(me.rankLevel);
        if (
          !searchParams.get("opponent") &&
          crew.items[0] &&
          !setup.opponentId
        ) {
          setSetup({ opponentId: crew.items[0].userId });
        }
      } catch {
        /* empty crew */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxStake = maxStakeForRankLevel(rankLevel);
  const stakes = stakeOptionsForRank(rankLevel);
  const opponent =
    friends.find((f) => f.userId === setup.opponentId) ??
    (setup.opponentId
      ? {
          ...fallbackOpponent,
          userId: setup.opponentId,
          name: "Rival",
          initial: "R",
        }
      : friends[0] ?? fallbackOpponent);
  const topics = battleTopics[setup.subject] ?? [];
  const effectiveStake = Math.min(setup.stake, maxStake);
  const canStake = coins >= effectiveStake && effectiveStake > 0;
  const pot = effectiveStake * 2;
  const opponentIsUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      setup.opponentId,
    );

  useEffect(() => {
    if (setup.stake > maxStake) setSetup({ stake: maxStake });
  }, [maxStake, setup.stake, setSetup]);

  const challenge = async () => {
    if (!canStake || busy) return;
    if (!opponentIsUuid) {
      setError("Pick a crew member to challenge.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const battle = await battlesApi.create({
        opponentId: setup.opponentId,
        subject: setup.subject,
        topic: setup.topic || undefined,
        difficulty: setup.difficulty,
        questions: setup.questions,
        secondsPerQuestion: setup.seconds,
        mode: setup.mode,
        stake: effectiveStake,
        idempotencyKey:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `create-${Date.now()}`,
      });
      resetPlay();
      router.push(`/battle/invite/${battle.id}?sent=1`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not create battle",
      );
    } finally {
      setBusy(false);
    }
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
          {friends.length === 0 ? (
            <p className="text-[12px] font-bold text-white/50">
              Add friends on Social to challenge them.
            </p>
          ) : (
            friends.map((f) => {
              const active = setup.opponentId === f.userId;
              return (
                <button
                  key={f.userId}
                  type="button"
                  aria-label={`Pick ${f.name}`}
                  onClick={() => setSetup({ opponentId: f.userId })}
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
            })
          )}
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
                Each puts in {effectiveStake} · max {maxStake} (Lv {rankLevel})
              </p>
            </div>
            <Coins className="h-12 w-12 text-[#ffc928]" strokeWidth={1.75} />
          </div>
          <div
            className={cn(
              "mt-4 grid gap-1.5",
              stakes.length >= 5 ? "grid-cols-5" : "grid-cols-4",
            )}
          >
            {stakes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setCustomStake("");
                  setSetup({ stake: s });
                }}
                className={cn(
                  "rounded-xl py-2.5 font-display text-[14px] font-bold",
                  effectiveStake === s && !customStake
                    ? "bg-[#ffc928] text-[#1b1730]"
                    : "bg-white/10 text-white/70",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="text-[10px] font-black tracking-wide text-white/40 uppercase">
              Custom stake
            </span>
            <input
              type="number"
              min={10}
              max={maxStake}
              step={10}
              value={customStake}
              placeholder={`10–${maxStake}`}
              onChange={(e) => {
                const raw = e.target.value;
                setCustomStake(raw);
                const n = Number(raw);
                if (Number.isFinite(n) && n > 0) {
                  setSetup({
                    stake: Math.min(maxStake, Math.max(10, Math.round(n))),
                  });
                }
              }}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 font-display text-[15px] font-bold text-white outline-none placeholder:text-white/30 focus:border-[#ffc928]"
            />
          </label>
          {!canStake ? (
            <p className="mt-3 text-[12px] font-bold text-[#ff8a3d]">
              Not enough coins for this stake.
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-[12px] font-bold text-[#ff8a3d]">{error}</p>
          ) : null}
        </div>
      </div>

      {/* Dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <motion.button
          type="button"
          disabled={!canStake || busy}
          onClick={() => void challenge()}
          whileTap={{ scale: 0.98, y: 2 }}
          className={cn(
            "pointer-events-auto flex w-full items-center justify-center gap-2 rounded-[20px] py-4 font-display text-[16px] font-semibold text-white",
            canStake && !busy
              ? "bg-arc-purple-500 shadow-[0_6px_0_#4b2fd6]"
              : "bg-[#c6bce0]",
          )}
        >
          <Swords className="h-5 w-5" strokeWidth={2.5} />
          {busy
            ? "Sending…"
            : `Challenge ${opponent.name.split(" ")[0]} · ${effectiveStake}c`}
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
    <div className={cn("min-w-0 flex-1", align === "right" && "text-right")}>
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
        active ? "bg-[#1b1433] text-white" : "bg-[#f6f2ff] text-[#8a7cb8]",
      )}
    >
      {label}
    </button>
  );
}
