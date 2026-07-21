# 14 — Battle Mode

**Stack:** NestJS + TypeORM + PostgreSQL; REST authoritative (WebSocket `/battle` deferred)  
**Consumers:** Battle setup, incoming invite, live question, answer reveal, sudden death, victory, profile history  
**Depends on:** `../social/12-social-media.md` (stubbed: verified active users), `../content-pool/08-content-pool.md`, `../gamification/07-gamification.md`, `../notifications/06-notifications.md`

**Implementation:** `arc-backend/src/battles/`, friends-only via `SocialPermissionService`  
**Frontend:** `arc-app/src/lib/api/battles.ts`, `components/battle/*`, Friends Battle rail → `/battle/create?opponent=<uuid>`

---

## 1. Purpose

Two users compete on a selected subject using reviewed questions from the Content Pool. Each may wager Coins. The winner receives the escrowed pot.

Battle must measure knowledge, not spending power.

---

## 2. Eligibility

Before creating/accepting:

- both accounts active and verified
- relationship allowed by social privacy
- pair not blocked
- subject available to both
- enough reviewed questions in pool
- both users have required Coin balance
- stake within level limit
- neither user already in conflicting live Battle
- risk/fraud hold absent

Default invitations: friends only.

---

## 3. Battle Configuration

Challenger chooses:

- opponent
- subject
- optional topic
- difficulty: easy, medium, hard, expert, mixed
- questions: 5, 10, 15, 20
- seconds/question: 15, 30, 45, 60
- mode: live or async
- Coin stake: 50, 100, 250, 500, custom within limit

Stake limits:

| Rank level | Max stake per player |
| ---------: | -------------------: |
|        1–4 |                  100 |
|        5–6 |                  250 |
|        7–9 |                  500 |
|      10–12 |                1,000 |

---

## 4. State Machine

```text
draft
→ invited
→ accepted
→ funding
→ ready
→ in_progress
→ sudden_death (optional)
→ completed
```

Terminal alternatives:

- declined
- expired
- cancelled
- forfeited
- voided
- refunded

Only server transitions state.

---

## 5. Data Model

### `battles`

- IDs for challenger/opponent
- subject/topic
- difficulty/configuration snapshot
- mode
- stake per player
- status
- invite expiry
- start/end timestamps
- current round
- winner ID
- final scores
- result reason
- question-set version
- risk status

### `battle_participants`

- battle/user
- role
- score
- correct count
- average answer ms
- current connection state
- forfeit status
- final placement

### `battle_questions`

Immutable snapshot:

- battle/round/order
- source question version
- prompt/options snapshot
- correct-answer hash/encrypted snapshot
- explanation snapshot
- difficulty
- time limit
- points configuration

### `battle_answers`

- participant/question
- selected answer
- correct
- response ms
- correctness/speed/difficulty/streak points
- submitted at
- idempotency key

Unique `(participant_id, battle_question_id)`.

### `battle_coin_escrows`

- battle/user
- amount
- debit ledger entry
- status: reserved, captured, refunded, released
- settlement transaction ID

### `battle_events`

Ordered event stream for reconnect/audit:

- invite
- accepted
- player_ready
- question_opened
- answer_submitted
- reveal
- score_changed
- disconnect
- sudden_death
- result

### `battle_results`

Profile/history snapshot with scores, opponent, subject, stake, Coins won/lost, accuracy, timing, and created at.

---

## 6. Invite Flow

1. challenger submits config
2. SocialPermissionService validates
3. Content Pool verifies question availability
4. server verifies challenger stake balance but does not debit yet
5. create `invited` Battle
6. notify opponent
7. invite expires in 30 minutes for live, 24 hours for async

Accept:

1. lock Battle
2. verify both balances again
3. debit both wallets into escrow in one transaction
4. generate/snapshot question set
5. mark accepted/ready
6. notify challenger

Decline/expiry does not debit Coins.

---

## 7. Question Generation

From active **quiz units** via `QuestionPoolService` (flattened `unit.content.questions`).

### Live mode

- same question version and order for both
- question revealed simultaneously
- no answer visible until both submit or timer expires

### Async mode

- equivalent calibrated sets
- same topic/difficulty distribution
- no direct identical ordering if answer leakage is a risk
- both must finish within 24 hours

Question-set rules:

- minimum pool size 5× requested count
- no recent exposure for either user where possible
- only active quiz units (`lesson_type = quiz`)
- no live AI-generated question
- snapshot content and answer keys at Battle creation

---

## 8. Live Transport

WebSocket namespace: `/battle`.

Client events:

- `battle:join`
- `battle:ready`
- `battle:answer`
- `battle:heartbeat`
- `battle:reconnect`

Server events:

- `battle:state`
- `battle:question`
- `battle:opponent_answered` — no answer content
- `battle:reveal`
- `battle:score`
- `battle:sudden_death`
- `battle:completed`

REST remains authoritative for initial/final state and reconnect snapshots.

---

## 9. Scoring

Per normal question:

```text
correctness = 100 if correct else 0
speed_bonus = correct ? round(30 × remaining_ms / total_ms) : 0
difficulty_bonus = correct ? {easy:0, medium:5, hard:10, expert:20} : 0
streak_bonus = correct_streak >= 3 ? 15 : 0
```

```text
question_score =
correctness + speed_bonus + difficulty_bonus + streak_bonus
```

Correctness always dominates speed.

Timeout = incorrect, 0 points.

---

## 10. Answer Reveal

Reveal after both answers or timeout:

- user answer
- opponent answer
- correct answer
- short explanation
- points for each
- total score
- next-question countdown

Never reveal one player’s selected answer before the opponent is locked.

---

## 11. Winner and Sudden Death

