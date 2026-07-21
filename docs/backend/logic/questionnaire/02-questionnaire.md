# 02 — Question Engine (Questionnaire / Goal Interview)

**Version:** 2.0 integrated  
**Integration:** Submission creates a versioned goal and an outbox request for Roadmap generation. Course Timing starts only after a valid roadmap is generated.

**Engine:** Question Engine (1 of 4 — see [README](../README.md))  
**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arc Next.js PWA (`arc-app`)  
**Product source:** `src/doc/Arc_MVP_Full_Technical_Roadmap.md` § Goal Interview, § `goals`, § `create_goal` / `generate_roadmap`  
**Source of truth for questions:** DB tables `questionnaire_definitions` / `questionnaire_steps` / `questionnaire_options` (seeded from `arc-backend/src/questionnaire/schema/seed-data.ts`)  
**Frontend:** fetches schema via API; maps icon keys → Lucide only (`src/lib/questionnaire/icons.ts`)  
**Downstream:** [03 — Skill Graph, Roadmap Generator & AI Coach](../roadmaps/03-goals-and-roadmap.md)

Backend owns **all question copy, options, selection rules, branching, and review labels** in the database. Frontend must not hardcode step lists.

---

## 0. Place in the four-engine system

| Engine              | This doc? | Role                                                               |
| ------------------- | --------- | ------------------------------------------------------------------ |
| **Question Engine** | **Yes**   | Adaptive questions + branching → validated answer tokens → `goals` |
| Skill Graph Engine  | No (03)   | Domain content DAG (skills / lessons / assessments)                |
| Roadmap Generator   | No (03)   | One-shot plan from `goals` + skill graph                           |
| AI Coach            | No (03)   | Ongoing roadmap updates from progress                              |

**Hard boundary:** Question Engine does **not** know React vs Marketing curricula. It only emits tokens (`front-end-developer`, `html-css`, `5-8`, …). Roadmap Generator + Skill Graph turn those into a path. Adding SEO / DevOps / AI domains = new question options (optional) + skill-graph content — **not** new questionnaire business logic.

```
/questionnaire/*  →  Question Engine (schema + draft + submit)
                         │
                         ├─ upsert goals (tokens)
                         └─ enqueue Roadmap Generator(goal_id)   ← handoff only
```

---

## 1. Goal

Ship APIs so the web app can:

1. Load questionnaire schema (steps, titles, options, schedule config, **branch rules**)
2. Save questionnaire answers (draft + final submit)
3. Resume in-progress answers after reload
4. Validate answers server-side against **schema-derived** allowed values
5. **Skip / show steps via branching** from prior answers (`visibleWhen`)
6. Create a `goals` row from structured answers
7. Trigger Roadmap Generator after final submit (enqueue only — no curriculum logic here)
8. Expose onboarding/questionnaire status for bootstrap routing
9. **Force incomplete users back into the questionnaire** after login (mandatory intake)

Flow:

```
/onboarding → /questionnaire → GET schema + GET answers
  → /questionnaire/1…N (visible steps only; schema.totalSteps = catalog count)
  → /questionnaire/review → POST submit → Roadmap Generator job
  → generation state → Course Timing + Weekly Plan → /home
```

**Mandatory gate:** if `profile.questionnaireStatus !== "completed"`, login and any app route (home, learn, …) redirect to `/questionnaire` (or `/onboarding` first if roles missing). Funnel paths `/onboarding` + `/questionnaire/*` stay reachable until complete.

---

## 2. Modules (NestJS) — Question Engine

```
questionnaire/                     # Question Engine
  questionnaire.module.ts
  questionnaire.controller.ts
  questionnaire.service.ts         # draft/submit; upsert goals; enqueue only
  questionnaire-schema.service.ts  # load/seed/cache definition
  questionnaire.validation.ts
  branching.ts                     # visibleWhen evaluation
  schema/
    seed-data.ts                   # boot seed for v1
    schema.types.ts
  entities/
    questionnaire-definition.entity.ts
    questionnaire-step.entity.ts   # includes visible_when jsonb
    questionnaire-option.entity.ts
    questionnaire-response.entity.ts
  …
```

