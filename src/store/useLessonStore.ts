import { create } from "zustand";

type LessonSessionState = {
  lessonId: string | null;
  contentStep: number;
  practiceOptionId: string | null;
  quizAnswers: Record<string, string>;
  quizIndex: number;
  completed: boolean;
  /** Local reveal cache after server check — optionId → correct */
  practiceReveal: {
    correctOptionId: string | null;
    feedback: string | null;
    correct: boolean | null;
  };
  quizReveal: Record<
    string,
    { correctOptionId: string; explanation: string; correct: boolean }
  >;
  startLesson: (lessonId: string) => void;
  hydrateFromProgress: (
    lessonId: string,
    progress: {
      contentStep: number;
      practiceOptionId: string | null;
      quizAnswers: Record<string, string>;
      quizIndex: number;
      completed: boolean;
    },
  ) => void;
  setContentStep: (step: number) => void;
  setPracticeOption: (optionId: string) => void;
  setPracticeReveal: (reveal: LessonSessionState["practiceReveal"]) => void;
  setQuizAnswer: (questionId: string, optionId: string) => void;
  setQuizReveal: (
    questionId: string,
    reveal: { correctOptionId: string; explanation: string; correct: boolean },
  ) => void;
  setQuizIndex: (index: number) => void;
  markCompleted: () => void;
  reset: () => void;
};

const emptyReveal = {
  correctOptionId: null as string | null,
  feedback: null as string | null,
  correct: null as boolean | null,
};

const initial = {
  lessonId: null as string | null,
  contentStep: 0,
  practiceOptionId: null as string | null,
  quizAnswers: {} as Record<string, string>,
  quizIndex: 0,
  completed: false,
  practiceReveal: emptyReveal,
  quizReveal: {} as LessonSessionState["quizReveal"],
};

export const useLessonStore = create<LessonSessionState>((set, get) => ({
  ...initial,
  startLesson: (lessonId) =>
    set((state) =>
      state.lessonId === lessonId
        ? state
        : {
            ...initial,
            lessonId,
          },
    ),
  hydrateFromProgress: (lessonId, progress) => {
    const current = get();
    if (
      current.lessonId === lessonId &&
      (Object.keys(current.quizAnswers).length > 0 ||
        current.practiceOptionId != null ||
        current.practiceReveal.correctOptionId != null)
    ) {
      return;
    }
    set({
      lessonId,
      contentStep: progress.contentStep,
      practiceOptionId: progress.practiceOptionId,
      quizAnswers: progress.quizAnswers,
      quizIndex: progress.quizIndex,
      completed: progress.completed,
      practiceReveal: emptyReveal,
      quizReveal: {},
    });
  },
  setContentStep: (contentStep) => set({ contentStep }),
  setPracticeOption: (practiceOptionId) =>
    set({ practiceOptionId, practiceReveal: emptyReveal }),
  setPracticeReveal: (practiceReveal) => set({ practiceReveal }),
  setQuizAnswer: (questionId, optionId) =>
    set((state) => ({
      quizAnswers: { ...state.quizAnswers, [questionId]: optionId },
    })),
  setQuizReveal: (questionId, reveal) =>
    set((state) => ({
      quizReveal: { ...state.quizReveal, [questionId]: reveal },
    })),
  setQuizIndex: (quizIndex) => set({ quizIndex }),
  markCompleted: () => set({ completed: true }),
  reset: () => set(initial),
}));
