export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt?: string;
  hasPassword?: boolean;
  passwordLastChangedAt?: string | null;
};

export type QuestionnaireStatus = "not_started" | "in_progress" | "completed";

export type Profile = {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  language: string;
  totalXp?: number;
  coins?: number;
  gems?: number;
  weeklyStreak?: number;
  questionnaireStatus?: QuestionnaireStatus;
  questionnaireCompletedAt?: string | null;
  onboardingCompletedAt?: string | null;
  intakeMode?: "form" | "chat" | null;
};

export type QuestionnaireAnswersPayload = Record<string, unknown>;

export type QuestionnaireResponse = {
  id: string | null;
  status: "not_started" | "draft" | "submitted";
  schemaVersion: number;
  answers: QuestionnaireAnswersPayload | null;
  goalId: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  /** Present on GET /questionnaire when a learner profile exists. */
  learnerProfile?: LearnerProfileSummaryDto | null;
};

export type StageConfidence = "low" | "medium" | "high";

export type PaceClass = "light" | "balanced" | "focused" | "intensive";

export type LearnerSkillEstimateDto = {
  skillSlug: string;
  provisionalStage: number;
  verifiedStage: number | null;
  confidence: StageConfidence;
  exposureLevel: string;
  evidenceSource: string;
};

export type LearnerProfileSummaryDto = {
  id: string;
  version: number;
  status: "provisional" | "verified" | "superseded";
  primaryTrackSlug: string;
  secondaryTrackSlugs: string[];
  selfReportedStage: number;
  provisionalStage: number;
  verifiedStage: number | null;
  stageConfidence: StageConfidence;
  targetStage: number;
  stageGap: number;
  paceClass: PaceClass;
  weeklyEffectiveMinutes: number;
  preferredSessionMinutes: number;
  diagnosticRequired: boolean;
  diagnosticReasonCodes: string[];
  skillEstimates: LearnerSkillEstimateDto[];
  createdAt: string | null;
};

export type FeasibilityDto = {
  state: "feasible" | "slightly_tight" | "intensive_option" | "unrealistic";
  requiredWeeksEstimate: number | null;
  deadlineWeeks: number | null;
  message: string;
  alternatives: string[];
};

export type ProfilePreviewDto = {
  primaryTrackSlug: string;
  secondaryTrackSlugs: string[];
  selfReportedStage: number;
  provisionalStage: number;
  stageConfidence: StageConfidence;
  targetStage: number;
  stageGap: number;
  paceClass: PaceClass;
  weeklyEffectiveMinutes: number;
  preferredSessionMinutes: number;
  skillMap: Array<{
    skillSlug: string;
    provisionalStage: number;
    confidence: StageConfidence;
    exposureLevel: string;
  }>;
  diagnosticRequired: boolean;
  diagnosticReasonCodes: string[];
  feasibility: FeasibilityDto;
  youAreHere: string;
  youWantToReach: string;
  yourPace: string;
};

export type ProfilePreviewResponse = {
  preview: ProfilePreviewDto;
  incompleteFields: string[];
  schemaVersion: number;
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
  learnerProfile?: LearnerProfileSummaryDto | null;
  placement?: {
    required: boolean;
    reasonCodes: string[];
  };
  feasibility?: FeasibilityDto;
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
  /** Safe display metadata only — never scoring weights. */
  profileHint?: string;
};

export type StepVisibleWhen = {
  field: string;
  op: "eq" | "neq" | "includes" | "excludes";
  value: string | string[];
};

export type QuestionnaireUiKind =
  | "options"
  | "schedule"
  | "track-select"
  | "skill-evidence"
  | "capacity"
  | "outcome"
  | "context"
  | "confidence-barriers";

export type QuestionnaireStepDto = {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  selection: "single" | "multi";
  allowOther?: boolean;
  uiKind: QuestionnaireUiKind;
  reviewLabel: string;
  reviewIcon: string;
  options: QuestionnaireOptionDto[];
  scheduleDays?: string[];
  scheduleTimes?: QuestionnaireOptionDto[];
  /** Exposure levels for skill-evidence uiKind. */
  exposureOptions?: QuestionnaireOptionDto[];
  /** Session length choices for capacity uiKind. */
  sessionOptions?: QuestionnaireOptionDto[];
  /** Secondary options for compound screens (outcome deadline, context frequency, barriers). */
  secondaryOptions?: QuestionnaireOptionDto[];
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
  /** Content-pool unit slug when present. */
  unitId?: string | null;
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
  finishedAt?: string | null;
  phases: RoadmapPhaseDto[];
};

