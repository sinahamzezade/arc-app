import { create } from "zustand";
import {
  emptyQuestionnaireAnswers,
  type QuestionnaireAnswers,
} from "@/schemas/questionnaire";

interface QuestionnaireState {
  answers: QuestionnaireAnswers;
  setAnswers: (answers: Partial<QuestionnaireAnswers>) => void;
  reset: () => void;
}

export const useQuestionnaireStore = create<QuestionnaireState>((set) => ({
  answers: emptyQuestionnaireAnswers,
  setAnswers: (patch) =>
    set((state) => ({ answers: { ...state.answers, ...patch } })),
  reset: () => set({ answers: emptyQuestionnaireAnswers }),
}));
