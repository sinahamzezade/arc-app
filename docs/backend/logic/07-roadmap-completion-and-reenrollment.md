# 06 — Roadmap Completion & Re-enrollment

**Version:** 1.0
**Stack:** NestJS + TypeORM + PostgreSQL
**Consumers:** Arlo Next.js PWA (`arc-app`)
**Depends on:** [00](./00-system-integration.md), [02](./02-questionnaire.md), [03](./03-goals-and-roadmap.md), [05](./05-Learn_Lesson_Play_API.md), [gamification](./gamification.md)
**Feeds:** [03](./03-goals-and-roadmap.md) (new roadmap generation), [02](./02-questionnaire.md) (re-enrollment), [gamification](./gamification.md) (graduation rewards)

This doc covers what happens after the last lesson of an active roadmap is completed: the completion moment, the graduation state, the coaching decision, and the re-enrollment flow that produces a new active roadmap.

**Core invariant:** completing a roadmap never auto-generates the next one. A new roadmap requires a deliberate learner action — either confirming the same goal or submitting a new one — so the system never silently enroll a user in content they did not choose.

---

## 0. Overview

```
Last lesson completed (doc 05 §4.6)
  │
  ▼
Roadmap completion check
  ├── not all required lessons done → no-op (normal lesson complete flow)
  └── all required lessons done
        │
        ▼
      Completion transaction
        - roadmap.finished_at = now()
        - roadmap.status → completed
        - graduation rewards (XP/gems/badge) via Gamification
        - roadmap.completed.v1 event fired
        │
        ▼
      Graduation screen (frontend)
        - summary: lessons completed, XP earned, skills unlocked, time taken
        - skill signal summary from learner_skill_estimates
        - CTA: "What's next?" → coach assessment OR new goal
        │
        ┌──────────────────────────────────────────────────────┐
        │ Coach assesses profile vs target stage               │
        │                                                      │
        │  Mastery sufficient → "Start next goal" prompt       │
        │  Gaps remain        → "Top-up path" offer            │
        │  Same goal deeper   → "Advanced path" offer          │
        └──────────────────────────────────────────────────────┘
              │
              ▼
          Learner chooses
              │
    ┌─────────┴──────────────────────┐
    │                                │
    ▼                                ▼
New goal                      Same goal / top-up
(re-enter questionnaire        (Coach generates replacement
 §3 fast-track mode)           roadmap from updated profile)
    │                                │
    └─────────────────┬──────────────┘
                      ▼
              New RoadmapGenerationProfile
              → Roadmap Generator (doc 03 §5)
              → atomic swap (doc 03 §14.4)
              → new roadmap becomes active
```

---

## 1. Completion check

The completion check runs as a hook inside the lesson completion transaction (doc 05 §4.6). It must not add latency to the lesson complete response — run it as a post-commit side-effect, not inline.

**A roadmap is complete when:**
- all `lessons` with `required: true` in the active roadmap have a `lesson_progress.status = completed` row for this user; AND
- all `milestones` of type `assessment` or `project` are `completed_at IS NOT NULL`.

Optional lessons (enrichment units with `required: false`) do not block completion. A learner who skips optional content still graduates.

**Implementation:**

```ts
// Post-commit hook — never blocks the lesson complete response
async function checkRoadmapCompletion(userId: string, roadmapId: string): Promise<void> {
  const complete = await roadmapCompletionService.isComplete(userId, roadmapId);
  if (!complete) return;
  await roadmapCompletionService.finalizeCompletion(userId, roadmapId);
}
```

```ts
async isComplete(userId: string, roadmapId: string): Promise<boolean> {
  const [requiredTotal, completedCount] = await Promise.all([
    lessonRepo.countRequiredForRoadmap(roadmapId),
    lessonProgressRepo.countCompletedRequired(userId, roadmapId),
  ]);
  const assessmentsComplete = await milestoneRepo.allAssessmentsComplete(userId, roadmapId);
  return completedCount >= requiredTotal && assessmentsComplete;
}
```

Idempotent: if `roadmaps.finished_at IS NOT NULL`, skip. A duplicate call (e.g. lesson retry after roadmap already finished) is a no-op.

---

## 2. Completion transaction

`finalizeCompletion` runs in a database transaction. It must succeed atomically or roll back entirely.

Steps:

1. **Lock the roadmap row** — `SELECT ... FOR UPDATE` on `roadmaps` where `id = roadmapId AND finished_at IS NULL`. If the row is already finished, exit (idempotent guard).
2. **Set timestamps** — `roadmaps.finished_at = now()`, `roadmaps.status = completed`.
3. **Compute mastery summary** — read `learner_skill_estimates` for skills in this roadmap; summarize `skillsMastered` (estimates at or above `targetStage`), `skillsPartial` (in progress), `skillsShaky` (below target).
4. **Request graduation rewards** — call Gamification with `{ event: "roadmap_completed", userId, roadmapId, skillsMastered, totalLessons, totalXpEarned, completionTimeWeeks }`. Gamification owns the final XP/gem/coin/badge amounts; this doc does not define them.
5. **Emit `roadmap.completed.v1`** — see §8.
6. **Enqueue coach assessment job** — `roadmap_completion_coach_v1` (§5). Fire-and-forget; does not block the transaction.

Failures in steps 4–6 (Gamification call, event emit, coach enqueue) are **fire-and-forget** — they are retried asynchronously and never roll back the roadmap finalization. The roadmap must be marked complete regardless.

---

## 3. Schema additions

### 3.1 `roadmaps` additions

| Column                   | Type                 | Notes                                               |
| ------------------------ | -------------------- | --------------------------------------------------- |
| `finished_at`            | timestamptz nullable | Set by completion transaction; null = not finished  |
| `completion_summary`     | jsonb nullable       | `{ skillsMastered, skillsPartial, skillsShaky, totalLessons, totalXpEarned, completionTimeWeeks }` |
| `post_completion_status` | varchar nullable     | `awaiting_choice` \| `reenrolled` \| `top_up` \| `advanced` |

### 3.2 `roadmap_completion_events` (new, append-only)

| Column               | Type        | Notes                                          |
| -------------------- | ----------- | ---------------------------------------------- |
| `id`                 | uuid PK     |                                                |
| `user_id`            | uuid FK     |                                                |
| `roadmap_id`         | uuid FK     |                                                |
| `skills_mastered`    | int         |                                                |
| `skills_partial`     | int         |                                                |
| `skills_shaky`       | int         |                                                |
| `total_lessons`      | int         |                                                |
| `total_xp_earned`    | int         |                                                |
| `completion_weeks`   | int         | `ceil((finished_at - roadmap.created_at) / 7)` |
| `next_action`        | varchar     | `new_goal` \| `same_goal_advanced` \| `top_up` |
| `created_at`         | timestamptz |                                                |

Append-only. One row per completed roadmap. Never updated.

### 3.3 `re_enrollment_jobs`

| Column                         | Type                  | Notes                                                   |
| ------------------------------ | --------------------- | ------------------------------------------------------- |
| `id`                           | uuid PK               |                                                         |
| `user_id`                      | uuid FK               |                                                         |
| `previous_roadmap_id`          | uuid FK               |                                                         |
| `trigger`                      | varchar               | `new_goal` \| `same_goal_advanced` \| `top_up`          |
| `new_goal_id`                  | uuid FK nullable       | Set for `new_goal` trigger                              |
| `status`                       | enum                  | `queued` \| `processing` \| `ready` \| `failed`         |
| `new_roadmap_id`               | uuid nullable         | Set when ready                                          |
| `error_code` / `error_message` | varchar/text nullable |                                                         |
| `attempts`                     | int                   |                                                         |
| `created_at` / `updated_at`    | timestamptz           |                                                         |

---

## 4. Graduation screen (frontend contract)

`GET /roadmaps/:id/completion-summary` — available only when `roadmaps.finished_at IS NOT NULL`.

**Response `200`:**

```json
{
  "roadmapId": "uuid",
  "title": "Front-End Developer",
  "finishedAt": "2026-07-15T12:00:00Z",
  "completionWeeks": 14,
  "totalLessons": 68,
  "totalXpEarned": 4200,
  "skillsMastered": 9,
  "skillsPartial": 2,
  "skillsShaky": 1,
  "skillSummary": [
    { "skillSlug": "html-css",    "stage": 4, "target": 4, "status": "mastered" },
    { "skillSlug": "javascript",  "stage": 3, "target": 4, "status": "partial" },
    { "skillSlug": "react",       "stage": 4, "target": 4, "status": "mastered" }
  ],
  "badges": ["first-roadmap", "html-master", "react-ready"],
  "coachAssessment": {
    "ready": true,                         // false while coach job is running
    "recommendation": "same_goal_advanced",
    "rationale": "9 of 12 skills mastered. Consider the Advanced React path to close the gaps.",
    "options": [
      { "key": "new_goal",             "label": "Explore a new career path" },
      { "key": "same_goal_advanced",   "label": "Go deeper: Advanced React" },
      { "key": "top_up",               "label": "Close my skill gaps first" }
    ]
  }
}
```

