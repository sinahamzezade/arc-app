# Arc Backend — Lifetime Ranking System

**Version:** 2.0 integrated  
**Canonical integration:** Permanent rank consumes Lifetime XP plus proof/active-day gates; it is independent from weekly Leagues.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Rank Ladder, profile badge, Home rank card, unlock screens  
**Depends on:** `gamification.md`, `03-goals-and-roadmap.md`, `04-weekly-plan-and-lessons.md`, `06-notifications.md`

---

## 1. Purpose

Ranks are permanent career-progression identities. They are not the same as weekly leagues.

A rank unlock requires:

1. minimum Lifetime XP
2. proof-of-skill milestones
3. minimum active-learning history

This prevents a user from farming XP and finishing the entire progression in one day.

---

## 2. The 12 Rank Levels

The names match the current Arc Rank Ladder.

| Level | Rank | Lifetime XP | Minimum active days | Core gate |
|---:|---|---:|---:|---|
| 1 | Curious Egg | 0 | 0 | Create account / begin onboarding |
| 2 | Brave Hatchling | 300 | 2 | Complete 3 distinct lessons |
| 3 | Rookie Eagle | 1,000 | 5 | Complete first quest and one quiz |
| 4 | Data Scout | 2,500 | 10 | Pass first skill assessment |
| 5 | Semi Ninja | 5,000 | 21 | Complete first phase + seal 3 weeks |
| 6 | Full Ninja | 8,500 | 35 | Complete two phases + two challenges |
| 7 | Query Warrior | 13,000 | 49 | Pass one track-specialist challenge |
| 8 | Chart Wizard | 19,000 | 70 | Complete one applied visualization/product task |
| 9 | Insight Hunter | 27,000 | 98 | Complete two projects + two boss challenges |
| 10 | Portfolio Hero | 38,000 | 126 | Publish/complete portfolio capstone |
| 11 | Interview Ranger | 52,000 | 160 | Pass interview-readiness assessment + mock |
| 12 | Job-Ready Eagle | 70,000 | 180 | Finish all required phases, final capstone, and final readiness assessment |

`active_days` means distinct local days with a meaningful learning action, not app opens.

---

## 3. Domain-Neutral Gate Mapping

Some rank names are playful and data-themed, but gates work for every track.

Examples:

- Query Warrior:
  - Data: SQL challenge
  - Frontend: JavaScript/React challenge
  - Marketing: campaign analysis challenge
- Chart Wizard:
  - Data: dashboard/visualization
  - Frontend: interface/data visualization task
  - Marketing: reporting/dashboard task

Role recipes map a generic gate key to a track-specific milestone.

---

## 4. Why XP Alone Is Insufficient

A user may exceed the XP threshold but remain at the current rank.

Example:

```text
User XP: 9,100
Current rank: Semi Ninja
Full Ninja XP requirement: passed
Missing gate: second phase + second challenge
Result: rank remains Semi Ninja
```

UI should display all missing requirements.

Ranks never demote.

---

## 5. Data Model

### 5.1 `rank_definitions`

- `level`
- `slug`
- `title`
- `xp_threshold`
- `minimum_active_days`
- `gate_rules` jsonb
- `icon_asset_key`
- `display_order`
- `is_active`
- `version`

### 5.2 `user_rank_states`

- `user_id`
- `current_rank_level`
- `current_rank_slug`
- `highest_rank_level`
- `evaluated_xp`
- `evaluated_at`
- `next_evaluation_reason`
- `version`

### 5.3 `rank_progress_requirements`

Materialized/derived status per user/rank:

- requirement key
- required value
- current value
- complete
- source IDs
- evaluated at

### 5.4 `rank_unlock_history`

Immutable:

- user
- old rank
- new rank
- XP snapshot
- gate snapshot
- unlocked at
- reward transaction ID nullable

---

## 6. Gate Rule Schema

```json
{
  "all": [
    {"type": "lifetime_xp", "gte": 5000},
    {"type": "active_days", "gte": 21},
    {"type": "phases_completed", "gte": 1},
    {"type": "weekly_seals", "gte": 3}
  ]
}
```

Supported rule types:

- lifetime XP
- active days
- lessons completed
- quests completed
- phases completed
- assessments passed
- challenges passed
- boss challenges passed
- projects completed
- portfolio capstone completed
- weekly seals
- interview readiness result
- role-recipe milestone key

---

## 7. Evaluation Flow

Evaluate after:

- reward grant
- lesson/quest/phase completion
- challenge/project completion
- weekly seal
- assessment result
- daily active-day close

Algorithm:

