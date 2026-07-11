"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { battleFriends, battleQuestions } from "@/lib/battle/mock-data";
import { useBattleStore } from "@/store/useBattleStore";
import { cn } from "@/lib/utils";

export default function BattlePlayScreen({ battleId }: { battleId: string }) {
  const router = useRouter();
  const setup = useBattleStore((s) => s.setup);
  const questionIndex = useBattleStore((s) => s.questionIndex);
  const yourScore = useBattleStore((s) => s.yourScore);
  const theirScore = useBattleStore((s) => s.theirScore);
  const selected = useBattleStore((s) => s.selectedOptionId);
  const revealed = useBattleStore((s) => s.revealed);
  const selectOption = useBattleStore((s) => s.selectOption);
  const reveal = useBattleStore((s) => s.reveal);
  const nextQuestion = useBattleStore((s) => s.nextQuestion);
  const isComplete = useBattleStore((s) => s.isComplete);

  const total = Math.min(setup.questions, battleQuestions.length);
  const q = battleQuestions[questionIndex];
  const opponent =
    battleFriends.find((f) => f.id === setup.opponentId) ?? battleFriends[0];

  const [secondsLeft, setSecondsLeft] = useState(setup.seconds);

  useEffect(() => {
    setSecondsLeft(setup.seconds);
  }, [questionIndex, setup.seconds]);

  useEffect(() => {
    if (revealed) return;
    if (secondsLeft <= 0) {
      if (!selected) selectOption(q.options[0].id);
      reveal();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, revealed, selected, selectOption, reveal, q.options]);

  const continueFlow = () => {
    if (isComplete()) {
      router.push(`/battle/result/${battleId}`);
      return;
    }
    nextQuestion();
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#f3effc] font-rounded">
      <header className="border-b border-[#ebe4f6] bg-white px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-3">
        <div className="flex items-center justify-between gap-2">
          <ScoreSide label="You" score={yourScore} accent />
          <div className="text-center">
            <p className="text-[11px] font-extrabold text-arc-purple-500">
              Round {questionIndex + 1}/{total}
            </p>
            <p
              className={cn(
                "mt-0.5 font-display text-[20px] font-bold",
                secondsLeft <= 5 ? "text-[#e5484d]" : "text-[#1b1730]",
              )}
            >
              {secondsLeft}s
            </p>
          </div>
          <ScoreSide label={opponent.name.split(" ")[0]} score={theirScore} />
        </div>
      </header>

      <div className="flex flex-1 flex-col px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#ebe4f6] bg-white p-4 shadow-[0_10px_28px_rgba(70,40,150,0.08)]"
        >
          <p className="text-[11px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
            {setup.subject} · {setup.topic}
          </p>
          <h1 className="mt-2 font-display text-[22px] leading-snug font-bold text-[#1b1730]">
            {q.prompt}
          </h1>
        </motion.div>

        <div className="mt-4 space-y-2.5">
          {q.options.map((opt) => {
            const isSelected = selected === opt.id;
            const isCorrect = opt.id === q.correctOptionId;
            const showCorrect = revealed && isCorrect;
            const showWrong = revealed && isSelected && !isCorrect;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={revealed}
                onClick={() => selectOption(opt.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left font-display text-[15px] font-semibold",
                  showCorrect && "border-[#62d84e] bg-[#f0fbeb] text-[#1f6b2e]",
                  showWrong && "border-[#ff8a3d] bg-[#fff4ec] text-[#9a4a12]",
                  !revealed &&
                    isSelected &&
                    "border-arc-purple-500 bg-[#f6f2ff] text-[#1b1730]",
                  !revealed &&
                    !isSelected &&
                    "border-[#ebe4f6] bg-white text-[#1b1730]",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f0ecf7] text-[12px] font-black text-[#8a7cb8]">
                  {opt.id.toUpperCase()}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>

        {revealed ? (
          <p className="mt-4 text-[13px] font-semibold text-[#4a3d78]">
            {q.explanation}
          </p>
        ) : null}

        <div className="mt-auto pt-6">
          {!revealed ? (
            <button
              type="button"
              disabled={!selected}
              onClick={reveal}
              className={cn(
                "w-full rounded-xl py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]",
                selected ? "bg-arc-purple-500" : "bg-[#c6bce0] shadow-none",
              )}
            >
              Lock answer
            </button>
          ) : (
            <button
              type="button"
              onClick={continueFlow}
              className="w-full rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
            >
              {isComplete() ? "See results" : "Next question"}
            </button>
          )}
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
      <p className="text-[10px] font-extrabold text-[#8a7cb8] uppercase">{label}</p>
      <p
        className={cn(
          "font-display text-[20px] leading-none font-bold",
          accent ? "text-arc-purple-500" : "text-[#1b1730]",
        )}
      >
        {score}
      </p>
    </div>
  );
}
