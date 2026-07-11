import { create } from "zustand";

type LessonSessionState = {
  lessonId: string | null;
  contentStep: number;
  practiceOptionId: string | null;
  quizAnswers: Record<string, string>;
  quizIndex: number;
  completed: boolean;
  startLesson: (lessonId: string) => void;
  setContentStep: (step: number) => void;
  setPracticeOption: (optionId: string) => void;
  setQuizAnswer: (questionId: string, optionId: string) => void;
  setQuizIndex: (index: number) => void;
  markCompleted: () => void;
  reset: () => void;
};

const initial = {
  lessonId: null as string | null,
  contentStep: 0,
  practiceOptionId: null as string | null,
  quizAnswers: {} as Record<string, string>,
  quizIndex: 0,
  completed: false,
};

export const useLessonStore = create<LessonSessionState>((set) => ({
  ...initial,
  startLesson: (lessonId) =>
    set({
      ...initial,
      lessonId,
    }),
  setContentStep: (contentStep) => set({ contentStep }),
  setPracticeOption: (practiceOptionId) => set({ practiceOptionId }),
  setQuizAnswer: (questionId, optionId) =>
    set((state) => ({
      quizAnswers: { ...state.quizAnswers, [questionId]: optionId },
    })),
  setQuizIndex: (quizIndex) => set({ quizIndex }),
  markCompleted: () => set({ completed: true }),
  reset: () => set(initial),
}));
