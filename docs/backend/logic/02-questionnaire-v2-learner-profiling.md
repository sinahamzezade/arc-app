# 02 — Question Engine v2: Learner Profiling, Placement & Roadmap Contract

**Version:** 2.0 proposed replacement for the previous questionnaire specification  
**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arc iOS/PWA onboarding, Review Answers screen, Learner Profile, Roadmap Generator, Weekly Planner, Notifications, Arlo Coach  
**Upstream:** Authentication and onboarding  
**Downstream:** Learning Document Pool, Placement Assessment, Roadmap Generator, Course Timing, Weekly Plan, Arlo Coach

---

## 0. Important product correction

The questionnaire is not only a form that stores ten answers and forwards tokens to the Roadmap Generator.

Its real purpose is to build a structured **Learner Profile** that answers four questions:

1. **Where is the user now?**
2. **Where does the user want to reach?**
3. **How much sustainable study capacity does the user have?**
4. **What kind of roadmap, content difficulty, lesson format, pace, reminders, and support should Arc provide?**

The corrected flow is:

```text
Raw questionnaire answers
  → validated answer tokens
  → learner-profile derivation
  → current-stage estimate
  → target-stage decision
  → per-skill gap map
  → capacity and schedule model
  → placement-confidence decision
  → roadmap-generation contract
  → personalized roadmap + weekly plan
```

The Review Answers screen must therefore show more than raw answers. It must also show a user-friendly profile summary:

```text
YOU ARE HERE
Stage 2 — Medium
Strongest skill: Excel
Needs foundations: SQL and Python

YOU WANT TO REACH
Stage 5 — Job-ready Specialist
Target role: Data Analyst

YOUR REALISTIC PACE
4 hours/week
Tuesday and Thursday evenings
Estimated initial plan: 24–28 weeks
```

Core rule:

> Questionnaire answers create a provisional learner profile. Verified learning performance and placement assessments can later correct that profile without deleting completed progress.

---

## 1. Comparison with the previous questionnaire specification

| Area | Previous behavior | Corrected behavior in v2 |
|---|---|---|
| Main output | Answer tokens and a `goals` row | Versioned Learner Profile plus goal and roadmap input snapshot |
| Knowledge level | General confidence token | Explicit current-stage estimate and per-skill mastery estimates |
| Reliability | Self-report treated as sufficient input | Self-report is provisional and may require placement validation |
| Destination | Target role and deadline | Target role, target outcome, and target knowledge stage |
| Time availability | Raw weekly-hours and schedule tokens | Effective weekly capacity, session capacity, pace class, and feasibility result |
| Roadmap connection | Roadmap reads tokens and prunes known skills | Roadmap receives entry stage, exit stage, skill gaps, verification confidence, pace, and format policy |
| Review screen | Displays answers | Displays answers plus “You are here / You want to reach / Your pace” profile preview |
| Skill handling | Selected skills only | Per-skill exposure depth and provisional mastery |
| Stage mismatch | Not handled | Mandatory placement check when answers conflict |
| Reassessment | Re-submit or overwrite | Versioned profile revision and safe roadmap replan |
| Existing progress | Not explicitly protected | Completed lessons, rewards, streak history, and project evidence are preserved |

The useful parts of the previous specification remain:

- backend-owned schema and options
- draft save and resume
- server-side validation
- data-driven branching
- mandatory onboarding gate
- versioned questionnaire definitions
- asynchronous roadmap generation

---

## 2. System boundaries

### 2.1 Question Engine owns

- question definitions and options
- branching rules
- draft and submitted answers
- validation
- answer review labels
- profiling-signal metadata attached to options
- initial learner-profile derivation
- current-stage provisional estimate
- target-stage derivation
- capacity and preference extraction
- profile versioning
- roadmap-generation request payload

### 2.2 Placement Assessment owns

- adaptive knowledge questions
- practical skill checks
- verified stage
- verified per-skill mastery
- confidence correction after evidence

### 2.3 Roadmap Generator owns

- selecting content from the Learning Document Pool
- choosing entry nodes and exit nodes
- ordering lessons and prerequisites
- inserting validation checkpoints
- sizing the roadmap to the user’s capacity
- generating a user-specific roadmap instance

### 2.4 Weekly Plan / Course Timing owns

