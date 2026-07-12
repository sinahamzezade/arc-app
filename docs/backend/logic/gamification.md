# Arc Backend — Gamification, Economy, Store, Unlocks & Streaks

**Version:** 2.0 integrated  
**Canonical integration:** Wallet/ledger and streak source of truth. Consumes doc 05 completion and doc 04 week-seal transactions; emits events through doc 00.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Lesson reward screen, Wallet, Gem Shop, Coin Shop, rank, league, roadmap unlocks, streak UI  
**Depends on:** `04-weekly-plan-and-lessons.md`, `05-Learn_Lesson_Play_API.md`, `06-notifications.md`  
**Feeds:** `ranking_system.md`, `leagues.md`, `lucky_wheel.md`, `battle_mode.md`

---

## 1. Existing Coverage and Boundary

Existing lesson and weekly-plan specs already require server-authoritative reward grants and idempotent lesson completion. This file creates the missing central economy module and one consistent set of reward/unlock rules.

Core rule:

> XP proves learning, Gems protect momentum, and Coins buy identity/social extras.

Never trust the client for:

- reward amounts
- balances
- streak state
- inventory
- rank
- lesson unlocks
- league XP
- store prices

---

## 2. Currency Definitions

| Currency | Purpose | Spendable | Reset |
|---|---|---:|---:|
| Lifetime XP | Permanent progress and rank evaluation | yes — currency packs only | never |
| Qualified League XP | Weekly competitive score | no | each league season |
| Gems | Utility: streak, hints, recovery, optional convenience | yes | never |
| Coins | Cosmetics and Battle stakes | yes | never |

Lifetime XP may be spent **only** on gem/coin currency packs (`POST /wallet/currency-packs/purchase` with `paymentMethod: xp`). Spending lowers `lifetime_xp` and therefore rank-gate progress; already unlocked ranks stay. League XP is never spendable.

Same pack SKUs reserve `iapProductId` for future real-money IAP (`paymentMethod: iap` not enabled yet).

Referral, Lucky Wheel, and cosmetic purchases never create League XP.

---

## 3. NestJS Layout

```text
gamification/
  gamification.module.ts
  rewards.controller.ts
  wallet.controller.ts
  store.controller.ts
  streak.controller.ts
  gamification.service.ts
  reward-calculator.service.ts
  reward-ledger.service.ts
  currency-packs.constants.ts
  currency-exchange.service.ts
  store.service.ts
  inventory.service.ts
  streak.service.ts
  unlock-evaluator.service.ts
  badge-evaluator.service.ts
  entities/
    wallet.entity.ts
    reward-ledger-entry.entity.ts
    reward-rule.entity.ts
    store-item.entity.ts
    user-inventory-item.entity.ts
    streak-state.entity.ts
    streak-day.entity.ts
    badge.entity.ts
    user-badge.entity.ts
```

---

## 4. Authoritative Ledger

### 4.1 `wallets`

One row per user:

- `lifetime_xp`
- `weekly_league_xp`
- `gems`
- `coins`
- `version`
- `updated_at`

Use integer amounts only.

### 4.2 `reward_ledger_entries`

Immutable double-entry-like journal.

| Field | Notes |
|---|---|
| `id` | uuid |
| `user_id` | |
| `currency` | `lifetime_xp`, `league_xp`, `gems`, `coins` |
| `amount` | signed integer |
| `reason_type` | lesson, quiz, project, wheel, battle, store, streak, admin |
| `reason_id` | source UUID |
| `transaction_group_id` | groups multi-currency reward |
| `idempotency_key` | unique per user/currency operation |
| `metadata` | score, multiplier snapshot |
| `created_at` | |

Balance is updated in the same transaction as ledger insertion. Ledger is the audit source and can rebuild wallets.

---

## 5. Dynamic Lesson Reward Model

### 5.1 Base reward by learning action

| Action | Base XP | Base Gems | Base Coins |
|---|---:|---:|---:|
| Video / Audio | 10 | 0 | 8 |
| Reading | 12 | 0 | 8 |
| Guided Example | 18 | 1 | 12 |
| Reflection | 15 | 1 | 10 |
| Quiz | 25 | 2 | 15 |
| Coding Practice | 32 | 3 | 20 |
| Dataset Practice | 36 | 3 | 22 |
| Debugging Task | 38 | 4 | 24 |
| Mini Project Task | 55 | 5 | 35 |
| Mini Challenge | 80 | 8 | 50 |
| Boss Challenge | 140 | 15 | 90 |
| Project Milestone | 180 | 20 | 120 |
| Final Capstone | 300 | 35 | 200 |

Passive lessons deliberately pay less than proof-of-skill work.

### 5.2 Difficulty multiplier

