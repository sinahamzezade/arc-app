# Learn / Lesson Play — Backend Implementation Spec

**Version:** 2.0 integrated  
**Integration:** Lesson completion is the central orchestration transaction connecting progress, Gamification, Roadmap unlocks, Weekly Plan, Course Timing, streak, rank, league, and notifications.

**Status:** Backend + frontend wired. App uses `GET/POST/PATCH /api/v1/lessons/:id/...`.  
**Source of truth (UI):** `arc-app` learn routes + lesson components.  
**Backend:** `LessonsModule` — see §4.

---

## 1. Problem

Frontend play flow is live:

```
/learn
  → /learn/:lessonId              (overview)
  → /learn/:lessonId/content      (paged teaching)
  → /learn/:lessonId/practice     (MCQ with hint)
  → /learn/:lessonId/quiz         (multi-question check)
  → /learn/:lessonId/reward       (claim XP / gems / coins / badge)
  → /learn/:lessonId/arlo         (side coach chat)
```

Today:

| Need                                                          | Current behavior                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Lesson metadata                                               | `GET /roadmaps/current` → `RoadmapLessonDto` (title, type, minutes, xp, status, resource) |
| Play body (content / practice / quiz / reward / arlo prompts) | Client mock (`lesson-1`) or **synthesized** from title via `buildLessonFromRoadmap`       |
| Session progress                                              | Zustand only — lost on refresh                                                            |
| Complete + economy                                            | Local `markCompleted()` — **no** XP/gems/coins/badge write, **no** lesson unlock          |
| Correct answers                                               | Sent to client in cleartext (`correct`, `correctOptionId`)                                |
| Arlo                                                          | Local keyword stubs                                                                       |

Backend must replace client synth + local completion with authoritative APIs.

---

## 2. Frontend contract (what UI already expects)

Canonical playable shape (from `arc-app/src/lib/lesson/mock-data.ts`):

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
  xpReward: number; // preview only; award on complete is server-owned
  objective: string;
  resource: {
    label: string;
    href: string; // http(s) or app path
    note: string;
  };
  arloPrompt: string; // overview hero line
  content: Array<{
    id: string;
    title: string;
    blocks: LessonContentBlock[];
  }>;
  practice: {
    prompt: string;
    hint: string;
    options: Array<{ id: string; label: string; correct?: boolean }>; // see §4.2
  };
  quiz: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string }>;
    correctOptionId?: string; // do NOT send pre-check; see §4.2
    explanation?: string;
  }>;
  reward: {
    xp: number;
    gems: number;
    coins: number;
    badgeId?: string; // e.g. "first-step"
    badgeLabel?: string;
    arloLine: string;
  };
  suggestedArlo: string[]; // chip prompts on Arlo screen
};
```

Session state already tracked client-side (optional to sync):

```ts
{
  lessonId: string;
  contentStep: number; // 0-based content page index
  practiceDone: boolean;
  quizAnswers: Record<string /* questionId */, string /* optionId */>;
  completed: boolean;
}
```

Path entry: nodes link to `/learn/${lesson.id}` from roadmap tree (`status: locked | available | completed`).

---

## 3. What already exists in backend

### 3.1 Entities (keep / extend)

| Entity           | Table              | Notes                                                                                                                                                                               |
| ---------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Lesson`         | `lessons`          | UUID, milestone, template FK, title, mission, description, type, minutes, difficulty, `xpReward`, order, resource, `status`                                                         |
| `LessonProgress` | `lesson_progress`  | Unique `(userId, lessonId)`; status `not_started \| in_progress \| completed`; started/completed timestamps; `timeSpentMinutes`; `xpAwarded`; `retryCount` — **no service/API yet** |
| `LessonTemplate` | `lesson_templates` | Has unused `contentOutline` jsonb — candidate store for play payload                                                                                                                |
| `Profile`        | `profiles`         | `totalXp`, `coins`, `gems` — award targets                                                                                                                                          |
| Roadmap tree DTO | via serializer     | Metadata only; no play body                                                                                                                                                         |