- distributing roadmap tasks across weeks
- calculating actual scheduled sessions
- reminders and rescheduling
- missed-task recovery
- target-date recalculation from real activity

### 2.5 AI Coach owns

- motivational language based on the user’s reasons
- contextual support based on blockers
- ongoing replanning from observed behavior
- explanations and recovery coaching

Hard boundary:

> The Question Engine must not contain SQL, React, Marketing, or other curriculum trees. It emits structured profile signals. The Skill Graph and Content Pool decide which content those signals select.

---

## 3. Corrected onboarding flow

```text
Authentication
  → email verification
  → questionnaire intro
  → ten top-level profiling screens
  → Review Answers + Learner Profile Preview
  → confirm profile
  → save submitted response
  → create provisional learner profile
  → decide whether placement is required
  → request roadmap generation
  → plan-ready screen
  → optional/required placement checkpoint
  → verified learner profile
  → roadmap revision when necessary
  → weekly plan activation
  → Home Dashboard
```

The product may keep exactly ten visible top-level screens. A screen may contain progressive sub-questions. For example, the Skills screen can ask both selected skills and exposure depth without becoming a separate top-level page.

---

## 4. Canonical ten-question model

## Q1. Target Track

**Question:** What do you want to learn or become?

Captures:

- target role
- target subject or track
- primary track
- optional secondary interests

Example tokens:

- `data-analyst`
- `front-end-developer`
- `back-end-developer`
- `marketing-specialist`

Roadmap effect:

- selects the role recipe
- selects the relevant skill graph
- determines mandatory role milestones

---

## Q2. Motivation

**Question:** Why is this important to you?

Examples:

- change career
- perform better in current job
- get promoted
- build a portfolio
- prepare for interviews
- learn for personal interest
- earn more

Roadmap and Coach effect:

- changes coaching messages
- prioritizes portfolio, interview, or workplace examples
- influences reminder wording
- does **not** change the user’s knowledge score

Privacy rule:

- motivation is private
- it is never shown on public profiles
- it never affects League score or rank unfairly

---

## Q3. Current Context

**Question:** What is your current work or study situation?

Captures:

- current role
- student / employed / unemployed / career switcher
- whether the target subject is used at work
- frequency of real-world use

Example use-frequency tokens:

- `never_used`
- `personal_projects`
- `studied_before`
- `work_sometimes`
- `work_regularly`

Profiling effect:

- contributes a limited evidence signal to current stage
- personalizes examples and projects
- must not be treated as proof of mastery by itself

Fairness rule:

> Employment status must never lower the user’s learning potential or block advanced content.

---

## Q4. Existing Skills & Evidence Depth

**Question:** Which skills do you already have, and how independently can you use them?

A selected skill must include an exposure level:

```ts
type SkillEvidenceAnswer = {
  skillSlug: string;
  exposureLevel:
    | "heard_of"
    | "follow_with_help"
    | "use_independently"
    | "use_professionally";
};
```

Example:

```json
[
  { "skillSlug": "excel", "exposureLevel": "use_independently" },
  { "skillSlug": "sql", "exposureLevel": "follow_with_help" },
  { "skillSlug": "python", "exposureLevel": "heard_of" }
]
```

Why this is necessary:

- selecting “SQL” alone does not tell Arc whether the user has only heard of SQL or can write complex queries
- per-skill depth allows the roadmap to start SQL at Stage 1 while starting Excel at Stage 3

Roadmap effect:

- builds per-skill entry estimates
- skips content only when evidence confidence is sufficient
- otherwise replaces skipped content with a short checkpoint or refresher

---

## Q5. Current Knowledge Stage — Self Assessment

**Question:** Which description best matches your current level in this subject?

| Stage | UI label | Description |
|---:|---|---|
| 1 | Beginner | I am new or need to start from the basics. |
| 2 | Medium | I understand basic ideas but still need guidance. |
| 3 | Pro | I can complete standard tasks independently. |
| 4 | Advanced | I can solve complex problems and build complete projects. |
| 5 | Job-ready Specialist | I can produce professional results and want gap-focused mastery. |

This answer is a **self estimate**, not verified truth.

The backend stores:

- `self_reported_stage`
- `provisional_stage`
- `verified_stage` nullable
- `stage_confidence`

---

## Q6. Weekly Study Capacity