| Difficulty | Multiplier |
|---|---:|
| Intro | 0.80 |
| Beginner | 1.00 |
| Intermediate | 1.25 |
| Advanced | 1.55 |
| Expert | 1.90 |

### 5.3 Course-position multiplier

Calculated from the lesson’s required-order percentile in the user’s path.

| Position | Multiplier |
|---|---:|
| First 0–20% | 0.80 |
| 21–50% | 1.00 |
| 51–75% | 1.20 |
| 76–90% | 1.40 |
| Final 10% | 1.65 |

This creates smaller early rewards and materially larger final rewards.

### 5.4 Performance multiplier

| Result | XP multiplier |
|---|---:|
| Pass 60–74% | 0.80 |
| Pass 75–89% | 1.00 |
| Pass 90–99% | 1.15 |
| Perfect | 1.30 |

### 5.5 Assistance multiplier

| Assistance | XP multiplier |
|---|---:|
| None | 1.00 |
| Normal hint | 0.95 |
| Premium hint | 0.85 |
| Remove options | 0.80 |
| Solution reveal | 0.40 |

### 5.6 Formula

```text
xp =
round(
  base_xp
  × difficulty_multiplier
  × course_position_multiplier
  × performance_multiplier
  × assistance_multiplier
  × repeat_multiplier
)
+ bounded_bonuses
```

```text
gems =
round(
  base_gems
  × difficulty_multiplier
  × course_position_multiplier
)
+ perfect_or_first_try_bonus
```

```text
coins =
round(
  base_coins
  × difficulty_multiplier
  × min(course_position_multiplier, 1.40)
)
```

Caps per single completion:

- XP: 1,000
- Gems: 75
- Coins: 500

### 5.7 Bonuses

- first correct attempt: +10% XP, max +40
- perfect quiz: +2 Gems
- first-attempt coding/dataset: +3 Gems
- weekly plan on track: +5% XP
- hard/expert proof task: +5 XP
- final capstone perfect: +100 XP and +10 Gems

### 5.8 Repeat multiplier

| Attempt | Multiplier |
|---|---:|
| First completion | 1.00 |
| First review within 7 days | 0.10 XP, 0 Gems, 0 Coins |
| Later review | 0 |
| Completion after solution reveal | max 0.40 |

---

## 6. Example Rewards

### Early beginner reading lesson

```text
12 × 1.00 × 0.80 × 1.00 = 9.6 → 10 XP
0 Gems
8 × 1.00 × 0.80 = 6 Coins
```

### Mid-course intermediate coding lesson, 92%, first attempt

```text
32 × 1.25 × 1.00 × 1.15 = 46 XP
First-attempt bonus ≈ +5 XP
Total: 51 XP
Gems: round(3 × 1.25 × 1.00) + 3 = 7
Coins: round(20 × 1.25) = 25
```

### Final advanced boss challenge, perfect

```text
140 × 1.55 × 1.65 × 1.30 ≈ 466 XP
+ bounded bonuses
Gems: round(15 × 1.55 × 1.65) + 2 ≈ 40
Coins: round(90 × 1.55 × 1.40) ≈ 195
```

### Final expert capstone, strong pass

```text
300 × 1.90 × 1.65 × 1.15 ≈ 1,082
Capped at 1,000 XP
Gems ≈ 75 cap
Coins ≈ 500 cap
```

---

## 7. Lesson and Phase Unlock Logic

### 7.1 Important rule

Normal sequential lessons should not require grinding unrelated XP.

A required next lesson unlocks when:

1. prerequisite lesson(s) are completed
2. required checkpoint score is met
3. any phase/milestone gate is satisfied
4. the lesson is included in the user’s roadmap instance

### 7.2 XP gates

XP is used for meaningful gates, not every small screen.

| Gate | Minimum Lifetime XP | Additional requirement |
|---|---:|---|
| First lessons | 0 | onboarding complete |
| Foundation checkpoint | 500 | prerequisite quest complete |
| Core phase | 2,000 | foundation assessment passed |
| Applied phase | 6,000 | one challenge + required lessons |
| Advanced/optional phase | 12,000 | skill assessment or rank requirement |
| Portfolio phase | 20,000 | two projects/challenges |
| Interview phase | 35,000 | portfolio milestone |
| Final readiness | 60,000 | capstone + final assessment |

If a user completes all required prerequisites but is slightly below an XP gate, provide a relevant review/challenge route. Do not encourage repeating trivial lessons.

### 7.3 Unlock evaluator

```text
unlocked =
all(prerequisite_completion)
AND lifetime_xp >= xp_floor
AND all(required_milestones)
AND entitlement_ok
AND not administratively_locked
```

Store a snapshot of the reasons in `lesson_unlock_audits`.

