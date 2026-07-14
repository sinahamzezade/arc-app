import { apiFetch } from "./client";
import type {
  QuestionnaireAnswersPayload,
  QuestionnaireResponse,
  QuestionnaireSchema,
  QuestionnaireSubmitResponse,
} from "./types";

export type IntakeMode = "form" | "chat";

export type IntakeConfig = {
  chatEnabled: boolean;
  defaultMode: IntakeMode;
  userMode: IntakeMode | null;
  effectiveMode: IntakeMode;
};

export type IntakeSuggestionOption = {
  value: string;
  label: string;
};

export type IntakeSuggestions = {
  fieldId: string;
  title: string;
  selection: "single" | "multi" | "schedule";
  allowOther: boolean;
  options: IntakeSuggestionOption[];
  days?: string[];
  times?: IntakeSuggestionOption[];
};

export type IntakeChatTurn = {
  assistantMessage: string;
  answers: QuestionnaireAnswersPayload;
  transcript: Array<{ role: "user" | "assistant"; content: string }>;
  missingFields: string[];
  done: boolean;
  promptVersion: string;
  model: string | null;
  suggestions: IntakeSuggestions | null;
};

export type IntakeChatSelection = {
  fieldId: string;
  values: string[];
  otherText?: string;
  days?: string[];
  times?: string[];
};

export type IntakeChatCompleteOk = {
  ok: true;
  missingFields: string[];
  questionnaire: QuestionnaireResponse;
  goal: QuestionnaireSubmitResponse["goal"];
  roadmap: QuestionnaireSubmitResponse["roadmap"];
};

export type IntakeChatCompleteIncomplete = {
  ok: false;
  missingFields: string[];
  answers: QuestionnaireAnswersPayload;
  transcript: Array<{ role: "user" | "assistant"; content: string }>;
  suggestions?: IntakeSuggestions | null;
};

export type IntakeChatCompleteResult =
  | IntakeChatCompleteOk
  | IntakeChatCompleteIncomplete;

export const questionnaireApi = {
  getSchema(accessToken?: string | null) {
    return apiFetch<QuestionnaireSchema>("/questionnaire/schema", {
      accessToken,
    });
  },

  get(accessToken?: string | null) {
    return apiFetch<QuestionnaireResponse>("/questionnaire", { accessToken });
  },

  getIntakeConfig(accessToken?: string | null) {
    return apiFetch<IntakeConfig>("/questionnaire/intake-config", {
      accessToken,
    });
  },

  setIntakeMode(mode: IntakeMode, accessToken?: string | null) {
    return apiFetch<IntakeConfig>("/questionnaire/intake-mode", {
      method: "PUT",
      body: { mode },
      accessToken,
    });
  },

  chatState(accessToken?: string | null) {
    return apiFetch<IntakeChatTurn>("/questionnaire/chat", { accessToken });
  },

  chatStart(accessToken?: string | null) {
    return apiFetch<IntakeChatTurn>("/questionnaire/chat/start", {
      method: "POST",
      accessToken,
    });
  },

  chatMessage(
    message: string,
    accessToken?: string | null,
    selection?: IntakeChatSelection,
  ) {
    return apiFetch<IntakeChatTurn>("/questionnaire/chat/message", {
      method: "POST",
      body: selection
        ? { selection, ...(message ? { message } : {}) }
        : { message },
      accessToken,
    });
  },

  chatComplete(accessToken?: string | null) {
    return apiFetch<IntakeChatCompleteResult>("/questionnaire/chat/complete", {
      method: "POST",
      accessToken,
    });
  },

  saveDraft(
    answers: QuestionnaireAnswersPayload,
    accessToken?: string | null,
  ) {
    return apiFetch<QuestionnaireResponse>("/questionnaire", {
      method: "PUT",
      body: { answers },
      accessToken,
    });
  },

  submit(
    answers: QuestionnaireAnswersPayload,
    accessToken?: string | null,
  ) {
    return apiFetch<QuestionnaireSubmitResponse>("/questionnaire/submit", {
      method: "POST",
      body: { answers },
      accessToken,
    });
  },
};
