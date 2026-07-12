# Arc Backend — Badges & Achievements System

**Version:** 1.0 integrated  
**Stack:** NestJS + TypeORM + PostgreSQL; Redis/queue recommended for counters and event processing  
**Consumers:** Home Dashboard, Profile, Badge Collection, Lesson Complete, Weekly Recap, Rank & Level, Friends, Battle, Study Together  
**Depends on:** [00 — System Integration Contract](./00-system-integration.md), [Gamification](./gamification.md), [Ranking](./ranking_system.md), [Leagues](./leagues.md), [Lessons](./05-Learn_Lesson_Play_API.md), [Weekly Plan](./04-weekly-plan-and-lessons.md), [Notifications](./06-notifications.md)  
**Integrates with:** [Social Media](./social_media.md), [Battle Mode](./battle_mode.md), [Study Together](./study_together.md), [Lucky Wheel](./lucky_wheel.md), [Referral System](./referral_system.md), [Content Pool](./content_pool.md)

---

## 1. Purpose

The Badges & Achievements System gives users durable proof of meaningful progress across Arc.

Badges are not decorative-only rewards. They represent verified actions such as completing lessons, passing challenges, maintaining weekly consistency, finishing projects, helping friends, winning Battles fairly, studying together, progressing through a roadmap, returning after a break, and reaching referral milestones.

The system owns:

- the master badge catalog
- badge categories, rarity and tiers
- badge eligibility rules
- progress toward locked badges
- event-driven badge evaluation
- duplicate prevention
- optional badge rewards
- profile visibility and featured badges
- unlock notifications
- seasonal and hidden badges
- fraud-only revocation

The system does not own XP, Gems, Coins, lesson completion, rank advancement, League scoring, social relationships, Battle winners, or streak truth. Those modules emit verified events; this system consumes them.

> A badge may unlock only from server-verified facts. Client UI state must never directly grant a badge.

---

## 2. How Many Badges Arc Has

Arc should launch with **36 core badges**.

| Category | Number |
|---|---:|
| Getting Started | 4 |
| Learning & Lessons | 6 |
| Quiz & Challenge Mastery | 5 |
| Consistency & Streaks | 5 |
| Roadmap & Career Progress | 5 |
| Projects & Portfolio | 4 |
| Social & Study Together | 3 |
| Battle & Competition | 2 |
| Referral & Community | 2 |
| **Total** | **36** |

Seasonal and hidden badges may be added later, but are not counted in the fixed 36 core badges.

Recommended UI count:

```text
12 / 36 earned
```

---

## 3. Badge Design Principles

1. Every badge must prove a meaningful action.
2. Criteria must be understandable and localized.
3. High-value badges must not be farmable through repeated easy actions.
4. Near-term and long-term badges should coexist.
5. Canonical backend facts are the only source of truth.
6. Earned badges are normally permanent.
7. Badge logic must connect to Lessons, Roadmap, Weekly Plan, Projects, Social, Battle, Study Together, Referral, Rank, and Profile.
8. Badge rewards create **zero League XP**.
9. XP alone cannot replace badge or milestone gates.
10. Icon, name, rarity, category, criteria, reward, and progress must be text-accessible.

---

## 4. Rarity

| Rarity | Meaning |
|---|---|
| Common | Early or expected progress |
| Uncommon | Repeated verified activity |
| Rare | Strong consistency or skill |
| Epic | Major milestone or difficult proof |
| Legendary | Long-term achievement |

Rarity affects presentation and optional reward size, but never changes eligibility after publication.

---

## 5. Core Badge Catalog — 36 Badges

### Getting Started — B01–B04

#### B01 — First Step
- **Rarity:** Common
- **Criteria:** Complete the first required lesson.
- **Reward:** 25 Coins
- **Source:** `lesson.completed.v1`

#### B02 — Meet Arlo
- **Rarity:** Common
- **Criteria:** Complete the AI Goal Interview and save the first personalized roadmap.
- **Reward:** 20 Coins
- **Sources:** `questionnaire.submitted.v1`, `roadmap.generated.v1`

