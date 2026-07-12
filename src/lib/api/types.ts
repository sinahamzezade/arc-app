export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt?: string;
};

export type QuestionnaireStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type Profile = {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  language: string;
  currentRole: string | null;
  targetRole: string | null;
  yearsExperience: number | null;
  totalXp?: number;
  coins?: number;
  gems?: number;
  weeklyStreak?: number;
  questionnaireStatus?: QuestionnaireStatus;
  questionnaireCompletedAt?: string | null;
  onboardingCompletedAt?: string | null;
};

export type QuestionnaireAnswersPayload = {
  goal: string[];
  motivation: string[];
  motivationOther?: string;
  currentJob: string;
  currentJobOther?: string;
  skills: string[];
  skillsOther?: string;
  studyHours: string;
  schedule: {
    days: string[];
    times: string[];
  };
  deadline: string;
  learningStyle: string[];
  learningStyleOther?: string;
  confidence: string;
  quitReasons: string[];
  quitReasonsOther?: string;
};

export type QuestionnaireResponse = {
  id: string | null;
  status: "not_started" | "draft" | "submitted";
  schemaVersion: number;
  answers: QuestionnaireAnswersPayload | null;
  goalId: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
};

export type QuestionnaireSubmitResponse = {
  questionnaire: QuestionnaireResponse;
  goal: {
    id: string;
    status: string;
    targetRoles: string[];
    weeklyHours: string | null;
    targetDeadline: string | null;
  } | null;
  roadmap: {
    status: "queued" | "processing" | "ready" | "failed";
    jobId: string;
    roadmapId: string | null;
  };
};

export type QuestionnaireOptionDto = {
  value: string;
  label: string;
  icon?: string;
  iconClassName?: string;
};

export type StepVisibleWhen = {
  field: string;
  op: "eq" | "neq" | "includes" | "excludes";
  value: string | string[];
};

export type QuestionnaireStepDto = {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  selection: "single" | "multi";
  allowOther?: boolean;
  uiKind: "options" | "schedule";
  reviewLabel: string;
  reviewIcon: string;
  options: QuestionnaireOptionDto[];
  scheduleDays?: string[];
  scheduleTimes?: QuestionnaireOptionDto[];
  visibleWhen?: StepVisibleWhen | StepVisibleWhen[];
};

export type QuestionnaireSchema = {
  schemaVersion: number;
  totalSteps: number;
  steps: QuestionnaireStepDto[];
};

export type AuthSessionResponse = {
  user: AuthUser;
  profile: Profile;
  accessToken: string;
  expiresIn: number;
  /** Present when Nest returns body token (cookie preferred). */
  refreshToken?: string;
};

export type MeResponse = {
  user: AuthUser;
  profile: Profile;
};

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
};