### 3.2 Existing HTTP (unchanged)

- `GET /roadmaps/current`
- `GET /roadmaps/jobs/:jobId`

Do **not** bloating tree DTO with full content. Keep tree lean; add dedicated lesson play endpoints.

---

## 4. Required APIs

Auth: all endpoints require authenticated user. Lesson must belong to user’s current roadmap (or be reachable via ownership check). Locked lessons → `403`.

### 4.1 `GET /lessons/:lessonId/play`

Returns full playable lesson for overview + content + practice + quiz + reward preview + Arlo chips.

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
      { "id": "a", "label": "<p>Hello Arc</p>" },
      { "id": "b", "label": "<p>Hello Arc<p>" }
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
    "quizAnswers": {},
    "startedAt": null,
    "completedAt": null
  }
}
```

**Security — grading keys**

- On `GET …/play`, **omit** `correct` / `correctOptionId` / quiz explanations.
- Reveal only after check/submit (§4.3–4.4).

**Errors:** `404` unknown lesson; `403` locked / not owned.

---

### 4.2 `POST /lessons/:lessonId/start`

Called when user opens overview / taps Start (frontend already calls local `startLesson`).

**Effects**

1. Upsert `lesson_progress` → `in_progress`, set `startedAt` if null.
2. Increment `retryCount` only if previously `completed` and user restarts (product choice — default: allow restart, reduced rewards on re-complete).

**Response `200`**

```json
{
  "lessonId": "uuid",
  "status": "in_progress",
  "startedAt": "ISO-8601"
}
```

---

### 4.3 `PATCH /lessons/:lessonId/progress`

Optional but recommended — resume after refresh.

**Body**

```json
{
  "contentStep": 1,
  "practiceDone": false,
  "quizAnswers": { "q1": "b" },
  "timeSpentMinutes": 6
}
```

Store step fields on `lesson_progress` (add jsonb column `session_state` if not present):

```ts
sessionState: {
  contentStep: number;
  practiceDone: boolean;
  practiceOptionId?: string | null;
  quizAnswers: Record<string, string>;
  quizIndex?: number;
}
```

Do not mark completed here.

---

### 4.4 `POST /lessons/:lessonId/practice/check`

**Body:** `{ "optionId": "a" }`

**Response**

```json
{
  "correct": true,
  "correctOptionId": "a",
  "feedback": "Nailed it — tags closed clean."
}
```

Server stores `practiceDone: true` in session state. Wrong answers still allow continue (UI does not gate).

---

### 4.5 `POST /lessons/:lessonId/quiz/check`

Per-question check (matches UI “Check” then reveal explanation).

**Body:** `{ "questionId": "q1", "optionId": "b" }`

**Response**

```json
{
  "correct": true,
  "correctOptionId": "b",
  "explanation": "Body is the stage. Head is backstage metadata."
}
```

Persist answer into `session_state.quizAnswers`.

---

### 4.6 `POST /lessons/:lessonId/complete` ★ critical

Called when UI hits reward screen (“Claim reward”). **Server-authoritative economy.**

**Body (recommended)**

```json
{
  "quizAnswers": { "q1": "b", "q2": "b", "q3": "b" },
  "practiceOptionId": "a",
  "timeSpentMinutes": 14
}
```

**Server steps (transaction)**

1. Require `Idempotency-Key`; load and lock lesson instance, published content version, attempt, and progress.
2. Verify ownership and server-derived unlock state.
3. If the same completion command already succeeded, return the stored completion result.
4. Grade practice/quiz from server-held keys and persist an immutable attempt result.
5. Ask Gamification to calculate the final reward from reward class, difficulty, course position, score, assistance, and repeat state.
6. Mark `lesson_progress` completed and store score/assistance/reward transaction reference.
7. Grant XP/Gems/Coins through the immutable wallet ledger.
8. Evaluate immediate roadmap/milestone unlocks; never write a global lesson-template status.
9. Complete the linked weekly task and add verified minutes exactly once.
10. Write outbox events (`lesson.completed.v1`, `reward.granted.v1`, optional milestone event).
11. Commit one transaction. After commit, Course Timing, daily streak, rank, league, badges, and Notifications consume the events idempotently.

**Response `200`**

```json
{
  "lessonId": "uuid",
  "status": "completed",
  "quizScore": { "correct": 3, "total": 3, "perfect": true },
  "reward": {
    "xp": 35,
    "gems": 2,
    "coins": 15,
    "badgeId": "first-step",
    "badgeLabel": "First Step",
    "arloLine": "Plot twist: you shipped a real webpage skeleton. Rookie no more."
  },
  "wallet": {
    "lifetimeXp": 135,
    "gems": 12,
    "coins": 40,
    "version": 8
  },
  "unlockedLessonIds": ["uuid-next"],
  "roadmapProgressPercent": 8
}
```

Frontend maps `reward` → reward screen; can drop local-only `markCompleted` once wired.

---

### 4.7 Arlo (phase 2 — optional for MVP wire)

UI today: mock replies + `suggestedArlo` chips.

Minimal MVP: chips come from `GET …/play`. Chat can stay client-stub.

When ready:

`POST /lessons/:lessonId/arlo/chat`

```json
{ "message": "Explain head vs body like I'm five" }
```

```json
{ "reply": "…" }
```

Scope replies to lesson title + objective + content outline. No answers that spoil quiz keys before complete.

---

## 5. Reward Calculation Contract

The complete reward model is defined in [gamification.md](./gamification.md).

Lesson Play supplies verified inputs only:

- lesson `rewardClass`
- lesson type and difficulty
- required-order/course-position percentile
- quiz/practice score
- assistance used
- first-completion/review state
- verified time and any eligible boost inventory

Gamification returns:

- Lifetime XP
- qualified League XP
- Gems
- Coins
- badge candidates
- applied multipliers/caps and rule version

`rewardPreview` on `GET /play` is generated by the same calculator using an assumed first-pass result and is non-binding. Actual completion may differ because score, hints, repeat state, caps, course position, or boosts change the calculation.

Roadmap/lesson rows may store `reward_class` and preview snapshots, but never an authoritative final reward. The client cannot submit reward amounts.

---

## 6. Content storage model

### 6.1 Recommended: structured jsonb on template + optional lesson override

Extend `lesson_templates.content_outline` (already jsonb) to a typed schema:

```json
{
  "objective": "…",
  "arloPrompt": "…",
  "suggestedArlo": ["…"],
  "content": [
    /* LessonContentPage[] */
  ],
  "practice": {
    "id": "p1",
    "prompt": "…",
    "hint": "…",
    "options": [
      { "id": "a", "label": "…", "correct": true },
      { "id": "b", "label": "…", "correct": false }
    ],
    "feedbackCorrect": "…",
    "feedbackIncorrect": "…"
  },
  "quiz": [
    {
      "id": "q1",
      "prompt": "…",
      "options": [{ "id": "a", "label": "…" }],
      "correctOptionId": "b",
      "explanation": "…"
    }
  ],
  "rewardPresentation": {
    "rewardClass": "standard_practice",
    "arloLine": "…",
    "badgeCandidateKey": null
  }
}
```

Resolution order for play payload:

1. `lessons` row override jsonb (if you add `play_content`) — rare personalization
2. Else `lesson_templates.content_outline`
3. Else generation job / AI fill (roadmap generator) that writes outline when creating lessons
4. Else fail `422` “content not ready” — **do not** ship title-only synth from API (frontend will stop synthesizing once API exists)

### 6.2 Seed

Port `arc-app` catalog `lesson-1` (HTML Hello World) into a template + first roadmap lesson as golden fixture for E2E.

### 6.3 Roadmap generator change

When creating `Lesson` rows, either:

- attach `lesson_template_id` with filled `content_outline`, or
- write play content onto lesson at generation time.

Metadata-only lessons are insufficient for play API.

---

## 7. Progress ↔ roadmap tree

Today tree exposes `lesson.status` from `lessons.status` column.

**Preferred model**

- Persist per-user state only on `lesson_progress`.
- Serializer derives tree status:

| Progress                        | Tree status                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| none / `not_started` + gated    | `locked`                                                                                              |
| none / `not_started` + unlocked | `available`                                                                                           |
| `in_progress`                   | `available` (or `in_progress` if you extend enum — UI currently only uses locked/available/completed) |
| `completed`                     | `completed`                                                                                           |

Unlock rule (MVP): completing lesson N unlocks lesson N+1 in same milestone; completing last lesson in milestone unlocks next milestone’s first lesson / unlocks phase as product requires.

Update `roadmap.progressPercent` = completed lessons / total lessons.

---

## 8. Schema additions (suggested migrations)

```text
lesson_progress
  + session_state jsonb NOT NULL DEFAULT '{}'
  + gems_awarded int NOT NULL DEFAULT 0
  + coins_awarded int NOT NULL DEFAULT 0
  + quiz_correct int NULL
  + quiz_total int NULL
  + practice_correct boolean NULL

