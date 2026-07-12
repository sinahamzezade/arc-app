import { apiFetch } from "./client";
import type {
  LessonArloChatResponse,
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
  attemptId?: string;
};

export type CompleteLessonBody = {
  quizAnswers?: Record<string, string>;
  practiceOptionId?: string;
  timeSpentMinutes?: number;
  attemptId: string;
};

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

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
      attemptId?: string | null;
    }>(`/lessons/${lessonId}/progress`, {
      method: "PATCH",
      body,
      accessToken,
    });
  },

  checkPractice(
    lessonId: string,
    body: { optionId: string; attemptId: string; hintUsed?: boolean },
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckPracticeResponse>(
      `/lessons/${lessonId}/practice/check`,
      {
        method: "POST",
        body,
        accessToken,
      },
    );
  },

  checkQuiz(
    lessonId: string,
    body: { questionId: string; optionId: string; attemptId: string },
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
    body: CompleteLessonBody,
    accessToken?: string | null,
    idempotencyKey?: string,
  ) {
    return apiFetch<LessonCompleteResponse>(`/lessons/${lessonId}/complete`, {
      method: "POST",
      body,
      accessToken,
      headers: {
        "Idempotency-Key": idempotencyKey ?? newIdempotencyKey(),
      },
    });
  },

  arloChat(
    lessonId: string,
    message: string,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonArloChatResponse>(
      `/lessons/${lessonId}/arlo/chat`,
      {
        method: "POST",
        body: { message },
        accessToken,
      },
    );
  },
};
