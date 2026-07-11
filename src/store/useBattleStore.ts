import { create } from "zustand";
import {
  battleQuestions,
  defaultBattleSetup,
  type BattleSetup,
} from "@/lib/battle/mock-data";

type BattlePlayState = {
  setup: BattleSetup;
  questionIndex: number;
  yourScore: number;
  theirScore: number;
  selectedOptionId: string | null;
  revealed: boolean;
  answers: Record<string, string>;
  setSetup: (patch: Partial<BattleSetup>) => void;
  resetPlay: () => void;
  selectOption: (optionId: string) => void;
  reveal: () => void;
  nextQuestion: () => void;
  isComplete: () => boolean;
};

const playInitial = {
  questionIndex: 0,
  yourScore: 0,
  theirScore: 0,
  selectedOptionId: null as string | null,
  revealed: false,
  answers: {} as Record<string, string>,
};

export const useBattleStore = create<BattlePlayState>((set, get) => ({
  setup: { ...defaultBattleSetup },
  ...playInitial,
  setSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
  resetPlay: () => set({ ...playInitial }),
  selectOption: (optionId) => {
    if (get().revealed) return;
    set({ selectedOptionId: optionId });
  },
  reveal: () => {
    const state = get();
    if (state.revealed || !state.selectedOptionId) return;
    const q = battleQuestions[state.questionIndex];
    const correct = state.selectedOptionId === q.correctOptionId;
    const yourGain = correct ? 100 + Math.floor(Math.random() * 20) : 0;
    // Mock opponent: ~55% correct
    const opponentCorrect = Math.random() > 0.45;
    const theirGain = opponentCorrect ? 100 + Math.floor(Math.random() * 15) : 0;
    set({
      revealed: true,
      yourScore: state.yourScore + yourGain,
      theirScore: state.theirScore + theirGain,
      answers: { ...state.answers, [q.id]: state.selectedOptionId },
    });
  },
  nextQuestion: () => {
    const { questionIndex, setup } = get();
    const max = Math.min(setup.questions, battleQuestions.length) - 1;
    if (questionIndex >= max) return;
    set({
      questionIndex: questionIndex + 1,
      selectedOptionId: null,
      revealed: false,
    });
  },
  isComplete: () => {
    const { questionIndex, setup, revealed } = get();
    const max = Math.min(setup.questions, battleQuestions.length) - 1;
    return revealed && questionIndex >= max;
  },
}));