#### B03 — Plan Builder
- **Rarity:** Common
- **Criteria:** Activate the first weekly plan with at least 2 scheduled learning tasks.
- **Reward:** 20 Coins
- **Source:** `weekly_plan.activated.v1`

#### B04 — First Full Week
- **Rarity:** Uncommon
- **Criteria:** Complete the first weekly commitment.
- **Reward:** 50 Coins
- **Source:** `weekly_plan.completed.v1`

### Learning & Lessons — B05–B10

#### B05 — Lesson Starter
- **Rarity:** Common
- **Criteria:** Complete 5 required lessons.
- **Reward:** 40 Coins

#### B06 — Lesson Explorer
- **Rarity:** Uncommon
- **Criteria:** Complete 25 required lessons.
- **Reward:** 100 Coins

#### B07 — Lesson Veteran
- **Rarity:** Rare
- **Criteria:** Complete 100 required lessons.
- **Reward:** 300 Coins + 10 Gems

#### B08 — Format Explorer
- **Rarity:** Uncommon
- **Criteria:** Complete at least one lesson in 5 distinct lesson formats.
- **Eligible formats:** video, audio, reading, guided example, coding, dataset, quiz, reflection, resource, mini project, debugging, recap
- **Reward:** 75 Coins

#### B09 — Practice First
- **Rarity:** Uncommon
- **Criteria:** Complete 10 coding or dataset practices with accepted results.
- **Reward:** 100 Coins

#### B10 — Deep Learner
- **Rarity:** Rare
- **Criteria:** Complete 20 lessons with at least one saved note, saved highlight, Arlo explanation, or retry followed by a correct result.
- **Reward:** 150 Coins + 5 Gems

### Quiz & Challenge Mastery — B11–B15

#### B11 — Quiz Spark
- **Rarity:** Common
- **Criteria:** Pass the first quiz.
- **Reward:** 25 Coins

#### B12 — Quiz Crusher
- **Rarity:** Uncommon
- **Criteria:** Pass 20 unique quizzes.
- **Reward:** 100 Coins

#### B13 — Perfect Checkpoint
- **Rarity:** Rare
- **Criteria:** Score 100% on 10 unique quizzes without revealing solutions.
- **Reward:** 150 Coins + 5 Gems

#### B14 — Challenge Accepted
- **Rarity:** Uncommon
- **Criteria:** Pass the first mini challenge.
- **Reward:** 75 Coins

#### B15 — Boss Slayer
- **Rarity:** Epic
- **Criteria:** Pass 5 boss/final challenges with at least 80% and no solution reveal.
- **Reward:** 400 Coins + 20 Gems

### Consistency & Streaks — B16–B20

Arc's main streak is based on weekly commitment, not daily app opening.

#### B16 — Weekly Warrior
- **Rarity:** Common
- **Criteria:** Complete 2 consecutive weekly commitments.
- **Reward:** 50 Coins

#### B17 — Four-Week Flame
- **Rarity:** Uncommon
- **Criteria:** Complete 4 consecutive weekly commitments.
- **Reward:** 125 Coins + 5 Gems

#### B18 — Twelve-Week Fire
- **Rarity:** Rare
- **Criteria:** Complete 12 consecutive weekly commitments.
- **Reward:** 400 Coins + 20 Gems

#### B19 — Year of Growth
- **Rarity:** Legendary
- **Criteria:** Complete 40 weekly commitments within a rolling 52-week period.
- **Reward:** 1,500 Coins + 100 Gems + exclusive frame

#### B20 — Comeback Eagle
- **Rarity:** Rare
- **Criteria:** After at least 14 inactive days, return and complete a weekly commitment within 10 days.
- **Reward:** 150 Coins + 10 Gems
- **Unlock limit:** once

### Roadmap & Career Progress — B21–B25