**Must not import:** `skill-graph/`, `coach/`. May import `roadmaps/` only for `enqueueGenerate(goalId)`.

Bump `QUESTIONNAIRE_SCHEMA_VERSION` when options/copy/branch rules change in a breaking way.

---

## 3. Relationship to auth / profile

Prerequisite: user authenticated (`JwtAuthGuard`) on all questionnaire routes including schema.

Profile flags:

| Column                       | Type                   | Notes                                         |
| ---------------------------- | ---------------------- | --------------------------------------------- |
| `questionnaire_status`       | `enum`                 | `not_started` \| `in_progress` \| `completed` |
| `questionnaire_completed_at` | `timestamptz` nullable |                                               |
| `onboarding_completed_at`    | `timestamptz` nullable |                                               |

Exposed on `GET /me` profile payload.

---

## 4. Data model

### 4.1 Question catalog (source of truth)

| Table                       | Purpose                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `questionnaire_definitions` | Versioned schema (`version`, `is_active`)                                                                                                   |
| `questionnaire_steps`       | Steps: `field_key`, `step_number`, title/subtitle, `selection`, `allow_other`, `ui_kind`, review labels, schedule jsonb, **`visible_when`** |
| `questionnaire_options`     | Choice rows per step: `value`, `label`, `icon`, `icon_class_name`, `sort_order`                                                             |

On boot, `QuestionnaireSchemaService` seeds v1 from `schema/seed-data.ts` if missing, then caches active definition for `GET /questionnaire/schema` + answer validation.

### 4.2 Branching (`visible_when`)

Adaptive path = **data**, not frontend if/else.

```ts
type StepVisibleWhen = {
  field: string; // prior step id, e.g. "goal"
  op: "eq" | "neq" | "includes" | "excludes";
  value: string | string[]; // token(s) from that step's options
};
```

- Omit / `null` → step always visible.
- Array of rules → **AND** (all must pass).
- Evaluate against **current answers** (draft or submit).
- Submit validation **requires only visible steps**.
- Frontend next/back + progress use **visible step list**; URL still uses catalog `stepNumber`.

Example (future domain skills — not required in v1 seed):

```json
{
  "id": "marketingSkills",
  "visibleWhen": {
    "field": "goal",
    "op": "includes",
    "value": "marketing-specialist"
  }
}
```

### 4.3 `questionnaire_responses`

| Column                      | Type                            | Notes                               |
| --------------------------- | ------------------------------- | ----------------------------------- |
| `id`                        | `uuid` PK                       |                                     |
| `user_id`                   | `uuid` unique FK                | One active row per user (MVP)       |
| `status`                    | `enum`                          | `draft` \| `submitted`              |
| `answers`                   | `jsonb`                         | Validated against active definition |
| `schema_version`            | `int`                           | Definition version at save          |
| `goal_id`                   | `uuid` nullable FK → `goals.id` |                                     |
| `submitted_at`              | `timestamptz` nullable          |                                     |
| `created_at` / `updated_at` | `timestamptz`                   |                                     |

### 4.4 `goals`

Mapped from answers on submit (see §7). One active goal per user (update on re-submit). **Bridge row** to Roadmap Generator — not curriculum.

---

## 5. Schema contract (backend truth)

### 5.1 `GET /questionnaire/schema`

Auth required. Returns full UI + validation definition.

```json
{
  "schemaVersion": 1,
  "totalSteps": 10,
  "steps": [
    {
      "id": "goal",
      "stepNumber": 1,
      "title": "What do you want to become?",
      "subtitle": "You can choose one or more. We'll build your roadmap from here.",
      "selection": "multi",
      "allowOther": false,
      "uiKind": "options",
      "reviewLabel": "Goal",
      "reviewIcon": "target",
      "options": [
        {
          "value": "data-analyst",
          "label": "Data Analyst",
          "icon": "bar-chart",
          "iconClassName": "bg-arc-purple-100 text-arc-purple-600"
        }
      ]
    },
    {
      "id": "schedule",
      "stepNumber": 6,
      "title": "What days or times work best for you?",
      "subtitle": "Select all that apply.",
      "selection": "multi",
      "uiKind": "schedule",
      "reviewLabel": "Best Time",
      "reviewIcon": "calendar",
      "options": [],
      "scheduleDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "scheduleTimes": [
        { "value": "morning", "label": "Morning (6 AM – 12 PM)" }
      ]
    }
  ]
}
```

