# Arlo — Battle, Social, XP, Gems, Coins & Referral System

## 1. Scope

This document defines only the following Arlo systems:

- Daily streak protection and recovery
- Gems: earning, pricing, store items, and restrictions
- XP: dynamic reward logic, levels, ranks, and leaderboard eligibility
- Coins: earning, cosmetic store, colors, and prices
- Friends, following, profiles, and Study Together
- One-to-one subject Battles
- Referral links, milestone rewards, and referral tracking
- Abuse prevention and server-side economy rules

This continues the existing Arlo product. It must keep the same Arlo mascot, purple visual system, iOS-first layout, terminology, and friendly career-focused tone.

Core economy rule:

> XP proves learning, Gems protect momentum, and Coins express identity and power social competition.

Arlo must never become pay-to-win:

- XP cannot be purchased directly.
- Gems cannot buy correct answers, required project completion, boss-challenge passes, leaderboard position, or Battle wins.
- Coins cannot unlock required learning content.
- Referral rewards never create leaderboard XP.

---

# 2. Currency Model

| Currency | Purpose | Spendable | Reset behavior |
|---|---|---:|---|
| Lifetime XP | Long-term level, rank, achievements, profile identity | No | Never resets |
| Weekly League XP | Weekly leaderboard and league placement | No | Resets weekly |
| Gems | Protection, recovery, learning convenience, optional unlocks, limited boosts | Yes | Never resets |
| Coins | Cosmetics, avatar items, profile themes, Battle stakes | Yes | Never resets |

---

# 3. Streak System

## 3.1 Two Separate Streaks

Arlo should use two streaks so daily habit does not replace the earlier weekly commitment logic.

### Daily Activity Streak

The Daily Activity Streak increases when the user opens Arlo and completes one meaningful action before the local-day deadline.

Meaningful actions:

- Complete one lesson
- Complete one quiz
- Complete one coding or dataset task
- Complete at least 5 verified study minutes
- Complete one Battle question set
- Complete a Study Together session
- Complete a Recovery Quest

Opening the app alone should not create a streak day. However, not opening Arlo guarantees that the daily streak is missed.

### Weekly Commitment Streak

The Weekly Commitment Streak increases when the user completes the agreed weekly commitment, for example:

- at least 80% of planned weekly minutes, or
- the required minimum number of sessions, or
- the required weekly mission

The weekly streak is the more important consistency measure. The daily streak is a habit layer.

## 3.2 Daily Deadline

- Deadline uses the user’s selected time zone.
- Default day closes at 03:00 local time, not midnight.
- Streak calculations are server-side.
- Repeated time-zone switching cannot create extra streak days.
- One time-zone change per 30 days is allowed without manual review.

## 3.3 Streak Freeze Logic

1. User buys a Streak Freeze with Gems.
2. Freeze stays in inventory until required.
3. At the daily deadline, Arlo checks whether a meaningful action was completed.
4. If not, Arlo automatically consumes the oldest valid freeze.
5. The streak remains active.
6. The protected date is marked as **Protected**, not **Completed**.
7. User receives: “Your streak was protected. Arlo used one Streak Freeze.”
8. A freeze never generates XP, Gems, Coins, or leaderboard progress.

Inventory limits:

- Free user: maximum 2 stored freeze days
- Premium user: maximum 5 stored freeze days
- Freeze cannot protect more than 3 consecutive missed days
- Freeze cannot be transferred

## 3.4 Streak Recovery Logic

If the user misses a day without a freeze:

- Daily streak breaks.
- A 48-hour recovery window opens.
- User can restore the streak with Gems or complete a Recovery Quest.
- Restored days are marked **Recovered**.
- Restoring never awards the missed day’s XP or lesson rewards.

| Recovery option | Price | Rule |
|---|---:|---|
| Restore 1 missed day | 80 Gems | Available for 48 hours |
| Restore 2 missed days | 150 Gems | Both days must be inside recovery window |
| Restore up to 3 days | 220 Gems | Maximum chain, once per month |
| Recovery Quest | 0 Gems | Complete a harder task within 24 hours |

Recovery Quest examples:

- 15-minute challenge
- 5-question quiz with 80% pass requirement
- Complete the originally missed scheduled lesson

## 3.5 Streak Store Items