#### B21 — Roadmap Rookie
- **Rarity:** Common
- **Criteria:** Complete the first roadmap quest.
- **Reward:** 50 Coins

#### B22 — Phase Finisher
- **Rarity:** Uncommon
- **Criteria:** Complete the first roadmap phase, including its required challenge.
- **Reward:** 150 Coins + 5 Gems

#### B23 — Halfway Hero
- **Rarity:** Rare
- **Criteria:** Reach 50% verified completion on the active career roadmap.
- **Reward:** 300 Coins + 15 Gems

#### B24 — Skill Path Master
- **Rarity:** Epic
- **Criteria:** Complete all required quests, challenges, and projects in one skill path.
- **Reward:** 750 Coins + 40 Gems

#### B25 — Job-Ready Eagle
- **Rarity:** Legendary
- **Criteria:** Reach the final rank and complete all mandatory portfolio and interview milestones.
- **Reward:** 2,500 Coins + 150 Gems + legendary frame
- **Rule:** XP alone never qualifies.

### Projects & Portfolio — B26–B29

#### B26 — Project Starter
- **Rarity:** Common
- **Criteria:** Complete the first verified project task.
- **Reward:** 50 Coins

#### B27 — Builder
- **Rarity:** Uncommon
- **Criteria:** Complete one full milestone project.
- **Reward:** 150 Coins + 5 Gems

#### B28 — Portfolio Hero
- **Rarity:** Epic
- **Criteria:** Complete 3 portfolio-ready projects and add them to the Arc portfolio.
- **Reward:** 750 Coins + 35 Gems

#### B29 — Feedback Finisher
- **Rarity:** Rare
- **Criteria:** Revise and resubmit a project after feedback, then pass final review.
- **Reward:** 250 Coins + 10 Gems

### Social & Study Together — B30–B32

#### B30 — Study Buddy
- **Rarity:** Common
- **Criteria:** Complete the first qualified Study Together session.
- **Minimum duration:** 15 verified minutes
- **Reward:** 50 Coins

#### B31 — Accountability Partner
- **Rarity:** Uncommon
- **Criteria:** Complete 10 qualified Study Together sessions with at least 2 different friends.
- **Reward:** 200 Coins + 10 Gems

#### B32 — Learning Circle
- **Rarity:** Rare
- **Criteria:** Complete qualified Study Together sessions with 5 different friends.
- **Reward:** 300 Coins + 15 Gems

### Battle & Competition — B33–B34

#### B33 — First Victory
- **Rarity:** Common
- **Criteria:** Win the first eligible completed Battle.
- **Reward:** 50 Coins

#### B34 — Battle Scholar
- **Rarity:** Rare
- **Criteria:** Win 20 eligible Battles across at least 3 subjects with at least 70% average accuracy.
- **Reward:** 400 Coins + 20 Gems
- **Anti-farm:** maximum 3 qualifying wins against the same opponent in 7 days

### Referral & Community — B35–B36

#### B35 — Connector
- **Rarity:** Uncommon
- **Criteria:** Reach 5 qualified referrals.
- **Reward:** Use the existing referral milestone reward; do not double-grant.

#### B36 — Arc Ambassador
- **Rarity:** Epic
- **Criteria:** Reach 25 qualified referrals.
- **Reward:** Use the existing referral milestone reward; do not double-grant.

---

## 6. Badge States

| State | Meaning |
|---|---|
| Locked | Criteria not met |
| In progress | Measurable progress exists |
| Earned | Successfully unlocked |
| Hidden | Criteria/name hidden before unlock |
| Seasonal active | Unlock window open |
| Seasonal expired | Window closed, not earned |
| Revoked | Removed only through audited fraud/admin action |

---

## 7. Data Model

