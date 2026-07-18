# Arlo Backend — Referral System

**Version:** 1.0 integrated  
**Stack:** NestJS + TypeORM + PostgreSQL; Redis/queue recommended for analytics and notifications  
**Consumers:** Invite Friends screen, referral dashboard, signup/OAuth flow, Wallet, notification inbox  
**Depends on:** [00 — System Integration Contract](./00-system-integration.md), [01 — User Model & Authentication](./01-user-model-and-authentication.md), [Gamification](./gamification.md), [Notifications](./06-notifications.md)  
**Integrates with:** [Social Media](./social_media.md), [Ranking](./ranking_system.md), [Leagues](./leagues.md)

**Implementation:** `arc-backend/src/referrals/`  
**Frontend:** `arc-app/src/lib/api/referrals.ts`, Friends invite card, `app/r/[token]/route.ts`

---

## 1. Purpose and Ownership

The Referral System lets an authenticated Arlo user create a shareable invitation link, send it through WhatsApp or another app, and track the invitation from link click through qualified signup and reward settlement.

The module owns:

- referral codes and public share links
- share-channel and campaign metadata
- anonymous click attribution
- attaching one inviter to a new account
- referral qualification
- referral reward orchestration
- referral status/history shown to the inviter
- anti-fraud checks and reward holds
- referral milestone progress

The module does **not** own:

- authentication or account creation
- wallet balances or ledger mutation
- friendships/follows
- notification delivery
- rank or League calculation

Those actions are requested through their canonical services.

Core rule:

> A link click is not a successful referral. The inviter is rewarded only after the new user becomes a verified, meaningfully activated learner.

---

## 2. Product Reward Decision

### 2.1 Recommended base reward

For every **qualified** new friend:

| Recipient | Reward | When settled |
|---|---:|---|
| Inviter | **300 Coins** | After the friend qualifies |
| New friend | **150 Coins + 50 Lifetime XP** | After the friend qualifies |
| League score | **0 League XP** | Referral rewards never affect Leagues |

Why 300 Coins:

- one referral is valuable enough to buy an entry-level cosmetic such as Classic Round Glasses
- it does not immediately buy premium cosmetics costing 900–2,000 Coins
- it is materially higher than one beginner lesson, while still requiring a real activated user
- it does not provide Gems, required-lesson skips, or Battle wins

The new friend sees the reward as **Pending** immediately after the referral is attached, but the wallet is credited only after qualification.

### 2.2 Qualification requirements

A referred account qualifies when all conditions are true:

1. account was created after an eligible referral click/code claim
2. email is verified
3. questionnaire is completed
4. an active personalized roadmap exists
5. the first **required** lesson is completed
6. the lesson passed its completion rule
7. at least 5 verified study minutes were recorded
8. qualification happens within 30 days of account creation
9. neither account is blocked, deleted, disabled, or under confirmed fraud
10. the attribution has not already rewarded another inviter

The first lesson requirement prevents mass fake-account signup while still rewarding a friend early in the Arlo journey.

### 2.3 Referral milestone bonuses

Milestones are based on **qualified and rewarded** friends, not clicks or raw signups.

| Qualified friends | One-time bonus to inviter |
|---:|---|
| 1 | Base reward only: 300 Coins |
| 3 | +300 Coins |
| 5 | +750 Coins, +10 Gems, `Connector` badge |
| 10 | +1,500 Coins, +25 Gems, `Violet Connector Frame` |
| 25 | +4,000 Coins, +50 Gems, `Arlo Ambassador` badge |

Milestone rewards use the Gamification ledger and are idempotent. A user receives each milestone once.

### 2.4 Rank and League protection

- The inviter receives no XP from referrals.
- The friend’s 50 XP is a one-time onboarding reward.
- The 50 XP may contribute to Lifetime XP, but rank gates still require lessons, challenges, projects, and active days.
- Referral events create **zero Qualified League XP**.
- Referral Coins may be spent normally after settlement.
- Pending referral rewards cannot be used in Battle escrow.

---

## 3. User-Facing Status Model

The inviter should see a clear status for each referral:

