# 04 — Weekly Plan & Lessons

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arc Next.js PWA — Home Seal Week vault (`HomeWeekLockVault`), `/week` pulse, lesson flow  
**Product source:** `Arc_MVP_Full_Technical_Roadmap.md` §6 Weekly Planner, §6.9, §13.4 `generate_weekly_plan`; `Arc_Battle_XP_Gems_Coins_Referral_Spec.md` §3.1 Weekly Commitment Streak  
**Depends on:** [01 — User Model & Authentication](./01-user-model-and-authentication.md), [03 — Skill Graph, Roadmap Generator & AI Coach](./03-goals-and-roadmap.md)  
**Feeds:** [05 — Learn / Lesson Play](./05-Learn_Lesson_Play_API.md), [06 — Notifications](./06-notifications.md)

---

## Scope (MVP)

1. **Current week plan** — sessions + hours goals, day segments, task list
2. **Home Seal Week vault** — compact progress card (screenshot contract below)
3. **Week Pulse (`/week`)** — detail view of same week
4. **Seal / streak** — weekly commitment streak on `profiles.weekly_streak`
5. **Replan** — rebuild remaining tasks without client-supplied streak/rewards
6. **Lesson complete → week progress** — sessions/hours/day status update server-side

Out of MVP: daily activity streak freezes (doc 05), multi-week history UI, calendar drag-drop, coach full `weekly_replanner_v1` loop (stub OK).

---

## UI contract — Home Seal Week vault

Frontend: `HomeWeekLockVault` + `homeMockData.weeklyProgress` / `weeklyStreak`.

| UI element | Source field | Notes |
| --- | --- | --- |
| Orange flame badge `7` / `WKS` | `streak.weeks` | = `profiles.weekly_streak` (sealed weeks count) |
| Title `SEAL WEEK 8` | `streak.weeks + 1` while unsealed; `streak.weeks` when sealed | Target week being locked |
| Badge `On track` / `Catch up` | `progress.onTrack` | Server-computed — never client |
| Hero `1 left · ~40m` | `sessionsPlanned - sessionsDone`, `estimateMinutes` | Estimate = sum minutes of remaining tasks (or next task) |
| 7 day dashes | `streak.days[0..6]` | `done` = green; first `empty` = yellow “today/next”; later `empty` = muted |
| `3/4 sessions · 5.5/8h` | `sessionsDone/Planned`, `hoursDone/Planned` | Hours may be decimal |
| `+50` XP / `+8` gems chips | `lockRewardXp`, `lockRewardGems` | **Preview** of seal reward — grant only on seal |
| Sync / replan control | `POST /weeks/current/replan` | RefreshCw → replan |
| `Plan` CTA | `/week` | Detail screen |

**Derived (frontend today, may stay client):**

```ts
sessionsLeft = sessionsPlanned - sessionsDone
sealed = sessionsLeft <= 0
targetWeek = weeks + (sealed ? 0 : 1)
nextEmptyIndex = days.findIndex(d => d.status === "empty") // yellow dash
```

Prefer returning `sealed`, `sessionsLeft`, `targetWeek`, `estimateMinutes` from API so all clients match.

---

## Domain rules

### Weekly commitment streak (core retention)

- Streak increments **only when the week seals** (commitment met) — not on daily app open.
- Separate from daily activity streak (doc 05).
- Time zone: `profiles.timezone` (IANA). Week bounds: **Monday 00:00 → Sunday 23:59:59.999** in local TZ (product may later align close to 03:00 like daily deadline — keep one rule, document in code).
- Client cannot set `weekly_streak`, `onTrack`, rewards, or day statuses.

### Seal criteria (MVP default)

Week seals when **either**:

1. `sessionsDone >= sessionsPlanned`, **or**
2. `hoursDone >= hoursPlanned * 0.8` (80% of planned minutes)

Configurable per plan row later; ship defaults above.

On seal (idempotent, once per `week_start`):

