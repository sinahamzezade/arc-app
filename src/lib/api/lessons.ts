import { apiFetch } from "./client";
import type {
  LessonCheckPracticeResponse,
  LessonCheckQuizResponse,
  LessonCompleteResponse,
  LessonPlayDto,
  LessonStartResponse,
} from "./types";

export type UpdateLessonProgressBody = {
  contentStep?: number;
  practiceDone?: boolean;
  practiceOptionId?: string;
  quizAnswers?: Record<string, string>;
  quizIndex?: number;
  timeSpentMinutes?: number;
};

export type CompleteLessonBody = {
  quizAnswers?: Record<string, string>;
  practiceOptionId?: string;
  timeSpentMinutes?: number;
};

export const lessonsApi = {
  getPlay(lessonId: string, accessToken?: string | null) {
    return apiFetch<LessonPlayDto>(`/lessons/${lessonId}/play`, {
      accessToken,
    });
  },

  start(lessonId: string, accessToken?: string | null) {
    return apiFetch<LessonStartResponse>(`/lessons/${lessonId}/start`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  saveProgress(
    lessonId: string,
    body: UpdateLessonProgressBody,
    accessToken?: string | null,
  ) {
    return apiFetch<{
      lessonId: string;
      status: string;
      sessionState: UpdateLessonProgressBody;
      timeSpentMinutes: number;
    }>(`/lessons/${lessonId}/progress`, {
      method: "PATCH",
      body,
      accessToken,
    });
  },

  checkPractice(
    lessonId: string,
    optionId: string,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckPracticeResponse>(
      `/lessons/${lessonId}/practice/check`,
      {
        method: "POST",
        body: { optionId },
        accessToken,
      },
    );
  },

  checkQuiz(
    lessonId: string,
    body: { questionId: string; optionId: string },
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckQuizResponse>(
      `/lessons/${lessonId}/quiz/check`,
      {
        method: "POST",
        body,
        accessToken,
      },
    );
  },

  complete(
    lessonId: string,
    body: CompleteLessonBody = {},
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCompleteResponse>(`/lessons/${lessonId}/complete`, {
      method: "POST",
      body,
      accessToken,
    });
  },
};