| UI status | Backend meaning |
|---|---|
| Link shared | A share link was generated or share intent recorded |
| Clicked | At least one anonymous eligible click occurred |
| Signed up | A new account was attributed |
| Verified | Email verification completed |
| Learning started | Questionnaire/roadmap completed |
| Almost there | First required lesson not yet completed |
| Qualified | All qualification rules passed |
| Rewarded | Both wallet grants settled |
| Expired | Qualification window ended |
| Rejected | Ineligible or confirmed abuse |
| Under review | Risk review is holding automatic payout |

Important privacy rule:

- before signup, show only aggregate anonymous click counts
- after signup, show the friend’s display name/avatar only when privacy allows
- never expose email address, IP address, device fingerprint, or exact location
- if the users are not friends, a masked label such as `S*** joined Arlo` is acceptable

---

## 4. Share-Link Design

### 4.1 Link format

Use a first-party HTTPS redirect:

```text
https://arc.app/r/{publicToken}
```

`publicToken` must be random and unguessable. Do not expose a raw user UUID.

Example redirect:

```text
GET /r/4Tx8kPzQ...
  → validate active link
  → record eligible click
  → set signed referral cookie
  → 302 /register
```

Recommended signed cookie:

```text
name: arc_ref
value: signed opaque attribution token
ttl: 30 days
httpOnly: true
secure: true
sameSite: Lax
```

The cookie stores no user-readable inviter details. It resolves server-side to the referral link.

### 4.2 Stable code versus generated links

Each inviter has:

1. one stable, human-readable referral code, for example `ALEX-A7K2`
2. many generated share links, each with its own public token and metadata

A generated link can store:

- channel: `whatsapp`, `telegram`, `sms`, `email`, `copy_link`, `native_share`, `facebook`, `x`, `linkedin`, `other`
- campaign: `friends_hub`, `reward_banner`, `profile`, `weekly_recap`
- locale
- optional destination variant
- created timestamp

This lets Arlo compare which share channels produce qualified users.

### 4.3 WhatsApp and other apps

The backend returns a share payload. The frontend chooses the best platform behavior.

```json
{
  "linkId": "uuid",
  "url": "https://arc.app/r/4Tx8kPzQ...",
  "title": "Join me on Arlo",
  "text": "I’m learning with Arlo. Join with my link and we’ll both earn rewards.",
  "channel": "whatsapp"
}
```

Frontend behavior:

1. On mobile/PWA, prefer the Web Share API:
   ```ts
   navigator.share({ title, text, url })
   ```
2. If unavailable, use platform-specific share URLs for WhatsApp, Telegram, SMS, or email.
3. Always provide `Copy link`.
4. Record a `share_intent` event when the user taps a share option.

Tracking limitation:

> Arlo can know that the share button was tapped and whether the referral link was later clicked. Arlo cannot reliably know whether a WhatsApp message was actually sent, delivered, opened, or read.

Do not display “message delivered” unless a future platform integration explicitly provides that fact.

### 4.4 Link rotation

- one active stable referral code per user
- user may rotate the code at most once every 30 days
- generated links can be individually revoked
- old links may redirect to a neutral invite page after revocation but must not create attribution
- account disable/block revokes all active referral links

---

## 5. Attribution Rules

### 5.1 One inviter per new account

A new account can have only one referral attribution.

Unique constraint:

```text
UNIQUE(invitee_user_id)
```

Once the account is verified, attribution is immutable except by an audited admin fraud correction.

### 5.2 Attribution priority

Use this deterministic order:

1. explicit valid referral token submitted during signup
2. signed `arc_ref` cookie from the most recent eligible first-party link
3. manually entered referral code before email verification
4. no attribution

Do not overwrite an existing attribution because the user clicked another link after registration.

### 5.3 Attribution window

- link click/cookie attribution lifetime: 30 days
- manual code can be entered during signup or within 24 hours after account creation
- manual code is rejected after email verification if another attribution already exists
- qualification must occur within 30 days after account creation

### 5.4 First-touch/last-touch decision

For multiple eligible clicks before signup:

- use the **last eligible referral click**
- store first click and last click for analytics
- once registration attaches the attribution, freeze it

### 5.5 Existing users

If an existing Arlo account opens a referral link:

- do not create a referral attribution
- do not grant rewards
- optionally show the inviter profile and an explicit `Follow` or `Add Friend` action
- never auto-follow or auto-create a friendship

---

## 6. Referral State Machine