export type RoadmapJobDto = {
  id: string;
  status: "queued" | "processing" | "ready" | "failed";
  roadmapId: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export type RoadmapResourceDto = {
  id: string;
  title: string;
  url: string;
  provider: string;
};

export type RoadmapLessonDto = {
  id: string;
  title: string;
  missionName: string | null;
  lessonType: string;
  estimatedMinutes: number;
  xpReward: number;
  orderIndex: number;
  status: "locked" | "available" | "completed";
  resource: RoadmapResourceDto | null;
};

export type RoadmapMilestoneDto = {
  id: string;
  title: string;
  orderIndex: number;
  type: string;
  lessons: RoadmapLessonDto[];
};

export type RoadmapPhaseDto = {
  id: string;
  title: string;
  orderIndex: number;
  locked: boolean;
  techStackSlug: string | null;
  milestones: RoadmapMilestoneDto[];
};

export type RoadmapTreeDto = {
  id: string;
  title: string;
  primaryRoleSlug: string;
  timelineWeeks: number;
  progressPercent: number;
  currentPhaseId: string | null;
  status: string;
  phases: RoadmapPhaseDto[];
};

export type RoadmapCurrentResponse = {
  job: RoadmapJobDto | null;
  roadmap: RoadmapTreeDto | null;
};

export type NotificationCategoryDto =
  | "streak"
  | "coach"
  | "social"
  | "rewards"
  | "system";

export type NotificationTypeDto =
  | "study_reminder"
  | "streak_risk"
  | "weekly_recap"
  | "missed_week_recovery"
  | "badge_unlocked"
  | "replan_suggestion"
  | "battle_invite"
  | "league_update"
  | "referral"
  | "product_update"
  | "coach_message"
  | "system";

export type NotificationDto = {
  id: string;
  type: NotificationTypeDto;
  category: NotificationCategoryDto;
  title: string;
  body: string;
  actionUrl: string | null;
  payload: Record<string, unknown> | null;
  unread: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationDto[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
};

export type NotificationUnreadCountResponse = {
  unreadCount: number;
};

export type NotificationPreferencesResponse = {
  preferences: {
    push: boolean;
    email: boolean;
    streakReminders: boolean;
    battleInvites: boolean;
    marketing: boolean;
  };
  toggles: Array<{
    id: "push" | "email" | "streakReminders" | "battleInvites" | "marketing";
    label: string;
    detail: string;
    on: boolean;
  }>;
};

export type WeekDayStatusDto = "done" | "empty" | "today";

export type WeekTaskStatusDto =
  | "upcoming"
  | "today"
  | "done"
  | "missed"
  | "skipped";

export type WeekCurrentResponse = {
  weekLabel: string;
  rangeLabel: string;
  weekStart: string;
  targetWeek: number;
  sealed: boolean;
  sessionsLeft: number;
  estimateMinutes: number;
  replanHref: string;
  progress: {
    percent: number;
    hoursDone: number;
    hoursPlanned: number;
    sessionsDone: number;
    sessionsPlanned: number;
    onTrack: boolean;
    lockRewardXp: number;
    lockRewardGems: number;
  };
  streak: {
    weeks: number;
    days: { label: string; status: "done" | "empty" }[];
  };
  days: {
    label: string;
    full: string;
    status: WeekDayStatusDto;
    minutesPlanned: number;
    minutesDone: number;
  }[];
  tasks: {
    id: string;
    dayLabel: string;
    title: string;
    track: string;
    minutes: number;
    xp: number;
    status: WeekTaskStatusDto;
    href?: string;
  }[];
  arloNudge: string;
};

/* ─── Lesson play ─────────────────────────────────────────────── */

export type LessonContentBlockDto =
  | { type: "text"; body: string }
  | { type: "callout"; title: string; body: string }
  | { type: "code"; label: string; code: string };

export type LessonPlayDto = {
  id: string;
  lessonNumber: number;
  title: string;
  missionName: string | null;
  minutes: number;
  xpReward: number;
  objective: string;
  status: "locked" | "available" | "completed";
  resource: {
    id: string | null;
    label: string;
    href: string;
    note: string;
    provider: string | null;
  };
  arloPrompt: string;
  content: Array<{
    id: string;
    title: string;
    blocks: LessonContentBlockDto[];
  }>;
  practice: {
    id: string;
    prompt: string;
    hint: string;
    options: Array<{ id: string; label: string }>;
  };
  quiz: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string }>;
  }>;
  rewardPreview: {
    xp: number;
    gems: number;
    coins: number;
    badgeId?: string;
    badgeLabel?: string;
    arloLine: string;
  };
  suggestedArlo: string[];
  progress: {
    status: "not_started" | "in_progress" | "completed";
    contentStep: number;
    practiceDone: boolean;
    quizAnswers: Record<string, string>;
    quizIndex: number;
    startedAt: string | null;
    completedAt: string | null;
  };
};

export type LessonStartResponse = {
  lessonId: string;
  status: string;
  startedAt: string;
};

export type LessonCheckPracticeResponse = {
  correct: boolean;
  correctOptionId: string;
  feedback: string;
};

export type LessonCheckQuizResponse = {
  correct: boolean;
  correctOptionId: string;
  explanation: string;
};

export type LessonCompleteResponse = {
  lessonId: string;
  status: string;
  quizScore: { correct: number; total: number; perfect: boolean };
  reward: {
    xp: number;
    gems: number;
    coins: number;
    badgeId?: string;
    badgeLabel?: string;
    arloLine: string;
  };
  profile: {
    totalXp: number;
    gems: number;
    coins: number;
  };
  unlockedLessonIds: string[];
  roadmapProgressPercent: number;
};