`coachAssessment.ready` is `false` while the coach job (§5) is still running. The frontend polls or listens via websocket. If the job has not resolved after 10 seconds, show a "We're preparing your next options..." state and resolve when ready. The graduation summary is always shown immediately — the CTA is what waits.

---

## 5. Coach assessment after completion

**Job:** `roadmap_completion_coach_v1` enqueued by §2 step 6.

The coach reads the completed roadmap's `completion_summary` and the current `learner_skill_estimates`, then decides which option to recommend. This is the **only** AI-involved step; everything else is deterministic.

Input to the coach model:

```json
{
  "role": "roadmap_completion_coach_v1",
  "completedRole": "front-end-developer",
  "targetStage": 4,
  "skillSummary": [ ... ],    // same as GET response above
  "completionWeeks": 14,
  "availableAdvancedRecipes": ["react-advanced", "typescript-deep-dive"],
  "blockerTags": ["needs quick wins"]
}
```

The model returns one of the three `options` keys plus a one-sentence `rationale`. The model may **not** invent a new skill, recipe, or path not in `availableAdvancedRecipes`. Its output is validated with Zod before being written to `roadmap_completion_events.next_action`.

Soft-fail: if the AI job fails after 3 retries, default recommendation is `new_goal` (safest neutral option); `coachAssessment.ready = true` with the fallback.

---

## 6. Re-enrollment flows

### 6.1 New goal

The learner picks a different career or domain. The questionnaire runs in **fast-track mode**: answers from the previous profile are pre-filled, and only questions whose answers are likely to have changed (goal, skills, availability) are shown. The learner can edit any answer.

On submit, the standard questionnaire flow (doc 02) produces a new `RoadmapGenerationProfile`. The Roadmap Generator (doc 03 §5) runs unchanged. The new roadmap is generated off to the side and swapped atomically when Course Timing produces a feasible initial schedule (doc 03 §14.4).

The completed roadmap is **archived** (`status: completed`, `finished_at` set) — it is never deleted or overwritten. Only one roadmap is active at a time.

### 6.2 Same goal, advanced path

The learner wants to continue deepening the same role. No questionnaire re-run is needed.

Steps:

1. Resolve the advanced recipe for the completed role (e.g. `react-advanced` for `front-end-developer`).
2. Build an updated `RoadmapGenerationProfile` from the current `learner_skill_estimates` — entry stages are now verified (from lesson performance), not provisional.
3. Run the Roadmap Generator (doc 03 §5) with the advanced recipe. Skills already mastered are omitted or served as `checkpoint` units; skills still `partial`/`shaky` get `foundation`/`refresher` units.
4. Atomic swap when ready (doc 03 §14.4).

### 6.3 Top-up path

The learner wants to close specific skill gaps before moving on. The coach produces a focused path covering only the `partial` and `shaky` skills from the completed roadmap's `skillSummary`.

Steps:

1. Gap = skills where `stage < targetStage` in `learner_skill_estimates`.
2. Run the Roadmap Generator with those skill node ids as the explicit required set (bypassing recipe phase selection — the gap is the full required set).
3. Budget from the learner's current `capacity.effectiveWeeklyMinutes`; no deadline.
4. Narration pass labels this as a "Skills Top-Up" path with a short estimated duration.
5. Atomic swap when ready.

Top-up paths are typically short (1–4 weeks). On completion they follow the same §2 completion transaction and loop back to §4 with an updated skill summary.

---

## 7. APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/roadmaps/:id/completion-summary` | Graduation screen payload (§4) |
| `POST` | `/roadmaps/:id/choose-next` | Learner picks an option; enqueues re-enrollment job |
| `GET` | `/roadmaps/re-enrollment-jobs/:jobId` | Poll new roadmap generation status |
| `GET` | `/roadmaps/current` | Unchanged; returns the new active roadmap once swapped |

### `POST /roadmaps/:id/choose-next`

Body:

```json
{ "choice": "new_goal | same_goal_advanced | top_up" }
```

- `new_goal` → redirects to questionnaire fast-track (returns `{ redirect: "/questionnaire?mode=fast_track" }`)
- `same_goal_advanced` → enqueues a `re_enrollment_jobs` row with `trigger: same_goal_advanced`; returns `{ jobId }`
- `top_up` → enqueues a `re_enrollment_jobs` row with `trigger: top_up`; returns `{ jobId }`