```text
link_created
  → clicked
  → signup_started
  → registered
  → email_verified
  → onboarding_completed
  → first_required_lesson_completed
  → qualified
  → rewarded
```

Alternative terminal states:

```text
clicked/registered → expired
registered/qualified → under_review
registered/qualified → rejected
rewarded → reversed_by_compensating_ledger_entry   # fraud/admin only
```

State transitions are server-owned and event-driven.

---

## 7. NestJS Module Layout

```text
referrals/
  referrals.module.ts
  referrals.controller.ts
  public-referral.controller.ts
  referral-links.service.ts
  referral-attribution.service.ts
  referral-qualification.service.ts
  referral-reward.service.ts
  referral-risk.service.ts
  referral-query.service.ts
  referral-events.consumer.ts
  dto/
  entities/
    referral-code.entity.ts
    referral-link.entity.ts
    referral-click.entity.ts
    referral-share-event.entity.ts
    referral-attribution.entity.ts
    referral-reward-grant.entity.ts
    referral-milestone.entity.ts
    referral-risk-review.entity.ts
```

Use the existing Gamification service for all currency writes and the existing Notifications service for inbox/push/email.

---

## 8. Data Model

### 8.1 `referral_codes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `owner_user_id` | uuid FK | Inviter |
| `code` | varchar unique | Case-insensitive public code |
| `status` | enum | `active`, `rotated`, `revoked` |
| `rotated_from_id` | uuid nullable | Audit chain |
| `created_at` | timestamptz | |
| `revoked_at` | timestamptz nullable | |

Only one active code per owner.

### 8.2 `referral_links`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `owner_user_id` | uuid FK | |
| `referral_code_id` | uuid FK | |
| `public_token_hash` | varchar unique | Store hash, not raw token |
| `channel` | enum | Share source |
| `campaign` | varchar | Allowlisted |
| `locale` | varchar | |
| `destination` | varchar | Allowlisted route key |
| `status` | enum | `active`, `revoked`, `expired` |
| `expires_at` | timestamptz nullable | Usually null for stable links |
| `created_at` | timestamptz | |
| `revoked_at` | timestamptz nullable | |

Store the raw public token only when returning it once, or derive it from a signed token. Never log raw secrets.

### 8.3 `referral_share_events`

Tracks what the Arlo client knows:

| Column | Notes |
|---|---|
| `id` | uuid |
| `link_id` | |
| `owner_user_id` | |
| `event_type` | `link_generated`, `share_option_tapped`, `native_share_opened`, `copied` |
| `channel` | |
| `client_event_id` | idempotency |
| `created_at` | |

This table does not claim a message was sent or read.

### 8.4 `referral_clicks`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `link_id` | uuid FK | |
| `clicked_at` | timestamptz | |
| `anonymous_session_id` | uuid/hash | First-party pseudonymous session |
| `ip_prefix_hash` | varchar nullable | Risk only; never shown |
| `user_agent_hash` | varchar nullable | Risk only |
| `country_code` | char(2) nullable | Coarse analytics |
| `referer_domain` | varchar nullable | Sanitized |
| `eligible` | boolean | Bot/pre-fetch clicks may be false |
| `ineligibility_reason` | varchar nullable | |
| `attributed_user_id` | uuid nullable | Filled after signup |
| `retention_delete_at` | timestamptz | Privacy retention |

Messaging-app link previews and security scanners may create clicks. Apply bot/prefetch filtering before counting a click as eligible.

### 8.5 `referral_attributions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `inviter_user_id` | uuid FK | |
| `invitee_user_id` | uuid unique FK | One inviter only |
| `referral_link_id` | uuid nullable | |
| `referral_code_id` | uuid | |
| `source` | enum | `link`, `cookie`, `manual_code`, `oauth_state` |
| `status` | enum | `registered`, `verified`, `activated`, `qualified`, `rewarded`, `expired`, `rejected`, `under_review` |
| `registered_at` | timestamptz | |
| `verified_at` | timestamptz nullable | |
| `questionnaire_completed_at` | timestamptz nullable | |
| `first_lesson_completed_at` | timestamptz nullable | |
| `qualified_at` | timestamptz nullable | |
| `rewarded_at` | timestamptz nullable | |
| `qualification_deadline_at` | timestamptz | registration + 30 days |
| `risk_score` | numeric nullable | Internal |
| `rejection_code` | varchar nullable | |
| `version` | int | Optimistic concurrency |
| `created_at` / `updated_at` | timestamptz | |

