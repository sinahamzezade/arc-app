import { apiFetch } from "./client";

export type ContentPublicationStatus =
  | "draft"
  | "review"
  | "published"
  | "retired"
  | "blocked";

export type ContentEntityType = "lesson_version" | "question_version";

export type RoleRecipeDto = {
  id: string;
  careerRoleId: string | null;
  targetRoleSlug: string;
  title: string;
  summary: string;
  version: number;
  defaultTimelineWeeks: number;
  stackPlan: {
    phases: Array<{
      key: string;
      title: string;
      tech_stack_slugs: string[];
      required: boolean;
      include_if_confidence_gte?: string;
    }>;
  };
  requiredSkillNodeIds: string[];
  optionalSkillNodeIds: string[];
  isActive: boolean;
};

export type LessonTemplateDto = {
  id: string;
  skillNodeId: string;
  slug: string;
  title: string;
  lessonType: string;
  estimatedMinutes: number;
  difficulty: string;
  learningStyleTags: string[];
  schedulingTags: string[];
  language: string;
  status: ContentPublicationStatus;
  publishedVersionId: string | null;
  rewardClass: string;
};

export type LessonVersionBodyDto = {
  schemaVersion: number;
  objective: string;
  sections: Array<{
    id: string;
    title: string;
    blocks: Array<Record<string, unknown>>;
  }>;
  practiceIds?: string[];
  quizIds?: string[];
  resourceIds?: string[];
};

export type LessonVersionDto = {
  id: string;
  lessonTemplateId: string;
  version: number;
  status: ContentPublicationStatus;
  body: LessonVersionBodyDto | Record<string, unknown>;
  schemaVersion: number;
  changeNote: string;
  publishedAt: string | null;
};

export type QuestionTemplateDto = {
  id: string;
  slug: string;
  questionType: string;
  skillNodeId: string | null;
  techStackSlug: string | null;
  difficulty: string;
  estimatedSeconds: number;
  allowedContexts: Array<"lesson" | "assessment" | "battle">;
  status: ContentPublicationStatus;
  publishedVersionId: string | null;
};

export type QuestionVersionDto = {
  id: string;
  questionTemplateId: string;
  version: number;
  status: ContentPublicationStatus;
  prompt: Record<string, unknown>;
  explanation: string;
  changeNote: string;
  publishedAt: string | null;
};

export type GraphValidationDto = {
  ok: true;
  nodeCount: number;
  edgeCount: number;
};

export type CreateLessonBody = {
  skillNodeId: string;
  slug: string;
  title: string;
  lessonType: string;
  estimatedMinutes?: number;
  difficulty?: string;
  learningStyleTags?: string[];
  schedulingTags?: string[];
  language?: string;
  missionNameTemplate?: string;
};

export type CreateLessonVersionBody = {
  body: LessonVersionBodyDto;
  changeNote?: string;
};

export type CreateQuestionBody = {
  slug: string;
  questionType: string;
  skillNodeId?: string;
  techStackSlug?: string;
  difficulty?: string;
  estimatedSeconds?: number;
  allowedContexts?: string[];
};

export type CreateQuestionVersionBody = {
  prompt: Record<string, unknown>;
  answer: Record<string, unknown>;
  explanation?: string;
  changeNote?: string;
};

/** Play payload from content pool — never includes answer keys. */
export type BattlePlayQuestionDto = {
  questionVersionId: string;
  questionType: string;
  difficulty: string;
  estimatedSeconds: number;
  prompt: Record<string, unknown>;
  options: Array<{ id: string; label: string }>;
};

/**
 * Content pool admin + recipe read APIs.
 * Matches `POST/GET /admin/content/*` on backend.
 */
export const contentApi = {
  getRoleRecipe(roleSlug: string, accessToken?: string | null) {
    return apiFetch<RoleRecipeDto>(
      `/admin/content/recipes/${encodeURIComponent(roleSlug)}`,
      { accessToken },
    );
  },

  createLesson(body: CreateLessonBody, accessToken?: string | null) {
    return apiFetch<LessonTemplateDto>("/admin/content/lessons", {
      method: "POST",
      body,
      accessToken,
    });
  },

  createLessonVersion(
    lessonId: string,
    body: CreateLessonVersionBody,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonVersionDto>(
      `/admin/content/lessons/${lessonId}/versions`,
      { method: "POST", body, accessToken },
    );
  },

  createQuestion(body: CreateQuestionBody, accessToken?: string | null) {
    return apiFetch<QuestionTemplateDto>("/admin/content/questions", {
      method: "POST",
      body,
      accessToken,
    });
  },

  createQuestionVersion(
    questionId: string,
    body: CreateQuestionVersionBody,
    accessToken?: string | null,
  ) {
    return apiFetch<QuestionVersionDto>(
      `/admin/content/questions/${questionId}/versions`,
      { method: "POST", body, accessToken },
    );
  },

  submitReview(
    versionId: string,
    entityType: ContentEntityType,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonVersionDto | QuestionVersionDto>(
      `/admin/content/versions/${versionId}/submit-review`,
      {
        method: "POST",
        body: { entityType },
        accessToken,
      },
    );
  },

  publish(
    versionId: string,
    entityType: ContentEntityType,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonVersionDto | QuestionVersionDto>(
      `/admin/content/versions/${versionId}/publish`,
      {
        method: "POST",
        body: { entityType },
        accessToken,
      },
    );
  },

  retire(
    versionId: string,
    entityType: ContentEntityType,
    accessToken?: string | null,
  ) {
    return apiFetch<LessonVersionDto | QuestionVersionDto>(
      `/admin/content/versions/${versionId}/retire`,
      {
        method: "POST",
        body: { entityType },
        accessToken,
      },
    );
  },

  validateGraph(accessToken?: string | null) {
    return apiFetch<GraphValidationDto>("/admin/content/validate-graph", {
      method: "POST",
      body: {},
      accessToken,
    });
  },
};