Optional per step: `"visibleWhen": { "field": "goal", "op": "includes", "value": "…" }` or an array of rules.

### 5.2 Step fields

| Field                            | Meaning                                               |
| -------------------------------- | ----------------------------------------------------- |
| `id`                             | Answer key (`goal`, `motivation`, …)                  |
| `stepNumber`                     | Route `/questionnaire/{n}`                            |
| `selection`                      | `single` \| `multi`                                   |
| `allowOther`                     | Show free-text `*Other` field                         |
| `uiKind`                         | `options` (choice cards) \| `schedule` (days + times) |
| `visibleWhen`                    | Optional branch rule(s); omit = always show           |
| `reviewLabel` / `reviewIcon`     | Review screen row                                     |
| `options[].value`                | Stored answer token (validated server-side)           |
| `options[].label`                | Display copy                                          |
| `options[].icon`                 | Icon key for frontend Lucide map (optional)           |
| `options[].iconClassName`        | Tailwind classes for icon chip (optional)             |
| `scheduleDays` / `scheduleTimes` | Only when `uiKind === "schedule"`                     |

### 5.3 Frontend rules

- **Do not** hardcode titles, options, or step count.
- Fetch schema once (store in Zustand); render steps from it.
- Icon keys only: map in `src/lib/questionnaire/icons.ts` (`bar-chart` → `BarChart3`, etc.).
- Progress UI uses **visible** step index / visible count (not raw `totalSteps` alone when branches exist).
- Next/back skip steps where `visibleWhen` fails.
- Review lists **visible** steps only.
- Labels for review use schema options + `getOptionLabel(schema, …)`.

### 5.4 Answer payload shape (schema_version = 1)

Still keyed by step `id`:

```ts
type QuestionnaireAnswers = {
  goal: string[];
  motivation: string[];
  motivationOther?: string;
  currentJob: string;
  currentJobOther?: string;
  skills: string[];
  skillsOther?: string;
  studyHours: string;
  schedule: { days: string[]; times: string[] };
  deadline: string;
  learningStyle: string[];
  learningStyleOther?: string;
  confidence: string;
  quitReasons: string[];
  quitReasonsOther?: string;
};
```

Allowed values = `step.options[].value` (plus `other` for single + `allowOther`).  
Schedule days/times from `scheduleDays` / `scheduleTimes`.  
Server derives allow-lists from active schema — never a second hardcoded list.

**Submit rules:**

- Required selections per **visible** step (multi ≥1, single non-empty, schedule days+times ≥1 each)
- Hidden steps not required
- Unknown enum → `VALIDATION_ERROR`
- `skills` cannot mix `none` with other values (when skills step visible)
- `currentJob === "other"` requires `currentJobOther`
- Free-text `*Other` max 500 chars

---

## 6. API contracts

Base path: `/api/v1/questionnaire`  
Auth: required on all routes.  
Errors: `{ statusCode, code, message }`.

### 6.1 Error codes

| Code                                | When                                |
| ----------------------------------- | ----------------------------------- |
| `VALIDATION_ERROR`                  | Bad / incomplete body, unknown enum |
| `QUESTIONNAIRE_NOT_FOUND`           | Reserved                            |
| `QUESTIONNAIRE_ALREADY_SUBMITTED`   | Draft update after submit           |
| `UNAUTHORIZED`                      | Missing/invalid JWT                 |
| `QUESTIONNAIRE_VERSION_CONFLICT`    | Stale draft/submission version      |
| `ROADMAP_GENERATION_ALREADY_QUEUED` | Existing job for same goal revision |

### 6.2 `GET /questionnaire/schema`

