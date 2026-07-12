# 00 — Arc Backend System Integration Contract

**Version:** 2.0  
**Stack:** NestJS + TypeORM + PostgreSQL; Redis/queues optional but recommended  
**Purpose:** Define the authoritative ownership, transactions, events, and end-to-end flows shared by every backend specification.

---

## 1. Why This File Exists

Arc now contains authentication, personalization, content, roadmaps, schedules, lessons, economy, streaks, ranks, leagues, social features, Battles, Study Together, Lucky Wheel, and notifications.

Without one integration contract, several modules could accidentally:

- award the same reward twice
- disagree about lesson or roadmap state
- schedule stale reminders
- use `profiles` as an economy database
- unlock content from client-provided values
- generate a roadmap that is never converted into a usable weekly plan

This file is authoritative whenever another document is ambiguous about cross-module ownership.

---

## 2. Canonical Sources of Truth

| Concern | Canonical owner | Read mirrors / projections |
|---|---|---|
| Account and session | `users`, `auth_identities`, auth token tables | none |
| App-facing identity | `profiles` | social/profile views |
| Questionnaire schema and answer draft | Question Engine | frontend cache |
| Goal revision | `goals` + questionnaire submission snapshot | profile target-role mirror |
| Shared curriculum | Content Pool / Skill Graph | caches |
| Personalized learning path | `roadmaps`, phases, milestones, lesson instances | home/roadmap DTOs |
| Lesson play content | published lesson version referenced by lesson instance | sanitized play payload |
| Lesson progress and assessment result | `lesson_progress` + attempt records | roadmap status projection |
| Long-term timing | Course Timing schedule | current-week projection |
| Current weekly commitment | `weekly_plans`, `weekly_tasks` | Home Seal Week DTO |
| XP, Gems, Coins | wallet + immutable reward ledger | `profiles.total_xp/gems/coins` optional read mirrors |
| Daily/weekly streak | streak state/day records | `profiles.weekly_streak` optional read mirror |
| Permanent rank | ranking state/history | profile rank mirror |
| Weekly competition | league season/cohort/membership/score events | Redis sorted set |
| Friends/follows | social graph tables | counters/cache |
| Notifications | notification inbox + delivery/schedule tables | unread-count cache |

A mirror may be returned for fast UI bootstrap, but it must never become the mutation source.

---

## 3. Shared Technical Rules

1. **Server authority:** clients never submit final rewards, balances, correct answers, rank, streak, winner, unlock state, or leaderboard score.
2. **Idempotency:** every external command that can charge, reward, complete, accept, settle, spin, or replan requires an `Idempotency-Key` or equivalent unique command key.
3. **Transactions:** core state and its immediate financial/progress side effects commit in one PostgreSQL transaction.
4. **Transactional outbox:** asynchronous consumers run only from events written in the same transaction as the source change.
5. **Optimistic concurrency:** mutable aggregates carry a `version`; stale writes return `409 VERSION_CONFLICT`.
6. **Time:** API timestamps are UTC ISO-8601. Calendar decisions use a snapshotted IANA timezone.
7. **Learning-day boundary:** daily habit/reward day closes at 03:00 local time.
8. **Learning-week boundary:** Monday 03:00 through the next Monday 02:59:59.999 in the user’s snapshotted timezone.
9. **Soft history:** published content, completed progress, ledger entries, Battle results, rank unlocks, and finalized league results are never destructively rewritten.
10. **Privacy:** serializers enforce privacy; hiding fields only in frontend is insufficient.

---

## 4. Synchronous vs Asynchronous Work

### Must be synchronous and atomic

- registering user + profile
- submitting questionnaire + goal revision + roadmap job request/outbox row
- completing lesson + grading + progress + reward ledger + immediate unlock decision + weekly-task update
- sealing week + streak increment + seal reward ledger
- purchasing store item
- accepting Battle + both Coin escrow debits
- Battle settlement/refund
- Lucky Wheel spin + reward grant

### May be asynchronous through outbox/queue

- roadmap generation
- rolling content materialization
- course schedule generation/replan
- rank evaluation and celebration
- league score projection/live broadcast
- notification delivery
- analytics
- social activity feed projection

Asynchronous work must be retryable and idempotent.

---

## 5. Core Event Envelope

```json
{
  "eventId": "uuid",
  "eventType": "lesson.completed.v1",
  "aggregateType": "lesson_progress",
  "aggregateId": "uuid",
  "userId": "uuid",
  "occurredAt": "2026-07-12T10:00:00.000Z",
  "schemaVersion": 1,
  "correlationId": "uuid",
  "causationId": "uuid-or-null",
  "payload": {}
}
```

