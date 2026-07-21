# 05 — Learn / Lesson Play API

**Version:** 3.1 (profile feedback + stage context)
**Status:** Backend + frontend wired. App calls `GET/POST/PATCH /api/v1/lessons/:id/...`.
**Source of truth (UI):** `arc-app` learn routes + lesson components.
**Backend:** `LessonsModule`.

> **Scope note for this revision.** This rewrite covers the sections available at authoring time: §1–§3, §4.1, and §16 (adaptive remediation). Sections §4.2–§15 (answer-key security detail, practice/quiz check endpoints, completion transaction, economy/gamification integration, schema, streaks, events, acceptance, priority) are referenced throughout but their bodies were not available; they are listed as a navigable index in **§Appendix A** and must be reconciled against the originals before merge. Nothing in those sections has been invented here.

---

## 0. Design principles

Every decision in this module follows one rule: **logic lives in deterministic backend code; the model only narrates.** Concretely:

- **The server is the single source of truth for anything gradeable or rewardable.** Answer keys, XP/gem/coin amounts, mastery state, badge eligibility, and unlock decisions are computed server-side and are never trusted from the client.
- **Secrets are stripped on read and revealed only after a check.** `GET /play` never ships correct-answer flags, remediation bodies, or reward keys. A correct/incorrect verdict is returned only in response to a graded `POST .../check`.
- **The LLM (Arlo) is a coach, not a judge.** It explains, encourages, and answers questions. It does not grade, award, unlock, or decide remediation. Those are code paths with tests.
- **Determinism is validated, not hoped for.** Idempotency keys, unique constraints, and content-version checks make repeated or concurrent requests safe; a completion cannot be farmed and a remediation round cannot be double-counted.
- **Failures degrade gracefully.** Analytics and remediation-event writes are fire-and-forget: they never roll back a successful lesson completion.

---

## 1. Problem

The frontend play flow is live:

```
/learn
  → /learn/:lessonId              (overview)
  → /learn/:lessonId/content      (paged teaching)
  → /learn/:lessonId/practice     (MCQ with hint)
  → /learn/:lessonId/quiz         (multi-question check)
  → /learn/:lessonId/reward       (claim XP / gems / coins / badge)
  → /learn/:lessonId/arlo         (side coach chat)
```

Current behavior versus what the backend must own:

| Concern                                               | Today                                                                                     | Must become                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Lesson metadata                                       | `GET /roadmaps/current` → `RoadmapLessonDto` (title, type, minutes, xp, status, resource) | Unchanged; tree stays lean                           |
| Play body (content / practice / quiz / reward / arlo) | Client mock (`lesson-1`) or synthesized from title via `buildLessonFromRoadmap`           | Authoritative `GET /play` payload                    |
| Session progress                                      | Zustand only — lost on refresh                                                            | Server-persisted `LessonProgress`, optionally synced |
| Complete + economy                                    | Local `markCompleted()` — no XP/gems/coins/badge write, no unlock                         | Server completion transaction                        |
| Correct answers                                       | Sent to client in cleartext (`correct`, `correctOptionId`)                                | Server-held; revealed only post-check                |
| Arlo                                                  | Local keyword stubs                                                                       | Coach endpoint, no grading authority                 |

The backend replaces client-side synthesis and local completion with authoritative APIs.

---

## 2. Frontend contract

Canonical playable shape (from `arc-app/src/lib/lesson/mock-data.ts`). The backend must satisfy this shape on `GET /play`, minus any secret fields (see §0 and §4.1).

```ts
type LessonContentBlock =
  | { type: "text"; body: string }
  | { type: "callout"; title: string; body: string }
  | { type: "code"; label: string; code: string };

type PlayableLesson = {
  id: string; // lessons.id (UUID)
  lessonNumber: number; // 1-based ordinal across roadmap
  title: string;
  missionName: string;
  minutes: number; // estimatedMinutes
  xpReward: number; // preview only; award is server-owned
  objective: string;
  resource: { label: string; href: string; note: string };
  arloPrompt: string; // overview hero line
  content: Array<{ id: string; title: string; blocks: LessonContentBlock[] }>;
  practice: {
    prompt: string;
    hint: string;
    options: Array<{ id: string; label: string; correct?: boolean }>; // `correct` stripped pre-check
  };
  quiz: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string }>;
    correctOptionId?: string; // NEVER sent pre-check
    explanation?: string;
  }>;
  reward: {
    xp: number;
    gems: number;
    coins: number;
    badgeId?: string;
    badgeLabel?: string;
    arloLine: string;
  };
  suggestedArlo: string[]; // chip prompts on the Arlo screen
};
```

