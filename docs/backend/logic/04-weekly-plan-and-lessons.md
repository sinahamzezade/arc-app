# 04 — Weekly Plan, Current Mission & Weekly Commitment

**Version:** 2.0 integrated  
**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Home Seal Week vault, Today’s Mission, `/week`, Course Timing, Lesson Play  
**Depends on:** [00](./00-system-integration.md), [03](./03-goals-and-roadmap.md), [course_timing](./course_timing.md), [gamification](./gamification.md)  
**Feeds:** [05](./05-Learn_Lesson_Play_API.md), [06](./06-notifications.md)

---

## 1. Ownership and Boundary

Course Timing owns the long-term schedule and future `schedule_slots`.

This module owns a **current learning-week projection**:

- planned sessions/minutes
- tasks assigned to the current week
- Today’s Mission selection
- on-track/catch-up state
- weekly seal evaluation
- current-week replan entry point

Lesson Play owns lesson completion. Gamification owns balances and streak records. Notifications owns reminders and recaps.

The Weekly Plan must not independently invent curriculum, grade lessons, or write XP/Gems directly.

---

## 2. Learning Week Boundary

Use the same protected learning-day convention across scheduling and streak logic:

```text
Monday 03:00 local time → next Monday 02:59:59.999 local time
```

Store:

- `week_start_local_date` (Monday display date)
- resolved UTC `window_start_at` / `window_end_at`
- `timezone_snapshot`

A timezone change does not retroactively move an active week.

---

## 3. UI Contract — Home Seal Week Vault

| UI | Server field |
|---|---|
| Flame / WKS | `weeklyStreak` from Gamification streak state |
| `SEAL WEEK N` | `targetWeek` |
| On track / Catch up | `progress.status` |
| `1 left · ~40m` | `sessionsLeft`, `remainingMinutes` |
| Mon–Sun marks | `days[]` |
| `3/4 sessions · 5.5/8h` | verified progress |
| Reward preview | `sealRewardPreview` |
| Today’s Mission | highest-priority eligible weekly task |
| Replan | delegates to Course Timing |

The response is server-computed. Frontend may format labels but must not derive seal/reward state as authority.

---

## 4. Plan State

`weekly_plans.status`:

- `building`
- `active`
- `sealed`
- `missed`
- `replanned`
- `archived`

A replan creates a new plan version for the same learning week; the latest active version is displayed. Completed task records remain linked for history and cannot be erased.

---

## 5. Data Model

### 5.1 `weekly_plans`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | |
| `roadmap_id` | uuid | Active roadmap version |
| `course_schedule_id` | uuid nullable | Timing source |
| `schedule_version` | int | Invalidates stale reminders |
| `plan_version` | int | Version within week |
| `week_start_local_date` | date | Monday label |
| `window_start_at` / `window_end_at` | timestamptz | UTC boundary snapshot |
| `timezone_snapshot` | varchar | IANA |
| `sessions_planned` / `sessions_done` | int | Server-owned |
| `minutes_planned` / `verified_minutes_done` | int | Prefer minutes over decimal hours |
| `seal_rule_snapshot` | jsonb | Criteria/version |
| `seal_reward_rule_key` | varchar | Gamification rule reference |
| `status` | enum | See §4 |
| `sealed_at` | timestamptz nullable | |
| `created_at` / `updated_at` | timestamptz | |

Unique active version constraint per `(user_id, week_start_local_date)`.

### 5.2 `weekly_tasks`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `weekly_plan_id` | uuid | |
| `schedule_slot_id` | uuid nullable | Course Timing source |
| `lesson_id` | uuid nullable | Personalized lesson instance |
| `task_type` | enum | lesson, review, challenge, project, recovery |
| `local_day_index` | smallint | Mon=0 … Sun=6 |
| `planned_start_at` | timestamptz nullable | |
| `planned_minutes` | int | |
| `verified_minutes` | int | Server-derived |
| `priority` | int | Mission selection |
| `status` | enum | planned, available, in_progress, completed, missed, moved, skipped |
| `completion_source_type/id` | nullable | Audit link |
| `completed_at` | timestamptz nullable | |
| `sort_order` | int | |

A task is completed from a trusted domain event, normally `lesson.completed.v1`; the client cannot mark it done directly.

### 5.3 `weekly_plan_events`

Append-only audit rows for generated, task moved, task completed, sealed, missed, and replanned transitions.

---

## 6. Plan Generation

Triggered after `schedule.generated.v1` and at weekly rollover.

1. load incomplete schedule slots intersecting the learning-week window
2. select required tasks before optional tasks
3. snapshot planned minutes and reward rule
4. calculate session target
5. choose Today’s Mission from due/available tasks
6. persist plan and tasks
7. create reminder schedule through Notifications

If no schedule is ready, return `building` rather than an empty successful plan.

---

## 7. Today’s Mission Selection

Order candidates by:

1. in-progress task
2. overdue required task that can still save the week
3. scheduled task for current learning day
4. next prerequisite task
5. short optional task fitting remaining user time

A task must be unlocked according to Roadmap/Gamification Unlock Evaluator.

Return one primary mission and optional alternatives. Mission state may be `start`, `resume`, `almost_done`, `recovery`, or `rest_day`.

---

## 8. Verified Progress

Progress comes from trusted sources:

- completed lesson/challenge/project
- accepted assessment
- verified Study Together focus minutes
- server-approved recovery task