| Item | Price | Function |
|---|---:|---|
| 1-Day Streak Freeze | 50 Gems | Protects one missed day |
| 3-Day Freeze Pack | 120 Gems | Three separate one-day freezes |
| Weekend Shield | 85 Gems | Protects Saturday and Sunday |
| Emergency Freeze | 70 Gems | Can be bought within 6 hours after deadline |
| 1-Day Streak Restore | 80 Gems | Restores one broken day |
| 3-Day Streak Restore | 220 Gems | Restores up to three days |

Pricing target:

> A regular active user should earn enough for one standard freeze every 1–2 weeks, but not enough to ignore learning indefinitely.

---

# 4. Gems System

## 4.1 How Users Earn Gems

| Action | Gems |
|---|---:|
| Easy lesson completed | 1–2 |
| Medium lesson completed | 3–4 |
| Hard lesson completed | 5–7 |
| Expert lesson completed | 8–10 |
| Perfect quiz | +2 |
| First-attempt coding task | +3 |
| Mini challenge passed | 8–15 |
| Boss challenge passed | 15–25 |
| Portfolio milestone | 15–30 |
| Full project completed | 30–50 |
| Weekly goal completed | 10–20 |
| 4-week commitment streak | 25 |
| Daily Lucky Wheel | 0–10 |
| Successful referral activation | 20–30 |
| Study Together completion | 2–5, weekly cap applies |

Target weekly earning:

- Casual user: 15–25 Gems
- Regular user: 30–50 Gems
- Highly active user: 60–100 Gems

## 4.2 What Users Can Buy With Gems

The Gem store should include at least these items.

| Item | Price | Function | Restriction |
|---|---:|---|---|
| 1-Day Streak Freeze | 50 | Protect one missed day | Inventory limit |
| 3-Day Freeze Pack | 120 | Three one-day freezes | Inventory limit |
| Weekend Shield | 85 | Protect Sat + Sun | Once per week |
| 1-Day Streak Restore | 80 | Restore one missed day | 48-hour window |
| 3-Day Streak Restore | 220 | Restore up to three days | Once per month |
| Premium Hint | 20 | Gives a stronger hint | No full answer |
| Remove Two Wrong Options | 15 | Quiz assistance | Single-choice only |
| Extra Quiz Attempt | 30 | Retry immediately | XP penalty still applies |
| Solution Reveal | 45 | Show solution after repeated failure | XP reduced by 60% |
| 30-Minute XP Booster | 50 | +20% qualified XP | One per day |
| Double-Gem Lesson Token | 60 | Doubles Gems on one lesson | Three per week |
| Lucky Wheel Re-Spin | 25 | One additional daily spin | One per day |
| Optional Side Quest Unlock | 60 | Opens optional content | Cannot open required nodes |
| Early Lesson Access | 70 | Opens one future non-required lesson | Prerequisites remain recommended |
| Challenge Practice Ticket | 40 | Extra practice simulation | No leaderboard XP |
| Battle Rematch Token | 20 | Removes rematch cooldown | Same opponent only |
| Battle Spectator Theme | 90 | Temporary animated Battle theme | Cosmetic |
| Arlo Focus Mode | 35 | Guided 25-minute focus session | One use |
| Weekly Replan Token | 30 | Rebuild week without damaging planned-streak state | Twice weekly |
| Reward Chest Key | 75 | Opens a standard bonus chest | No guaranteed rare item |
| Badge Frame Unlock | 120 | Premium profile frame | Cosmetic |
| Arlo Celebration Animation | 150 | Unlocks a celebration animation | Cosmetic |

## 4.3 Gem Restrictions

- Gems cannot be transferred between users.
- Gems cannot be wagered in Battles.
- Referral Gems may have a 7-day fraud hold.
- Gem boosters cannot stack.
- Gems cannot change Battle difficulty or correctness.
- Required challenges and projects cannot be skipped with Gems.
- Revealed solutions always reduce XP.

---

# 5. XP System

## 5.1 XP Types

### Lifetime XP

Used for:

- levels
- permanent rank
- achievements
- profile progression
- long-term history

Lifetime XP never resets.

### Weekly League XP

Used for:

- weekly leaderboard
- Bronze, Silver, and Gold leagues
- promotion and demotion

Weekly League XP resets every Monday at 04:00 local time.

## 5.2 Base XP by Difficulty

| Difficulty | Base XP |
|---|---:|
| Easy | 10 |
| Medium | 20 |
| Hard | 35 |
| Expert | 50 |