Use versioned event names. Consumers store processed `eventId` values or enforce a unique source key.

---

## 6. Required Event Catalog

| Event | Primary consumers |
|---|---|
| `user.registered.v1` | notifications/profile defaults |
| `questionnaire.submitted.v1` | roadmap generation |
| `roadmap.generated.v1` | course timing, weekly plan bootstrap, notification |
| `roadmap.regenerated.v1` | timing replan, notification |
| `schedule.generated.v1` | weekly-plan projection, reminders |
| `schedule.replanned.v1` | weekly-plan projection, reminder cancellation/rebuild |
| `lesson.started.v1` | timing analytics |
| `lesson.completed.v1` | timing, streak, rank, league, badges, notifications |
| `milestone.completed.v1` | rank, notification |
| `week.sealed.v1` | rank, recap notification, analytics |
| `reward.granted.v1` | wallet UI projection, badge/rank/league consumers |
| `streak.changed.v1` | notification |
| `rank.unlocked.v1` | notification/social activity |
| `league.finalized.v1` | notification/rewards |
| `friend.requested.v1` | notification |
| `study.invited.v1` | notification |
| `battle.invited.v1` | notification |
| `battle.completed.v1` | reward/rank/league/profile notification |
| `wheel.rewarded.v1` | notification/analytics |

---

## 7. End-to-End Flow: New User to First Mission

```text
Register
  → create User + Profile
  → verify email
  → onboarding/profile basics
  → questionnaire draft/submit
  → create immutable goal revision
  → roadmap generation job
  → select published Content Pool versions
  → persist active roadmap version
  → Course Timing calculates feasibility and schedule
  → current Weekly Plan projection is generated
  → Home receives first Today’s Mission
```

The app must not display an empty Home while asynchronous work runs. It shows a generation state and polls job/bootstrap status.

---

## 8. End-to-End Flow: Lesson Completion

Within one orchestration transaction:

1. verify lesson ownership and unlock eligibility
2. lock lesson progress/attempt
3. grade from server-held answer keys
4. calculate reward using Gamification rules
5. complete lesson progress
6. write reward ledger and update wallet
7. evaluate immediate next-node unlock
8. mark linked weekly task complete and add verified minutes
9. write outbox events
10. commit

After commit:

- Course Timing recalculates pace/ETA when material
- Daily streak marks the learning day complete
- Rank evaluates permanent gates
- League consumes only qualified League XP
- notification service sends relevant reward/milestone messages
- Home/Roadmap projections refresh

No consumer may award the lesson reward a second time.

---

## 9. End-to-End Flow: Replanning

1. user or Arlo requests replan
2. Course Timing locks active schedule version
3. completed lessons/tasks remain immutable
4. only incomplete future slots move
5. roadmap structure changes only when a skill-path change is genuinely needed
6. current Weekly Plan is regenerated as a projection
7. old scheduled notifications are cancelled by schedule version
8. new reminders are created
9. active roadmap is swapped only after a replacement version is valid

Replanning cannot remove earned rewards or sealed weeks.

---

## 10. Composition APIs

Feature APIs remain owned by their modules. For app bootstrap and Home, add a read-only composition layer:

```text
GET /api/v1/bootstrap
GET /api/v1/home/summary
```

`/bootstrap` returns routing/status information. `/home/summary` combines current mission, week progress, wallet/rank summaries, milestone, wheel availability, and unread count. It reads canonical services/projections and performs no mutations.

---

## 11. Shared Error Shape

```json
{
  "statusCode": 409,
  "code": "VERSION_CONFLICT",
  "message": "This item changed. Refresh and try again.",
  "correlationId": "uuid",
  "details": null
}
```

All modules use stable machine-readable codes and a correlation ID.

---

## 12. Integration Acceptance Criteria

- every mutable/financial command is idempotent
- balances are changed only through the Gamification ledger
- lesson completion updates lesson, wallet, unlock, and weekly progress atomically
- roadmap generation always hands off to Course Timing and Weekly Plan
- replanning preserves completed history and invalidates stale reminders
- notification delivery is preference-, quiet-hour-, cap-, and dedupe-aware
- rank and league consume different XP concepts correctly
- profile economy/rank/streak values are mirrors, not mutation sources
- all cross-module events use the outbox and are safe to replay