---

## 8. Gem Store

| Item | Price | Restriction |
|---|---:|---|
| 1-Day Streak Freeze | 50 Gems | max inventory |
| 3-Day Freeze Pack | 120 | |
| Weekend Shield | 85 | once/week |
| Emergency Freeze | 70 | within 6h of deadline |
| Restore 1 Day | 80 | 48h window |
| Restore 2 Days | 150 | recovery window |
| Restore 3 Days | 220 | once/month |
| Premium Hint | 20 | no answer |
| Remove Two Wrong Options | 15 | single-choice |
| Extra Quiz Attempt | 30 | XP penalty remains |
| Solution Reveal | 45 | 60% XP reduction |
| 30-Min XP Booster | 50 | +20%, once/day |
| Double-Gem Lesson Token | 60 | max 3/week |
| Lucky Wheel Re-spin | 25 | max 1/day |
| Optional Side Quest Unlock | 60 | optional only |
| Early Non-required Lesson | 70 | cannot bypass required proof |
| Challenge Practice Ticket | 40 | no League XP |
| Arlo Focus Mode | 35 | one session |
| Weekly Replan Token | 30 | twice/week |
| Common Chest Key | 75 | weighted reward |
| Badge Frame Unlock | 120 | cosmetic |
| Celebration Animation | 150 | cosmetic |

---

## 9. Coin Shop

### Glasses

| Item | Color | Price |
|---|---|---:|
| Classic Round Glasses | Black | 300 |
| Analyst Frames | Midnight Purple | 450 |
| Neon Study Glasses | Violet | 550 |
| Gold Aviators | Gold | 900 |

### Hats

| Item | Color | Price |
|---|---|---:|
| Arc Beanie | Deep Purple | 500 |
| SQL Cap | Royal Blue | 650 |
| Data Detective Hat | Brown + Gold | 850 |
| Wizard of Data Hat | Purple + Gold | 1,100 |
| Graduation Cap | Navy + Gold | 1,250 |

### Clothing and accessories

| Item | Color | Price |
|---|---|---:|
| Lavender Hoodie | Lavender | 800 |
| Midnight Hoodie | Dark Purple | 900 |
| Emerald Hoodie | Emerald | 1,000 |
| Crimson Challenge Hoodie | Crimson | 1,100 |
| Silver Headphones | Silver + Purple | 700 |
| Golden Headphones | Gold + Black | 1,200 |
| Study Scarf | Purple + White | 550 |
| Mini Backpack | Violet | 750 |
| Laptop Sticker Pack | Mixed | 400 |

### Profile/app cosmetics

| Item | Color | Price |
|---|---|---:|
| Bronze Profile Frame | Bronze | 600 |
| Silver Profile Frame | Silver | 900 |
| Gold Profile Frame | Gold | 1,400 |
| Confetti Celebration | Multicolor | 700 |
| Purple Lightning | Purple | 1,000 |
| Star Trail | Gold | 1,300 |
| Lavender Roadmap Theme | Lavender | 1,500 |
| Night Study Theme | Navy + Purple | 1,800 |
| Battle Arena Theme | Purple + Gold | 2,000 |

Coins never buy XP, Gems, streak recovery, answers, or required lessons.

---

## 10. Store Data Model

### `store_items`

- `sku`
- `currency`
- `price`
- `item_type`
- `inventory_payload`
- `rarity`
- `availability_rules`
- `purchase_limit`
- `starts_at` / `ends_at`
- `is_active`
- `version`

### `user_inventory_items`

- `user_id`
- `sku`
- `quantity`
- `equipped`
- `acquired_from`
- `acquired_at`
- `expires_at` nullable

Purchases use price snapshots and idempotency keys.

---

## 11. Daily and Weekly Streaks

### Daily Activity Streak

A day qualifies when the user completes at least one meaningful action before local 03:00:

- lesson/checkpoint
- coding/dataset task
- five verified study minutes
- completed Battle set
- qualified Study Together session
- recovery quest

Opening the app alone is insufficient.

### Weekly Commitment Streak

Managed with the weekly-plan rules:

- seal planned sessions, or
- reach at least 80% of planned minutes

It is separate from the daily streak.

---

## 12. Freeze and Restore

### Freeze

- purchased with Gems and stored in inventory
- automatically consumed at day close if no meaningful activity
- protected day is not a completed day
- no XP/rewards are granted
- max 2 stored for free users, 5 for premium
- max 3 consecutive protected days

### Restore

| Option | Price | Window |
|---|---:|---|
| Restore 1 day | 80 Gems | 48 hours |
| Restore 2 days | 150 | 48 hours |
| Restore 3 days | 220 | once/month |
| Recovery Quest | free | complete within 24h |

