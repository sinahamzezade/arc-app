# Arc Backend — Weekly Leagues & Leaderboards

**Version:** 2.0 integrated  
**Canonical integration:** Consumes only qualified League XP from the Gamification ledger/outbox. PostgreSQL is authoritative; Redis is a projection.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL; Redis recommended for live sorted sets  
**Consumers:** League screen, friend profile, Home league card, notifications  
**Depends on:** `gamification.md`, `ranking_system.md`, `social_media.md`, `06-notifications.md`

---

## 1. Purpose

Leagues are weekly, resettable competition. They are separate from permanent ranks.

- Rank = long-term career progression
- League = weekly qualified learning performance

All accounts view synchronized server data.

---

## 2. League Tiers

| Tier | Entry gate |
|---|---|
| Bronze | all eligible users |
| Silver | rank level ≥ 3 |
| Gold | rank level ≥ 4 |
| Platinum | rank level ≥ 6 |
| Diamond | rank level ≥ 8 |
| Master | rank level ≥ 10 and at least 12 weekly seals |

Each tier may use divisions III, II, I. Promotion normally moves one division; crossing division I moves to the next tier.

---

## 3. Weekly League XP

Included:

- first qualified lesson completion
- quizzes and active practice
- assessments
- challenges
- projects
- capped Battle XP
- weekly seal bonus

Excluded:

- Lucky Wheel XP
- referral rewards
- admin grants
- app opens
- restored/protected streak days
- repeats/farming
- cosmetic/store actions
- Study Together presence without learning completion

League XP is created from the gamification ledger with `countsForLeague=true`.

---

## 4. Season Boundaries

Global fairness requires users in the same cohort to share the same boundary.

- cohorts are grouped by a `season_timezone`
- default regional buckets: Europe, Americas, APAC, Middle East/Africa
- season starts Monday 04:00 in cohort timezone
- season ends next Monday 03:59:59.999
- user timezone changes do not move them mid-season
- the next season may assign a new regional bucket

Store start/end as UTC timestamps.

---

## 5. Cohort Formation

Default cohort size: 30.

Inputs:

- current league/division
- rank level band
- recent qualified XP band
- regional timezone bucket
- language, optional
- recent activity

Rules:

- friends are not intentionally grouped together or separated
- blocked users may remain in one cohort but are hidden from each other; preferably avoid pairing
- bot/test/admin accounts excluded
- inactive users enter an inactive cohort after two empty seasons
- late joiners enter a late-start cohort with adjusted UI, not an established cohort

---

## 6. Promotion and Demotion

Default for a full 30-person cohort:

- top 7: promote one division
- positions 8–24: remain
- bottom 5: demote one division
- positions 25–30 includes six users; configure exact `demote_count=5`, tie handling may shift boundary

For small cohorts:

```text
promote_count = max(1, floor(active_members × 0.23))
demote_count  = max(1, floor(active_members × 0.17))
```

Do not demote users with zero activity from Bronze; mark them inactive.

Tier entry gates still apply. A user who wins Gold I but lacks the Platinum rank gate remains Gold I and receives a “gate needed” state.

---

## 7. Tie-Breaking

Order by:

1. qualified League XP
2. more proof-weighted XP from challenge/project
3. more distinct active days
4. earlier time reaching final XP total
5. stable user UUID hash

The UI should explain only the first three.

---

## 8. Data Model

### `league_seasons`

- tier/division
- regional bucket
- starts/ends
- status: forming, active, finalizing, finalized
- configuration snapshot

### `league_cohorts`

- season ID
- tier/division
- max members
- seed metadata
- status

### `league_memberships`

- cohort/user
- starting rank
- qualified XP
- position
- promotion result
- joined at
- last score event at
- privacy state

### `league_score_events`

References reward ledger:

- membership ID
- ledger entry ID unique
- XP delta
- source type/id
- occurred at
- sequence

### `league_final_results`

Immutable snapshot:

- final position
- final XP
- tie-break snapshot
- old/new league
- reward transaction
- notification status

---

## 9. Online Synchronization

Source of truth: PostgreSQL score events and membership totals.

Recommended live path:

1. reward transaction commits
2. outbox emits qualified League XP event
3. League consumer inserts `league_score_event`
4. increments membership total
5. updates Redis sorted set
6. broadcasts WebSocket/SSE cohort update
7. periodic reconciliation compares Redis to PostgreSQL

Redis keys:

```text
league:cohort:{cohortId}:scores
league:cohort:{cohortId}:member:{userId}
```