Do not count app-open time, background timers, Lucky Wheel, shop browsing, or client-only timer values.

A lesson completion linked to a weekly task updates, in the same orchestration transaction:

- task status/completion
- verified minutes
- sessions done when the task qualifies as a session
- day status
- seal evaluation

The source completion ID is unique to prevent double counting.

---

## 9. Seal Criteria

Default plan snapshot:

```text
seal when sessions_done >= sessions_planned
OR verified_minutes_done >= 80% of minutes_planned
```

A plan may additionally require a `must_complete_task_id` for a critical weekly mission.

Seal is idempotent and executes once:

1. lock active weekly plan
2. re-evaluate trusted progress
3. set `sealed`
4. call `GamificationService.sealWeek()`
5. increment weekly streak in streak source of truth
6. grant seal reward through ledger
7. write `week.sealed.v1` outbox event
8. Notifications creates recap/chest message

Never update profile balance fields directly.

---

## 10. On-Track Calculation

Use both time and session pace:

```text
elapsed_ratio = elapsed_learning_week_minutes / total_learning_week_minutes
expected_minutes = minutes_planned × elapsed_ratio
expected_sessions = floor(sessions_planned × elapsed_ratio)
```

States:

- `ahead`: actual ≥ expected + one meaningful session
- `on_track`: actual near expected, with one-session grace
- `catch_up`: behind but seal remains realistically possible
- `at_risk`: insufficient remaining capacity
- `sealed`: completed

Course Timing supplies remaining available capacity so `at_risk` is realistic, not only calendar-based.

---

## 11. Replan

`POST /weeks/current/replan` is an orchestration endpoint.

It delegates to Course Timing:

1. validate reason and requested constraint
2. preserve completed tasks and earned rewards
3. move only incomplete future slots
4. create new schedule version
5. project a new weekly-plan version
6. cancel stale notifications from the old version
7. schedule new reminders
8. emit `schedule.replanned.v1`

Supported reasons:

- `user_request`
- `missed_sessions`
- `reduce_workload`
- `increase_pace`
- `availability_changed`
- `coach_recommendation`

A Gem Replan Token, when required by product rules, is consumed by Gamification before the replan commits.

---

## 12. Week Rollover

Idempotent job per user/week:

- if sealed: archive when next plan activates
- if active and criteria not met: mark `missed`
- streak break/recovery rules remain owned by Gamification
- create no-guilt recovery notification
- request next schedule window and plan
- preserve all historical tasks

The job must use the snapshotted boundary and survive retries.

---

## 13. API (`/api/v1`, JWT)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/weeks/current` | Home + Week detail projection |
| `GET` | `/weeks/:weekStart` | Historical read |
| `POST` | `/weeks/current/replan` | Delegate integrated replan |
| `POST` | `/weeks/current/tasks/:taskId/move` | Course Timing move command |
| `POST` | `/weeks/current/tasks/:taskId/skip` | Policy-checked skip/replacement |

Lesson completion remains `POST /lessons/:lessonId/complete` in doc 05.

### Current response

```json
{
  "status": "active",
  "weekStart": "2026-07-06",
  "windowStartAt": "2026-07-06T01:00:00Z",
  "windowEndAt": "2026-07-13T00:59:59.999Z",
  "targetWeek": 8,
  "todayMission": {
    "taskId": "uuid",
    "lessonId": "uuid",
    "title": "Filtering with WHERE",
    "state": "resume",
    "estimatedMinutes": 25,
    "href": "/learn/uuid"
  },
  "progress": {
    "status": "on_track",
    "percent": 68,
    "verifiedMinutesDone": 330,
    "minutesPlanned": 480,
    "sessionsDone": 3,
    "sessionsPlanned": 4,
    "sessionsLeft": 1,
    "remainingMinutes": 40
  },
  "weeklyStreak": 7,
  "sealRewardPreview": {"xp": 50, "gems": 8},
  "days": [
    {"dayIndex": 0, "status": "completed"},
    {"dayIndex": 1, "status": "completed"},
    {"dayIndex": 2, "status": "completed"},
    {"dayIndex": 3, "status": "current"}
  ],
  "tasks": []
}
```

---

## 14. Notification Hooks

- plan/session reminder creation after schedule projection
- catch-up or at-risk nudge
- stale reminder cancellation on replan
- weekly recap on seal
- missed-week recovery on rollover

All messages are created through Notifications and use dedupe keys containing schedule/plan version.

---

## 15. Error Codes

- `WEEK_PLAN_BUILDING`
- `WEEK_PLAN_NOT_FOUND`
- `WEEK_PLAN_ALREADY_SEALED`
- `WEEK_TASK_NOT_FOUND`
- `WEEK_TASK_ALREADY_COMPLETED`
- `WEEK_REPLAN_CONFLICT`
- `WEEK_REPLAN_NOT_ALLOWED`
- `WEEK_VERSION_CONFLICT`

---

## 16. Acceptance Criteria

- current week is a projection of Course Timing, not an independent curriculum
- all week boundaries use the documented 03:00 learning-week rule
- Today’s Mission is always unlocked and actionable
- lesson completion updates linked weekly progress exactly once
- weekly seal and reward are atomic and idempotent
- reward/streak writes go through Gamification
- replan preserves completed history and cancels stale reminders
- Home and Week detail read the same server projection
- rollover survives retries and produces no duplicate rewards or notifications