### 7.1 `badge_definitions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | varchar unique | Stable identifier |
| `version` | int | Published rule version |
| `name_key` | varchar | Localization |
| `description_key` | varchar | Localization |
| `category` | enum | 9 categories |
| `rarity` | enum | common to legendary |
| `tier` | enum nullable | bronze/silver/gold/platinum |
| `icon_asset_key` | varchar | Design asset reference |
| `is_hidden` | boolean | |
| `is_seasonal` | boolean | |
| `starts_at` / `ends_at` | timestamptz nullable | |
| `status` | enum | draft, active, retired |
| `criteria_type` | varchar | Evaluator key |
| `criteria_json` | jsonb | Versioned parameters |
| `reward_json` | jsonb | Coins/Gems/cosmetic/reference |
| `sort_order` | int | |
| `created_at` / `updated_at` | timestamptz | |

Published criteria are immutable. Changes require a new version.

### 7.2 `user_badges`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `badge_definition_id` | uuid FK | |
| `badge_code` | varchar | Snapshot |
| `badge_version` | int | Snapshot |
| `status` | enum | earned, revoked |
| `earned_at` | timestamptz | |
| `source_event_id` | uuid | Audit |
| `source_entity_type` | varchar | lesson, week, battle, etc. |
| `source_entity_id` | uuid nullable | |
| `reward_transaction_group_id` | uuid nullable | Ledger reference |
| `metadata_json` | jsonb | Proof snapshot |
| `revoked_at` | timestamptz nullable | |
| `revocation_reason` | varchar nullable | |

Constraint:

```text
UNIQUE(user_id, badge_code)
```

### 7.3 `user_badge_progress`

| Column | Notes |
|---|---|
| `user_id` | User |
| `badge_code` | Badge |
| `current_value` | Current numeric progress |
| `target_value` | Target |
| `progress_percent` | 0–100 |
| `progress_json` | Distinct formats, friends, subjects, requirements |
| `last_event_id` | Consumer idempotency |
| `updated_at` | |

This table is a projection. Canonical facts remain in source modules.

### 7.4 `badge_unlock_events`

Stores evaluator, source event, criteria snapshot, result, reason, and timestamp.

### 7.5 `badge_featured_slots`

Users can feature up to 4 earned badges.

Constraint:

```text
UNIQUE(user_id, slot_index)
```

---

## 8. Event-Driven Evaluation

Consumed events include:

- `lesson.completed.v1`
- `quiz.passed.v1`
- `challenge.passed.v1`
- `project.task_completed.v1`
- `project.completed.v1`
- `project.review_passed.v1`
- `roadmap.generated.v1`
- `roadmap.quest_completed.v1`
- `roadmap.phase_completed.v1`
- `roadmap.progress_updated.v1`
- `weekly_plan.activated.v1`
- `weekly_plan.completed.v1`
- `streak.updated.v1`
- `rank.unlocked.v1`
- `study_together.completed.v1`
- `battle.completed.v1`
- `referral.milestone_unlocked.v1`

Processing flow:

```text
domain event
  → transactional outbox
  → badge consumer
  → dedupe by eventId
  → update progress projection
  → verify criteria against canonical facts
  → unlock if eligible
  → optional reward through Gamification ledger
  → badge.unlocked.v1
  → Home/Profile/Notification projections
```

---

## 9. Unlock Transaction

1. Lock or upsert progress row.
2. Dedupe the source event.
3. Query canonical facts.
4. Evaluate the active badge version.
5. If not eligible, update progress and audit.
6. If eligible, insert `user_badges`.
7. Grant reward through the Gamification ledger.
8. Store ledger transaction group ID.
9. Write unlock audit.
10. Emit `badge.unlocked.v1` through the outbox.
11. Commit.

Idempotency key:

```text
badge:{userId}:{badgeCode}
```

Referral badges reference the existing referral milestone transaction and never grant the same currency twice.

---

## 10. Progress Logic

### Counter criteria

```text
required_lessons_completed / 25
```

### Distinct-set criteria

```json
{
  "completedLessonTypes": ["video", "reading", "coding"],
  "current": 3,
  "target": 5
}
```

### Consecutive criteria

Read canonical streak history, not a client-maintained counter.

### Composite criteria