Client-side session state (optional to sync to the server):

```ts
{
  lessonId: string;
  contentStep: number; // 0-based content page index
  practiceDone: boolean;
  quizAnswers: Record<string, string>; // questionId → optionId
  completed: boolean;
}
```

**Path entry.** Roadmap tree nodes link to `/learn/${lesson.id}`, each carrying `status: locked | available | completed`.

---

## 3. Existing backend

### 3.1 Entities (keep / extend)

| Entity           | Table              | Notes                                                                                                                                                      |
| ---------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Lesson`         | `lessons`          | UUID, milestone, template FK, title, mission, description, type, minutes, difficulty, `xpReward`, order, resource, `status`                                |
| `LessonProgress` | `lesson_progress`  | Unique `(userId, lessonId)`; status `not_started \| in_progress \| completed`; started/completed timestamps; `timeSpentMinutes`; `xpAwarded`; `retryCount` |
| `LessonTemplate` | `lesson_templates` | Has `contentOutline` jsonb — the store for the play payload                                                                                                |
| `Profile`        | `profiles`         | `totalXp`, `coins`, `gems` — award targets                                                                                                                 |
| Roadmap tree DTO | via serializer     | Metadata only; no play body                                                                                                                                |

### 3.2 Existing HTTP (unchanged)

- `GET /roadmaps/current`
- `GET /roadmaps/jobs/:jobId`

Do **not** bloat the tree DTO with play content. Keep the tree lean; serve play bodies from dedicated lesson endpoints.

---

## 4. Required APIs

**Auth.** Every endpoint requires an authenticated user. The lesson must belong to the user's current roadmap (or pass an ownership check). Locked lessons return `403`.

### 4.1 `GET /lessons/:lessonId/play`

Returns the full playable lesson: overview, content, practice, quiz, a reward _preview_, and Arlo chips. All secrets are stripped (no `correct` flags, no `correctOptionId`, no remediation bodies, no reward keys).

**Response `200`**

```json
{
  "id": "uuid",
  "lessonNumber": 3,
  "title": "Your first webpage",
  "missionName": "Hello World Rookie",
  "minutes": 18,
  "xpReward": 35,
  "objective": "Build a tiny HTML page…",
  "status": "available",
  "resource": {
    "id": "uuid",
    "label": "MDN: Getting started with HTML",
    "href": "https://…",
    "note": "Skim the first section…",
    "provider": "mdn"
  },
  "arloPrompt": "Stuck on tags? Ask me…",
  "content": [
    {
      "id": "c1",
      "title": "HTML is the skeleton",
      "blocks": [
        { "type": "text", "body": "…" },
        { "type": "callout", "title": "Arlo says", "body": "…" },
        { "type": "code", "label": "starter.html", "code": "<!DOCTYPE html>…" }
      ]
    }
  ],
  "practice": {
    "id": "p1",
    "prompt": "Which snippet correctly opens a paragraph…",
    "hint": "Opening tag, text, closing tag…",
    "options": [
      { "id": "a", "label": "<p>Hello Arlo</p>" },
      { "id": "b", "label": "<p>Hello Arlo<p>" }
    ]
  },
  "quiz": [
    {
      "id": "q1",
      "prompt": "Where does visible page content live?",
      "options": [
        { "id": "a", "label": "<head>" },
        { "id": "b", "label": "<body>" }
      ]
    }
  ],
  "rewardPreview": {
    "xp": 35,
    "gems": 2,
    "coins": 15,
    "badgeId": "first-step",
    "badgeLabel": "First Step",
    "arloLine": "Plot twist: you shipped…"
  },
  "suggestedArlo": [
    "Explain <head> vs <body> like I'm five",
    "Why do I need </p>?",
    "Quiz me on h1 vs p"
  ],
  "progress": {
    "status": "not_started",
    "contentStep": 0,
    "practiceDone": false,
    "timeSpentMinutes": 0,
    "xpAwarded": 0,
    "retryCount": 0
  },
  "adaptive": {
    "enabled": true,
    "attemptBudgetPerConcept": 2,
    "concepts": ["html-tag-closing", "head-vs-body"]
  }
}
```

**Stripping rules (enforced in the serializer, tested):**

- `practice.options[].correct` — removed.
- `quiz[].correctOptionId` and `quiz[].explanation` — removed.
- Reward `badgeId`/amounts appear only as a _preview_ (`rewardPreview`); the authoritative award happens in the completion transaction (§4.6).
- Remediation `microExplanation` and `recoveryItem` bodies are **never** on this endpoint; they are delivered only by check responses (§16.4). Only the `adaptive` summary (flag, budget, concept list) is exposed.

---

## Appendix A — Sections pending reconciliation (§4.2–§15)

These sections are referenced by §4.1 and §16 but were not available for this rewrite. They must be merged from the original before this document is considered complete. Listed with the purpose inferred from surviving cross-references:

- **§4.2 Answer-key security** — why `correct` / `correctOptionId` are never sent pre-check; referenced by §2 and §4.1.
- **§4.3–§4.5 Practice & quiz check endpoints** — `POST /lessons/:id/practice/check` and `/quiz/check`; grading against the server-held key; extended by §16.4.
- **§4.6 Completion transaction** — the central orchestration (progress, gamification, roadmap unlock, weekly plan, streak, rank, league, notifications); extended by §16.5.
- **§5 Economy / Gamification integration** — final XP/gem/coin/badge math; §16.5 feeds it `conceptsMastered`, `conceptsTotal`, `remediationRoundsUsed`.
- **§8 Schema** — base tables; extended by §16.3 (`lesson_attempts`, `remediation_events`).
- **§11 Acceptance criteria** — base list; extended by §16.8 ("repeat completion does not farm full XP").
- **§14 Priority order** — base delivery order; extended by §16.9 (items 7–10).
- **§15 Event & attempt contract** — §15.2 attempt + content-version validation; §15.5 `lesson.completed.v1`; §15.6 analytics-failure isolation.

---

## 16. Adaptive remediation

When a learner answers a practice or quiz item wrong, the server can serve a targeted micro-explanation plus a _fresh_ recovery item for the specific concept that was missed — without ever hard-blocking progress. All grading and all remediation decisions are server-side (§0).

### 16.1 Seed content shape

Every gradeable item carries a `conceptTag`. Each concept referenced by an item should have a remediation pool: a micro-explanation and one or more recovery items that differ from the primary item.

```json
{
  "quiz": [
    {
      "id": "q1",
      "prompt": "Where does visible page content live?",
      "conceptTag": "head-vs-body",
      "options": [
        { "id": "a", "label": "<head>" },
        { "id": "b", "label": "<body>" }
      ],
      "correctOptionId": "b",
      "explanation": "Body is the stage. Head is backstage metadata."
    }
  ],
  "remediation": {
    "html-tag-closing": {
      "microExplanation": [
        {
          "type": "text",
          "body": "Every element you open, you must close. The closing tag repeats the name with a leading slash: </p>."
        },
        { "type": "code", "label": "correct.html", "code": "<p>Hello</p>" }
      ],
      "recoveryItems": [
        {
          "id": "r-tagclose-1",
          "prompt": "Which line correctly closes a heading?",
          "options": [
            { "id": "a", "label": "<h1>Title<h1>" },
            { "id": "b", "label": "<h1>Title</h1>", "correct": true }
          ],
          "explanation": "The closing tag adds the slash: </h1>."
        }
      ]
    },
    "head-vs-body": {
      "microExplanation": [
        {
          "type": "callout",
          "title": "Arlo says",
          "body": "Think theater: <body> is the stage the audience sees; <head> is backstage — title, metadata, links."
        }
      ],
      "recoveryItems": [
        {
          "id": "r-headbody-1",
          "prompt": "Where does a <title> tag belong?",
          "options": [
            { "id": "a", "label": "<head>", "correct": true },
            { "id": "b", "label": "<body>" }
          ],
          "explanation": "Title is metadata → head."
        }
      ]
    }
  }
}
```

### 16.2 Authoring rules

- Every practice/quiz item **must** carry a `conceptTag`.
- A concept referenced by any item **should** have at least one recovery item. With none, remediation degrades gracefully to explanation-only (§16.4, step 4 "else" branch).
- Recovery items **must** differ from the primary item — never repeat the just-failed question verbatim.

### 16.3 Schema additions (extends §8)

```text
lesson_attempts
  + concept_mastery jsonb NOT NULL DEFAULT '{}'
      -- { "<conceptTag>": { "state": "shaky", "misses": 2, "recoveries": 1 } }