## 5.3 Lesson-Type Multiplier

| Lesson type | Multiplier |
|---|---:|
| Video | 0.80 |
| Audio | 0.80 |
| Reading | 0.85 |
| Guided Example | 1.00 |
| Reflection | 0.90 |
| Quiz | 1.10 |
| Coding Practice | 1.30 |
| Dataset Practice | 1.35 |
| Debugging Task | 1.35 |
| Mini Project Task | 1.50 |
| Mini Challenge | 1.60 |
| Boss Challenge | 2.00 |
| Full Project | 2.50 |

## 5.4 Performance Multiplier

| Result | Multiplier |
|---|---:|
| Failed / incomplete | 0 |
| Passed with 60–74% | 0.80 |
| Passed with 75–89% | 1.00 |
| Passed with 90–99% | 1.15 |
| Perfect result | 1.30 |

## 5.5 Assistance Multiplier

| Assistance | Multiplier |
|---|---:|
| No help | 1.00 |
| Normal hint | 0.95 |
| Premium hint | 0.85 |
| Remove wrong options | 0.80 |
| Solution revealed | 0.40 |

## 5.6 XP Formula

```text
Qualified XP =
round(
  Base Difficulty XP
  × Lesson-Type Multiplier
  × Performance Multiplier
  × Assistance Multiplier
  + First-Try Bonus
  + Consistency Bonus
  + Limited Speed Bonus
)
```

Bonuses:

| Bonus | Value |
|---|---:|
| First correct attempt | +20% of calculated XP |
| Daily activity streak | +2 XP, once daily |
| Weekly commitment on track | +5% |
| Speed bonus | Up to +10%, accuracy required |
| Hard lesson completion | +5 XP |
| Perfect boss challenge | +20 XP |

## 5.7 XP Examples

### Easy Reading Lesson

```text
10 × 0.85 × 1.00 = 8.5
Rounded reward: 9 XP
```

### Medium Coding Practice, 92%, First Try

```text
20 × 1.30 × 1.15 = 29.9
First-try bonus: +6
Total: 36 XP
```

### Hard Boss Challenge, Perfect

```text
35 × 2.00 × 1.30 = 91
Perfect boss bonus: +20
Total: 111 XP
```

### Solution Revealed

```text
20 × 1.30 × 1.00 × 0.40 = 10.4
Rounded reward: 10 XP
```

## 5.8 XP Farming Rules

- First completion gives full XP.
- First review within 7 days gives 10% review XP.
- Additional repeats give no XP.
- Battle XP is capped at 100 League XP per day.
- Study Together does not create XP by itself.
- Referral actions never create XP.
- Lucky Wheel can award no more than 25 XP per day.
- XP boosters apply only to qualified learning XP.
- Repeating easy lessons cannot farm leaderboard XP.

---

# 6. Levels, Ranks, and Leaderboards

## 6.1 Lifetime Level Curve

```text
XP required for next level = 100 × level^1.35
```

Approximate totals:

| Level | Lifetime XP |
|---|---:|
| 1 | 0 |
| 5 | 1,200 |
| 10 | 4,500 |
| 20 | 14,000 |
| 30 | 30,000 |
| 50 | 80,000 |

## 6.2 Career Rank Requirements

Rank must combine XP with proof-of-skill.

| Rank | Lifetime XP | Additional requirement |
|---|---:|---|
| Mini Ninja | 0 | Complete onboarding |
| Semi Ninja | 750 | Complete first quest |
| SQL Ninja | 1,950 | Pass SQL Mini Challenge |
| Data Ninja | 4,500 | Complete first project |
| Insight Ninja | 9,000 | Pass two boss challenges |
| Pro Ninja | 18,000 | Complete three projects |
| Job-ready Ninja | 30,000 | Complete final portfolio and interview readiness |

## 6.3 What XP Counts in the Leaderboard

Included:

- first completion of lessons
- quizzes
- coding and dataset practice
- challenges
- projects
- capped Battle XP
- limited weekly goal bonus

Excluded:

- referral rewards
- app opens
- social follows
- restored streak days
- purchased cosmetics
- repeated lesson farming
- unverified offline activity

## 6.4 League Ranges

| League | Weekly League XP |
|---|---:|
| Bronze | 0–299 |
| Silver | 300–749 |
| Gold | 750–1,499 |
| Elite, optional later | 1,500+ |

Suggested divisions:

- Bronze III: 0–99
- Bronze II: 100–199
- Bronze I: 200–299
- Silver III: 300–449
- Silver II: 450–599
- Silver I: 600–749
- Gold III: 750–999
- Gold II: 1,000–1,249
- Gold I: 1,250–1,499

These are initial values and should be adjusted after real usage data.

## 6.5 Cohort Logic

- 30 users per weekly cohort
- similar level, time zone, and recent activity
- top 8 promote
- middle 17 remain
- bottom 5 demote
- new users start in Bronze III
- inactive users move to an inactive pool after two weeks
- leaderboard participation can be hidden in privacy settings

---

# 7. Coins System

## 7.1 How Users Earn Coins

| Action | Coins |
|---|---:|
| Daily Lucky Wheel | 10–100 |
| Complete daily mission | 20 |
| Complete weekly goal | 100–200 |
| Win a Battle | Opponent’s stake |
| Battle participation | 10, capped daily |
| First lesson in a new phase | 50 |
| Project milestone | 75 |
| Full project | 150 |
| Referral signup | 100 |
| Referral activation | 300 |
| Five activated referrals | 1,500 |
| Badge milestone | 50–200 |
| Study Together completion | 15, weekly cap |

## 7.2 Coin Store — Cosmetic Items

### Glasses

| Item | Color | Price |
|---|---|---:|
| Classic Round Glasses | Black | 300 Coins |
| Analyst Frames | Midnight Purple | 450 Coins |
| Neon Study Glasses | Violet | 550 Coins |
| Gold Aviators | Gold | 900 Coins |

### Hats

| Item | Color | Price |
|---|---|---:|
| Arlo Beanie | Deep Purple | 500 Coins |
| SQL Cap | Royal Blue | 650 Coins |
| Data Detective Hat | Brown + Gold | 850 Coins |
| Wizard of Data Hat | Purple + Gold Stars | 1,100 Coins |
| Graduation Cap | Navy + Gold Tassel | 1,250 Coins |

### Clothing and Accessories

| Item | Color | Price |
|---|---|---:|
| Lavender Hoodie | Lavender | 800 Coins |
| Midnight Hoodie | Dark Purple | 900 Coins |
| Emerald Hoodie | Emerald Green | 1,000 Coins |
| Crimson Challenge Hoodie | Crimson | 1,100 Coins |
| Silver Headphones | Silver + Purple | 700 Coins |
| Golden Headphones | Gold + Black | 1,200 Coins |
| Study Scarf | Purple + White | 550 Coins |
| Mini Backpack | Violet | 750 Coins |
| Laptop Sticker Pack | Mixed Arlo Colors | 400 Coins |

### Profile and App Cosmetics

| Item | Color | Price |
|---|---|---:|
| Bronze Profile Frame | Bronze | 600 Coins |
| Silver Profile Frame | Silver | 900 Coins |
| Gold Profile Frame | Gold | 1,400 Coins |
| Confetti Celebration | Multicolor | 700 Coins |
| Purple Lightning Celebration | Purple | 1,000 Coins |
| Star Trail Celebration | Gold | 1,300 Coins |
| Lavender Roadmap Theme | Lavender | 1,500 Coins |
| Night Study Theme | Navy + Purple | 1,800 Coins |
| Battle Arena Theme | Purple + Gold | 2,000 Coins |

## 7.3 Coin Balance Targets

- Common cosmetic: 300–700 Coins
- Rare cosmetic: 800–1,300 Coins
- Epic cosmetic: 1,400–2,500 Coins
- Seasonal cosmetic: 2,500–4,000 Coins

Expected earning:

- 150–300 Coins per week without referrals
- 300–600 Coins per week with Battles and weekly goals

Coins cannot buy XP, answers, streak recovery, required lessons, or leaderboard placement.

---

# 8. Friend and Social System

## 8.1 Relationship Types

- Follow: one-way relationship
- Friend: mutual accepted relationship
- Study Partner: friend who completed at least one Study Together session
- Battle Rival: friend with at least three completed Battles

For MVP, mutual Friends should be the main interaction model.

## 8.2 Friend Profile

A friend profile may show:

- display name
- avatar and equipped cosmetics
- current rank
- current league
- total badges
- featured badges
- weekly XP
- public subjects
- optional streak
- Battle wins and losses
- Study Together sessions
- current public milestone
- Invite to Battle
- Invite to Study
- Follow / Unfollow
- Remove Friend
- Report / Block