```json
{
  "finalRankUnlocked": true,
  "requiredRoadmapComplete": true,
  "portfolioComplete": true,
  "interviewMilestonesComplete": false
}
```

### Accuracy criteria

Exclude solution-revealed, voided, test, duplicated, or suspicious attempts.

---

## 11. Economy Integration

Badge rewards use the immutable Gamification ledger.

| Rarity | Recommended Coins | Recommended Gems |
|---|---:|---:|
| Common | 20–50 | 0 |
| Uncommon | 50–150 | 0–5 |
| Rare | 150–400 | 5–20 |
| Epic | 400–1,000 | 20–50 |
| Legendary | 1,500–2,500 | 100–150 |

Rules:

- badge XP is normally 0
- badge rewards create 0 League XP
- badges do not directly unlock required lessons
- cosmetic rewards use Inventory
- reward values are snapshotted at unlock time
- retired badges remain visible for previous earners

---

## 12. Rank Integration

Ranks may require specific earned badges as proof, but rank remains owned by `ranking_system.md`.

Examples:

- early rank requires `first_step`
- skill rank requires `challenge_accepted`
- portfolio rank requires `portfolio_hero`
- final rank requires mandatory milestones and `job_ready_eagle`

A fraud-based badge revocation may trigger rank reevaluation.

---

## 13. League Integration

Badges grant **zero Qualified League XP**.

Badges may appear as leaderboard/profile decoration, but they do not change the current League score.

---

## 14. Home, Profile and Friends

### Home Dashboard

Show only:

- newest unlocked badge
- one near-completion badge
- earned count
- CTA to Badge Collection

### Badge Collection

Filters:

- All
- Earned
- In progress
- Locked
- Learning
- Consistency
- Projects
- Social
- Battle
- Community

### Profile

Show:

- earned / 36 core badges
- up to 4 featured badges
- rarity
- earned date
- badge details

### Friend Profile

Apply badge visibility rules and never reveal private learning details.

---

## 15. Visibility and Privacy

Visibility options:

- public
- friends only
- private

Recommended defaults:

- badge count: visible to accepted friends
- featured badges: visible to accepted friends
- full collection: friends only
- failed attempts, schedule, motivation, exact referral identities: never exposed

---

## 16. Notifications

Types:

- `badge_unlocked`
- `badge_progress_near`
- `badge_season_ending`
- `badge_featured_prompt`

Rules:

- unlock notification is immediate
- near-progress notifications are capped at 2 per week
- no push for every progress increment
- quiet hours and preferences apply

Dedupe key:

```text
badge_unlocked:{userId}:{badgeCode}
```

---