**Question:** How much time can you realistically study each week?

Capture both:

- weekly time range or exact minutes
- preferred session length

Example:

```json
{
  "weeklyHoursToken": "3-5",
  "preferredSessionMinutes": 30
}
```

The wording must emphasize realistic commitment, not ideal ambition.

Capacity effect:

- controls lesson count per week
- controls session size
- controls target-date feasibility
- does not change lesson difficulty or mastery requirements

---

## Q7. Preferred Days and Time Windows

**Question:** Which days and times normally work best?

```json
{
  "days": ["tue", "thu", "sat"],
  "timeWindows": ["evening"],
  "timezone": "Europe/Berlin"
}
```

Schedule effect:

- creates initial weekly-plan windows
- provides notification windows
- supports daylight-saving-safe reminders
- does not automatically create calendar events without user consent

---

## Q8. Target Outcome and Deadline

**Question:** What result do you want, and when do you want to reach it?

Target outcome maps to target stage:

| Outcome | Default target stage |
|---|---:|
| Understand the basics | 2 — Medium |
| Use the skill independently | 3 — Pro |
| Build advanced real projects | 4 — Advanced |
| Become job-ready / change career | 5 — Job-ready Specialist |

The user also selects a target deadline:

- 1–3 months
- 3–6 months
- 6–12 months
- 12+ months
- no fixed deadline

Rule:

> Deadline changes pace, not proof requirements. Arc must not silently remove mandatory lessons or assessments simply to promise an unrealistic date.

---

## Q9. Learning Style

**Question:** How do you learn best?

Examples:

- hands-on practice
- guided examples
- video
- audio
- reading
- quizzes
- projects

Roadmap effect:

- changes the format mix
- never removes required practical or assessment evidence

Example policy:

```json
{
  "practice": 0.35,
  "guidedExample": 0.2,
  "video": 0.15,
  "reading": 0.15,
  "quiz": 0.15
}
```

---

## Q10. Confidence and Learning Barriers

**Question:** How confident are you, and what usually makes learning difficult?

Examples:

- lack of time
- unclear plan
- content is too difficult
- content is too easy
- motivation drops
- interruptions
- fear of failure
- language difficulty

Effects:

- confidence contributes only a small calibration signal
- blockers influence reminders, session size, recovery flow, and Arlo coaching
- blockers do not lower the user’s knowledge stage

---

## 5. Learner Profile model

The questionnaire must create a versioned learner-profile snapshot.

## 5.1 Overall profile

```ts
type LearnerProfileSnapshot = {
  id: string;
  userId: string;
  questionnaireResponseId: string;
  version: number;
  status: "provisional" | "verified" | "superseded";

  primaryTrackSlug: string;
  secondaryTrackSlugs: string[];

  selfReportedStage: 1 | 2 | 3 | 4 | 5;
  provisionalStage: 1 | 2 | 3 | 4 | 5;
  verifiedStage?: 1 | 2 | 3 | 4 | 5;
  stageScore: number;
  stageConfidence: "low" | "medium" | "high";

  targetStage: 2 | 3 | 4 | 5;
  stageGap: number;

  weeklyDeclaredMinutes: number;
  weeklyEffectiveMinutes: number;
  preferredSessionMinutes: number;
  preferredDays: string[];
  preferredTimeWindows: string[];
  timezone: string;
  paceClass: "light" | "balanced" | "focused" | "intensive";

  motivationTags: string[];
  learningStyleWeights: Record<string, number>;
  blockerTags: string[];

  diagnosticRequired: boolean;
  diagnosticReasonCodes: string[];
  profilingModelVersion: string;

  createdAt: string;
};
```

## 5.2 Per-skill estimates

A single overall stage is useful for UI, but the roadmap must use per-skill estimates.

```ts
type LearnerSkillEstimate = {
  profileId: string;
  skillSlug: string;
  selfExposureLevel: string;
  provisionalStage: 1 | 2 | 3 | 4 | 5;
  verifiedStage?: 1 | 2 | 3 | 4 | 5;
  confidence: "low" | "medium" | "high";
  evidenceSource: "questionnaire" | "placement" | "lesson_performance" | "project";
};
```

Example:

