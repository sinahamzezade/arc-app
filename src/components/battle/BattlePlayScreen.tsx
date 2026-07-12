"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Coins,
  Lock,
  Swords,
  Timer,
  WifiOff,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { battlesApi, type BattleDto } from "@/lib/api/battles";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { useBattleStore } from "@/store/useBattleStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

function opponentLabel(battle: {
  opponent: { displayName: string | null; username: string | null };
}) {
  return (
    battle.opponent.displayName ||
    battle.opponent.username ||
    "Rival"
  ).split(" ")[0];
}

function ArenaBackdrop() {
  return (
    <>
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
    </>
  );
}

function FighterCard({
  label,
  name,
  avatarUrl,
  ready,
  side,
  online,
}: {
  label: string;
  name: string;
  avatarUrl?: string | null;
  ready: boolean;
  side: "you" | "them";
  online?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "relative w-[42%] rounded-[22px] border border-white/15 bg-white/10 px-3 py-3.5 backdrop-blur-sm",
        side === "you" ? "-rotate-2" : "rotate-2",
      )}
      initial={{ opacity: 0, x: side === "you" ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={softSpring}
    >
      <p className="text-[9px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
        {label}
      </p>
      <div className="mt-2 flex flex-col items-center">
        <div className="relative">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ring-2",
              ready ? "ring-[#62d84e]" : "ring-white/25",
            )}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={assets.arlo.thinking}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {ready ? (
            <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#62d84e] text-white shadow-[0_3px_0_#2d9e45]">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          ) : (
            <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
              <Timer className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          )}
        </div>
        <p className="mt-2 max-w-full truncate font-display text-[15px] font-bold">
          {name}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[11px] font-extrabold uppercase",
            ready ? "text-[#7dffb5]" : "text-white/45",
          )}
        >
          {ready ? "Ready" : "Not ready"}
        </p>
        {online === false ? (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#ff8a3d]">
            <WifiOff className="h-3 w-3" strokeWidth={2.5} />
            Weak link
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

function LobbyShell({
  battle,
  title,
  subtitle,
  children,
  error,
}: {
  battle: BattleDto | null;
  title: string;
  subtitle: string;
  children?: ReactNode;
  error?: string | null;
}) {
  const name = battle ? opponentLabel(battle) : "Rival";
  const stake = battle?.stakePerPlayer ?? 0;
  const pot = battle?.pot ?? stake * 2;
  const youReady = Boolean(battle?.youReady);
  const themReady = Boolean(battle?.opponentReady);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-24 text-white">
        <ArenaBackdrop />

        <div className="relative flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            <Swords className="h-3 w-3" strokeWidth={2.5} />
            Arena
          </span>
          {battle?.subject ? (
            <span className="truncate text-[11px] font-bold text-white/45">
              {battle.subject}
              {battle.topic ? ` · ${battle.topic}` : ""}
            </span>
          ) : null}
        </div>

        <h1 className="relative mt-4 font-display text-[34px] leading-[0.92] font-bold tracking-[-0.04em]">
          {title}
        </h1>
        <p className="relative mt-2 max-w-[18rem] text-[14px] font-bold text-white/60">
          {subtitle}
        </p>

        <div className="relative mt-8 flex items-end justify-between">
          <FighterCard
            label="You"
            name="You"
            ready={youReady}
            side="you"
            online={battle?.youOnline}
          />

          <motion.div
            className="absolute top-2 left-1/2 z-[2] -translate-x-1/2"
            animate={{ y: [0, -5, 0], rotate: [-3, 3, -3] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="flex flex-col items-center rounded-2xl bg-[#ffc928] px-3 py-2 text-[#0f1220] shadow-[0_6px_0_#c79a2e]">
              <Coins className="h-4 w-4" strokeWidth={2.5} />
              <p className="mt-0.5 font-display text-[20px] leading-none font-bold tabular-nums">
                {pot}
              </p>
              <p className="text-[8px] font-black tracking-wide uppercase">
                pot
              </p>
            </div>
          </motion.div>

          <FighterCard
            label="Rival"
            name={name}
            avatarUrl={battle?.opponent.avatarUrl}
            ready={themReady}
            side="them"
            online={battle?.opponentOnline}
          />
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2 text-[11px] font-extrabold text-white/55">
          <span className="rounded-full bg-white/10 px-2.5 py-1">
            {battle?.questionCount ?? "—"}Q
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">
            {battle?.secondsPerQuestion ?? "—"}s
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 capitalize">
            {battle?.difficulty ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
            <Coins className="h-3 w-3 text-[#ffc928]" strokeWidth={2.5} />
            {stake}/side
          </span>
        </div>
      </section>

      <div className="relative z-[1] -mt-8 space-y-3 px-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        {children}
        {error ? (
          <p className="rounded-2xl bg-[#fff0f0] px-4 py-3 text-center text-[13px] font-bold text-[#e5484d]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function BattlePlayScreen({ battleId }: { battleId: string }) {
  const router = useRouter();
  const battle = useBattleStore((s) => s.battle);
  const setup = useBattleStore((s) => s.setup);
  const questions = useBattleStore((s) => s.questions);
  const yourScore = useBattleStore((s) => s.yourScore);
  const theirScore = useBattleStore((s) => s.theirScore);
  const selected = useBattleStore((s) => s.selectedOptionId);
  const revealed = useBattleStore((s) => s.revealed);
  const submitting = useBattleStore((s) => s.submitting);
  const error = useBattleStore((s) => s.error);
  const selectOption = useBattleStore((s) => s.selectOption);
  const applyBattle = useBattleStore((s) => s.applyBattle);
  const setSubmitting = useBattleStore((s) => s.setSubmitting);
  const setError = useBattleStore((s) => s.setError);
  const isComplete = useBattleStore((s) => s.isComplete);

  const q = questions[0];
  const openedAt = battle?.currentQuestion?.openedAt;
  const timeLimitMs =
    battle?.currentQuestion?.timeLimitMs ?? setup.seconds * 1000;

  const [secondsLeft, setSecondsLeft] = useState(setup.seconds);
  const [forfeitBusy, setForfeitBusy] = useState(false);
  const [readyBusy, setReadyBusy] = useState(false);
  const [answerLocked, setAnswerLocked] = useState(false);
  const submittedForQ = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const dto = await battlesApi.state(battleId);
        if (!cancelled) applyBattle(dto);
        if (
          !cancelled &&
          (dto.status === "completed" ||
            dto.status === "forfeited" ||
            dto.status === "voided" ||
            dto.status === "refunded")
        ) {
          router.replace(`/battle/result/${battleId}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? messageForCode(err.code, err.message)
              : "Failed to load battle",
          );
        }
      }
    };
    void load();
    const poll = setInterval(() => void load(), 2000);
    const beat = setInterval(() => {
      void battlesApi.heartbeat(battleId).catch(() => undefined);
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(beat);
    };
  }, [battleId, applyBattle, setError, router]);

  useEffect(() => {
    if (!openedAt) {
      setSecondsLeft(Math.ceil(timeLimitMs / 1000));
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - new Date(openedAt).getTime();
      setSecondsLeft(Math.max(0, Math.ceil((timeLimitMs - elapsed) / 1000)));
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [openedAt, timeLimitMs, q?.id]);

  const submit = async (timedOut = false) => {
    if (!q || !battle?.currentQuestion) return;
    if (submittedForQ.current === q.id) return;
    if (revealed || submitting) return;
    if (!timedOut && !selected) return;

    submittedForQ.current = q.id;
    setAnswerLocked(true);
    setSubmitting(true);
    setError(null);
    const responseMs = openedAt
      ? Math.min(timeLimitMs, Date.now() - new Date(openedAt).getTime())
      : timeLimitMs;
    try {
      const dto = await battlesApi.submitAnswer(battleId, {
        battleQuestionId: q.id,
        selectedOptionId: timedOut ? undefined : (selected ?? undefined),
        timedOut,
        responseMs,
      });
      applyBattle(dto);
      if (
        dto.status === "completed" ||
        dto.status === "forfeited" ||
        dto.status === "voided" ||
        dto.status === "refunded"
      ) {
        router.push(`/battle/result/${battleId}`);
      }
    } catch (err) {
      submittedForQ.current = null;
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not submit answer",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!q || revealed || submitting) return;
    if (secondsLeft > 0) return;
    void submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, q?.id, revealed, submitting]);

  useEffect(() => {
    submittedForQ.current = null;
    setAnswerLocked(false);
  }, [q?.id]);

  const continueFlow = async () => {
    if (isComplete()) {
      router.push(`/battle/result/${battleId}`);
      return;
    }
    try {
      const dto = await battlesApi.continuePlay(battleId);
      applyBattle(dto);
      if (
        dto.status === "completed" ||
        dto.status === "forfeited" ||
        dto.status === "voided" ||
        dto.status === "refunded"
      ) {
        router.push(`/battle/result/${battleId}`);
      }
    } catch {
      try {
        const dto = await battlesApi.state(battleId);
        applyBattle(dto);
        if (
          dto.status === "completed" ||
          dto.status === "forfeited" ||
          dto.status === "voided" ||
          dto.status === "refunded"
        ) {
          router.push(`/battle/result/${battleId}`);
        }
      } catch {
        /* keep current */
      }
    }
  };

  const onForfeit = async () => {
    if (forfeitBusy) return;
    if (!window.confirm("Forfeit this battle? Opponent takes the pot.")) return;
    setForfeitBusy(true);
    try {
      const dto = await battlesApi.forfeit(battleId);
      applyBattle(dto);
      router.push(`/battle/result/${battleId}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Forfeit failed",
      );
      setForfeitBusy(false);
    }
  };

  const onReady = async () => {
    if (readyBusy) return;
    setReadyBusy(true);
    setError(null);
    try {
      const dto = await battlesApi.ready(battleId);
      applyBattle(dto);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Ready failed",
      );
    } finally {
      setReadyBusy(false);
    }
  };

  if (battle?.status === "accepted" || battle?.status === "funding") {
    return (
      <LobbyShell
        battle={battle}
        title="Escrow lock"
        subtitle="Staking coins into the pot. Hang tight."
        error={error}
      >
        <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white p-4 shadow-[0_14px_32px_rgba(70,40,150,0.1)]">
          <div className="flex items-center gap-3">
            <motion.span
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffc928] text-[#0f1220]"
              animate={{ rotate: [0, -12, 12, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <Lock className="h-5 w-5" strokeWidth={2.5} />
            </motion.span>
            <div>
              <p className="font-display text-[16px] font-bold text-[#1b1730]">
                Funding escrow…
              </p>
              <p className="mt-0.5 text-[12px] font-bold text-[#8a7cb8]">
                Both stakes lock before first question
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ebe4f6]">
            <motion.div
              className="h-full rounded-full bg-arc-purple-500"
              animate={{ x: ["-40%", "60%", "-40%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "45%" }}
            />
          </div>
        </div>
      </LobbyShell>
    );
  }

  if (battle?.status === "ready") {
    const waitingThem = battle.youReady && !battle.opponentReady;
    return (
      <LobbyShell
        battle={battle}
        title="Waiting room"
        subtitle={
          waitingThem
            ? "You're locked in. Waiting on rival…"
            : battle.youReady
              ? "Both ready — opening arena…"
              : "Tap ready when you're locked in."
        }
        error={error}
      >
        {!battle.youReady ? (
          <motion.button
            type="button"
            onClick={() => void onReady()}
            disabled={readyBusy}
            whileTap={{ scale: 0.98, y: 1 }}
            transition={snappySpring}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-arc-purple-500 py-4 font-display text-[16px] font-semibold text-white shadow-[0_8px_0_#4b2fd6] disabled:opacity-60"
          >
            <Zap className="h-5 w-5 fill-white" strokeWidth={2.25} />
            {readyBusy ? "Locking…" : "I'm ready"}
          </motion.button>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[#d5ccec] bg-white px-4 py-4 text-center shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
            <motion.div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef9f3] text-[#16a56b]"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Check className="h-5 w-5" strokeWidth={3} />
            </motion.div>
            <p className="mt-2 font-display text-[15px] font-bold text-[#1b1730]">
              You&apos;re ready
            </p>
            <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
              {waitingThem
                ? `Waiting for ${opponentLabel(battle)}…`
                : "Match starts any second"}
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={forfeitBusy}
          onClick={() => void onForfeit()}
          className="w-full py-2 text-[12px] font-bold text-[#8a7cb8] underline-offset-2 hover:underline"
        >
          {forfeitBusy ? "Leaving…" : "Forfeit"}
        </button>
      </LobbyShell>
    );
  }

  if (!q) {
    return (
      <LobbyShell
        battle={battle}
        title="Stand by"
        subtitle="Next question loading into the arena."
        error={error}
      >
        <div className="rounded-[20px] border border-[#ebe4f6] bg-white px-4 py-5 text-center shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
          <motion.span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6f2ff] text-arc-purple-500"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <Swords className="h-6 w-6" strokeWidth={2.25} />
          </motion.span>
          <p className="mt-3 font-display text-[15px] font-bold text-[#1b1730]">
            {error ?? "Waiting for next question…"}
          </p>
        </div>
      </LobbyShell>
    );
  }

  const correctId = q.correctOptionId;
  const name = battle ? opponentLabel(battle) : "Rival";
  const sudden =
    battle?.status === "sudden_death" ||
    battle?.isSuddenDeath ||
    q.isSuddenDeath;
  const myReveal = q.answers?.find((a) => a.isYou);
  const theirReveal = q.answers?.find((a) => !a.isYou);
  const theirPick = theirReveal?.selectedOptionId;
  const myPts = myReveal?.questionScore;
  const theirPts = theirReveal?.questionScore;
  const youAnswered =
    Boolean(battle?.youAnswered) || answerLocked || Boolean(myReveal);
  const themAnswered =
    Boolean(battle?.opponentAnswered) || Boolean(theirReveal);
  const waitingOnOpponent =
    !revealed &&
    youAnswered &&
    !themAnswered &&
    battle?.mode !== "async";
  const inputLocked = revealed || submitting || youAnswered;
  const timerHot = secondsLeft <= 5;
  const timerPct = Math.max(
    0,
    Math.min(100, (secondsLeft / Math.max(1, setup.seconds)) * 100),
  );

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-5 text-white">
        <ArenaBackdrop />

        <div className="relative flex items-start justify-between gap-2">
          <ScoreChip
            label="You"
            score={yourScore}
            accent
            align="left"
          />

          <div className="flex flex-col items-center pt-0.5">
            {sudden ? (
              <p className="text-[10px] font-black tracking-[0.12em] text-[#ff8a3d] uppercase">
                Sudden death
                {battle?.suddenDeathCount
                  ? ` · ${battle.suddenDeathCount}/5`
                  : ""}
              </p>
            ) : (
              <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
                Round {battle?.currentRound ?? 1}/{setup.questions}
              </p>
            )}
            <motion.div
              className={cn(
                "relative mt-2 flex h-[68px] w-[68px] items-center justify-center rounded-full",
                timerHot
                  ? "bg-[#ff5a5a]/25 ring-2 ring-[#ff5a5a]"
                  : "bg-white/10 ring-2 ring-[#ffc928]/50",
              )}
              animate={timerHot ? { scale: [1, 1.06, 1] } : undefined}
              transition={{ duration: 0.7, repeat: Infinity }}
            >
              <svg
                className="absolute inset-0 -rotate-90"
                viewBox="0 0 68 68"
                aria-hidden
              >
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="4"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={timerHot ? "#ff5a5a" : "#ffc928"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - timerPct / 100)}`}
                />
              </svg>
              <p
                className={cn(
                  "relative font-display text-[22px] font-bold tabular-nums",
                  timerHot ? "text-[#ffb0b0]" : "text-white",
                )}
              >
                {secondsLeft}
              </p>
            </motion.div>
          </div>

          <ScoreChip label={name} score={theirScore} align="right" />
        </div>

        {battle?.opponentOnline === false ? (
          <p className="relative mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#ff8a3d]">
            <WifiOff className="h-3.5 w-3.5" strokeWidth={2.5} />
            Opponent connection weak…
          </p>
        ) : null}
      </header>

      <div className="relative z-[1] -mt-3 flex flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {sudden ? (
          <p className="mb-3 rounded-[16px] bg-[#fff4ec] px-3 py-2 text-center text-[12px] font-bold text-[#9a4a12] shadow-[0_6px_16px_rgba(154,74,18,0.08)]">
            One question can decide it. Correctness beats speed.
          </p>
        ) : null}

        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 14, rotate: -0.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={softSpring}
          className="overflow-hidden rounded-[24px] border border-[#ebe4f6] bg-white shadow-[0_14px_32px_rgba(70,40,150,0.1)]"
        >
          <div className="flex items-stretch">
            <div className="flex w-12 shrink-0 flex-col items-center justify-center bg-[#0f1220] text-[#ffc928]">
              <Swords className="h-4 w-4" strokeWidth={2.5} />
              <span className="mt-1 text-[9px] font-black tracking-wide uppercase">
                Q
              </span>
            </div>
            <div className="min-w-0 flex-1 px-3.5 py-3.5">
              <p className="text-[11px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
                {setup.subject}
                {setup.topic ? ` · ${setup.topic}` : ""}
              </p>
              <h1 className="mt-1.5 font-display text-[20px] leading-snug font-bold tracking-[-0.02em] text-[#1b1730]">
                {q.prompt}
              </h1>
            </div>
          </div>
        </motion.div>

        <div className="mt-3.5 space-y-2.5">
          {q.options.map((opt, i) => {
            const isSelected = selected === opt.id;
            const isCorrect = Boolean(correctId) && opt.id === correctId;
            const showCorrect = revealed && isCorrect;
            const showWrong =
              revealed && Boolean(correctId) && isSelected && !isCorrect;
            const showPicked = revealed && !correctId && isSelected;
            const showTheir =
              revealed && theirPick === opt.id && theirPick !== selected;
            const letter = String.fromCharCode(65 + i);

            return (
              <motion.button
                key={opt.id}
                type="button"
                disabled={inputLocked}
                onClick={() => selectOption(opt.id)}
                whileTap={
                  inputLocked
                    ? undefined
                    : { scale: 0.985, y: 1 }
                }
                transition={snappySpring}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left font-display text-[15px] font-semibold shadow-[0_4px_0_rgba(70,40,150,0.06)]",
                  showCorrect &&
                    "border-[#62d84e] bg-[#f0fbeb] text-[#1f6b2e] shadow-[0_4px_0_#62d84e]",
                  showWrong &&
                    "border-[#ff8a3d] bg-[#fff4ec] text-[#9a4a12] shadow-[0_4px_0_#ff8a3d]",
                  showTheir &&
                    "border-[#2d8cff] bg-[#eef5ff] text-[#1b4a8a] shadow-[0_4px_0_#2d8cff]",
                  showPicked &&
                    "border-arc-purple-500 bg-[#f3effc] text-[#1b1730] shadow-[0_4px_0_#4b2fd6]",
                  !revealed &&
                    isSelected &&
                    "border-arc-purple-500 bg-[#f3effc] text-[#1b1730] shadow-[0_4px_0_#4b2fd6]",
                  !revealed &&
                    !isSelected &&
                    "border-[#ebe4f6] bg-white text-[#1b1730]",
                  i === 1 && !revealed && !isSelected && "ml-1.5",
                  i === 2 && !revealed && !isSelected && "-ml-1",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-black",
                    showCorrect && "bg-[#62d84e] text-white",
                    showWrong && "bg-[#ff8a3d] text-white",
                    !showCorrect &&
                      !showWrong &&
                      isSelected &&
                      "bg-arc-purple-500 text-white",
                    !showCorrect &&
                      !showWrong &&
                      !isSelected &&
                      "bg-[#f0ecf7] text-[#8a7cb8]",
                  )}
                >
                  {letter}
                </span>
                <span className="min-w-0 flex-1">{opt.label}</span>
                {showTheir ? (
                  <span className="text-[10px] font-extrabold uppercase text-[#2d8cff]">
                    {name}
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </div>

        {waitingOnOpponent ? (
          <motion.p
            className="mt-4 rounded-[18px] bg-[#0f1220] px-4 py-3 text-center text-[13px] font-bold text-white"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            Answer locked. Waiting for {name}…
          </motion.p>
        ) : null}

        {revealed ? (
          <div className="mt-4 space-y-2 overflow-hidden rounded-[18px] border border-[#ebe4f6] bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
            {typeof myPts === "number" || typeof theirPts === "number" ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black tracking-wide text-[#8a7cb8] uppercase">
                  Round points
                </p>
                <p className="font-display text-[14px] font-bold text-[#1b1730]">
                  You {myPts ?? 0} · {name} {theirPts ?? 0}
                </p>
              </div>
            ) : null}
            {q.explanation ? (
              <p className="text-[13px] font-semibold text-[#4a3d78]">
                {q.explanation}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-2xl bg-[#fff0f0] px-4 py-2.5 text-[13px] font-bold text-[#e5484d]">
            {error}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-6">
          {!revealed && !waitingOnOpponent ? (
            <motion.button
              type="button"
              disabled={!selected || submitting}
              onClick={() => void submit(false)}
              whileTap={
                selected && !submitting ? { scale: 0.98, y: 1 } : undefined
              }
              transition={snappySpring}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-[18px] py-3.5 font-display text-[15px] font-semibold text-white",
                selected && !submitting
                  ? "bg-arc-purple-500 shadow-[0_6px_0_#4b2fd6]"
                  : "bg-[#c6bce0]",
              )}
            >
              <Lock className="h-4 w-4" strokeWidth={2.5} />
              {submitting ? "Locking…" : "Lock answer"}
            </motion.button>
          ) : revealed ? (
            <motion.button
              type="button"
              onClick={() => void continueFlow()}
              whileTap={{ scale: 0.98, y: 1 }}
              transition={snappySpring}
              className="w-full rounded-[18px] bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6]"
            >
              Continue
            </motion.button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-[18px] bg-[#c6bce0] py-3.5 font-display text-[15px] font-semibold text-white"
            >
              Waiting…
            </button>
          )}
          <button
            type="button"
            disabled={forfeitBusy}
            onClick={() => void onForfeit()}
            className="w-full py-2 text-[12px] font-bold text-[#8a7cb8] underline-offset-2 hover:underline"
          >
            {forfeitBusy ? "Leaving…" : "Forfeit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreChip({
  label,
  score,
  accent,
  align,
}: {
  label: string;
  score: number;
  accent?: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "min-w-[4.75rem] rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm",
        align === "left" ? "-rotate-1 text-left" : "rotate-1 text-right",
        accent && "ring-1 ring-[#ffc928]/40",
      )}
    >
      <p className="text-[10px] font-extrabold text-white/50">{label}</p>
      <p className="mt-0.5 font-display text-[24px] leading-none font-bold tabular-nums">
        {score}
      </p>
    </div>
  );
}