Privacy controls:

- hide weekly XP
- hide streak
- hide Battle history
- hide current lesson
- allow invitations from friends only
- disable leaderboard visibility

## 8.3 Friend Activity Feed

Optional items:

- “Sara reached SQL Ninja.”
- “Alex completed SQL Basics.”
- “Mina earned Quiz Crusher.”
- “John is looking for a Study Partner.”

Do not expose detailed weaknesses or failed attempts.

---

# 9. Study Together

## 9.1 Invitation

Inviter chooses:

- Start now
- Start within 1 hour
- Schedule date and time
- Duration: 15, 25, 45, or 60 minutes
- Subject: SQL, Python, Excel, Data Analysis, or Any
- Optional message

Example notification:

> “Alex invited you to study SQL together for 25 minutes. Starts within 1 hour.”

## 9.2 Technical MVP Logic

1. Friend accepts.
2. Both enter a shared Focus Room.
3. Each chooses their own lesson or task.
4. Synchronized timer starts.
5. Both see presence, timer, task title, pause state, and Arlo encouragement.
6. Each studies individually.
7. At the end, each confirms completion.

No video or voice call is required for MVP.

## 9.3 Rewards

If both complete at least 80% of the session:

- each receives 15 Coins
- each receives 2 Gems
- normal lesson XP still applies
- maximum shared reward: 3 sessions per week

If only one completes:

- completed user keeps normal lesson XP
- no shared bonus
- no penalty

States:

- Invited
- Accepted
- Declined
- Expired
- Scheduled
- Waiting
- In progress
- Disconnected
- Completed by both
- Completed by one
- Cancelled

---

# 10. Battle System

## 10.1 Purpose

Battle lets two friends compete in a specific subject using timed, calibrated questions. It should feel energetic but still measure real knowledge.

## 10.2 Battle Setup

The challenger chooses:

- Opponent
- Subject: SQL, Python, Excel, Data Analysis, Data Visualization, Frontend, Backend
- Optional topic: SELECT, WHERE, JOIN, GROUP BY, Aggregations
- Difficulty: Easy, Medium, Hard, Mixed
- Question count: 5, 10, 15, or 20
- Time per question: 15, 30, 45, or 60 seconds
- Coin stake: 50, 100, 250, 500, or allowed custom value
- Mode: Live or Async

The friend receives a challenge notification and can Accept or Decline.

## 10.3 Coin Stake Rules

- Both users must own the selected amount.
- Coins are escrowed when Battle starts.
- Winner receives the full pot.
- Example: each stakes 100 Coins; winner receives 200 Coins.
- Draw refunds both stakes.
- Stake transfers Coins; it does not mint new Coins.

Maximum stake by level:

| Level | Maximum stake |
|---|---:|
| 1–4 | 100 Coins |
| 5–9 | 250 Coins |
| 10–19 | 500 Coins |
| 20+ | 1,000 Coins |

## 10.4 Question Fairness

- Live mode: same question at the same time.
- Async mode: equivalent calibrated questions.
- Questions are versioned and validated.
- Scoring is server-side.
- No hints, solution reveal, or option elimination in Battles.
- Each question has a timer.
- One answer is not revealed before the other user submits.

## 10.5 Battle Scoring

| Result | Points |
|---|---:|
| Correct answer | 100 |
| Incorrect answer | 0 |
| Speed bonus | 0–30 |
| Three-correct streak | +15 |
| Perfect hard answer | +20 |

```text
Question Score = Correctness + Speed + Streak + Difficulty Bonus
```

Correctness must always matter more than speed.

## 10.6 Answer Reveal

After both answer or time expires, show:

- both selected answers
- correct answer
- short explanation
- points earned
- total score
- next-question countdown

## 10.7 Tie-Breaker — Penalty Mode

If final score is tied:

1. Enter Sudden Death.
2. Both receive one question.
3. If one is correct and the other is wrong, correct player wins.
4. If both are correct or both are wrong, continue.
5. Maximum five sudden-death questions.
6. If still tied, compare hard-question accuracy.
7. Then compare average response time.
8. If still identical, declare draw and refund Coins.

## 10.8 Battle XP

| Event | XP |
|---|---:|
| Complete Battle | 5 XP |
| Correct answer | 2 XP |
| Win Battle | +10 XP |
| Perfect Battle | +10 XP |
| Daily Battle XP cap | 100 XP |