1. `profiles.weekly_streak += 1`
2. Grant `lockRewardXp` → `profiles.total_xp`
3. Grant `lockRewardGems` → `profiles.gems`
4. Emit notification `weekly_recap` (prefs-gated)
5. Mark week row `status = sealed`

### On-track calculation

```
expectedSessionsByToday = ceil(sessionsPlanned * (dayIndex + 1) / 7)
  // dayIndex: Mon=0 … Sun=6 in user TZ

onTrack = sessionsDone >= expectedSessionsByToday - 1
  // soft: allow one session behind
```

Alternate (stricter): compare `hoursDone` vs proportional `hoursPlanned`. Use sessions for MVP; keep function swappable.

If week already sealed → `onTrack = true`.

### Day segment status

| Status | Meaning |
| --- | --- |
| `done` | ≥1 planned task completed that local day **or** verified study minutes ≥ day's planned minutes |
| `empty` | No qualifying completion yet |
| `today` (pulse only) | Local today and still `empty` / in progress |

Home vault uses `done | empty` only; yellow dash = first `empty` in Mon→Sun order.

### Lock rewards (preview vs grant)

| Field | Meaning |
| --- | --- |
| `lockRewardXp` | XP granted **on seal** (MVP default **50**) |
| `lockRewardGems` | Gems granted **on seal** (MVP default **8**) |

Do not add these to balance until seal. Completing individual lessons still awards lesson XP/gems via doc 05 — separate ledger.

---

## Modules (NestJS)

```
weeks/
  weeks.module.ts
  weeks.controller.ts      # /weeks/*
  weeks.service.ts         # plan CRUD, progress, seal, onTrack
  weeks.planner.service.ts # generate from roadmap + availability
  weeks.serializer.ts
  dto/
  entities/
    weekly-plan.entity.ts
    weekly-task.entity.ts
lessons/                   # or under roadmaps/
  lessons.controller.ts    # complete lesson → hooks weeks + rewards
```

Coach replan may call `WeeksPlannerService.replan(userId)` — coach never writes streak/rewards directly.

---

## Data model

### `weekly_plans`

One row per user per `week_start` (Monday date in user TZ, stored as `date`).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users` | |
| `roadmap_id` | `uuid` FK nullable | Active roadmap instance |
| `week_start` | `date` | Monday (user TZ calendar date) |
| `week_index` | `int` | Display “Seal week N” target — usually `weekly_streak + 1` at create |
| `sessions_planned` | `int` | e.g. 4 |
| `sessions_done` | `int` default 0 | Server-updated |
| `hours_planned` | `numeric(4,1)` | e.g. 8.0 |
| `hours_done` | `numeric(4,1)` default 0 | From completed task minutes / 60 |
| `lock_reward_xp` | `int` | Snapshot at plan create |
| `lock_reward_gems` | `int` | Snapshot at plan create |
| `status` | `enum` | `active` \| `sealed` \| `missed` \| `replanned` |
| `sealed_at` | `timestamptz` nullable | |
| `created_at` / `updated_at` | `timestamptz` | |

Unique: `(user_id, week_start)`.

### `weekly_tasks`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `weekly_plan_id` | `uuid` FK | Cascade |
| `lesson_id` | `uuid` nullable FK | Roadmap lesson when applicable |
| `day_index` | `smallint` | 0=Mon … 6=Sun |
| `title` | `varchar` | |
| `track` | `varchar` | e.g. `SQL Basics` |
| `minutes` | `int` | Estimate |
| `xp_reward` | `int` | Lesson/task XP (doc 05) |
| `status` | `enum` | `upcoming` \| `today` \| `done` \| `missed` \| `skipped` |
| `completed_at` | `timestamptz` nullable | |
| `sort_order` | `int` | |
| `href` | `varchar` nullable | Client path hint `/learn/:id` |

### Profile fields (already exist)

| Column | Role |
| --- | --- |
| `weekly_streak` | Sealed-week count → flame badge |
| `timezone` | Week bounds + day labels |
| `total_xp` / `gems` | Updated on seal (+ lesson grants) |

---

## HTTP API (`/api/v1`, JWT)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/weeks/current` | Home vault + pulse payload |
| `POST` | `/weeks/current/replan` | Rebuild remaining tasks (Arlo / sync) |
| `PATCH` | `/weeks/current/tasks/:taskId` | Reschedule / skip (`dayIndex`, `status`) |
| `POST` | `/lessons/:lessonId/complete` | Complete lesson → progress + rewards (may live in lessons module) |