### 8.6 `referral_reward_grants`

One row per recipient/reward stage:

| Column | Notes |
|---|---|
| `id` | uuid |
| `attribution_id` | |
| `recipient_user_id` | inviter or invitee |
| `reward_kind` | `base_inviter`, `base_invitee`, `milestone` |
| `coins` / `gems` / `lifetime_xp` | snapshot |
| `status` | `pending`, `granted`, `held`, `rejected`, `reversed` |
| `ledger_transaction_group_id` | nullable until granted |
| `idempotency_key` | unique |
| `hold_until` | nullable |
| `created_at` / `granted_at` | |

### 8.7 `referral_milestones`

| Column | Notes |
|---|---|
| `user_id` | |
| `milestone_count` | 3, 5, 10, 25 |
| `status` | `locked`, `eligible`, `granted` |
| `qualified_count_snapshot` | |
| `ledger_transaction_group_id` | |
| `granted_at` | |

Unique `(user_id, milestone_count)`.

### 8.8 `referral_risk_reviews`

Internal/admin only:

- attribution ID
- risk reasons
- status: queued, approved, rejected
- reviewer/audit fields
- decision timestamp

---

## 9. Registration and OAuth Integration

### 9.1 Email registration

`POST /auth/register` accepts an optional opaque field:

```json
{
  "email": "friend@example.com",
  "password": "Secret1!",
  "agreeToTerms": true,
  "referralToken": "opaque-token-if-present"
}
```

Server transaction:

1. create User + Profile
2. resolve referral token/cookie/code
3. ensure inviter exists and is eligible
4. reject self-referral
5. insert immutable `referral_attributions` row with `registered`
6. create pending reward preview rows
7. write `referral.registered.v1` outbox event
8. commit

A referral failure must not normally block a valid signup. Return signup success plus a referral warning code when the code is expired/invalid.

### 9.2 Google/Apple OAuth

Preserve referral context in the OAuth `state`:

- state contains a nonce referencing a server-side pending attribution session
- do not place raw inviter IDs or trusted reward data directly in client state
- callback resolves the nonce and attaches attribution on first account creation
- returning/existing OAuth users are not eligible as new referrals

### 9.3 Manual code entry

Allow manual code entry only:

- on signup
- or within 24 hours after account creation
- before another attribution is attached
- before reward qualification

Endpoint:

```text
POST /api/v1/referrals/claim-code
```

This route is idempotent and rejects code changes after attribution lock.

---

## 10. Qualification and Reward Settlement

### 10.1 Event inputs

Referral consumes:

- `user.registered.v1`
- `user.email_verified.v1`
- `questionnaire.submitted.v1`
- `roadmap.generated.v1`
- `lesson.completed.v1`
- `user.disabled.v1`
- `user.deleted.v1`

### 10.2 Qualification evaluator

On each relevant event:

```text
if attribution.status is terminal:
    stop

load inviter + invitee eligibility
load email verification
load questionnaire status
load active roadmap
load first required lesson completion
load verified minutes
run risk policy

if all qualification rules pass:
    qualify and settle
else:
    update progress/status only
```

### 10.3 Atomic settlement

Use one PostgreSQL transaction:

1. lock `referral_attributions` row
2. confirm status is eligible and not already rewarded
3. rerun fraud/eligibility checks
4. set attribution `qualified`
5. create/update reward grant snapshots:
   - inviter: +300 Coins
   - invitee: +150 Coins, +50 Lifetime XP
6. call Gamification ledger service for both recipients
7. set grants `granted`
8. set attribution `rewarded`
9. evaluate inviter milestone counts
10. grant any newly reached milestone
11. write outbox events/notifications
12. commit

Idempotency keys:

```text
referral:{attributionId}:inviter:base
referral:{attributionId}:invitee:base
referral:{inviterId}:milestone:{count}
```

A retry must return the previously granted transaction IDs and never double-pay.

### 10.4 Compensating reversal

Never delete ledger history.

If confirmed fraud is discovered after settlement:

- create negative compensating ledger entries
- mark reward grant `reversed`
- mark attribution `rejected`
- store admin/risk reason
- never allow balance below policy-defined debt rules without review