1. load current rank
2. load all higher rank definitions in order
3. evaluate next rank only
4. if every gate passes, unlock it
5. repeat only if the next rank also passes, but cap to one visible rank celebration per transaction
6. persist history
7. grant configured rank reward
8. publish `rank.unlocked`
9. create notification

The minimum active-day gates ensure multiple rank skips are rare.

---

## 8. Rank Rewards

Optional, moderate rewards:

| Level | Reward |
|---:|---|
| 2 | 100 Coins |
| 3 | 150 Coins + badge |
| 4 | 10 Gems |
| 5 | Semi Ninja rank frame |
| 6 | 300 Coins |
| 7 | specialist badge |
| 8 | 20 Gems |
| 9 | premium celebration |
| 10 | Portfolio Hero frame |
| 11 | 500 Coins + 25 Gems |
| 12 | Job-Ready Eagle frame + final badge |

Rank rewards do not create League XP.

---

## 9. API

| Method | Path |
|---|---|
| `GET` | `/ranks` |
| `GET` | `/ranks/me` |
| `GET` | `/ranks/me/ladder` |
| `GET` | `/ranks/users/:userId` | privacy filtered |

Example:

```json
{
  "current": {
    "level": 5,
    "title": "Semi Ninja",
    "lifetimeXp": 6200
  },
  "next": {
    "level": 6,
    "title": "Full Ninja",
    "xp": {"current": 6200, "required": 8500},
    "requirements": [
      {"key": "phases_completed", "current": 1, "required": 2, "complete": false},
      {"key": "challenges_passed", "current": 2, "required": 2, "complete": true},
      {"key": "active_days", "current": 30, "required": 35, "complete": false}
    ]
  }
}
```

---

## 10. Notifications

- `rank_close`: optional, once per rank
- `rank_unlocked`
- `rank_gate_completed`

Examples:

- “One more phase stands between you and Full Ninja.”
- “Rank unlocked: Semi Ninja.”
- “XP is ready. Finish the milestone to climb.”

---

## 11. Anti-Farming

- Lifetime XP still follows reward anti-farming rules
- active days require meaningful actions
- repeated lesson review does not count as new distinct completion
- admin/system XP cannot satisfy proof gates
- Battle XP cannot satisfy project/assessment gates
- restored/protected streak days do not count as active learning days
- suspicious activity may place rank evaluation on hold
- all requirements use server-side source records

---

## 12. Migration from Existing Profile Fields

If `profiles.current_rank` and `profiles.total_xp` already exist:

- keep them as denormalized read fields
- `wallets.lifetime_xp` and `user_rank_states` become source of truth
- update profile mirrors in the same transaction/outbox
- never derive rank from the string alone

---

## 13. Error Codes

- `RANK_DEFINITION_MISSING`
- `RANK_REQUIREMENT_NOT_MET`
- `RANK_EVALUATION_HELD`
- `RANK_ALREADY_UNLOCKED`
- `RANK_VERSION_CONFLICT`

---

## 14. Analytics

- `rank_progress_viewed`
- `rank_requirement_completed`
- `rank_unlocked`
- `rank_reward_granted`
- `rank_evaluation_held`

---

## 15. Acceptance Criteria

- all 12 rank levels exist with the specified names
- every rank requires XP plus milestone/effort gates
- final rank cannot be earned in one day
- active days are verified learning days
- rank evaluation is event-driven and idempotent
- users see exactly which requirements remain
- ranks never demote
- rank rewards do not enter weekly leagues

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/ranks/` |
| Definitions + state + progress + history | `entities/rank-*.entity.ts`, `user-rank-state.entity.ts` |
| 12-rank seed + rewards | `ranks.constants.ts` (onModuleInit) |
| Gate eval | `ranks.evaluator.ts` |
| Unlock + rewards (no League XP) | `ranks.service.ts` → `RewardReasonType.Rank` |
| Event hooks | gamification outbox → `RanksService.onDomainEvent` (lesson / seal / reward) |
| APIs | `GET /ranks`, `/ranks/me`, `/ranks/me/ladder`, `/ranks/users/:id`, privacy + activity |
| Profile / league mirrors | `profiles.currentRank`, `user_league_states.rankLevel` |
| FE client | `arc-app/src/lib/api/ranks.ts`, `useRanks` / `useHomeRankCard` |
| FE screen / home | live `RankScreen` + requirements list; `HomeExtras` RankInfo |

**Still thin:** full role-recipe milestone wiring from skill-graph, `rank_gate_completed` emit on each gate flip, analytics bus, anti-farm hold automation, Battle-XP exclusion from proof counters.