```json
{
  "overallStage": 2,
  "skillEstimates": [
    { "skillSlug": "excel", "provisionalStage": 3, "confidence": "medium" },
    { "skillSlug": "sql", "provisionalStage": 1, "confidence": "medium" },
    { "skillSlug": "python", "provisionalStage": 1, "confidence": "low" }
  ]
}
```

This means the user can receive:

- an Excel validation checkpoint instead of full beginner lessons
- complete SQL foundations
- complete Python foundations

---

## 6. Stage derivation logic

## 6.1 Signal weights

The provisional score is calculated only from available signals and normalized to 100.

| Signal | Maximum weight |
|---|---:|
| Self-reported overall stage | 30% |
| Per-skill evidence depth | 40% |
| Real-world/study context | 15% |
| Confidence calibration | 5% |
| Verified prior evidence, when available | 10% |

Formula:

```text
provisional_score =
  sum(signal_value × signal_weight for available signals)
  / sum(available signal weights)
```

Confidence may move the score by at most 5 points. A confident beginner must not be classified as advanced without evidence.

## 6.2 Signal values

### Self-reported stage

| Answer | Score |
|---|---:|
| Stage 1 | 10 |
| Stage 2 | 30 |
| Stage 3 | 50 |
| Stage 4 | 70 |
| Stage 5 | 90 |

### Skill exposure

| Exposure | Score |
|---|---:|
| Heard of it | 15 |
| Can follow with help | 35 |
| Can use independently | 65 |
| Use professionally | 85 |

### Current use context

| Context | Score |
|---|---:|
| Never used | 0 |
| Personal exploration | 25 |
| Formal study/course | 40 |
| Used sometimes at work | 65 |
| Used regularly at work | 85 |

## 6.3 Score-to-stage map

| Score | Provisional stage |
|---:|---|
| 0–19 | Stage 1 — Beginner |
| 20–39 | Stage 2 — Medium |
| 40–59 | Stage 3 — Pro |
| 60–79 | Stage 4 — Advanced |
| 80–100 | Stage 5 — Job-ready Specialist |

## 6.4 Confidence calculation

Set `stageConfidence = high` only when:

- at least three signal groups are present
- signal spread is no more than 20 points
- no major contradiction exists

Set `medium` when:

- at least two signal groups are present
- spread is no more than 35 points

Set `low` when:

- stage is based mostly on self-report
- signals disagree by more than 35 points
- selected skills have no depth information
- user claims Stage 4 or 5 with no supporting evidence

---

## 7. Placement-assessment policy

Questionnaire profiling is provisional.

## 7.1 Placement is mandatory when

- provisional Stage is 3 or higher and Arc plans to skip foundational content
- self-reported stage and evidence-derived stage differ by more than one stage
- stage confidence is low
- the user selects “use professionally” without enough supporting context
- the user requests a job-ready or advanced target but no reliable current level is available
- the user edits their target track after making roadmap progress

## 7.2 Placement may be lightweight when

- user is clearly Stage 1
- no content will be skipped
- first foundation lesson can safely act as the diagnostic

## 7.3 Placement result

```json
{
  "verifiedOverallStage": 2,
  "verifiedSkillStages": {
    "excel": 3,
    "sql": 1,
    "python": 1
  },
  "confidence": "high",
  "roadmapRevisionRequired": true
}
```

The verified stage supersedes the provisional stage for future planning.

Completed lessons, XP, rewards, streak history, notes, and projects remain unchanged.

---

## 8. Study-capacity model

## 8.1 Declared capacity

Decode the selected weekly range to minutes:

| Token | Declared minutes/week |
|---|---:|
| `lt-3` | 120 |
| `3-5` | 240 |
| `5-8` | 390 |
| `8-12` | 600 |
| `gt-12` | 840 |

## 8.2 Schedule capacity

```text
schedule_capacity = selected_days × preferred_session_minutes
```

## 8.3 Effective planning capacity

Use a sustainability buffer:

```text
effective_weekly_minutes =
  min(declared_capacity, schedule_capacity when available)
  × 0.80
```

The 20% buffer reduces unrealistic plans and supports normal missed days.

## 8.4 Pace classes

| Effective minutes/week | Pace class |
|---:|---|
| under 150 | Light |
| 150–300 | Balanced |
| 301–540 | Focused |
| above 540 | Intensive |

More study time means:

- more content can be scheduled per week
- project milestones can arrive sooner
- the completion estimate becomes shorter