Normal account inactivity or later account deletion does not automatically claw back a legitimate reward.

---

## 11. Public and Authenticated APIs

### 11.1 Public redirect

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/r/:publicToken` | Record click, set attribution cookie, redirect to register |

Security:

- fixed allowlisted redirect destination
- no arbitrary `next` URL
- rate-limit by token/session/IP risk signal
- bot/pre-fetch detection
- never return inviter private data

### 11.2 Referral dashboard

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/referrals/me` | Code, default link, totals, milestone progress |
| `POST` | `/api/v1/referrals/links` | Generate channel/campaign link |
| `GET` | `/api/v1/referrals/links` | Link performance list |
| `DELETE` | `/api/v1/referrals/links/:id` | Revoke generated link |
| `POST` | `/api/v1/referrals/code/rotate` | Rotate stable code |
| `GET` | `/api/v1/referrals/invites` | Referral statuses, cursor pagination |
| `GET` | `/api/v1/referrals/activity` | User-safe status timeline |
| `POST` | `/api/v1/referrals/claim-code` | New user manually claims code |

### 11.3 Generate-link request

```json
{
  "channel": "whatsapp",
  "campaign": "friends_hub",
  "locale": "en"
}
```

Response:

```json
{
  "linkId": "uuid",
  "referralCode": "ALEX-A7K2",
  "url": "https://arc.app/r/4Tx8kPzQ...",
  "share": {
    "title": "Join me on Arlo",
    "text": "Learn with Arlo. Use my link and we’ll both earn rewards."
  },
  "rewardPreview": {
    "inviterCoins": 300,
    "friendCoins": 150,
    "friendXp": 50
  }
}
```

### 11.4 Dashboard response

```json
{
  "code": "ALEX-A7K2",
  "defaultUrl": "https://arc.app/r/...",
  "rewardPreview": {
    "perQualifiedFriend": {
      "coins": 300
    },
    "friendGets": {
      "coins": 150,
      "lifetimeXp": 50
    }
  },
  "stats": {
    "shares": 12,
    "eligibleClicks": 8,
    "signups": 3,
    "qualified": 2,
    "rewarded": 2,
    "coinsEarned": 600
  },
  "nextMilestone": {
    "qualifiedRequired": 3,
    "qualifiedCurrent": 2,
    "reward": {
      "coins": 300
    }
  },
  "recentInvites": [
    {
      "id": "uuid",
      "displayName": "P***",
      "status": "almost_there",
      "message": "First required lesson still needed",
      "createdAt": "2026-07-12T10:00:00.000Z"
    }
  ]
}
```

### 11.5 Tracking endpoints/events

Frontend may send an idempotent analytics event:

```text
POST /api/v1/referrals/links/:id/share-events
```

Body:

```json
{
  "clientEventId": "uuid",
  "eventType": "share_option_tapped",
  "channel": "whatsapp"
}
```

This records user intent only. Link clicks are always recorded server-side at `/r/:token`.

---

## 12. Notifications

Recommended types:

| Type | Recipient | Trigger |
|---|---|---|
| `referral_signup` | inviter | New attributed account verified |
| `referral_progress` | inviter | Friend reaches onboarding/roadmap stage; in-app only by default |
| `referral_reward_pending` | friend | Referral attached; explain qualification |
| `referral_qualified` | inviter | Friend qualified |
| `referral_rewarded` | both | Wallet grants settled |
| `referral_milestone_unlocked` | inviter | 3/5/10/25 milestone granted |
| `referral_expired` | inviter | Optional inbox-only status |

Suggested copy:

- “Priya joined Arlo with your link. One first mission unlocks your 300 Coins.”
- “Referral reward unlocked: +300 Coins.”
- “Welcome reward unlocked: +150 Coins and +50 XP.”
- “Five friends qualified — Connector badge unlocked.”

Do not send push notifications for every anonymous click.

Dedupe keys:

```text
referral_signup:{attributionId}
referral_rewarded:{attributionId}:{recipientId}
referral_milestone:{inviterId}:{count}
```

---

## 13. Social Integration

A referral attribution is not a social relationship.

After the friend signs up, Arlo may show explicit actions:

- `Follow inviter`
- `Send friend request`
- `Study together after onboarding`

