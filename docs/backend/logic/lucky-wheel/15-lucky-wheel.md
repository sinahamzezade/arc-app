# 15 — Lucky Wheel

**Version:** 2.0 integrated  
**Canonical integration:** One secure server spin transaction calls Gamification ledger; Wheel XP never becomes League XP.

See [00 — System Integration Contract](../integration/00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arlo Lucky Wheel screen, Home daily bonus card, Rewards Wallet  
**Depends on:** `../auth/01-user-model-and-authentication.md`, `../notifications/06-notifications.md`, `../gamification/07-gamification.md`

---

## 1. Existing Coverage and Boundary

Existing files establish that rewards are server-owned and that Lucky Wheel rewards may include Coins, Gems, limited XP, badges, or retry outcomes. This file defines the complete backend lifecycle.

The Lucky Wheel is a **bonus engagement system**, not a requirement for course, streak, rank, or league progression.

---

## 2. Core Rules

1. One free spin per reward day.
2. Reward day resets at **03:00 in the user’s configured time zone**.
3. The server clock is authoritative.
4. The wheel shown to a user is a snapshot; its result cannot be changed by client animation.
5. A spin result and reward ledger entry are committed in one transaction.
6. The client sends no reward identifier or winning angle.
7. “Try Again” may grant a replacement spin, but cannot loop indefinitely.
8. Lucky Wheel XP counts as Lifetime XP only and is capped at 25 XP/day; it does not count toward League XP.
9. Inventory-limited or disabled rewards are replaced before the wheel snapshot is returned.
10. All probabilities are configurable without an app release.

---

## 3. NestJS Module Layout

```text
lucky-wheel/
  lucky-wheel.module.ts
  lucky-wheel.controller.ts
  lucky-wheel.service.ts
  wheel-layout.service.ts
  wheel-eligibility.service.ts
  wheel-rng.service.ts
  wheel-reset.service.ts
  dto/
  entities/
    wheel-campaign.entity.ts
    wheel-segment-rule.entity.ts
    wheel-user-day.entity.ts
    wheel-spin.entity.ts
    wheel-reward-inventory.entity.ts
```

Uses `GamificationService.grantReward()` and never writes balances directly.

---

## 4. Reward Day and Reset

### Reward-day boundaries

```text
reward_day_start = latest local 03:00
reward_day_end   = next local 03:00
```

Store the resolved UTC timestamps per user-day to make DST behavior auditable.

### Reset behavior

The system does not need to create rows for every user at 03:00.

Use lazy initialization:

1. `GET /lucky-wheel` resolves the current reward day.
2. Load `wheel_user_days` by `(user_id, reward_day_date)`.
3. If missing, create it with one free entitlement and a frozen layout snapshot.
4. Return `nextSpinAt` and `resetsAt`.

A scheduled job may pre-create entitlements for recently active users, but correctness must not depend on the cron.

---

## 5. Data Model

### 5.1 `wheel_campaigns`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `slug` | varchar unique | |
| `status` | enum | `draft`, `active`, `paused`, `ended` |
| `starts_at` / `ends_at` | timestamptz nullable | |
| `timezone_policy` | enum | `user_local`, `utc`, `campaign_zone` |
| `segment_count` | int | MVP: 6 |
| `max_free_spins_per_day` | int | Default 1 |
| `max_paid_respins_per_day` | int | Default 1 |
| `eligibility_rules` | jsonb | Rank, country, feature flags |
| `created_at` / `updated_at` | timestamptz | |

### 5.2 `wheel_segment_rules`

A campaign can have more reward candidates than visible segments.

| Column | Type |
|---|---|
| `id` | uuid |
| `campaign_id` | uuid |
| `reward_key` | varchar |
| `reward_type` | enum |
| `reward_payload` | jsonb |
| `weight` | numeric |
| `min_rank_level` | int nullable |
| `max_rank_level` | int nullable |
| `daily_global_limit` | int nullable |
| `total_inventory` | int nullable |
| `replacement_reward_key` | varchar nullable |
| `allow_duplicate_on_layout` | boolean |
| `is_active` | boolean |
| `sort_order` | int |

Reward types:

- `coins`
- `gems`
- `lifetime_xp`
- `inventory_item`
- `streak_freeze`
- `badge`
- `extra_spin`
- `try_again`

### 5.3 `wheel_user_days`

| Column | Type |
|---|---|
| `id` | uuid |
| `user_id` | uuid |
| `campaign_id` | uuid |
| `reward_day` | date |
| `day_start_at` / `day_end_at` | timestamptz |
| `layout_snapshot` | jsonb |
| `free_spins_total` | int |
| `paid_spins_total` | int |
| `spins_used` | int |
| `next_spin_at` | timestamptz nullable |
| `layout_version` | int |
| `created_at` / `updated_at` | timestamptz |

Unique: `(user_id, campaign_id, reward_day)`.

### 5.4 `wheel_spins`

| Column | Type |
|---|---|
| `id` | uuid |
| `user_day_id` | uuid |
| `spin_number` | int |
| `entitlement_type` | enum: `free`, `extra`, `gem_respin` |
| `winning_segment_id` | varchar |
| `reward_key` | varchar |
| `reward_snapshot` | jsonb |
| `rng_value` | numeric |
| `idempotency_key` | varchar |
| `ledger_transaction_id` | uuid nullable |
| `status` | enum: `reserved`, `awarded`, `failed`, `reversed` |
| `created_at` | timestamptz |

Unique: `(user_id, idempotency_key)` through a joined/duplicated user field or service constraint.

### 5.5 `wheel_reward_inventory`

For limited rewards:

- `reward_key`
- `total_quantity`
- `reserved_quantity`
- `awarded_quantity`
- `available_from`
- `available_until`

Use atomic reservation.

---

## 6. Default Six-Segment Layout

An initial configuration matching the current UI:

| Segment | Reward | Weight |
|---|---|---:|
| A | 10 Gems | 14 |
| B | 25 Lifetime XP | 18 |
| C | 100 Coins | 18 |
| D | Try Again | 12 |
| E | Lucky Badge / badge fragment | 8 |
| F | 50 Coins | 30 |

Weights are relative, not percentages. Operations can change them.

Daily caps:

- Gems: maximum 15 from the wheel
- XP: maximum 25 from the wheel
- extra spins: maximum one extra entitlement
- rare badge: one award per account

---

## 7. Dynamic Layout Generation

`WheelLayoutService` creates a six-segment snapshot.

### Candidate filtering

Remove candidates when:

- campaign inactive
- rank requirement not met
- item already owned and non-duplicable
- reward inventory exhausted
- account already hit daily reward cap
- reward restricted by region/subscription/feature flag
- safety or fraud hold applies

### Candidate scoring

```text
effective_weight =
base_weight
× rank_factor
× retention_factor
× inventory_factor
× campaign_factor
```

Examples:

- a streak-risk user may have a slightly higher chance of a Streak Freeze
- a new user may see more Coins and fewer advanced cosmetics
- an owner of the Lucky Badge receives the configured replacement

### Layout invariants

- exactly six visible segments
- at least one Coin segment
- no more than two segments of the same reward type
- no duplicate unique item
- total normalized weight > 0
- layout is immutable after first display, except explicit replacement rules

---

## 8. Reward Replacement Logic

### 8.1 Before the spin

When a candidate becomes unavailable before the user-day is created:

1. use `replacement_reward_key`
2. otherwise select from campaign fallback pool
3. otherwise use `50_coins`
4. persist the replacement in `layout_snapshot`

### 8.2 After a user wins and has another spin

If the user receives an extra/re-spin entitlement:

- unique won item is replaced
- already-hit daily-cap reward is replaced
- the won segment may remain only when duplicates are allowed
- replacement layout version increments
- previous spin result remains unchanged

Example:

```json
{
  "oldSegment": "lucky_badge",
  "newSegment": "100_coins",
  "reason": "unique_reward_already_owned",
  "layoutVersion": 2
}
```

### 8.3 Inventory race

If inventory is exhausted after layout creation but before award:

- attempt atomic inventory reserve
- if reserve fails, award the segment’s snapshotted fallback
- record `replacementReason = inventory_exhausted_at_award`
- never silently return no reward

---

## 9. Spin Transaction

`POST /lucky-wheel/spin`:

1. authenticate user
2. resolve reward day
3. lock `wheel_user_days` row
4. verify an unused entitlement
5. verify `now >= next_spin_at`
6. load layout snapshot
7. generate cryptographically secure random number
8. select weighted segment
9. reserve limited inventory if needed
10. create `wheel_spins` row as `reserved`
11. call `GamificationService.grantReward()` with an idempotency key
12. mark spin `awarded`
13. consume entitlement
14. if reward is `extra_spin`, add one entitlement and update layout
15. commit
16. return result and animation target

The UI may animate to `landingIndex`, but the server result already exists.

---

## 10. Secure Random Selection

Use Node `crypto.randomInt()` or a cryptographically secure provider.

Do not use:

- `Math.random()`
- client-generated angle
- client-generated seed
- timestamps as randomness

Store the normalized RNG value for audit, but never expose internal weights to the client unless product intentionally displays odds.

---

## 11. Time Tracking

Response fields:

```json
{
  "serverNow": "2026-07-12T11:00:00Z",
  "rewardDay": "2026-07-12",
  "spinsAvailable": 1,
  "nextSpinAt": null,
  "resetsAt": "2026-07-13T01:00:00Z"
}
```

Client countdown:

```text
remaining = nextSpinAt_or_resetsAt - serverNow
```

Refresh from server when:

- app returns from background
- local countdown reaches zero
- time zone changes
- device clock differs by more than 60 seconds

---

## 12. HTTP API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/lucky-wheel` | Current layout, entitlement, timer |
| `POST` | `/lucky-wheel/spin` | Execute authoritative spin |
| `POST` | `/lucky-wheel/respin/purchase` | Spend Gems for allowed re-spin |
| `GET` | `/lucky-wheel/history?cursor=` | User spin history |
| `GET` | `/lucky-wheel/rewards/:spinId` | Re-fetch idempotent result |

### Spin request

```json
{
  "idempotencyKey": "uuid"
}
```

### Spin response

```json
{
  "spinId": "uuid",
  "winningSegmentId": "segment-c",
  "landingIndex": 2,
  "reward": {
    "type": "coins",
    "amount": 100,
    "label": "100 Coins"
  },
  "wallet": {
    "coins": 2550,
    "gems": 350,
    "lifetimeXp": 1250
  },
  "spinsAvailable": 0,
  "resetsAt": "2026-07-13T01:00:00Z"
}
```

---

## 13. Re-Spin Purchase

- price: 25 Gems by default
- maximum one Gem re-spin per reward day
- Gems debited and entitlement granted in one transaction
- purchasing does not itself spin
- if no valid layout can be created, purchase fails without debit
- refunded/reversed only on server error

---

## 14. Notifications

Optional notifications:

- `lucky_wheel_ready`: daily spin available
- `lucky_wheel_reward`: rare reward won
- `lucky_wheel_expiring`: optional, max one per day

Respect push preferences and daily notification cap.

---

## 15. Anti-Abuse

- server clock and user timezone history are authoritative
- no more than one timezone change per 30 days without review
- idempotency key required for spin
- device reinstall does not reset entitlement
- account deletion/recreation fraud signals are retained where legally allowed
- rare rewards may have account-age and email-verification requirements
- suspicious spin velocity triggers risk review
- wheel rewards cannot be transferred

---

## 16. Error Codes

- `WHEEL_NOT_AVAILABLE`
- `WHEEL_NO_SPINS_LEFT`
- `WHEEL_SPIN_TOO_EARLY`
- `WHEEL_CAMPAIGN_ENDED`
- `WHEEL_LAYOUT_INVALID`
- `WHEEL_REWARD_UNAVAILABLE`
- `WHEEL_RESPIN_LIMIT_REACHED`
- `INSUFFICIENT_GEMS`
- `IDEMPOTENCY_KEY_REQUIRED`

---

## 17. Analytics

- `wheel_viewed`
- `wheel_layout_created`
- `wheel_spin_started`
- `wheel_spin_awarded`
- `wheel_reward_replaced`
- `wheel_respin_purchased`
- `wheel_reset`
- `wheel_rare_reward_awarded`

Track configured odds separately from observed outcomes.

---

## 18. Acceptance Criteria

- one free spin is available per user reward day
- reset works lazily and survives missed cron jobs
- the server, not animation, chooses the reward
- rewards are added through an immutable ledger
- unavailable rewards are replaced deterministically
- unique items cannot be won twice unless configured
- timers use server timestamps
- spin and reward are idempotent
- daily XP/Gem/re-spin limits are enforced
- users cannot manipulate reward results by changing device time

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/lucky-wheel/` |
| Campaign + rules + user-day + spins | `entities/wheel-*.entity.ts` |
| Layout snapshot | `wheel-layout.service.ts` |
| Secure RNG | `wheel-rng.service.ts` (`crypto.randomInt`) |
| Spin + respin + history | `lucky-wheel.service.ts` → ledger `RewardReasonType.Wheel` (no League XP) |
| APIs | `GET/POST /lucky-wheel`, `/spin`, `/respin/purchase`, `/history`, `/rewards/:id` |
| Seed | default campaign `daily-lucky-wheel` on module init |
| FE client | `arc-app/src/lib/api/lucky-wheel.ts`, `useLuckyWheel` |
| FE screen | live `LuckyWheelScreen` (animate to `landingIndex`) |
| FE home | `HomeExtras` WheelInfo from `/lucky-wheel` |

**Still thin:** full inventory race reserve table usage, retention weight factors, TZ-change review, `lucky_wheel_expiring` emitter, analytics bus, Bull pre-create job.
