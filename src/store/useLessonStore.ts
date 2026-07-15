import { create } from "zustand";
import type { LessonQuizAnswerValue } from "@/lib/api/types";

export type QuizReveal = {
  correct: boolean;
  /** Correct answer — option index (mcq) or boolean. */
  answer: LessonQuizAnswerValue;
  explain: string | null;
};

type LessonSessionState = {
  lessonId: string | null;
  attemptId: string | null;
  /** Reading pager index (also reused for video single step). */
  contentStep: number;
  /** Practice/task acceptance-criteria checklist by index. */
  practiceChecked: Record<number, boolean>;
  practiceDone: boolean;
  practiceHintUsed: boolean;
  quizAnswers: Record<string, LessonQuizAnswerValue>;
  quizIndex: number;
  completed: boolean;
  quizReveal: Record<string, QuizReveal>;
  startLesson: (lessonId: string) => void;
  setAttemptId: (attemptId: string | null) => void;
  hydrateFromProgress: (
    lessonId: string,
    progress: {
      contentStep: number;
      practiceDone: boolean;
      quizAnswers: Record<string, LessonQuizAnswerValue>;
      quizIndex: number;
      completed: boolean;
      attemptId?: string | null;
    },
  ) => void;
  setContentStep: (step: number) => void;
  togglePracticeChecked: (index: number) => void;
  setPracticeDone: (done: boolean) => void;
  setPracticeHintUsed: (used: boolean) => void;
  setQuizAnswer: (questionId: string, answer: LessonQuizAnswerValue) => void;
  setQuizReveal: (questionId: string, reveal: QuizReveal) => void;
  setQuizIndex: (index: number) => void;
  resetQuizRun: () => void;
  setCompleted: (completed: boolean) => void;
  reset: () => void;
};

const initial = {
  lessonId: null as string | null,
  attemptId: null as string | null,
  contentStep: 0,
  practiceChecked: {} as Record<number, boolean>,
  practiceDone: false,
  practiceHintUsed: false,
  quizAnswers: {} as Record<string, LessonQuizAnswerValue>,
  quizIndex: 0,
  completed: false,
  quizReveal: {} as Record<string, QuizReveal>,
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
        Object.keys(current.practiceChecked).length > 0 ||
        current.practiceDone ||
        Object.keys(current.quizReveal).length > 0)
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
      practiceChecked: {},
      practiceDone: progress.practiceDone,
      quizAnswers: progress.quizAnswers,
      quizIndex: progress.quizIndex,
      completed: progress.completed,
      quizReveal: {},
      practiceHintUsed: false,
    });
  },
  setContentStep: (contentStep) => set({ contentStep }),
  togglePracticeChecked: (index) =>
    set((state) => ({
      practiceChecked: {
        ...state.practiceChecked,
        [index]: !state.practiceChecked[index],
      },
    })),
  setPracticeDone: (practiceDone) => set({ practiceDone }),
  setPracticeHintUsed: (practiceHintUsed) => set({ practiceHintUsed }),
  setQuizAnswer: (questionId, answer) =>
    set((state) => ({
      quizAnswers: { ...state.quizAnswers, [questionId]: answer },
    })),
  setQuizReveal: (questionId, reveal) =>
    set((state) => ({
      quizReveal: { ...state.quizReveal, [questionId]: reveal },
    })),
  setQuizIndex: (quizIndex) => set({ quizIndex }),
  resetQuizRun: () =>
    set({ quizAnswers: {}, quizReveal: {}, quizIndex: 0 }),
  setCompleted: (completed) => set({ completed }),
  reset: () => set(initial),
}));