Normal winner: highest total score.

If tied:

1. enter sudden death
2. ask one question at a time
3. if one correct and one wrong, correct user wins
4. if both same correctness, continue
5. maximum five sudden-death questions
6. then compare:
   - hard/expert correct count
   - total accuracy
   - lower average response time
7. if still identical, draw and refund stakes

---

## 12. Coin Settlement

Example: both stake 100.

- challenger debit: -100
- opponent debit: -100
- escrow pot: 200
- winner credit: +200

Settlement in one transaction.

Draw/void/system failure:

- refund each original stake
- no minted stake Coins

Forfeit:

- valid remaining player receives pot
- server outage or verified system fault refunds both

---

## 13. Disconnect Rules

Live:

- heartbeat every 5 seconds
- 15-second grace
- reconnect restores current state
- one extended disconnect warning
- second or >60-second absence may forfeit
- if both disconnect/system unavailable, void/refund

Async:

- no socket requirement
- deadline enforcement by job
- accepted but unplayed expiry refunds both
- repeated abandonment creates cooldown

---

## 14. Battle Rewards and XP

Normal learning reward:

- 5 Lifetime XP for completion
- 2 XP per correct answer
- +10 XP win
- +10 XP perfect result
- max 100 qualified Battle League XP/day

Coin participation bonus: 10 Coins, max three/day, optional. Stake settlement is separate.

No Gems are wagered.

---

## 15. Profile History

`GET /battles/history` and friend profile may show:

- opponent
- subject/topic
- result
- final score
- stake/pot
- Coins won/lost
- accuracy
- average answer time
- date
- rematch availability

Aggregate:

- played/won/lost/drawn
- win rate
- favorite subject
- best topic
- current win streak

Respect profile privacy and blocks.

---

## 16. API

| Method | Path                       |
| ------ | -------------------------- |
| `POST` | `/battles`                 |
| `GET`  | `/battles/invites`         |
| `POST` | `/battles/:id/accept`      |
| `POST` | `/battles/:id/decline`     |
| `POST` | `/battles/:id/cancel`      |
| `POST` | `/battles/:id/ready`       |
| `GET`  | `/battles/:id`             |
| `GET`  | `/battles/:id/state`       |
| `POST` | `/battles/:id/answers`     |
| `POST` | `/battles/:id/forfeit`     |
| `POST` | `/battles/:id/rematch`     |
| `GET`  | `/battles/history?cursor=` |
| `GET`  | `/battles/stats/me`        |

All mutations require idempotency keys.

---

## 17. Notifications

- `battle_invite`
- `battle_invite_expiring`
- `battle_accepted`
- `battle_starting`
- `battle_result`
- `battle_rematch`

Examples:

- “Alex challenged you to 10 SQL questions for 100 Coins.”
- “Sudden Death: one question can decide it.”
- “Victory — 200 Coins added.”

---

## 18. Anti-Collusion and Security

Signals:

- repeated pair/stake patterns
- intentional fast wrong answers
- circular Coin transfers
- impossible response times
- multiple accounts/device
- abnormal win trading

Controls:

- reduce/disable Battle XP after three same-pair Battles/day
- risk-hold large settlements
- server timer and grading
- question exposure tracking
- no client answer keys
- signed WebSocket session token
- audit event sequence
- report and block actions

---

## 19. Error Codes

- `BATTLE_OPPONENT_NOT_ALLOWED`
- `BATTLE_ALREADY_PENDING`
- `BATTLE_INVITE_EXPIRED`
- `BATTLE_INSUFFICIENT_QUESTION_POOL`
- `BATTLE_INSUFFICIENT_COINS`
- `BATTLE_STAKE_LIMIT`
- `BATTLE_ALREADY_STARTED`
- `BATTLE_ANSWER_ALREADY_SUBMITTED`
- `BATTLE_QUESTION_EXPIRED`
- `BATTLE_NOT_PARTICIPANT`
- `BATTLE_SETTLEMENT_FAILED`

---

## 20. Analytics

- `battle_created`
- `battle_invited`
- `battle_accepted`
- `battle_started`
- `battle_answer_submitted`
- `battle_sudden_death_started`
- `battle_completed`
- `battle_forfeited`
- `battle_refunded`
- `battle_rematch_requested`
- `battle_risk_flagged`

---

## 21. Acceptance Criteria

- Battle eligibility respects friendship/privacy/blocking
- both stakes are escrowed before start
- questions come from active quiz units in the Content Pool
- answer keys are never sent early
- live players see synchronized authoritative state
- scoring and winner logic are deterministic
- ties use sudden death and a final draw fallback
- settlement is idempotent and auditable
- match history appears on profile subject to privacy
- Battle XP is capped and cannot be farmed

---

## 22. File map (implementation notes)

### Backend
- Escrow via `RewardLedgerService` (real entry IDs)
- Heartbeat `POST /battles/:id/heartbeat` + disconnect forfeit/void
- Async play expiry + invite expiring notifs
- Pair XP farm cap, participation coin daily cap, league XP daily cap 100
- Quiz-unit pool via `selectBattleSet` / `unit-battle-question.util`; async set differentiation
- Dev seed: `BattleQuizUnitsSeedService` upserts quiz units (not question_templates)

### Frontend
- Sudden death banner, reveal opponent pick + points, forfeit, heartbeat poll
- Idempotency-Key header; history cursor load-more
- Create: expert difficulty, rank stake caps + custom stake (`stake-limits.ts`)
- Play: funding/ready rooms, wait-for-opponent after lock
- Hub: multi incoming + outgoing invites via `useBattleHub`
- Result: accuracy / avg time; forfeit/void headlines
- Profile: battle record card (`useBattleStats`)