## 17. APIs

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/badges` | Active catalog |
| `GET` | `/api/v1/badges/:code` | Badge detail |
| `GET` | `/api/v1/users/me/badges` | Own collection and progress |
| `GET` | `/api/v1/users/:userId/badges` | Privacy-filtered view |
| `PUT` | `/api/v1/users/me/badges/featured` | Set up to 4 featured badges |
| `PUT` | `/api/v1/users/me/badges/visibility` | Update privacy |

Example response:

```json
{
  "summary": {
    "earned": 12,
    "totalCore": 36,
    "completionPercent": 33.3
  },
  "badges": [
    {
      "code": "quiz_crusher",
      "name": "Quiz Crusher",
      "status": "in_progress",
      "rarity": "uncommon",
      "progress": {
        "current": 14,
        "target": 20,
        "percent": 70
      },
      "reward": {
        "coins": 100,
        "gems": 0
      }
    }
  ]
}
```

---

## 18. Hidden and Seasonal Badges

Hidden and seasonal badges are optional and excluded from the 36 core total.

Rules:

- hidden criteria may be masked before unlock
- seasonal badges have explicit start/end timestamps
- ownership remains permanent after valid unlock
- hidden/seasonal badges cannot be mandatory rank gates
- published rules are versioned and auditable

---

## 19. Admin Operations

Admin may:

- create draft definitions
- preview eligibility
- publish a new version
- retire a badge
- configure assets and localization
- inspect unlock audit
- revoke only for fraud/admin correction

Published criteria are never silently edited. A new rule requires a new version.

---

## 20. Revocation

Allowed only for:

- confirmed cheating
- fraudulent Battle results
- fake referral network
- admin/test grant mistake
- reversed source event caused by fraud

Revocation flow:

1. Create audited revocation record.
2. Mark badge revoked.
3. Remove from featured slots.
4. Create compensating ledger transaction if needed.
5. Emit `badge.revoked.v1`.
6. Reevaluate rank only when the badge was a required gate.

Do not revoke because a user later misses a streak, changes roadmap, becomes inactive, or because a badge is retired.

---

## 21. Anti-Farming

- unique lessons/challenges/projects only
- replaying completed content does not increment counters
- solution-revealed attempts do not count for mastery badges
- Battle farming is limited by opponent and time window
- Study Together requires verified minimum duration
- referral badges use qualified referrals only
- suspicious events stay pending during review
- client timestamps are not trusted alone

---

## 22. Background Jobs

- rebuild progress from canonical events
- reconcile earned badges against source facts
- repair missing ledger links
- activate/retire seasonal badges
- send capped near-progress nudges
- detect duplicate ownership or impossible progress

All jobs must be idempotent.

---

## 23. Error Codes

| Code | Meaning |
|---|---|
| `BADGE_NOT_FOUND` | Unknown badge |
| `BADGE_INACTIVE` | Not active |
| `BADGE_ALREADY_EARNED` | Idempotent duplicate |
| `BADGE_CRITERIA_NOT_MET` | Not eligible |
| `BADGE_PROGRESS_UNAVAILABLE` | Projection rebuilding |
| `BADGE_NOT_OWNED` | Cannot feature locked badge |
| `BADGE_FEATURED_LIMIT` | More than 4 selected |
| `BADGE_DUPLICATE_FEATURED` | Duplicate featured code |
| `BADGE_REVOKED` | Revoked badge cannot be featured |
| `BADGE_VERSION_CONFLICT` | Stale definition |
| `BADGE_REWARD_FAILED` | Ledger retry required |

---

## 24. Acceptance Criteria

The Badges System is accepted only when:

- exactly 36 core badges are published for MVP
- the 36 badges are grouped into the 9 defined categories
- all unlocks use server-verified canonical facts
- clients cannot directly grant badges
- users can retrieve earned, locked and in-progress badges
- progress supports counters, distinct sets, streaks and composite requirements
- one user can earn each core badge only once
- unlock processing is idempotent
- rewards use the immutable Gamification ledger
- badge rewards create zero League XP
- referral badge rewards are not double-granted
- users can feature up to 4 earned badges
- privacy rules apply on friend profiles
- hidden and seasonal badges do not change the 36 core count
- retired badges remain visible to previous earners
- revocation is limited to audited fraud/admin cases
- Lessons, Weekly Plan, Roadmap, Projects, Social, Study Together, Battle, Referral, Rank, Home, Profile and Notifications stay synchronized

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/badges/` |
| Catalog | Seed **36** defs in `badge-catalog.seed.ts` → `badge_definitions` |
| Earn rows | Expanded `user_badges` (+ progress, unlock events, featured, settings) |
| Eval | `BadgesService.onDomainEvent` — lesson/week outbox + study/battle hooks |
| Ledger | `RewardReasonType.Badge` — coins/gems, **0 League XP**; referral `skipLedger` |
| APIs | `GET /badges`, `GET /badges/:code`, `GET/PUT users/me/badges*`, `GET users/:id/badges` |
| Notifs | `badge_unlocked` on unlock |
| FE | `lib/api/badges.ts`, live `BadgesScreen`, Profile counts from API |

**Still thin:** full composite/job-ready eval, seasonal/hidden admin publish, revoke flow UI, Home live badge strip (home pack may still mock).
