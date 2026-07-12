export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt?: string;
};

export type QuestionnaireStatus = "not_started" | "in_progress" | "completed";

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
  /** Pool snapshot — present when roadmap instance stores source refs. */
  lessonTemplateId?: string | null;
  lessonVersionId?: string | null;
  rewardClass?: string | null;
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
  | "learning"
  | "streak"
  | "coach"
  | "social"
  | "rewards"
  | "system";

export type NotificationTypeDto =
  | "study_reminder"
  | "study_starting"
  | "missed_session"
  | "replan_suggestion"
  | "deadline_risk"
  | "pace_ahead"
  | "pace_behind"
  | "streak_risk"
  | "streak_protected"
  | "streak_broken"
  | "streak_recovered"
  | "weekly_recap"
  | "missed_week_recovery"
  | "reward_granted"
  | "badge_unlocked"
  | "rank_close"
  | "rank_unlocked"
  | "rank_close"
  | "rank_gate_completed"
  | "chest_ready"
  | "lucky_wheel_ready"
  | "lucky_wheel_reward"
  | "friend_request"
  | "friend_request_accepted"
  | "new_follower"
  | "study_invite"
  | "study_invite_accepted"
  | "study_session_starting"
  | "study_partner_ready"
  | "study_session_completed"
  | "battle_invite"
  | "battle_invite_expiring"
  | "battle_accepted"
  | "battle_starting"
  | "battle_result"
  | "battle_rematch"
  | "league_update"
  | "league_started"
  | "league_position_changed"
  | "league_promotion_risk"
  | "league_demote_risk"
  | "league_position_risk"
  | "league_finalized"
  | "league_promoted"
  | "league_demoted"
  | "league_gate_blocked"
  | "referral"
  | "product_update"
  | "coach_message"
  | "system"
  | "security";

export type NotificationDto = {
  id: string;
  type: NotificationTypeDto;
  category: NotificationCategoryDto;
  title: string;
  body: string;
  actionUrl: string | null;
  payload: Record<string, unknown> | null;
  priority?: "low" | "normal" | "high" | "critical";
  unread: boolean;
  readAt: string | null;
  expiresAt?: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationDto[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
  nextCursor?: string | null;
};

export type NotificationUnreadCountResponse = {
  unreadCount: number;
};

export type NotificationPreferenceToggleId =
  | "push"
  | "email"
  | "learningReminders"
  | "weeklyProgress"
  | "streakReminders"
  | "rewards"
  | "social"
  | "studyTogetherInvites"
  | "battleInvites"
  | "leagueUpdates"
  | "luckyWheel"
  | "coachMessages"
  | "marketing";

export type NotificationPreferencesResponse = {
  preferences: Record<NotificationPreferenceToggleId, boolean> & {
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
  toggles: Array<{
    id: NotificationPreferenceToggleId;
    label: string;
    detail: string;
    on: boolean;
  }>;
};

export type WeekDayStatusDto = "done" | "empty" | "today" | "current" | "completed";

export type WeekTaskStatusDto =
  | "upcoming"
  | "today"
  | "done"
  | "missed"
  | "skipped"
  | "moved";

export type WeekProgressStatusDto =
  | "ahead"
  | "on_track"
  | "catch_up"
  | "at_risk"
  | "sealed";

export type WeekCurrentResponse = {
  status?: string;
  weekLabel: string;
  rangeLabel: string;
  weekStart: string;
  windowStartAt?: string | null;
  windowEndAt?: string | null;
  targetWeek: number;
  sealed: boolean;
  sessionsLeft: number;
  estimateMinutes: number;
  replanHref: string;
  weeklyStreak?: number;
  todayMission?: {
    taskId: string;
    lessonId: string | null;
    title: string;
    state: string;
    estimatedMinutes: number;
    href: string;
  } | null;
  progress: {
    status?: WeekProgressStatusDto;
    percent: number;
    hoursDone: number;
    hoursPlanned: number;
    verifiedMinutesDone?: number;
    minutesPlanned?: number;
    sessionsDone: number;
    sessionsPlanned: number;
    sessionsLeft?: number;
    remainingMinutes?: number;
    onTrack: boolean;
    lockRewardXp: number;
    lockRewardGems: number;
  };
  sealRewardPreview?: { xp: number; gems: number };
  streak: {
    weeks: number;
    days: { label: string; status: "done" | "empty" }[];
  };
  days: {
    label: string;
    full: string;
    dayIndex?: number;
    status: WeekDayStatusDto;
    minutesPlanned: number;
    minutesDone: number;
  }[];
  tasks: {
    id: string;
    dayLabel: string;
    dayIndex?: number;
    title: string;
    track: string;
    minutes: number;
    xp: number;
    status: WeekTaskStatusDto;
    href?: string;
    lessonId?: string | null;
  }[];
  arloNudge: string;
};

/* ─── Lesson play ─────────────────────────────────────────────── */

export type LessonContentBlockDto =
  | { type: "text"; body: string }
  | { type: "callout"; title: string; body: string }
  | { type: "code"; label: string; code: string };

export type LessonContentSourceDto = {
  lessonTemplateId: string | null;
  lessonVersionId: string | null;
  version: number | null;
  status: string | null;
  rewardClass: string | null;
};

export type LessonPlayDto = {
  id: string;
  lessonNumber: number;
  title: string;
  missionName: string | null;
  minutes: number;
  xpReward: number;
  objective: string;
  status: "locked" | "available" | "completed";
  contentVersionId?: string;
  contentSchemaVersion?: number;
  rewardRuleVersion?: string;
  attemptId?: string | null;
  serverTime?: string;
  /** Content-pool provenance when backend attaches it. */
  contentSource?: LessonContentSourceDto | null;
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
    practiceOptionId?: string | null;
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
  attemptId?: string;
  contentVersionId?: string;
  contentSchemaVersion?: number;
  rewardRuleVersion?: string;
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
  wallet?: {
    lifetimeXp: number;
    gems: number;
    coins: number;
    version: number;
  };
  profile: {
    totalXp: number;
    gems: number;
    coins: number;
  };
  unlockedLessonIds: string[];
  roadmapProgressPercent: number;
  attemptId?: string | null;
  contentVersionId?: string;
  rewardRuleVersion?: string;
};

export type LessonArloChatResponse = {
  reply: string;
  source: "ai" | "stub";
};