Battle XP counts toward League XP only when:

- opponent is verified
- Battle is completed
- pair is not suspiciously repeated
- daily cap is not exceeded

## 10.9 Disconnect Logic

Live Battle:

- 15-second reconnect grace period
- one warning
- second extended disconnect = forfeit
- forfeit transfers pot to remaining player
- server outage refunds both users

Async Battle:

- 24-hour completion window
- accepted but unplayed Battle expires and refunds Coins
- repeated abandonment can create cooldown

## 10.10 Battle History

Show:

- opponent
- subject
- difficulty
- score
- result
- Coin stake
- Coins won or lost
- accuracy
- average response time
- rematch
- report

User Battle stats:

- played
- wins
- losses
- draws
- win rate
- favorite subject
- strongest topic
- current win streak

---

# 11. Referral System

## 11.1 Referral Link

Each user receives:

- unique referral code
- deep link
- QR code
- native share sheet
- campaign-source parameters

Example:

```text
https://arc.app/invite/ALEX42
```

## 11.2 Referral Stages

| Stage | Meaning |
|---|---|
| Link created | Referral link exists |
| Clicked | Friend opened link |
| Installed | App install attributed |
| Signed up | Account created |
| Verified | Email or phone verified |
| Activated | First lesson completed |
| Qualified | First weekly goal completed |
| Rewarded | Rewards released |
| Rejected | Invalid or fraudulent |

## 11.3 Referral Rewards

### Standard Referral

| Milestone | Inviter reward | Friend reward |
|---|---:|---:|
| Sign up + verify | 100 Coins | 100 Coins |
| Complete first lesson within 7 days | 20 Gems | 20 Gems |
| Complete first weekly goal | 300 Coins + 30 Gems | 150 Coins + 15 Gems |

### Referral Milestones

| Activated friends | Bonus |
|---|---|
| 1 | Standard rewards |
| 3 | +500 Coins |
| 5 | +1,500 Coins + 150 Gems + Arlo Connector badge |
| 10 | +3,000 Coins + 300 Gems + exclusive profile frame |
| 20 | +7,500 Coins + 500 Gems + exclusive Arlo cosmetic |

A successful activated friend must:

- verify account
- complete first lesson
- be active on at least 3 separate days
- not be flagged as duplicate or fraudulent

## 11.4 Referral Dashboard

User can see:

- links shared
- unique clicks
- installs
- signups
- verified users
- activated users
- qualified users
- pending rewards
- released rewards
- rejected referrals
- each friend’s current stage
- copy link
- share again
- QR code
- milestone progress

Example rows:

- “Mina — Signed up — Complete first lesson to unlock rewards.”
- “Alex — Activated — 20 Gems pending.”
- “Sara — Qualified — Rewards delivered.”

## 11.5 Attribution

- 30-day click window
- first valid referral wins
- referral code can be entered at signup if no tracked click exists
- one inviter per new user
- no retroactive referral after 7 days
- deep links must support iOS, Android, and web
- install and signup matching is server-side

## 11.6 Referral Anti-Fraud

Hold or reject rewards for:

- same device
- same payment account
- same verified phone
- repeated accounts from one device
- disposable email
- suspicious IP clusters
- emulator abuse
- self-referral
- deleted and recreated accounts
- referred user who never becomes active

Recommended holds:

- Coins after verification: immediate or 24 hours
- Gems after first lesson: 7 days
- large milestone rewards: 14 days

---

# 12. Notifications

## Streak

- “Your streak is safe — Arlo used a Freeze.”
- “Your streak ended yesterday. Restore it within 24 hours.”
- “One 5-minute mission keeps your daily streak alive.”
- “Your weekly streak needs one more session.”

## Battle

- “Sara challenged you to a 10-question SQL Battle for 100 Coins.”
- “Your Battle starts in 5 minutes.”
- “You won 200 Coins. Rematch?”
- “Sudden Death! One question decides it.”

## Study Together

- “Mina invited you to study together in the next hour.”
- “Your Study Partner is ready.”
- “25 minutes complete — both of you stayed focused.”

## Referral

- “Someone opened your Arlo invite.”
- “Your friend signed up.”
- “Your referral completed the first lesson. 20 Gems are pending.”
- “Five friends joined Arlo — milestone reward unlocked.”

---

# 13. Safety and Abuse Prevention

