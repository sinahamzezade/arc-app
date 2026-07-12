import { create } from "zustand";
import type { QuestionnaireSchema } from "@/lib/api/types";
import {
  emptyQuestionnaireAnswers,
  type QuestionnaireAnswers,
} from "@/schemas/questionnaire";

interface QuestionnaireState {
  answers: QuestionnaireAnswers;
  schema: QuestionnaireSchema | null;
  hydrated: boolean;
  setAnswers: (answers: Partial<QuestionnaireAnswers>) => void;
  replaceAnswers: (answers: QuestionnaireAnswers) => void;
  setSchema: (schema: QuestionnaireSchema) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
}

export const useQuestionnaireStore = create<QuestionnaireState>((set) => ({
  answers: emptyQuestionnaireAnswers,
  schema: null,
  hydrated: false,
  setAnswers: (patch) =>
    set((state) => ({ answers: { ...state.answers, ...patch } })),
  replaceAnswers: (answers) => set({ answers, hydrated: true }),
  setSchema: (schema) => set({ schema }),
  setHydrated: (hydrated) => set({ hydrated }),
  reset: () =>
    set({
      answers: emptyQuestionnaireAnswers,
      schema: null,
      hydrated: false,
    }),
}));