Rules:

- no automatic follow
- no automatic friendship
- blocking either direction hides referral social details
- reward eligibility is independent from accepting a friend request
- inviter cannot see the invitee’s private learning activity

---

## 14. Fraud and Abuse Prevention

### 14.1 Hard rejection signals

Reject or make ineligible when:

- inviter equals invitee
- normalized email belongs to inviter or linked identity
- same Google/Apple provider identity
- invitee account existed before attribution
- referral token/code is revoked or expired
- invitation already rewarded another inviter
- confirmed bot/account-farm pattern
- banned/disabled inviter or invitee
- tampered signed token

### 14.2 Risk/hold signals

Do not reject solely from one weak signal. Hold for review when several signals combine:

- many signups from one device/browser
- unusually high velocity
- repeated disposable email domains
- many accounts from one IP prefix in a short period
- immediate scripted onboarding
- impossible geographic/device changes
- repeated lesson completions at unrealistic speed
- 10+ qualified referrals in a rolling 30-day period

Shared household/device/IP alone is not enough to reject a valid family referral.

### 14.3 Automatic payout policy

- first 10 qualified referrals in a rolling 30-day period may auto-settle when risk is low
- additional referrals are placed in `under_review` for up to 7 days
- approved held rewards settle normally
- rejected rewards create no wallet credit
- user sees `Under review`, not a fraud accusation

### 14.4 Rate limits

Suggested defaults:

- link generation: 30/hour/user
- code rotation: 1/30 days
- claim-code attempts: 5/day/account
- public redirect: adaptive token/IP rate limit
- share-event writes: 100/day/user
- dashboard endpoints: normal authenticated read limits

---

## 15. Privacy and Retention

1. Referral URLs contain opaque public tokens, not user IDs or emails.
2. Anonymous click data is used only for attribution, fraud prevention, and aggregate analytics.
3. Raw IP addresses should not be retained; use a salted prefix hash where legally appropriate.
4. Delete or aggregate anonymous click records after 90 days.
5. Keep reward/ledger/audit history as required for integrity and fraud investigation.
6. Inviter-facing APIs never expose private account identifiers.
7. Honor account deletion by anonymizing eligible analytics while preserving financial ledger integrity.
8. Add referral tracking to privacy disclosures and consent/cookie handling where legally required.

---

## 16. Event Catalog

Referral emits:

| Event | Consumers |
|---|---|
| `referral.link_created.v1` | analytics |
| `referral.clicked.v1` | analytics/attribution |
| `referral.registered.v1` | notifications |
| `referral.verified.v1` | qualification |
| `referral.qualified.v1` | reward settlement |
| `referral.rewarded.v1` | notifications, wallet projection |
| `referral.milestone_unlocked.v1` | notifications, badge/inventory |
| `referral.rejected.v1` | risk analytics |
| `referral.expired.v1` | dashboard/notification |

Every consumer deduplicates by `eventId`.

---

## 17. Error Codes

| Code | Meaning |
|---|---|
| `REFERRAL_LINK_NOT_FOUND` | Unknown token/link |
| `REFERRAL_LINK_INACTIVE` | Revoked/expired |
| `REFERRAL_CODE_INVALID` | Unknown or malformed code |
| `REFERRAL_ALREADY_ATTRIBUTED` | Account already has inviter |
| `REFERRAL_SELF_NOT_ALLOWED` | Self-referral |
| `REFERRAL_CLAIM_WINDOW_CLOSED` | Manual claim too late |
| `REFERRAL_INVITER_INELIGIBLE` | Disabled/banned/ineligible |
| `REFERRAL_QUALIFICATION_EXPIRED` | 30-day activation window ended |
| `REFERRAL_UNDER_REVIEW` | Reward held |
| `REFERRAL_REWARD_ALREADY_GRANTED` | Idempotent repeat |
| `REFERRAL_RATE_LIMITED` | Too many requests |
| `REFERRAL_VERSION_CONFLICT` | Stale aggregate write |

An invalid referral token should not usually fail a valid registration. Return the account result and a machine-readable referral warning.

---

## 18. Background Jobs

Recommended jobs:

- expire referral cookies/attributions past deadline
- evaluate stalled attribution states
- release approved risk holds
- aggregate link/channel conversion statistics
- anonymize old click records
- rebuild inviter milestone progress
- reconcile reward grants against ledger entries
- notify expiring “almost qualified” referrals sparingly