Returns §5.1 payload. Frontend entry point for questions.

### 6.3 `GET /questionnaire`

Current user response (or empty `not_started`).

```json
{
  "id": null,
  "status": "not_started",
  "schemaVersion": 1,
  "answers": null,
  "goalId": null,
  "submittedAt": null,
  "updatedAt": null
}
```

### 6.4 `PUT /questionnaire`

Upsert draft. Soft-validate against schema (strip unknown; allow incomplete).

```json
{
  "answers": {
    /* partial or full */
  }
}
```

Sets profile `questionnaire_status = in_progress` if was `not_started`.  
Does **not** create goals / roadmap.

### 6.5 `POST /questionnaire/submit`

```json
{
  "answers": {
    /* complete QuestionnaireAnswers */
  }
}
```

Transaction:

1. Strict validate vs active schema (**visible steps only**)
2. Lock the user questionnaire aggregate
3. Persist a submitted answer snapshot with `submission_version`
4. Create a new immutable `goals` revision (do not mutate the goal used by an active roadmap)
5. Mark profile questionnaire completed on first submit
6. Create one `roadmap_generation_job` request or outbox event keyed by goal revision
7. Commit; asynchronous Roadmap Generator consumes the request

**Response `201`:**

```json
{
  "questionnaire": { "id": "uuid", "status": "submitted", "goalId": "uuid", … },
  "goal": {
    "id": "uuid",
    "status": "active",
    "targetRoles": ["data-analyst"],
    "weeklyHours": "5-8",
    "targetDeadline": "3-6"
  },
  "roadmap": { "status": "queued", "jobId": "uuid", "roadmapId": null }
}
```

Idempotent for the same `Idempotency-Key` and answer hash: return the existing submission, goal revision, and generation job. A later intentional edit creates a new submission/goal revision; it does not overwrite the currently active roadmap until replacement generation succeeds.

---

## 7. Mapping answers → `goals`

| Questionnaire field     | Goal column                                       |
| ----------------------- | ------------------------------------------------- |
| `goal`                  | `target_roles`                                    |
| `motivation` + other    | `motivation` jsonb                                |
| `currentJob` (+ other)  | `current_profession` / `current_profession_other` |
| `skills` + other        | `skills` jsonb                                    |
| `studyHours`            | `weekly_hours`                                    |
| `schedule`              | `availability`                                    |
| `deadline`              | `target_deadline`                                 |
| `learningStyle` + other | `learning_styles`                                 |
| `confidence`            | `confidence`                                      |
| `quitReasons` + other   | `quit_reasons`                                    |
| full object             | `raw_answers`                                     |

Roadmap Generator reads **`goals`**, not questionnaire UI rows (except audit via `raw_answers` / `schema_version`).

---

## 8. Frontend screen map

| UI        | Route                       | Backend                                     |
| --------- | --------------------------- | ------------------------------------------- |
| Intro     | `/questionnaire`            | `GET /schema` + `GET /`                     |
| Steps     | `/questionnaire/[n]`        | Schema-driven UI + branching; `PUT` on Next |
| Review    | `/questionnaire/review`     | Visible steps only; `POST /submit`          |
| Bootstrap | Splash / login / middleware | `GET /me` + `profile.questionnaireStatus`   |

Client helpers:

- `questionnaireApi.getSchema()` / `.get()` / `.saveDraft()` / `.submit()`
- `useHydrateQuestionnaire()` — parallel schema + answers load
- `useQuestionnaireStore` — `{ schema, answers, … }`
- `isStepVisible` / `getVisibleSteps` / next-prev helpers — `src/lib/questionnaire/branching.ts` + `steps.ts`
- `resolvePostAuthPath()` — login destination from profile flags
- `middleware.ts` — block app routes until questionnaire `completed`

Post-auth order: verify email → onboarding roles → **questionnaire** → home.

---

## 9. Security & validation

- Auth required; own-row only
- Allowed values always from schema module
- Cap free-text length
- Throttle submit (5/min)
- Never trust client for XP/coins/gems
- Branch evaluation server-side on submit (client skip is UX only)