remediation_events            -- append-only; analytics + reward input
  id                uuid pk
  attempt_id        uuid fk -> lesson_attempts
  user_id           uuid
  lesson_id         uuid
  concept_tag       text
  trigger_item_id   text            -- practice/quiz item that was failed
  recovery_item_id  text null       -- item served (null if explanation-only)
  round             int             -- 1-based remediation round for this concept in this attempt
  outcome           text            -- 'served' | 'recovered' | 'failed_again' | 'budget_exhausted'
  created_at        timestamptz
  UNIQUE(attempt_id, concept_tag, round)
```

Answer keys are **never** stored in `remediation_events` — only outcomes and IDs.

### 16.4 Flow — practice/quiz check with remediation

Extends §4.4 and §4.5. Both check endpoints gain a remediation branch. `attemptId` is required (§15.2).

```
POST /lessons/:id/practice/check   (or /quiz/check)
body: { attemptId, itemId, optionId }   // itemId = practice id or questionId

server:
1. Validate attempt + content version (§15.2). Resolve conceptTag for itemId.
2. Grade against the server-held key.
3. If CORRECT:
     - mark concept mastered (if it was previously shaky via remediation → 'recovered')
     - return { correct: true, correctOptionId, explanation, remediation: null }
4. If WRONG:
     a. concept_mastery[conceptTag].misses += 1; state → attempting/shaky.
     b. If misses <= attemptBudget AND an unserved recoveryItem exists for this attempt:
          - pick the next unseen recoveryItem for conceptTag
          - write remediation_events(outcome='served', round, recovery_item_id)
          - return {
              correct: false,
              correctOptionId,               // reveal is allowed AFTER a check (§4.1 forbids only pre-check)
              explanation,
              remediation: {
                conceptTag,
                round,
                microExplanation: [ ...blocks... ],
                recoveryItem: { id, prompt, options[] }   // NO correct flag
              }
            }
        Else (budget exhausted OR no recovery item left):
          - state → 'shaky'; write remediation_events(outcome='budget_exhausted' | 'served')
          - return { correct: false, correctOptionId, explanation,
                     remediation: { conceptTag, exhausted: true, microExplanation } }
