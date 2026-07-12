import { create } from "zustand";

type LessonSessionState = {
  lessonId: string | null;
  attemptId: string | null;
  contentStep: number;
  practiceOptionId: string | null;
  practiceHintUsed: boolean;
  quizAnswers: Record<string, string>;
  quizIndex: number;
  completed: boolean;
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
  setAttemptId: (attemptId: string | null) => void;
  hydrateFromProgress: (
    lessonId: string,
    progress: {
      contentStep: number;
      practiceOptionId: string | null;
      quizAnswers: Record<string, string>;
      quizIndex: number;
      completed: boolean;
      attemptId?: string | null;
    },
  ) => void;
  setContentStep: (step: number) => void;
  setPracticeOption: (optionId: string) => void;
  setPracticeHintUsed: (used: boolean) => void;
  setPracticeReveal: (reveal: LessonSessionState["practiceReveal"]) => void;
  setQuizAnswer: (questionId: string, optionId: string) => void;
  setQuizReveal: (
    questionId: string,
    reveal: { correctOptionId: string; explanation: string; correct: boolean },
  ) => void;
  setQuizIndex: (index: number) => void;
  setCompleted: (completed: boolean) => void;
  reset: () => void;
};

const emptyReveal = {
  correctOptionId: null as string | null,
  feedback: null as string | null,
  correct: null as boolean | null,
};

const initial = {
  lessonId: null as string | null,
  attemptId: null as string | null,
  contentStep: 0,
  practiceOptionId: null as string | null,
  practiceHintUsed: false,
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
  setAttemptId: (attemptId) => set({ attemptId }),
  hydrateFromProgress: (lessonId, progress) => {
    const current = get();
    if (
      current.lessonId === lessonId &&
      (Object.keys(current.quizAnswers).length > 0 ||
        current.practiceOptionId != null ||
        current.practiceReveal.correctOptionId != null)
    ) {
      if (progress.attemptId && !current.attemptId) {
        set({ attemptId: progress.attemptId });
      }
      return;
    }
    set({
      lessonId,
      // Keep live attempt only for same lesson — stale play cache often lags start().
      attemptId:
        progress.attemptId ??
        (current.lessonId === lessonId ? current.attemptId : null) ??
        null,
      contentStep: progress.contentStep,
      practiceOptionId: progress.practiceOptionId,
      quizAnswers: progress.quizAnswers,
      quizIndex: progress.quizIndex,
      completed: progress.completed,
      practiceReveal: emptyReveal,
      quizReveal: {},
      practiceHintUsed: false,
    });
  },
  setContentStep: (contentStep) => set({ contentStep }),
  setPracticeOption: (practiceOptionId) =>
    set({ practiceOptionId, practiceReveal: emptyReveal }),
  setPracticeHintUsed: (practiceHintUsed) => set({ practiceHintUsed }),
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
  setCompleted: (completed) => set({ completed }),
  reset: () => set(initial),
}));