It does **not** mean:

- required assessments disappear
- users skip prerequisites without evidence
- advanced content is given before readiness

---

## 9. Deadline-feasibility logic

The Content Pool exposes required estimated minutes between the user’s entry point and target stage.

```text
estimated_weeks =
  ceil(required_content_minutes / effective_weekly_minutes)
```

### Feasibility states

| Difference from requested deadline | Result |
|---|---|
| Plan fits | `feasible` |
| Up to 10% longer | `slightly_tight` |
| 11–25% longer | `intensive_option` |
| More than 25% longer | `unrealistic_without_change` |

When the requested deadline is unrealistic, Arc must offer explicit choices:

1. extend the deadline
2. increase weekly study time
3. choose a lower target stage
4. keep the goal and accept the realistic estimate

Arc must not silently remove job-critical content.

---

## 10. Roadmap-generation contract

The Roadmap Generator must receive a stable profile snapshot ID, not re-interpret UI copy.

```ts
type RoadmapGenerationProfile = {
  learnerProfileId: string;
  profilingModelVersion: string;
  primaryTrackSlug: string;

  currentOverallStage: number;
  currentStageSource: "provisional" | "verified";
  currentStageConfidence: string;
  targetStage: number;

  skillEstimates: Array<{
    skillSlug: string;
    stage: number;
    confidence: string;
  }>;

  capacity: {
    effectiveWeeklyMinutes: number;
    preferredSessionMinutes: number;
    days: string[];
    timeWindows: string[];
    timezone: string;
    paceClass: string;
  };

  preferences: {
    learningStyleWeights: Record<string, number>;
    motivationTags: string[];
    blockerTags: string[];
  };

  placement: {
    required: boolean;
    reasonCodes: string[];
  };

  targetDeadline?: string;
};
```

## 10.1 Content-selection algorithm

```text
1. Resolve role recipe from primary track.
2. Load all required skill nodes for the target stage.
3. Determine entry stage per skill.
4. Determine exit stage per skill and role requirement.
5. For verified mastered nodes:
     omit or mark completed-by-assessment.
6. For provisional mastered nodes:
     insert validation checkpoint or condensed refresher.
7. For low-confidence nodes:
     include foundations or placement task.
8. Preserve all mandatory projects, challenges, and role proof.
9. Prefer lesson formats matching learning-style weights.
10. Size weekly delivery to effective capacity.
11. Insert recovery buffer and review checkpoints.
12. Persist the input profile snapshot in roadmap generation metadata.
```

## 10.2 Stage-based content policy

| Current stage | Default roadmap treatment |
|---:|---|
| 1 — Beginner | Full foundations, guided examples, short practice, frequent checks |
| 2 — Medium | Condensed foundations plus core independent practice |
| 3 — Pro | Core/advanced practice, projects, minimal verified refresher |
| 4 — Advanced | Complex projects, architecture/strategy, interview and portfolio gaps |
| 5 — Job-ready Specialist | Gap-only path, validation, specialization, portfolio/interview polish |

## 10.3 Target-stage exit policy

| Target stage | Required outcome |
|---:|---|
| 2 | Explain basics and complete guided exercises |
| 3 | Complete standard tasks independently |
| 4 | Build and explain advanced projects |
| 5 | Pass role assessments and complete job-ready portfolio/interview proof |

---

## 11. Review Answers and Profile Preview

Before submission, the frontend calls a preview endpoint.

```text
POST /api/v1/questionnaire/profile-preview
```

Request:

```json
{
  "answers": {}
}
```

Response:

```json
{
  "answersReview": [
    { "label": "Goal", "value": "Data Analyst" },
    { "label": "Study Time", "value": "3–5 hours/week" }
  ],
  "profilePreview": {
    "currentPosition": {
      "stage": 2,
      "label": "Medium",
      "confidence": "medium",
      "summary": "You understand some foundations but still need guided SQL and Python practice."
    },
    "destination": {
      "stage": 5,
      "label": "Job-ready Specialist",
      "targetRole": "Data Analyst"
    },
    "skillMap": [
      { "skill": "Excel", "stage": 3 },
      { "skill": "SQL", "stage": 1 },
      { "skill": "Python", "stage": 1 }
    ],
    "capacity": {
      "effectiveWeeklyMinutes": 192,
      "preferredDays": ["Tue", "Thu"],
      "timeWindow": "Evening",
      "paceClass": "Balanced"
    },
    "estimatedPlan": {
      "weeksMin": 24,
      "weeksMax": 28,
      "feasibility": "feasible"
    },
    "placement": {
      "required": true,
      "message": "A short placement check will confirm which Excel lessons you can skip."
    }
  }
}
```