-- optional
lessons
  + play_content jsonb NULL          -- override outline
  + objective text NULL              -- or keep in jsonb only

-- badges (if not present)
user_badges (user_id, badge_id, unlocked_at) UNIQUE(user_id, badge_id)
```

Wire `LessonProgress` into a new `LessonsModule` (or extend `RoadmapsModule`) with controller + service.

---

## 9. NestJS module sketch

```
LessonsModule
  LessonsController
    GET    /lessons/:id/play
    POST   /lessons/:id/start
    PATCH  /lessons/:id/progress
    POST   /lessons/:id/practice/check
    POST   /lessons/:id/quiz/check
    POST   /lessons/:id/complete
  LessonsService
    resolvePlayPayload(user, lessonId)
    start / saveProgress / checkPractice / checkQuiz / complete
  LessonContentService
    loadOutline(lesson) → strip secrets for GET
  LessonCompletionOrchestrator
    one transaction across progress + Gamification + unlock + weekly task
  GamificationService
    calculate + ledger grant (idempotent)
  LessonUnlockService
    unlock next + recompute roadmap %
```

DTOs: class-validator for bodies; serializers strip `correct` / `correctOptionId` / `explanation` on play GET.

---

## 10. Frontend swap checklist (for app after backend ships)

1. Add `lib/api/lessons.ts` clients for endpoints above.
2. Replace `resolvePlayableLesson` / `buildLessonFromRoadmap` with `GET …/play` (keep mock only for Storybook / offline).
3. Overview → `POST …/start`.
4. Practice / Quiz Check → server check endpoints; stop reading local `correct` flags.
5. Reward mount → `POST …/complete`; render response `reward` + refresh profile/path.
6. Optionally hydrate Zustand from `progress` on play GET.

---

## 11. Acceptance criteria

- [ ] Authenticated user can load play payload for an `available` lesson with real content (not title synth).
- [ ] Locked lesson returns 403.
- [ ] Correct answers never appear on GET play.
- [ ] Complete is idempotent; second call does not double XP/gems/coins.
- [ ] Wallet ledger and lesson progress update atomically; Profile mirrors, if retained, match the wallet.
- [ ] Next lesson unlocks; `GET /roadmaps/current` reflects `completed` / `available`.
- [ ] First lesson complete grants `first-step` badge once.
- [ ] Seeded HTML lesson matches UI golden path end-to-end.
- [ ] Repeat completion does not farm full XP (reduced or zero).

---

## 12. Out of scope (this doc)

- Full Arlo LLM coach (phase 2).
- Coding sandbox / project submit lessons.
- Weekly plan generation is separate, but linked weekly-task completion is part of the completion transaction.
- League consumes only the qualified League XP emitted by Gamification; Lesson Play does not write league scores directly.
- Paywall / premium lesson gates.

---

## 13. File map (frontend reference)

| Path                                                             | Role                               |
| ---------------------------------------------------------------- | ---------------------------------- |
| `arc-app/src/app/(routes)/learn/**`                              | Routes                             |
| `arc-app/src/components/lesson/*`                                | Screens                            |
| `arc-app/src/lib/lesson/mock-data.ts`                            | Playable types + golden `lesson-1` |
| `arc-app/src/lib/lesson/map-play.ts`                              | Map GET play DTO → UI lesson |
| `arc-app/src/hooks/usePlayableLesson.ts`                          | Live play loader + hydrate   |
| `arc-app/src/store/useLessonStore.ts`                            | Ephemeral session                  |
| `arc-app/src/schemas/lesson.ts`                                  | Zod progress shape (unused)        |
| `arc-app/src/lib/api/types.ts`                                   | `RoadmapLessonDto` metadata        |
| `arc-backend/src/roadmaps/entities/lesson.entity.ts`             | Lesson row                         |
| `arc-backend/src/roadmaps/entities/lesson-progress.entity.ts`    | Progress row (wire up)             |
| `arc-backend/src/skill-graph/entities/lesson-template.entity.ts` | `contentOutline`                   |

---

## 14. Priority order for implementers

1. **Content schema + seed** into `content_outline` / play payload loader
2. **`GET /lessons/:id/play`** (strip secrets)
3. **`POST …/complete`** + Gamification ledger + unlock + weekly-task transaction
4. **`POST …/start`** + progress PATCH
5. **Practice/quiz check** endpoints (stop leaking keys)
6. Arlo chat (optional)

## 15. Integrated Attempts, Content Versions and Event Contract

### 15.1 Published content version

`GET /lessons/:id/play` resolves the exact published `lesson_version_id` snapshotted by the user’s lesson instance. It must not use the newest pool draft automatically.

The payload includes:

- `contentVersionId`
- `contentSchemaVersion`
- `rewardRuleVersion`
- `attemptId` after start
- server timestamps

### 15.2 Attempts

Add `lesson_attempts`:

- user/lesson/progress
- attempt number
- content version
- started/submitted/completed times
- assistance usage
- score snapshot
- reward eligibility
- status

Practice and quiz checks reference `attemptId`. Answers from an expired/different content version are rejected.

### 15.3 Progress PATCH security

Client may submit navigation state and incremental answers, but:

- time spent is bounded and reconciled with server timestamps/heartbeats
- client cannot set `practiceDone`, score, completed, or reward eligibility as authority
- answer IDs are validated against the attempt’s content version

### 15.4 Completion result persistence

Persist a `lesson_completion_results` or equivalent snapshot containing reward, score, unlock IDs, roadmap projection, and transaction IDs. Repeated completion calls return this snapshot.

### 15.5 Cross-module event payload

`lesson.completed.v1` includes IDs and verified facts:

```json
{
  "lessonId": "uuid",
  "lessonProgressId": "uuid",
  "attemptId": "uuid",
  "roadmapId": "uuid",
  "milestoneId": "uuid",
  "weeklyTaskId": "uuid-or-null",
  "verifiedMinutes": 25,
  "scorePercent": 92,
  "difficulty": "intermediate",
  "lessonType": "coding_practice",
  "rewardTransactionGroupId": "uuid",
  "qualifiedLeagueXp": 45
}
```

No correct-answer keys are placed in events or notifications.

### 15.6 Failure handling

If the completion transaction fails, no reward, weekly completion, or unlock remains committed. External notification/analytics failure does not roll back a successful lesson.

### 15.7 Additional acceptance

- play/attempt/completion all use the same content version
- completion is safe under duplicate requests and two open devices
- weekly progress cannot double count one completion
- reward ledger is the economy source of truth
- event replay cannot re-award or re-complete the lesson