All jobs are idempotent and use cursor/batch processing.

---

## 19. Analytics Definitions

Use exact funnel definitions:

| Metric | Definition |
|---|---|
| Shares | Recorded share intents, not confirmed sends |
| Eligible clicks | Human-like first-party redirect clicks |
| Signup conversion | Attributed account created / eligible clicks |
| Verification conversion | Verified attributed accounts / attributed signups |
| Qualification conversion | Qualified / attributed signups |
| Reward conversion | Granted / qualified |
| Cost per qualified referral | Granted virtual-currency value / qualified referrals |
| Channel conversion | Qualified referrals grouped by generated link channel |

Do not label `share_option_tapped` as a sent invitation.

---

## 20. End-to-End Flows

### Flow A — WhatsApp referral

```text
Inviter taps Invite Friends
  → POST /referrals/links { channel: whatsapp }
  → frontend opens native share/WhatsApp
  → friend taps https://arc.app/r/{token}
  → server records click + signed cookie
  → friend registers
  → referral attribution attached
  → friend verifies email
  → friend completes questionnaire + roadmap
  → friend completes first required lesson
  → referral qualifies
  → atomic ledger settlement
  → inviter receives 300 Coins
  → friend receives 150 Coins + 50 XP
  → both receive notification
```

### Flow B — Link clicked but no signup

```text
click recorded
  → inviter dashboard shows aggregate click
  → no identity shown
  → no reward
  → attribution cookie expires after 30 days
```

### Flow C — Signup but no first lesson

```text
attribution registered/verified
  → reward shown as Pending
  → friend receives onboarding reminder within preference/cap rules
  → inviter sees Almost there
  → after 30 days, attribution expires
  → no wallet reward
```

### Flow D — Existing user opens link

```text
existing session detected
  → no referral attribution/reward
  → optional inviter profile shown
  → explicit follow/friend action only
```

### Flow E — Suspicious high volume

```text
qualification reached
  → risk score exceeds threshold
  → attribution = under_review
  → no wallet credit yet
  → review approves or rejects
  → approval settles through normal idempotent transaction
```

---

## 21. Acceptance Criteria

The referral backend is accepted only when:

- every user can retrieve one stable referral code
- users can generate separate links for WhatsApp and other share channels
- the public link records eligible clicks and safely redirects to signup
- referral context survives email signup and Google/Apple OAuth
- one new account can be attributed to only one inviter
- existing accounts cannot become referrals retroactively
- inviter can see aggregate clicks, signups, qualification, and reward states
- anonymous click identity is never exposed
- WhatsApp send/read status is not falsely claimed
- inviter reward is exactly 300 Coins per qualified friend
- friend reward is exactly 150 Coins + 50 Lifetime XP
- referral creates zero League XP
- qualification requires verification, questionnaire, roadmap, and first required lesson
- all rewards are granted through the immutable Gamification ledger
- reward settlement is atomic and idempotent across both users
- 3/5/10/25 referral milestone bonuses are granted once
- referral does not auto-follow or auto-friend users
- notification delivery respects user preferences, quiet hours, dedupe, and caps
- self-referral and obvious account farming are blocked
- suspicious but potentially valid household referrals are held, not automatically rejected
- reward reversal uses compensating ledger entries
- all referral state changes are auditable

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/referrals/` |
| Entities | codes, links, clicks, attributions, grants, milestones, share_events, risk_reviews |
| Qual eval | `ReferralsService.evaluateInvitee` — email + questionnaire + roadmap Ready + completed lesson + ≥5 study min + 30d |
| Settlement | gamification `RewardReasonType.Referral` (coins / friend Lifetime XP; **0 League XP**) |
| Hooks | auth verify + OAuth new user attach; questionnaire submit; lesson outbox |
| APIs | `/me`, links CRUD, `claim-code`, `code/rotate`, `invites`, `activity`, `share-events`, public `/r/:token` |
| FE | `referralsApi`, Friends invite dashboard + claim, Register optional code, Web Share |

**Still thin:** full fraud automation + hold queue UI, compensating reversal job, click retention cron, typed `referral_*` notif subtypes, WhatsApp deep analytics.
