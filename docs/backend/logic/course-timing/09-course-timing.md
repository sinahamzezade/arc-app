# 09 — Course Timing, Scheduling & Reminder Engine

**Version:** 2.0 integrated  
**Canonical integration:** Owns long-term/future schedule. Doc 04 is the current-week projection; replans are versioned and invalidate old notifications.

See [00 — System Integration Contract](../integration/00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Questionnaire, Roadmap Generator, Weekly Planner, Home mission, notifications  
**Depends on:** `../questionnaire/02-questionnaire.md`, `../roadmaps/03-goals-and-roadmap.md`, `../weeks/04-weekly-plan-and-lessons.md`, `../notifications/06-notifications.md`, `../content-pool/08-content-pool.md`

---

## 1. Purpose

This module turns user promises from the questionnaire into a realistic, continuously updated learning schedule.

Inputs:

- target completion date/deadline token
- weekly or daily study commitment
- available days and time windows
- time zone
- roadmap/content estimates
- actual completion behavior

The timeline is not a fixed marketing promise. It changes from verified user activity.

---

## 2. Existing Coverage and Boundary

Existing files already save availability, weekly hours, and deadline tokens; generate roadmaps from capacity; and create weekly tasks. This file unifies those pieces into one timing engine.

It owns:

- capacity decoding
- feasibility checks
- target completion estimate
- rolling scheduling
- reminders
- missed-session handling
- dynamic pace recalculation
- schedule versions and audit

It does not own lesson content or rewards.

---

## 3. Module Layout

```text
course-timing/
  course-timing.module.ts
  timing.controller.ts
  timing.service.ts
  capacity.service.ts
  schedule-builder.service.ts
  pace-engine.service.ts
  reminder-planner.service.ts
  timing-jobs.processor.ts
  entities/
    learning-commitment.entity.ts
    course-schedule.entity.ts
    schedule-slot.entity.ts
    pace-snapshot.entity.ts
    reminder-plan.entity.ts
    schedule-change.entity.ts
```

---

## 4. Data Model

### 4.1 `learning_commitments`

One active row per goal/roadmap:

- user/goal/roadmap IDs
- timezone
- selected weekly-hours token
- decoded target minutes/week
- selected available days
- selected time windows
- target deadline token
- requested completion date nullable
- reminder lead minutes
- quiet hours
- status/version

### 4.2 `course_schedules`

- roadmap ID
- schedule version
- start date
- target completion date
- estimated completion date
- total required minutes
- completed minutes
- remaining minutes
- planned minutes/week
- effective minutes/week
- pace state
- feasibility state
- active window start/end
- generated at

### 4.3 `schedule_slots`

- local date
- start/end local time
- UTC start/end snapshot
- planned minutes
- task IDs
- status: `planned`, `started`, `completed`, `missed`, `moved`, `cancelled`
- source: questionnaire, replan, coach, user
- reminder status

### 4.4 `pace_snapshots`

Daily/weekly calculation:

- planned vs completed minutes
- active days
- completion velocity
- estimate accuracy
- EWMA effective minutes/week
- new ETA
- pace state
- reason

### 4.5 `schedule_changes`

Audit every replan:

- old/new schedule version
- actor: user, system, coach
- reason
- changed fields
- created at

---

## 5. Questionnaire Decoding

Use schema-versioned maps already aligned with the questionnaire.

Example weekly hours:

| Token | Target hours/week |
|---|---:|
| `lt-3` | 2 |
| `3-5` | 4 |
| `5-8` | 6.5 |
| `8-12` | 10 |
| `gt-12` | 14 |

Example deadline:

| Token | Initial weeks |
|---|---:|
| `1-3` | 8 |
| `3-6` | 16 |
| `6-12` | 24 |
| `12+` | 40 |
| `none` | recipe default |

The backend stores both original token and decoded value.

---

## 6. Capacity and Feasibility

### 6.1 Usable capacity

```text
usable_weekly_minutes =
selected_weekly_hours × 60 × 0.85
```

The 15% buffer protects against interruptions and underestimated lessons.

```text
deadline_capacity =
usable_weekly_minutes × target_weeks
```

### 6.2 Feasibility ratio

```text
feasibility_ratio =
required_content_minutes / deadline_capacity
```

| Ratio | State | Action |
|---|---|---|
| ≤ 0.85 | comfortable | include optional reinforcement |
| 0.86–1.00 | feasible | normal path |
| 1.01–1.20 | compressed | reduce optional content, increase checkpoints |
| > 1.20 | unrealistic | ask user to extend deadline or increase hours |

Never remove required proof-of-skill content merely to claim the requested deadline.

---

## 7. Initial Schedule Generation

1. load user commitment and roadmap outline
2. calculate capacity and feasibility
3. request required/optional content from Content Pool
4. create target completion estimate
5. distribute next incomplete lessons across available days
6. respect lesson duration and modality tags
7. avoid overloading a single day
8. create the first two-week active window
9. create weekly plan from those slots
10. schedule reminder jobs

### Slot rules

- minimum planned session: 10 minutes
- preferred session: 25–45 minutes
- maximum default deep-work session: 90 minutes
- split lessons only when lesson metadata allows it
- commute-safe audio may fill small mobile windows
- coding/project tasks require compatible longer slots

---

## 8. Dynamic Pace Engine

The more verified study time the user completes, the faster the estimated finish date moves.

### Effective pace

Use an exponentially weighted moving average:

```text
effective_weekly_minutes =
0.50 × current_week_completed
+ 0.30 × previous_week_completed
+ 0.20 × older_baseline
```

For new users, use planned minutes until at least 7 active days exist.

### ETA

```text
estimated_weeks_remaining =
remaining_required_minutes
/ max(effective_weekly_minutes, minimum_safe_rate)
```

```text
estimated_completion_date =
next_schedule_boundary + estimated_weeks_remaining
```

### Pace states

- `ahead`
- `on_track`
- `slightly_behind`
- `at_risk`
- `paused`

Pace changes should be stable; do not move ETA after every tiny event. Recalculate:

- lesson completion
- weekly rollover
- replan
- 3-day inactivity
- commitment change

---

## 9. Rolling Content Fetch

Instead of scheduling the entire course in fixed detail:

- roadmap holds the full skill/milestone structure
- Course Timing materializes 2–4 weeks of lessons
- when 50% of the active window is completed, fetch the next batch
- if user studies more, pull the next batch earlier
- if user slows down, move future tasks without losing progress
- completed lesson instances are immutable

This makes progression genuinely activity-dependent.

---

## 10. Reminder Notifications

### Types

- `study_reminder`
- `study_starting`
- `missed_session`
- `streak_risk`
- `pace_ahead`
- `pace_behind`
- `replan_suggestion`
- `deadline_risk`

### Default triggers

| Trigger | Timing |
|---|---|
| Upcoming session | 30 minutes before |
| Session start | at start, optional |
| Missed session | 60 minutes after end |
| Daily promise risk | 2 hours before local day closes |
| Weekly behind | Friday/Saturday based on remaining plan |
| Deadline risk | when feasibility or ETA worsens materially |
| Positive pace | at most once per week |

### Notification rules

- respect notification preferences
- respect quiet hours
- max 1–2 actionable study notifications/day
- deduplicate by `(user, type, slot/schedule_version)`
- stale reminders are cancelled after replan
- deep link to specific lesson or schedule

---

## 11. Time Zone and DST

- store user IANA timezone
- store each slot’s local fields plus resolved UTC snapshots
- new slots use current timezone
- existing near-term slots do not silently shift after travel without confirmation
- day boundary follows the gamification 03:00 rule where daily streak context is required
- one timezone change per 30 days without risk review
- DST ambiguous/nonexistent times use documented library resolution

---

## 12. Replanning

Triggers:

- user changes availability
- user changes deadline
- missed two scheduled sessions
- pace state becomes `at_risk`
- user asks Arlo to make week easier
- course content estimate changes
- long absence

Replan transaction:

1. lock active schedule
2. keep completed tasks
3. cancel future reminders
4. move only incomplete future slots
5. increment schedule version
6. regenerate active window
7. update weekly plan
8. emit replan notification

No reward or streak should be changed directly by the timing module.

---

## 13. User Activity Rules

Verified activity includes:

- server-completed lessons
- accepted quiz/practice submissions
- verified session time
- qualified Study Together focus time

Do not count:

- app left open in background
- unverified client timer
- wheel/shop/profile browsing
- repeated idle heartbeats

---

## 14. API

| Method | Path |
|---|---|
| `GET` | `/course-timing/current` |
| `GET` | `/course-timing/calendar?from=&to=` |
| `PATCH` | `/course-timing/commitment` |
| `POST` | `/course-timing/replan` |
| `POST` | `/course-timing/slots/:id/move` |
| `POST` | `/course-timing/slots/:id/skip` |
| `GET` | `/course-timing/feasibility` |

### Current response

```json
{
  "plannedMinutesPerWeek": 390,
  "effectiveMinutesPerWeek": 420,
  "pace": "ahead",
  "requestedCompletionDate": "2026-12-01",
  "estimatedCompletionDate": "2026-11-18",
  "remainingMinutes": 8400,
  "nextSession": {
    "slotId": "uuid",
    "startsAt": "2026-07-13T17:00:00Z",
    "lessonId": "uuid",
    "minutes": 25
  }
}
```

---

## 15. Jobs

- reminder dispatch queue
- daily pace snapshot
- weekly schedule rollover
- active-window materialization
- stale-slot reconciliation
- deadline-risk detector

Jobs must be idempotent and keyed by schedule version.

---

## 16. Error Codes

- `TIMING_COMMITMENT_MISSING`
- `TIMING_INVALID_TIMEZONE`
- `TIMING_DEADLINE_UNREALISTIC`
- `TIMING_SLOT_CONFLICT`
- `TIMING_SLOT_ALREADY_COMPLETED`
- `TIMING_REPLAN_IN_PROGRESS`
- `TIMING_NO_CONTENT_AVAILABLE`
- `TIMING_VERSION_CONFLICT`

---

## 17. Analytics

- `schedule_generated`
- `schedule_replanned`
- `slot_started`
- `slot_completed`
- `slot_missed`
- `reminder_sent`
- `reminder_opened`
- `pace_state_changed`
- `estimated_completion_changed`
- `content_window_expanded`

---

## 18. Acceptance Criteria

- questionnaire timing answers become a persisted commitment
- schedule uses content estimates and user availability
- impossible deadlines are reported honestly
- faster verified activity moves ETA earlier
- inactivity moves ETA later and offers replan
- reminders use server time, timezone, quiet hours, and schedule version
- stale reminders are cancelled after replan
- future content is materialized in rolling windows
- completed progress is never lost during replan

---

## Implementation map (arc-backend)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/course-timing/` |
| Commitment | `entities/learning-commitment.entity.ts` ← goal tokens + TZ |
| Schedule + slots | `course-schedule`, `schedule-slot` |
| Pace / ETA | `pace-engine.service.ts` + `pace_snapshots` |
| Capacity / feasibility bands | `capacity.service.ts` |
| Slot builder (2-week window) | `schedule-builder.service.ts` |
| Reminders | `reminder-planner.service.ts` → notif schedules |
| Replan / move / skip | `timing.service.ts` + `TimingController` |
| Jobs | `timing-jobs.processor.ts` (interval tick) |
| Bootstrap | after roadmap assemble |
| Lesson complete | `LessonCompletionOrchestrator` → `onLessonCompleted` |
| FE client | `arc-app/src/lib/api/course-timing.ts`, `useCourseTiming` |

**Still thin:** Bull queue (in-process interval), Study Together verified minutes, gem replan token spend, full DST library, dedicated calendar UI screen.

**FE wired:** Home pace strip + Seal Week badge; Week pulse path timing card + dual replan; Settings schedule row + timezone sync; `useCourseTiming` / `courseTimingApi`.
