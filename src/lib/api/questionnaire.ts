import { apiFetch } from "./client";
import type {
  QuestionnaireAnswersPayload,
  QuestionnaireResponse,
  QuestionnaireSchema,
  QuestionnaireSubmitResponse,
} from "./types";

export const questionnaireApi = {
  getSchema(accessToken?: string | null) {
    return apiFetch<QuestionnaireSchema>("/questionnaire/schema", {
      accessToken,
    });
  },

  get(accessToken?: string | null) {
    return apiFetch<QuestionnaireResponse>("/questionnaire", { accessToken });
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