---

## 10. Implementation checklist

- [x] Schema module as single source of truth
- [x] `GET /questionnaire/schema`
- [x] Entities: `questionnaire_responses`, `goals`
- [x] Profile questionnaire status columns
- [x] Validation derives allow-lists from schema
- [x] `GET` / `PUT` / `POST …/submit`
- [x] Roadmap enqueue stub (handoff to Roadmap Generator)
- [x] `GET /me` includes questionnaire status
- [x] Frontend consumes schema (no hardcoded steps)
- [x] `visibleWhen` schema + branching helpers (BE + FE)
- [ ] Domain-specific branched steps in seed (e.g. Marketing skills)
- [ ] e2e: schema → draft → submit → goal
- [ ] OpenAPI examples for schema payload

---

## 11. Env

```bash
QUESTIONNAIRE_SCHEMA_VERSION=1
```

(Version also hardcoded in schema module for runtime; env is documentation / future override.)

---

## 12. Out of scope

- Admin CMS to edit questions (later: DB-backed schema)
- Skill Graph / Roadmap Generator / AI Coach internals (doc 03)
- Multi-goal careers merge logic (generator concern)
- Streaming SSE for conversational turns (phase 2)

### Conversational intake (implemented)

Env: `INTAKE_DEFAULT_MODE=form|chat`, `INTAKE_CHAT_ENABLED=true`.
User override via `PUT /questionnaire/intake-mode` and intro CTAs.
Chat routes: `POST /questionnaire/chat/start|message|complete`.
LLM: `LLM_BASE_URL` + `LLM_API_KEY` + `LLM_INTAKE_MODEL` (OpenAI-compatible; Qwen 3 supported).
Chat extracts **validated schema tokens**, then reuses the same `submit` → goals → roadmap enqueue path.

---

## 13. Downstream Handoff and Revision Safety

### 13.1 Submission event

The Question Engine writes:

```text
questionnaire.submitted.v1
```

Payload contains IDs and schema/version metadata, not curriculum:

```json
{
  "userId": "uuid",
  "questionnaireResponseId": "uuid",
  "submissionVersion": 2,
  "goalId": "uuid",
  "goalRevision": 2,
  "schemaVersion": 1
}
```

The Roadmap Generator is the only consumer that converts goal tokens into curriculum.

### 13.2 Timing fields

`studyHours`, `schedule`, `deadline`, and timezone remain preserved on the goal/submission. They are inputs to Roadmap sizing and Course Timing, but the Question Engine does not create weekly tasks or reminders.

### 13.3 Re-answering after an active roadmap exists

1. save a new submission version
2. create a new goal revision
3. queue a replacement roadmap job
4. keep the old roadmap/schedule active while generation runs
5. validate and generate the new schedule
6. atomically swap active roadmap/schedule pointers
7. archive old future-only path data; preserve completed progress/history
8. notify the user only after the replacement is usable

### 13.4 Concurrency

Draft `PUT` accepts `version` or `If-Match`. Submit requires an `Idempotency-Key`. Two tabs cannot create two active goal revisions for one identical answer hash.

### 13.5 Acceptance additions

- questionnaire submission never leaves the user with a half-swapped roadmap
- answer timing data is preserved for Course Timing
- the same submit command cannot enqueue duplicate generation work
- curriculum remains outside the Question Engine

## 14. Acceptance criteria

- [x] Frontend renders titles/options from `GET /questionnaire/schema`
- [x] Changing schema on backend changes UI without frontend redeploy of copy (icon keys must exist in map)
- [x] Draft save + resume works
- [x] Submit validates against schema allow-lists
- [x] Submit creates/updates goal + marks questionnaire completed
- [x] User cannot read/write another user’s answers
- [x] Login with incomplete questionnaire redirects to `/questionnaire` (or `/onboarding` if roles missing)
- [x] App routes blocked until `questionnaireStatus === completed`
- [x] Question Engine does not contain domain curriculum trees
- [x] Hidden steps (via `visibleWhen`) skipped in nav + not required on submit
