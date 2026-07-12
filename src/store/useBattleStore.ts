import { create } from "zustand";
import type { BattleDto, BattleQuestionDto } from "@/lib/api/battles";
import {
  defaultBattleSetup,
  type BattleQuestion,
  type BattleSetup,
} from "@/lib/battle/mock-data";

function mapQuestion(q: BattleQuestionDto): BattleQuestion {
  return {
    id: q.id,
    questionVersionId: q.questionVersionId,
    prompt: q.stem,
    options: q.options,
    correctOptionId: q.correctOptionIds?.[0],
    explanation: q.explanation,
    isSuddenDeath: q.isSuddenDeath,
    answers: q.answers,
  };
}

type BattlePlayState = {
  setup: BattleSetup;
  activeBattleId: string | null;
  battle: BattleDto | null;
  questions: BattleQuestion[];
  questionIndex: number;
  yourScore: number;
  theirScore: number;
  selectedOptionId: string | null;
  revealed: boolean;
  answers: Record<string, string>;
  submitting: boolean;
  error: string | null;
  setSetup: (patch: Partial<BattleSetup>) => void;
  setQuestions: (questions: BattleQuestion[]) => void;
  applyBattle: (dto: BattleDto) => void;
  resetPlay: () => void;
  selectOption: (optionId: string) => void;
  setSubmitting: (v: boolean) => void;
  setError: (msg: string | null) => void;
  isComplete: () => boolean;
};

const playInitial = {
  questionIndex: 0,
  yourScore: 0,
  theirScore: 0,
  selectedOptionId: null as string | null,
  revealed: false,
  answers: {} as Record<string, string>,
  submitting: false,
  error: null as string | null,
};

export const useBattleStore = create<BattlePlayState>((set, get) => ({
  setup: { ...defaultBattleSetup },
  activeBattleId: null,
  battle: null,
  questions: [],
  ...playInitial,
  setSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
  setQuestions: (questions) => set({ questions, ...playInitial }),
  applyBattle: (dto) => {
    const q = dto.currentQuestion;
    const revealed = Boolean(q?.revealedAt);
    const myAnswer = q?.answers?.find((a) => a.selectedOptionId);
    set({
      activeBattleId: dto.id,
      battle: dto,
      yourScore: dto.yourScore,
      theirScore: dto.theirScore,
      setup: {
        opponentId: dto.opponent.userId,
        subject: dto.subject,
        topic: dto.topic ?? "",
        difficulty:
          dto.difficulty === "expert"
            ? "expert"
            : (dto.difficulty as BattleSetup["difficulty"]),
        questions: dto.questionCount,
        seconds: dto.secondsPerQuestion,
        mode: dto.mode,
        stake: dto.stakePerPlayer,
      },
      questions: q ? [mapQuestion(q)] : get().questions,
      questionIndex: 0,
      revealed,
      selectedOptionId: myAnswer?.selectedOptionId ?? get().selectedOptionId,
      error: null,
    });
  },
  resetPlay: () =>
    set({
      ...playInitial,
      battle: null,
      activeBattleId: null,
      questions: [],
    }),
  selectOption: (optionId) => {
    if (get().revealed || get().submitting) return;
    set({ selectedOptionId: optionId });
  },
  setSubmitting: (v) => set({ submitting: v }),
  setError: (msg) => set({ error: msg }),
  isComplete: () => {
    const { battle } = get();
    return (
      battle?.status === "completed" ||
      battle?.status === "forfeited" ||
      battle?.status === "voided" ||
      battle?.status === "refunded"
    );
  },
}));