```

Recovery items are graded by the **same** endpoint with `itemId` = the recovery item id:

```
POST /lessons/:id/quiz/check   body: { attemptId, itemId: "r-headbody-1", optionId }
  - if correct → concept_mastery[tag].recoveries += 1; state → 'mastered'; outcome='recovered'
  - if wrong   → loop back to step 4 (respecting attemptBudget)
```

The learner is **never hard-blocked**. After the budget is exhausted the UI shows the explanation plus a "Continue anyway" affordance. Mastery is recorded as `shaky`, which the reward calculator reads.

### 16.5 Completion integration (extends §4.6 and §5)

The completion transaction (§4.6, step 5) already sends score + assistance to Gamification. Add two verified inputs derived from `concept_mastery`:

- `conceptsMastered` / `conceptsTotal`
- `remediationRoundsUsed` (an assistance signal, same category as hints)

Reward implications (final numbers owned by `../gamification/07-gamification.md`):

- All concepts `mastered` with **zero** remediation → eligible for full/perfect reward and any perfect-run badge.
- Concepts recovered via remediation → full learning credit, mild reward damping (remediation counts as assistance, like hints).
- Concepts left `shaky` (budget exhausted) → lesson still completes; perfect-score bonuses and mastery badges are withheld, but base reward is granted so the learner is not punished into churn.

This keeps §11's acceptance ("repeat completion does not farm full XP") consistent: mastery — not click-through — gates the top reward.

### 16.5.1 Learner-profile feedback (verified stage correction)

Completion is also where **verified performance corrects the provisional learner profile** (questionnaire doc 02 §5.2, §16). A completed lesson emits a per-skill signal with `evidenceSource: "lesson_performance"` for each `skills_taught` value on the unit. Idempotency is keyed by `attemptId + skillSlug`, so retries cannot inflate mastery.

- strong completion means no remediation plus either quiz score ≥80% or a completed practice/proof task;
- strong completion raises the matching skill estimate's `provisionalStage` by at most 1, capped at the active profile's `targetStage`;
- a strong `checkpoint` quiz raises that skill's `verifiedStage` to the proven stage (capped by the unit's `serves_stage` and the target stage) and sets confidence to `high`;
- shaky evidence (remediation used or quiz score <70%) lowers confidence only; it never lowers provisional or verified stage by itself.

After estimates change, the active learner profile refreshes its aggregate `provisionalStage`, `verifiedStage`, and `stageGap` from the estimate set. The flow never rewrites questionnaire answers and never replans synchronously; a later reassessment/replan flow decides whether to revise the roadmap. The mapping uses the same `skillSlug → domain` resolution as generation (content_pool §7.1), in reverse: the unit's `skills_taught` domain is the `skillSlug` the estimate updates.

### 16.6 `GET /play` additions

`GET /lessons/:id/play` exposes only the adaptive summary; secrets stay stripped:

```json
{
  "unitRole": "foundation",
  "servesStage": [1, 2],
  "skillsTaught": ["html-css:html-intro"],
  "adaptive": {
    "enabled": true,
    "attemptBudgetPerConcept": 2,
    "concepts": ["html-tag-closing", "head-vs-body"]
  }
}
```

`unitRole` and `servesStage` are read-only context (they let the client label a lesson as a "quick check" vs "full lesson"); they carry no secrets. `microExplanation` and `recoveryItem` bodies are delivered **only** in check responses (§16.4), never on the play GET.

### 16.7 Event contract additions (extends §15.5)

New optional facts on `lesson.completed.v1`:

```json
{
  "conceptsTotal": 2,
  "conceptsMastered": 2,
  "remediationRoundsUsed": 1,
  "shakyConcepts": [],
  "skillSignals": [
    { "skillSlug": "html-css", "evidenceSource": "lesson_performance", "direction": "toward_target" }
  ]
}
```

New event `lesson.remediation.v1` (fire-and-forget analytics; failure never rolls back a lesson, per §15.6):

```json
{
  "attemptId": "uuid",
  "lessonId": "uuid",
  "conceptTag": "head-vs-body",
  "round": 1,
  "outcome": "recovered"
}
```

### 16.8 Acceptance criteria (extends §11)

- [ ] Every practice/quiz item resolves a `conceptTag`; items missing one fail seed validation.
- [ ] A wrong answer within budget returns a `remediation` block with a fresh recovery item (never the failed item verbatim).
- [ ] Recovery-item answer keys never appear on `GET /play` or in any event/notification.
- [ ] A correct recovery flips concept state to `mastered` (recorded as `recovered`) and stops further remediation for that concept.
- [ ] Exhausting the attempt budget marks the concept `shaky`, allows "Continue anyway", and does NOT hard-block completion.
- [ ] Completion with any `shaky` concept withholds the perfect-run bonus/badge but still grants base reward.
- [ ] `remediation_events` is append-only and idempotent under duplicate check requests (unique on attempt + concept + round).
- [ ] Remediation analytics failure does not roll back a successful completion.
- [ ] Two open devices cannot double-count remediation rounds for the same attempt + concept + round.

### 16.9 Priority order (extends §14)

7. Add `conceptTag` to seed content + seed one remediation pool for the golden HTML lesson.
8. Remediation branch in practice/quiz check (§16.4) + `remediation_events`.
9. Concept-mastery inputs into completion → Gamification (§16.5).
10. `adaptive` block on play GET + `lesson.remediation.v1` event.