### `GET /weeks/current` response

Matches Home + Week Pulse consumers:

```json
{
  "weekLabel": "Week commitment",
  "rangeLabel": "Jul 6 – Jul 12",
  "weekStart": "2026-07-06",
  "targetWeek": 8,
  "sealed": false,
  "sessionsLeft": 1,
  "estimateMinutes": 40,
  "replanHref": "/week",
  "progress": {
    "percent": 68,
    "hoursDone": 5.5,
    "hoursPlanned": 8,
    "sessionsDone": 3,
    "sessionsPlanned": 4,
    "onTrack": true,
    "lockRewardXp": 50,
    "lockRewardGems": 8
  },
  "streak": {
    "weeks": 7,
    "days": [
      { "label": "Mon", "status": "done" },
      { "label": "Tue", "status": "done" },
      { "label": "Wed", "status": "done" },
      { "label": "Thu", "status": "done" },
      { "label": "Fri", "status": "done" },
      { "label": "Sat", "status": "empty" },
      { "label": "Sun", "status": "empty" }
    ]
  },
  "days": [
    {
      "label": "Mon",
      "full": "Monday",
      "status": "done",
      "minutesPlanned": 60,
      "minutesDone": 65
    }
  ],
  "tasks": [
    {
      "id": "…",
      "dayLabel": "Sat",
      "title": "Filtering with WHERE",
      "track": "Coding Practice",
      "minutes": 40,
      "xp": 25,
      "status": "today",
      "href": "/learn/lesson-1"
    }
  ],
  "arloNudge": "Five days locked. Finish Saturday to lock week 8 — Sunday can flex. No guilt."
}
```

`percent` = `round(100 * hoursDone / hoursPlanned)` capped 100 (or sessions ratio if hours_planned = 0).

If no plan exists but roadmap ready → generate synchronously or return `202`-style `{ "status": "generating" }` + job id (prefer sync for MVP if planner is deterministic).

### `POST /weeks/current/replan`

Body (optional):

```json
{
  "mode": "catch_up",
  "reduceHours": false
}
```

| `mode` | Behavior |
| --- | --- |
| `catch_up` | Pack missed tasks into remaining days |
| `reduce` | Lower `sessions_planned` / `hours_planned` (min floors) |
| `rebuild` | Fresh select from roadmap for leftover capacity |

Rules:

- Never decrease `weekly_streak`
- Never auto-grant lock rewards
- Missed tasks → `missed` or rescheduled; no guilt copy required server-side (Arlo nudge string OK)
- Rate-limit: max **2** successful replans per week (aligns Weekly Replan Token product later)

Response: same shape as `GET /weeks/current`.

### `POST /lessons/:lessonId/complete`

Orchestration (lessons module calls weeks + rewards):

1. Idempotent complete check
2. Award lesson XP/gems (doc 05)
3. If lesson linked to `weekly_tasks` → mark task `done`, bump `sessions_done` / `hours_done`
4. Recompute day segment for that `day_index`
5. If seal criteria met → run seal transaction
6. Return reward payload + refreshed week summary (optional embed)

---

## Plan generation (`generate_weekly_plan`)

Input:

- `userId`, active `roadmap_id`
- `week_start`
- Availability from questionnaire / profile (`studyHours`, schedule days)

Logic:

1. Pull next incomplete roadmap lessons in order
2. Fit into available day slots until `hours_planned` / `sessions_planned` filled
3. Snapshot `lock_reward_xp` / `lock_reward_gems` defaults (50 / 8)
4. Insert `weekly_plans` + `weekly_tasks`

Trigger:

- After roadmap job `ready` (first week)
- Monday rollover cron (or lazy on first `GET /weeks/current` of new week)
- Missed previous week → create new plan with `status` path that can emit `missed_week_recovery` notification

---

## Week rollover & missed weeks

| Previous week end state | Action |
| --- | --- |
| `sealed` | Streak already incremented; create next plan |
| `active` but criteria unmet | Set `missed`; **do not** reset streak to 0 in MVP soft mode — hold streak, emit recovery notif (product: Comeback Eagle). Hard reset = later flag. |
| No plan | Create from roadmap |

MVP recommendation: **soft miss** (streak holds, recovery nudge) — adults not punished for one bad week. Document flag `WEEKS_STREAK_RESET_ON_MISS=false`.

---

## Error codes

| Code | HTTP | When |
| --- | --- | --- |
| `WEEK_NOT_FOUND` | 404 | No current plan and cannot generate |
| `WEEK_ALREADY_SEALED` | 409 | Replan / mutate sealed week |
| `TASK_NOT_FOUND` | 404 | Bad task id |
| `REPLAN_LIMIT` | 429 | >2 replans this week |
| `ROADMAP_NOT_READY` | 409 | No path to schedule from |
| `LESSON_ALREADY_COMPLETED` | 409 | Idempotent complete |

---

## Frontend mapping (current mocks → API)

| Mock | API |
| --- | --- |
| `homeMockData.weeklyProgress` | `progress` |
| `homeMockData.weeklyStreak` | `streak` (`weeks` ← profile) |
| `weekPulseMockData` | full `GET /weeks/current` |
| `HomeWeekLockVault` props | subset of current week |
| `estimateMinutes` | server `estimateMinutes` |

Replace mocks when endpoint ships; keep types aligned with `HomeMockData["weeklyProgress"]` / `["weeklyStreak"]`.

---

## Security

1. **Never trust client** for `onTrack`, day `status`, `sessionsDone`, `hoursDone`, streak, or lock rewards.
2. All mutations scoped to `req.user.id`.
3. Seal + reward grant in **one DB transaction**.
4. Replan cannot invent XP/gems.

---

## Notifications hooks

| Event | Type | When |
| --- | --- | --- |
| Behind pace mid-week | `streak_risk` | `!onTrack` and sessionsLeft > 0 near week end |
| Week sealed | `weekly_recap` | After seal |
| Missed week | `missed_week_recovery` | Rollover miss |
| Replan ready | `replan_suggestion` | After coach/system replan |

Respect `streakReminders` preference ([06](./06-notifications.md)).

---

## Implementer checklist

- [ ] Migrations: `weekly_plans`, `weekly_tasks`
- [ ] `WeeksService.getCurrent(userId)` — lazy create if missing
- [ ] `onTrack` + day segment + `estimateMinutes` serializers
- [ ] Seal transaction → streak + XP + gems + notif
- [ ] `POST /weeks/current/replan` with rate limit
- [ ] Lesson complete hook updates plan
- [ ] Monday rollover / lazy week boundary
- [ ] e2e: generate plan → complete sessions → seal → `weekly_streak` +1, balances up
- [ ] Unit: onTrack soft rule; 80% hours seal; idempotent seal
- [ ] Frontend: wire `HomeWeekLockVault` + `WeekPulseScreen` to `GET /weeks/current`

---

## Env

```env
WEEKS_LOCK_REWARD_XP=50
WEEKS_LOCK_REWARD_GEMS=8
WEEKS_SEAL_HOURS_RATIO=0.8
WEEKS_STREAK_RESET_ON_MISS=false
WEEKS_REPLAN_MAX_PER_WEEK=2
WEEKS_TZ_FALLBACK=UTC
```