- Users can block and report others.
- Battle chat uses preset messages in MVP.
- No free-text Battle chat is required initially.
- Private profiles hide detailed performance.
- Question pools must be large enough to prevent memorization.
- Repeated Battles between the same pair give reduced XP after three Battles per day.
- Intentional losing for Coin transfer triggers fraud review.
- Referral rewards require verified activation.
- Currency balances are server-side.
- Reward operations are idempotent.
- Client-calculated XP, Gems, Coins, Battle results, or referral states are never trusted.

---

# 14. Core Data Objects

## Wallet

```json
{
  "user_id": "user_123",
  "lifetime_xp": 1950,
  "weekly_league_xp": 420,
  "gems": 350,
  "coins": 2450,
  "streak_freezes": 1,
  "updated_at": "2026-07-11T15:00:00Z"
}
```

## Battle

```json
{
  "battle_id": "battle_123",
  "challenger_id": "user_123",
  "opponent_id": "user_456",
  "subject": "sql",
  "topic": "where",
  "difficulty": "medium",
  "question_count": 10,
  "seconds_per_question": 30,
  "stake_coins_each": 100,
  "mode": "live",
  "status": "accepted",
  "challenger_score": 0,
  "opponent_score": 0,
  "winner_id": null
}
```

## Referral

```json
{
  "referral_id": "ref_123",
  "inviter_id": "user_123",
  "invite_code": "ALEX42",
  "referred_user_id": "user_789",
  "stage": "activated",
  "click_at": "2026-07-01T12:00:00Z",
  "signup_at": "2026-07-01T12:05:00Z",
  "first_lesson_at": "2026-07-02T10:00:00Z",
  "reward_status": "pending_fraud_hold"
}
```

---

# 15. Required Analytics Events

## Economy

- `xp_earned`
- `gem_earned`
- `gem_spent`
- `coin_earned`
- `coin_spent`
- `store_item_viewed`
- `store_item_purchased`
- `streak_freeze_used`
- `streak_restore_purchased`
- `streak_recovery_quest_started`
- `streak_recovery_quest_completed`

## Battle

- `battle_created`
- `battle_invited`
- `battle_accepted`
- `battle_declined`
- `battle_started`
- `battle_question_answered`
- `battle_sudden_death_started`
- `battle_completed`
- `battle_forfeited`
- `battle_rematch_requested`
- `battle_reported`

## Social

- `friend_request_sent`
- `friend_request_accepted`
- `follow_created`
- `study_invite_sent`
- `study_invite_accepted`
- `study_session_started`
- `study_session_completed`

## Referral

- `referral_link_created`
- `referral_link_shared`
- `referral_link_clicked`
- `referral_install_attributed`
- `referral_signup_completed`
- `referral_verified`
- `referral_activated`
- `referral_qualified`
- `referral_reward_released`
- `referral_rejected`

---

# 16. MVP Acceptance Criteria

The system is accepted only when:

- Daily Activity Streak and Weekly Commitment Streak are separate.
- Users can buy and automatically use Streak Freezes.
- Users can restore a broken streak inside a limited window.
- Users have a non-Gem Recovery Quest option.
- Gem pricing matches realistic weekly earning.
- At least 15 useful Gem store items exist.
- Gems cannot buy required learning completion or Battle wins.
- XP changes dynamically by difficulty, lesson type, accuracy, attempts, and assistance.
- Lifetime XP and Weekly League XP are separate.
- Only qualified learning XP enters the leaderboard.
- Bronze, Silver, and Gold ranges are defined.
- Rank requires both XP and proof-of-skill.
- Coins are used for cosmetics, identity, and Battle stakes.
- At least 12 cosmetic items exist with colors and prices.
- Users can add friends, follow users, view allowed performance, and inspect badges.
- Users can invite friends to Study Together.
- Study Together works without video or voice in MVP.
- Users can configure subject, difficulty, question count, timer, and Coin stake before Battle.
- Battle answers are revealed only after both users submit.
- Tied Battles enter Sudden Death.
- Battle Coins are escrowed and transferred safely.
- Battle XP is limited and capped.
- Users can create and share tracked referral links.
- Referral dashboard shows clicks, signups, activations, qualification, and rewards.
- Referral milestones support 1, 3, 5, 10, and 20 activated friends.
- Fraud checks protect referral rewards and intentional Battle losses.
- All XP, Gem, Coin, Battle, streak, and referral calculations are server-side.
