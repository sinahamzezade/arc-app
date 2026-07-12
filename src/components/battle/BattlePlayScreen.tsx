"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { battlesApi } from "@/lib/api/battles";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { useBattleStore } from "@/store/useBattleStore";
import { cn } from "@/lib/utils";

function opponentLabel(battle: {
  opponent: { displayName: string | null; username: string | null };
}) {
  return (
    battle.opponent.displayName ||
    battle.opponent.username ||
    "Rival"
  ).split(" ")[0];
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

  if (battle?.status === "accepted" || battle?.status === "funding") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 bg-[#f3effc] px-6 font-rounded">
        <p className="text-center font-display text-[20px] font-bold text-[#1b1730]">
          Funding escrow…
        </p>
        <p className="text-center text-[14px] font-semibold text-[#4a3d78]">
          Locking stakes. Hang tight.
        </p>
      </div>
    );
  }

  if (battle?.status === "ready") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="text-center font-display text-[20px] font-bold text-[#1b1730]">
          Waiting room
        </p>
        <p className="text-center text-[14px] font-semibold text-[#4a3d78]">
          {battle.youReady
            ? "Waiting for opponent…"
            : "Tap ready when you are."}
        </p>
        {!battle.youReady ? (
          <button
            type="button"
            onClick={async () => {
              try {
                const dto = await battlesApi.ready(battleId);
                applyBattle(dto);
              } catch (err) {
                setError(
                  err instanceof ApiError
                    ? messageForCode(err.code, err.message)
                    : "Ready failed",
                );
              }
            }}
            className="rounded-xl bg-arc-purple-500 px-6 py-3 font-display text-[15px] font-semibold text-white"
          >
            I&apos;m ready
          </button>
        ) : null}
        {error ? (
          <p className="text-[13px] font-bold text-[#e5484d]">{error}</p>
        ) : null}
      </div>
    );
  }

  if (!q) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-[#f3effc] px-6 font-rounded">
        <p className="text-center text-[15px] font-semibold text-[#4a3d78]">
          {error ?? "Waiting for next question…"}
        </p>
      </div>
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
  const waitingOnOpponent =
    !revealed &&
    (answerLocked || Boolean(myReveal)) &&
    !theirReveal &&
    battle?.mode !== "async";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#f3effc] font-rounded">
      <header className="border-b border-[#ebe4f6] bg-white px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-3">
        <div className="flex items-center justify-between gap-2">
          <ScoreSide label="You" score={yourScore} accent />
          <div className="text-center">
            {sudden ? (
              <p className="text-[11px] font-extrabold tracking-wide text-[#e5484d] uppercase">
                Sudden death
                {battle?.suddenDeathCount
                  ? ` · ${battle.suddenDeathCount}/5`
                  : ""}
              </p>
            ) : (
              <p className="text-[11px] font-extrabold text-arc-purple-500">
                Round {battle?.currentRound ?? 1}/{setup.questions}
              </p>
            )}
            <p
              className={cn(
                "mt-0.5 font-display text-[20px] font-bold",
                secondsLeft <= 5 ? "text-[#e5484d]" : "text-[#1b1730]",
              )}
            >
              {secondsLeft}s
            </p>
          </div>
          <ScoreSide label={name} score={theirScore} />
        </div>
        {battle?.opponentOnline === false ? (
          <p className="mt-2 text-center text-[11px] font-bold text-[#e5484d]">
            Opponent connection weak…
          </p>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {sudden ? (
          <p className="mb-3 rounded-2xl bg-[#fff4ec] px-3 py-2 text-center text-[12px] font-bold text-[#9a4a12]">
            One question can decide it. Correctness beats speed.
          </p>
        ) : null}

        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#ebe4f6] bg-white p-4 shadow-[0_10px_28px_rgba(70,40,150,0.08)]"
        >
          <p className="text-[11px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
            {setup.subject}
            {setup.topic ? ` · ${setup.topic}` : ""}
          </p>
          <h1 className="mt-2 font-display text-[22px] leading-snug font-bold text-[#1b1730]">
            {q.prompt}
          </h1>
        </motion.div>

        <div className="mt-4 space-y-2.5">
          {q.options.map((opt) => {
            const isSelected = selected === opt.id;
            const isCorrect = Boolean(correctId) && opt.id === correctId;
            const showCorrect = revealed && isCorrect;
            const showWrong =
              revealed && Boolean(correctId) && isSelected && !isCorrect;
            const showPicked = revealed && !correctId && isSelected;
            const showTheir =
              revealed && theirPick === opt.id && theirPick !== selected;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={revealed || submitting}
                onClick={() => selectOption(opt.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left font-display text-[15px] font-semibold",
                  showCorrect && "border-[#62d84e] bg-[#f0fbeb] text-[#1f6b2e]",
                  showWrong && "border-[#ff8a3d] bg-[#fff4ec] text-[#9a4a12]",
                  showTheir && "border-[#2d8cff] bg-[#eef5ff] text-[#1b4a8a]",
                  showPicked &&
                    "border-arc-purple-500 bg-[#f3effc] text-[#1b1730]",
                  !revealed &&
                    isSelected &&
                    "border-arc-purple-500 bg-[#f3effc] text-[#1b1730]",
                  !revealed &&
                    !isSelected &&
                    "border-[#ebe4f6] bg-white text-[#1b1730]",
                )}
              >
                <span className="flex-1">{opt.label}</span>
                {showTheir ? (
                  <span className="text-[10px] font-extrabold uppercase text-[#2d8cff]">
                    {name}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {waitingOnOpponent ? (
          <p className="mt-4 rounded-2xl bg-[#eef5ff] px-4 py-3 text-center text-[13px] font-bold text-[#1b4a8a]">
            Answer locked. Waiting for {name}…
          </p>
        ) : null}

        {revealed ? (
          <div className="mt-4 space-y-2 rounded-2xl bg-white px-4 py-3">
            {typeof myPts === "number" || typeof theirPts === "number" ? (
              <p className="text-[13px] font-bold text-[#1b1730]">
                Points · You {myPts ?? 0} · {name} {theirPts ?? 0}
              </p>
            ) : null}
            {q.explanation ? (
              <p className="text-[13px] font-semibold text-[#4a3d78]">
                {q.explanation}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-[13px] font-bold text-[#e5484d]">{error}</p>
        ) : null}

        <div className="mt-auto space-y-2 pt-6">
          {!revealed && !waitingOnOpponent ? (
            <button
              type="button"
              disabled={!selected || submitting}
              onClick={() => void submit(false)}
              className={cn(
                "w-full rounded-xl py-3.5 font-display text-[15px] font-semibold text-white",
                selected && !submitting
                  ? "bg-arc-purple-500 shadow-[0_4px_0_#4b2fd6]"
                  : "bg-[#c6bce0]",
              )}
            >
              {submitting ? "Locking…" : "Lock answer"}
            </button>
          ) : revealed ? (
            <button
              type="button"
              onClick={() => void continueFlow()}
              className="w-full rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-[#c6bce0] py-3.5 font-display text-[15px] font-semibold text-white"
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

function ScoreSide({
  label,
  score,
  accent,
}: {
  label: string;
  score: number;
  accent?: boolean;
}) {
  return (
    <div className={cn("min-w-[4.5rem]", accent ? "text-left" : "text-right")}>
      <p className="text-[11px] font-extrabold text-[#8a7cb8]">{label}</p>
      <p className="font-display text-[22px] font-bold tabular-nums text-[#1b1730]">
        {score}
      </p>
    </div>
  );
}