export type RoadmapCurrentResponse = {
  job: RoadmapJobDto | null;
  roadmap: RoadmapTreeDto | null;
};

export type RoadmapCompletionSkillSummary = {
  skillSlug: string;
  stage: number;
  target: number;
  status: "mastered" | "partial" | "shaky";
};

export type RoadmapCompletionSummaryDto = {
  roadmapId: string;
  title: string;
  finishedAt: string;
  completionWeeks: number;
  totalLessons: number;
  totalXpEarned: number;
  skillsMastered: number;
  skillsPartial: number;
  skillsShaky: number;
  skillSummary: RoadmapCompletionSkillSummary[];
  badges: string[];
  coachAssessment: {
    ready: boolean;
    recommendation: "new_goal" | "same_goal_advanced" | "top_up" | null;
    rationale: string | null;
    options: Array<{ key: string; label: string }>;
  };
};

export type ChooseNextResponse = {
  redirect?: string;
  jobId?: string;
};

export type ReEnrollmentJobDto = {
  id: string;
  status: "queued" | "processing" | "ready" | "failed";
  trigger: string;
  previousRoadmapId: string;
  newRoadmapId: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
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
  | "chat_message"
  | "incoming_call"
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

export type WeekDayStatusDto =
  | "done"
  | "empty"
  | "today"
  | "current"
  | "completed"
  | "inactive";

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

export type LessonTypeDto =
  | "reading"
  | "video"
  | "practice"
  | "mini_project"
  | "interactive"
  | "quiz";

export type LessonSectionBlockDto = {
  type: "text" | "callout" | "code";
  /** text/callout body copy */
  body?: string;
  /** callout heading */
  title?: string;
  /** code block source */
  code?: string;
  /** code block label (e.g. language or filename) */
  label?: string;
};

export type LessonSectionDto = {
  id: string;
  title: string;
  blocks: LessonSectionBlockDto[];
};

export type LessonReadingBodyDto = {
  objective: string;
  sections: LessonSectionDto[];
  keyTakeaways: string[];
};

export type LessonVideoBodyDto = {
  objective: string;
  note: string;
};

/** practice | mini_project | interactive */
export type LessonTaskBodyDto = {
  objective: string;
  task: string;
  acceptanceCriteria: string[];
  hints?: string[];
  starterHtml?: string;
};

export type LessonQuizQuestionDto = {
  id: string;
  q: string;
  type: "mcq" | "boolean";
  options?: string[];
};

export type LessonQuizBodyDto = {
  objective: string;
  passScore: number;
  questions: LessonQuizQuestionDto[];
};

/** Type-specific unit body — secrets (answer/explain) stripped by server. */
export type LessonPlayBodyDto =
  | LessonReadingBodyDto
  | LessonVideoBodyDto
  | LessonTaskBodyDto
  | LessonQuizBodyDto;

export type LessonQuizAnswerValue = number | boolean;

export type LessonPlayDto = {
  id: string;
  lessonNumber: number;
  title: string;
  missionName: string | null;
  lessonType: LessonTypeDto;
  minutes: number;
  /** Base lesson XP from the roadmap row. */
  xp: number;
  /** Previewed XP after reward rules. */
  xpReward: number;
  objective: string;
  status: "locked" | "available" | "completed";
  provider: string | null;
  url: string | null;
  level: number;
  unitId: string | null;
  contentVersionId?: string;
  rewardRuleVersion?: string;
  attemptId?: string | null;
  serverTime?: string;
  /** Safe unit snapshot context — no private learner profile data. */
  adaptive?: {
    unitRole: string | null;
    servesStage: number[];
    entryAction: string | null;
    skillsTaught: string[];
  };
  body: LessonPlayBodyDto;
  rewardPreview: {
    xp: number;
    gems: number;
    coins: number;
    badgeId?: string;
    badgeLabel?: string;
    arloLine: string;
  };
  progress: {
    status: "not_started" | "in_progress" | "completed";
    contentStep: number;
    practiceDone: boolean;
    quizAnswers: Record<string, LessonQuizAnswerValue>;
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
  done: boolean;
};

export type LessonCheckQuizResponse = {
  questionId: string;
  correct: boolean;
  /** Correct answer — option index (mcq) or boolean. */
  answer: LessonQuizAnswerValue;
  explain: string | null;
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
  roadmapCompleted?: boolean;
  roadmapId?: string | null;
};

export type LessonArloChatResponse = {
  reply: string;
  source: "ai" | "stub";
};