Restore marks day `recovered`; it does not replay missed rewards.

---

## 13. Streak Data Model

### `streak_states`

- `user_id`
- `daily_streak`
- `weekly_streak`
- `longest_daily_streak`
- `last_qualified_day`
- `recovery_window_ends_at`
- `consecutive_protected_days`
- `version`

### `streak_days`

Unique `(user_id, local_date)`:

- status: `completed`, `protected`, `missed`, `recovered`
- qualifying_action_type/id
- freeze_inventory_id
- timezone_snapshot
- day_start_at/day_end_at

---

## 14. API

| Method | Path |
|---|---|
| `GET` | `/wallet` |
| `GET` | `/wallet/ledger?cursor=` |
| `GET` | `/wallet/currency-packs?target=` |
| `POST` | `/wallet/currency-packs/purchase` |
| `GET` | `/store?currency=&type=` |
| `POST` | `/store/purchases` |
| `GET` | `/inventory` |
| `POST` | `/inventory/:id/equip` |
| `GET` | `/streaks` |
| `POST` | `/streaks/restore` |
| `GET` | `/rewards/:transactionGroupId` |

Currency pack purchase body: `{ sku, paymentMethod: "xp" }` + `Idempotency-Key`. Debits lifetime XP and credits gems or coins in one ledger group. Error `INSUFFICIENT_XP` when balance too low.

Internal:

```ts
grantReward({
  userId,
  reasonType,
  reasonId,
  resultSnapshot,
  idempotencyKey
})
```

---

## 15. Rank and League Hooks

After a qualified ledger transaction commits, publish:

```text
gamification.reward_granted
```

Consumers:

- Ranking System evaluates lifetime rank
- Leagues update qualified weekly score
- Badge evaluator checks conditions
- Notifications may create reward/rank messages

Use transactional outbox delivery.

---

## 16. Anti-Farming and Safety

- no client-supplied rewards
- first completion only for full reward
- repeated easy tasks produce no League XP
- daily Battle XP cap
- Lucky Wheel XP excluded from League XP
- offline completions are queued, signed, and revalidated
- system/admin grants have explicit reason and do not count in leagues
- wallet cannot become negative except temporary escrow account logic
- store prices are server snapshots
- reward rules are versioned so old completions remain auditable

---

## 17. Error Codes

- `REWARD_ALREADY_GRANTED`
- `REWARD_RULE_NOT_FOUND`
- `INSUFFICIENT_GEMS`
- `INSUFFICIENT_COINS`
- `ITEM_NOT_AVAILABLE`
- `ITEM_ALREADY_OWNED`
- `PURCHASE_LIMIT_REACHED`
- `LESSON_PREREQUISITE_MISSING`
- `XP_GATE_NOT_MET`
- `STREAK_NOT_RECOVERABLE`
- `STREAK_FREEZE_LIMIT_REACHED`

---

## 18. Acceptance Criteria

- every balance change has an immutable ledger row
- lesson rewards scale by type, difficulty, position, and performance
- final lessons/challenges pay substantially more than early passive lessons
- normal next lessons do not require unrelated XP grinding
- phase gates combine XP and proof-of-skill
- Gem and Coin prices come from server catalog
- streak freeze/restore is server-owned and timezone-safe
- reward grants are idempotent
- League XP excludes non-learning rewards
- rank, badges, and unlocks react through outbox events

---

## Implementation map (arc-backend)

| Doc area | Code |
|----------|------|
| Module | `src/gamification/` |
| Wallet + ledger | `entities/wallet`, `reward-ledger-entry`, `RewardLedgerService` |
| Dynamic §5 rewards | `reward-calculator.service.ts` + `lesson-reward-v2` |
| Lesson grant | `LessonRewardsService` → calculator; orchestrator grants + streak qualify |
| Soft XP gates | `LessonUnlockService` phase-boundary vs `XP_GATES` |
| Store catalog + purchase | `store.service.ts`, `StoreController`, seed `store-catalog.seed.ts` |
| Inventory / equip | `inventory.service.ts`, `InventoryController` |
| Daily streak + freeze/restore | `streak.service.ts`, `StreakController` (+ 15m day-close tick) |
| APIs | `GET /wallet`, `/wallet/ledger`, `/store`, `POST /store/purchases`, `/inventory`, `/streaks`, `/rewards/:id` |
| FE client | `arc-app/src/lib/api/wallet.ts`, live `WalletScreen` |

**Still thin:** Lucky Wheel economy, offline signed completions, badge evaluator entity, full cosmetic equip UI, Bull for streak close (interval for now), `lesson_unlock_audits` table.

**FE wired:** Wallet balances/ledger/shop live; streak strip + restore; economy hydrate from `/wallet`.
