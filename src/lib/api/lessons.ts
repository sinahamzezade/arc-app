import { apiFetch } from "./client";
import type {
  LessonArloChatResponse,
  LessonCheckActiveBlockResponse,
  LessonCheckPracticeResponse,
  LessonCheckQuizResponse,
  LessonCompleteResponse,
  LessonPlayDto,
  LessonQuizAnswerValue,
  LessonStartResponse,
} from "./types";

export type UpdateLessonProgressBody = {
  contentStep?: number;
  practiceDone?: boolean;
  quizAnswers?: Record<string, LessonQuizAnswerValue>;
  quizIndex?: number;
  timeSpentMinutes?: number;
  attemptId?: string;
};

export type CompleteLessonBody = {
  quizAnswers?: Record<string, LessonQuizAnswerValue>;
  timeSpentMinutes?: number;
  attemptId: string;
};

/** Self-attest the task is done (practice / mini_project / interactive). */
export type CheckPracticeBody = {
  attemptId: string;
  done?: boolean;
  hintUsed?: boolean;
};

/** One of optionIndex (mcq) / booleanAnswer (boolean) is required. */
export type CheckQuizBody = {
  attemptId: string;
  questionId?: string;
  questionIndex?: number;
  optionIndex?: number;
  booleanAnswer?: boolean;
};

export type CheckActiveBlockBody = {
  attemptId: string;
};

export type CheckScenarioBody = CheckActiveBlockBody & {
  optionId: string;
};

export type CheckVisualHotspotBody = CheckActiveBlockBody & {
  hotspotId: string;
};

export type CheckDragOrderBody = CheckActiveBlockBody & {
  orderedIds: string[];
};

export type CheckDebateBody = CheckActiveBlockBody & {
  side: "a" | "b";
};

export type CheckSandboxSimulationBody = CheckActiveBlockBody & {
  actions: string[];
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
    body: CheckPracticeBody,
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
    body: CheckQuizBody,
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

  checkScenario(
    lessonId: string,
    blockId: string,
    body: CheckScenarioBody,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckActiveBlockResponse>(
      `/lessons/${lessonId}/scenario/${blockId}/check`,
      { method: "POST", body, accessToken },
    );
  },

  checkVisualHotspot(
    lessonId: string,
    blockId: string,
    body: CheckVisualHotspotBody,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckActiveBlockResponse>(
      `/lessons/${lessonId}/visual-hotspot/${blockId}/check`,
      { method: "POST", body, accessToken },
    );
  },

  checkDragOrder(
    lessonId: string,
    blockId: string,
    body: CheckDragOrderBody,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckActiveBlockResponse>(
      `/lessons/${lessonId}/drag-order/${blockId}/check`,
      { method: "POST", body, accessToken },
    );
  },

  checkDebate(
    lessonId: string,
    blockId: string,
    body: CheckDebateBody,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckActiveBlockResponse>(
      `/lessons/${lessonId}/debate/${blockId}/check`,
      { method: "POST", body, accessToken },
    );
  },

  checkSandboxSimulation(
    lessonId: string,
    blockId: string,
    body: CheckSandboxSimulationBody,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonCheckActiveBlockResponse>(
      `/lessons/${lessonId}/sandbox-simulation/${blockId}/check`,
      { method: "POST", body, accessToken },
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