Rules:

- preview does not persist the final profile
- profile language must be supportive and non-judgmental
- clearly label the current stage as an estimate until verified
- user can edit any answer before confirmation

---

## 12. Data model

## 12.1 Existing questionnaire tables retained

- `questionnaire_definitions`
- `questionnaire_steps`
- `questionnaire_options`
- `questionnaire_responses`

Add to `questionnaire_options`:

| Column | Type | Purpose |
|---|---|---|
| `profile_signal` | jsonb nullable | Generic scoring and profile metadata |

Example:

```json
{
  "dimension": "skill_evidence",
  "skillSlug": "sql",
  "signalValue": 65,
  "evidenceStrength": 0.7
}
```

## 12.2 `learner_profile_snapshots`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `questionnaire_response_id` | uuid FK | |
| `goal_id` | uuid FK | |
| `version` | int | Monotonic per user |
| `status` | enum | provisional, verified, superseded |
| `primary_track_slug` | varchar | |
| `secondary_track_slugs` | text[] | |
| `self_reported_stage` | smallint | 1–5 |
| `provisional_stage` | smallint | 1–5 |
| `verified_stage` | smallint nullable | 1–5 |
| `stage_score` | numeric | 0–100 |
| `stage_confidence` | enum | low, medium, high |
| `target_stage` | smallint | 2–5 |
| `weekly_declared_minutes` | int | |
| `weekly_effective_minutes` | int | |
| `preferred_session_minutes` | int | |
| `pace_class` | enum | light, balanced, focused, intensive |
| `availability` | jsonb | days, windows, timezone |
| `learning_style_weights` | jsonb | |
| `motivation_tags` | text[] | Private |
| `blocker_tags` | text[] | Private |
| `diagnostic_required` | boolean | |
| `diagnostic_reason_codes` | text[] | |
| `profiling_model_version` | varchar | e.g. `learner_profile_v2` |
| `input_snapshot` | jsonb | normalized inputs |
| `created_at` | timestamptz | |

Unique:

```text
UNIQUE(user_id, version)
```

Only one non-superseded active profile per user.

## 12.3 `learner_skill_estimates`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK | |
| `skill_slug` | varchar | Skill Graph token |
| `provisional_stage` | smallint | 1–5 |
| `verified_stage` | smallint nullable | |
| `confidence` | enum | low, medium, high |
| `evidence_source` | enum | questionnaire, placement, lesson, project |
| `evidence_meta` | jsonb | Private audit |

Unique:

```text
UNIQUE(profile_id, skill_slug)
```

## 12.4 `placement_assessments`

Owned by the Placement/Assessment module, linked to:

- learner profile ID
- track/skill
- question set version
- result stage
- confidence
- completion time
- roadmap revision status

---

## 13. API contracts

Base path:

```text
/api/v1/questionnaire
```

## 13.1 `GET /schema`

Returns the backend-owned ten-screen schema, branching, validation, review labels, and profile-signal metadata safe for frontend use.

Do not expose internal scoring weights that could make placement easy to manipulate.

## 13.2 `GET /`

Returns current draft/submitted response and current learner-profile summary.

## 13.3 `PUT /`

Saves draft answers.

- soft validation
- no final profile
- no roadmap generation
- profile preview may be recalculated on demand

## 13.4 `POST /profile-preview`

- strict-enough validation for visible completed fields
- derives non-persistent profile preview
- returns current position, destination, capacity, feasibility, and placement recommendation

## 13.5 `POST /submit`

Transaction and outbox flow:

```text
1. Lock current questionnaire response.
2. Strictly validate all visible required fields.
3. Save immutable submitted response version.
4. Upsert goal version.
5. Derive provisional learner profile.
6. Insert per-skill estimates.
7. Mark questionnaire onboarding completed.
8. Create roadmap-generation job with learnerProfileId.
9. Create placement-assessment requirement when needed.
10. Write questionnaire.submitted.v2 and learner_profile.created.v1 to outbox.
11. Commit.
```