Poll `GET /roadmaps/re-enrollment-jobs/:jobId` until `status: ready`, then redirect to `/path` (the new active roadmap).

---

## 8. Events

### `roadmap.completed.v1`

Fired by the completion transaction (§2 step 5). Fire-and-forget — failure never rolls back the completion.

```json
{
  "event": "roadmap.completed.v1",
  "userId": "uuid",
  "roadmapId": "uuid",
  "roleSlug": "front-end-developer",
  "finishedAt": "2026-07-15T12:00:00Z",
  "completionWeeks": 14,
  "totalLessons": 68,
  "totalXpEarned": 4200,
  "skillsMastered": 9,
  "skillsPartial": 2,
  "skillsShaky": 1
}
```

### `roadmap.reenrollment_started.v1`

Fired when the learner submits a choice and a new roadmap is queued.

```json
{
  "event": "roadmap.reenrollment_started.v1",
  "userId": "uuid",
  "previousRoadmapId": "uuid",
  "trigger": "same_goal_advanced",
  "jobId": "uuid"
}
```

---

## 9. Guardrails

- A new roadmap is **never auto-generated** on completion. A deliberate learner action (`POST /choose-next`) is always required.
- The completed roadmap row is **never deleted or mutated** after `finished_at` is set. It is a permanent historical record.
- The coach model may **only** recommend options from `availableAdvancedRecipes`. It may not invent a new career, skill, or path.
- No "job ready", "you are now employable", or salary claims in any coach or graduation copy — guardrail from doc 03 §9.
- Only one roadmap is **active** at a time. The previous roadmap transitions to `status: completed` before the new one is swapped in.
- Top-up and advanced paths are generated by the **same** Roadmap Generator (doc 03 §5) with the same deterministic pipeline — not a special-case flow.

---

## 10. Error codes

| Code | When |
| --- | --- |
| `ROADMAP_NOT_COMPLETE` | `POST /choose-next` called on a roadmap without `finished_at` |
| `ROADMAP_ALREADY_REENROLLED` | `POST /choose-next` called after a re-enrollment job already exists |
| `REENROLLMENT_JOB_FAILED` | Worker exhausted retries generating the new roadmap |
| `ADVANCED_RECIPE_NOT_FOUND` | No advanced recipe exists for the completed role |
| `TOPUP_GAP_EMPTY` | All skills are mastered; no top-up content to generate |
| `COACH_ASSESSMENT_FAILED` | Coach job failed after retries; fallback to `new_goal` default |

---

## 11. Acceptance criteria

- [ ] Last required lesson completion triggers `checkRoadmapCompletion` as a post-commit hook
- [ ] `roadmaps.finished_at` is set exactly once; duplicate calls are no-ops
- [ ] Optional lessons do not block roadmap completion
- [ ] Completion transaction atomically sets `finished_at`, writes `completion_summary`, and enqueues graduation rewards + coach job
- [ ] Graduation rewards fire-and-forget; their failure does not roll back roadmap finalization
- [ ] `GET /roadmaps/:id/completion-summary` returns `404` when `finished_at IS NULL`
- [ ] `coachAssessment.ready` is `false` while the coach job is running; polling resolves it
- [ ] Coach model is Zod-validated; soft-fail defaults to `new_goal`
- [ ] Coach model cannot recommend a recipe not in `availableAdvancedRecipes`
- [ ] `POST /choose-next` with `new_goal` redirects to questionnaire fast-track
- [ ] `POST /choose-next` with `same_goal_advanced` or `top_up` enqueues `re_enrollment_jobs` and returns `jobId`
- [ ] The completed roadmap is archived; it is never deleted or overwritten
- [ ] Only one roadmap is active per user at any time; the old one moves to `completed` before the new one becomes active
- [ ] Top-up and advanced paths use the same Roadmap Generator pipeline (doc 03 §5), not a separate code path
- [ ] `TOPUP_GAP_EMPTY` is returned when all skills are already mastered
- [ ] `roadmap.completed.v1` and `roadmap.reenrollment_started.v1` events are fired and are analytics-failure-isolated

---

## 12. Out of scope (later)

- Multiple concurrent active roadmaps (multi-goal)
- Employer-verified skill certificates
- Social / cohort graduation moments
- Roadmap completion leaderboards
- Partial roadmap abandonment and archival (user quits mid-path)