If Redis fails, API falls back to PostgreSQL.

---

## 10. API

| Method | Path |
|---|---|
| `GET` | `/leagues/current` |
| `GET` | `/leagues/current/leaderboard?cursor=` |
| `GET` | `/leagues/current/me` |
| `GET` | `/leagues/history?cursor=` |
| `GET` | `/leagues/users/:userId` | privacy filtered |

Response includes:

- server timestamp
- season ends at
- current position
- promotion/demotion zones
- user’s score
- surrounding users
- top users
- score-source breakdown

---

## 11. Season Finalization

A locked, idempotent job:

1. acquire PostgreSQL advisory lock for season/cohort
2. stop accepting events after end timestamp
3. drain outbox
4. reconcile totals
5. calculate positions and ties
6. apply promotion/demotion gates
7. persist final results
8. grant season rewards
9. create notifications
10. create next-season placement seed
11. mark finalized

Late score events are assigned only if their authoritative completion time is before season end and they arrived within a defined grace window.

---

## 12. League Rewards

Example:

| Result | Reward |
|---|---|
| 1st | 500 Coins + 25 Gems |
| 2nd | 350 Coins + 15 Gems |
| 3rd | 250 Coins + 10 Gems |
| Promoted | 100 Coins |
| Stayed active | 25 Coins |
| Master top 3 | cosmetic/profile reward |

Rewards do not count as League XP.

---

## 13. Notifications

Types:

- `league_started`
- `league_position_changed` — rate-limited
- `league_promotion_risk`
- `league_demote_risk`
- `league_finalized`
- `league_promoted`
- `league_gate_blocked`

Rules:

- no notification for every small position movement
- risk notification max once per day
- final result always in inbox
- deep link to current league/result

---

## 14. Privacy

- users can hide from public profile league display
- membership still exists for scoring
- hidden user displays as anonymized in others’ leaderboard when required
- blocked users do not see one another’s identity
- minors/default-private accounts use stricter visibility

---

## 15. Anti-Cheat

- only qualified ledger events accepted
- one ledger event can enter one season once
- completion timestamps server-owned
- repeated easy tasks excluded
- Battle XP capped
- suspicious XP velocity triggers hold
- collusive Battles may be removed before finalization
- offline completion uses signed/revalidated server submission
- no client score mutation endpoint

---

## 16. Error Codes

- `LEAGUE_NOT_ASSIGNED`
- `LEAGUE_SEASON_NOT_ACTIVE`
- `LEAGUE_SCORE_EVENT_DUPLICATE`
- `LEAGUE_FINALIZING`
- `LEAGUE_RESULT_NOT_READY`
- `LEAGUE_PROMOTION_GATE_MISSING`

---

## 17. Analytics

- `league_assigned`
- `league_score_added`
- `league_position_changed`
- `league_finalized`
- `league_promoted`
- `league_demoted`
- `league_gate_blocked`
- `league_notification_opened`

---

## 18. Acceptance Criteria

- all users in a cohort see the same server leaderboard
- PostgreSQL remains authoritative
- League XP includes only qualified learning
- Bronze, Silver, Gold, Platinum, Diamond, and Master are supported
- promotion/demotion is deterministic and snapshotted
- rank gates prevent premature high-tier entry
- season finalization is idempotent
- live updates survive Redis failure through fallback/reconciliation
- notifications are useful and rate-limited

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/leagues/` |
| Tiers / gates / promo math | `league-tiers.ts`, `league-promotion.ts` |
| Season bounds (Mon 04:00 regional) | `league-season-bounds.ts` |
| Score ingest + velocity hold | `league-score.service.ts` ← gamification outbox |
| Live projection | `league-live-scores.service.ts` — Redis if `REDIS_URL`, else memory |
| Finalize + rewards + Master cosmetic | `league-finalize.service.ts` |
| Privacy / blocks / admin exclude | `leagues.service.ts` + `SocialPermissionService` |
| APIs | `LeaguesController` — current, leaderboard, me, history, users, privacy |
| FE board | `useCurrentLeague` (20s poll), `LeaderboardScreen` |
| FE home card | `useHomeLeagueCard` → `HomeExtras` |
| FE history / privacy | Past tab; Settings hide-league toggle |
| FE notifs | `map-notification.ts` league_* icons |

**Still thin:** true WS/SSE clients (Redis pub ready), bot/test account flag (admin only), analytics bus, minors privacy path, Bull finalize job (admin HTTP trigger exists).