Example response:

```json
{
  "questionnaire": {
    "status": "submitted",
    "schemaVersion": 2
  },
  "learnerProfile": {
    "id": "uuid",
    "version": 1,
    "status": "provisional",
    "currentStage": 2,
    "targetStage": 5,
    "stageConfidence": "medium",
    "diagnosticRequired": true
  },
  "roadmap": {
    "status": "queued",
    "jobId": "uuid"
  }
}
```

## 13.6 `GET /profile`

Returns the current private learner profile and skill map.

## 13.7 `POST /reassess`

Used when:

- user changes target
- user believes the stage is wrong
- long inactivity makes profile stale
- performance strongly contradicts the profile

Creates a new profile revision or placement assessment. It never overwrites audit history.

---

## 14. Events

Questionnaire emits:

- `questionnaire.draft_saved.v1`
- `questionnaire.submitted.v2`
- `learner_profile.created.v1`
- `placement.required.v1`
- `roadmap.generation_requested.v2`
- `learner_profile.revision_requested.v1`

Placement emits:

- `placement.completed.v1`
- `learner_profile.verified.v1`
- `roadmap.replan_requested.v1`

Consumers must deduplicate by event ID.

---

## 15. Roadmap revision after verified placement

If placement confirms the profile:

- mark the profile verified
- keep the existing roadmap
- unlock validated skipped nodes where appropriate

If placement changes the stage:

```text
1. Preserve all completed lesson and project rows.
2. Create a new learner-profile version.
3. Generate a roadmap revision from the next safe boundary.
4. Archive only future unstarted roadmap items that are replaced.
5. Keep XP, Gems, Coins, badges, streaks, notes, and history.
6. Recalculate weekly plan from future dates only.
7. Cancel outdated reminders by schedule version.
```

---

## 16. Profile freshness and continuous correction

The questionnaire creates the first profile, but Arc should improve it from behavior.

Update evidence from:

- placement results
- quiz accuracy
- practice independence
- hint usage
- solution reveals
- challenge results
- project quality
- lesson completion speed
- repeated struggle or repeated easy completion

Rules:

- observed behavior changes `verified_stage`, not historical answers
- never reduce stage after one bad lesson
- use multiple evidence points and confidence thresholds
- stage adjustments should be explainable to the user
- major changes trigger a safe replan, not silent content deletion

Implemented lesson-performance rule:

- strong completion means no remediation plus either quiz score ≥80% or a completed practice/proof task
- strong completion raises the matching skill estimate's `provisionalStage` by at most 1, capped at `targetStage`
- a strong `checkpoint` quiz also raises that skill's `verifiedStage` to the proven stage (capped by the unit's `serves_stage` and the target stage) and sets confidence to `high`
- shaky evidence (remediation used or quiz score <70%) lowers confidence only; it never lowers provisional or verified stage by itself
- after skill estimates change, the active profile refreshes its aggregate `provisionalStage`, `verifiedStage`, and `stageGap` from the estimate set; historical questionnaire answers remain unchanged
- the full placement-assessment module in §7 / §12.4 is still separate from this lesson-evidence loop; today `reassess` creates a new provisional revision and marks `diagnosticRequired`

---

## 17. Migration from the old questionnaire model

For users who completed schema v1:

```text
1. Keep the existing questionnaire response unchanged.
2. Create learner_profile_snapshot version 1 from available fields.
3. Convert selected skills to low/medium-confidence estimates.
4. Use confidence only as a weak signal.
5. Set diagnostic_required = true when current stage cannot be inferred.
6. Keep the existing roadmap active.
7. Add a placement checkpoint at the next safe roadmap boundary.
8. Replan only after verified evidence and user-visible explanation.
```

Do not force existing users to repeat the full questionnaire unless essential fields are missing.

---

## 18. Security, privacy, fairness, and explainability

- questionnaire and learner profile are private user data
- motivation and blockers must not appear on public profiles
- current employment must not restrict access to advanced learning
- confidence must never be treated as mastery
- raw scoring weights remain server-side
- all free text is length-limited and sanitized
- all submitted profile versions are auditable
- users can see why Arc estimated their stage in plain language
- users can request reassessment
- users cannot directly submit `provisionalStage`, `verifiedStage`, or `stageScore`
- roadmap jobs accept only server-created profile snapshot IDs
- client cannot claim known skills to bypass mandatory proof without verification

---

## 19. Error codes

| Code | Meaning |
|---|---|
| `QUESTIONNAIRE_VALIDATION_ERROR` | Invalid or incomplete visible answer |
| `QUESTIONNAIRE_SCHEMA_STALE` | Draft uses an incompatible schema version |
| `PROFILE_PREVIEW_INCOMPLETE` | Not enough answers for preview |
| `PROFILE_DERIVATION_FAILED` | Server could not derive profile |
| `PROFILE_VERSION_CONFLICT` | Concurrent update/revision |
| `TARGET_BELOW_CURRENT_STAGE` | Target needs confirmation or alternative path |
| `DEADLINE_NOT_FEASIBLE` | Requested outcome cannot fit current capacity |
| `PLACEMENT_REQUIRED` | Verification needed before content can be skipped |
| `ROADMAP_GENERATION_FAILED` | Generation job failed |
| `UNAUTHORIZED` | Missing/invalid authentication |

---

## 20. Testing requirements

### Unit tests

- answer validation by active schema
- branch visibility
- stage score calculation
- missing-signal normalization
- score-to-stage boundaries
- confidence calculation
- per-skill estimate derivation
- target-stage mapping
- capacity calculation
- deadline feasibility
- diagnostic-required rules
- profile versioning

### Integration tests

- schema → draft → preview → submit → profile → roadmap job
- mismatch causes placement requirement
- high-confidence beginner receives foundation path
- advanced claim cannot skip content without verification
- per-skill stages create different entry points
- impossible deadline returns explicit alternatives
- resubmission creates a new profile version
- verified placement triggers safe replan
- completed progress survives replan

### End-to-end examples

#### Beginner with limited time

```text
Stage 1 + 2 hours/week + job-ready target
  → full foundations
  → light pace
  → realistic long timeline
  → short guided lessons
```

#### Medium user with strong Excel but weak SQL

```text
Overall Stage 2
Excel Stage 3 provisional
SQL Stage 1
  → Excel checkpoint
  → SQL foundations
  → no global skip based on Excel strength
```

#### Advanced self-claim without evidence

```text
Self Stage 4 + low evidence
  → low confidence
  → placement required
  → provisional roadmap with locked advanced skip decisions
```

---

## 21. Implementation checklist

- [ ] Add schema version 2
- [ ] Add explicit self-stage and target-outcome fields
- [ ] Add per-skill exposure depth
- [ ] Add preferred session duration
- [ ] Add `profile_signal` metadata to questionnaire options
- [ ] Create `LearnerProfilingService`
- [ ] Create `learner_profile_snapshots`
- [ ] Create `learner_skill_estimates`
- [ ] Add `POST /profile-preview`
- [ ] Add stage and confidence derivation
- [ ] Add capacity and feasibility calculation
- [ ] Pass `learnerProfileId` to Roadmap Generator
- [ ] Add placement requirement workflow
- [ ] Add versioned reassessment and safe replan
- [ ] Add migration for schema-v1 users
- [ ] Add privacy-filtered learner profile API
- [ ] Add unit/integration/e2e tests

---

## 22. Acceptance criteria

The revised questionnaire is accepted only when:

- the backend still owns all question copy, options, branching, and validation
- the user can save and resume a draft
- the product can keep ten top-level questionnaire screens
- the Review screen shows both answers and a derived profile preview
- the profile clearly shows “where the user is” and “where the user wants to reach”
- the system stores self-reported, provisional, and verified stages separately
- stages use the five-level model defined in this document
- the system creates per-skill estimates, not only one global level
- confidence alone cannot classify mastery
- contradictory answers trigger placement validation
- roadmap generation receives a versioned learner-profile snapshot
- current stage controls roadmap entry points
- target stage controls roadmap exit requirements
- study capacity controls pacing and weekly content volume
- deadline does not silently remove required proof
- learning style changes format preference but not completion standards
- motivation and blockers personalize coaching without affecting competitive scoring
- verified placement can safely revise the roadmap
- completed progress and rewards survive all profile revisions
- old questionnaire users can migrate without repeating the full interview
- every stage and roadmap decision is auditable and explainable
