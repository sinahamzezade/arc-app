# Arlo Backend — Social Media, Friends & Following

**Version:** 2.0 integrated  
**Canonical integration:** SocialPermissionService is shared by Study Together and Battle. Notifications consumes social events; social never awards XP directly.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arlo Next.js PWA — Friends Hub, friend profile, followers/following, friend requests, Battle and Study Together entry points  
**Depends on:** `01-user-model-and-authentication.md`, `06-notifications.md`  
**Feeds:** `battle_mode.md`, `study_together.md`, `leagues.md`

---

## 1. Existing Coverage and Boundary

The existing backend files already define users/profiles, authentication, notification storage, and some product-level social ideas. This file turns those ideas into a dedicated, implementable social graph.

This file owns:

- friend requests
- accepted friendships
- following and unfollowing
- followers/following/friends lists
- friend profiles and privacy rules
- blocking and reporting
- friend suggestions and mutual connections
- social activity events used by the Friends Hub
- permission checks used by Battle and Study Together

This file does **not** own:

- Battle match logic — `battle_mode.md`
- shared study room logic — `study_together.md`
- rewards — `gamification.md`
- league scoring — `leagues.md`
- free-text direct messaging — out of MVP

---

## 2. Product Rules

1. **Follow** is one-way.
2. **Friendship** is mutual and requires acceptance.
3. A user may follow someone without being their friend.
4. Accepting a friend request creates a friendship and, by default, mutual follows.
5. Blocking has priority over every social relation.
6. Private fields are hidden server-side, not only in the UI.
7. Users cannot discover or interact with accounts that blocked them.
8. Social actions never directly award XP.
9. All list endpoints use cursor pagination.
10. The client must never submit relationship counters or relationship state as truth.

---

## 3. NestJS Module Layout

```text
social/
  social.module.ts
  social.controller.ts
  social.service.ts
  social-query.service.ts
  social-permission.service.ts
  social-suggestions.service.ts
  social-events.service.ts
  dto/
  entities/
    friend-request.entity.ts
    friendship.entity.ts
    follow.entity.ts
    user-block.entity.ts
    user-report.entity.ts
    social-privacy-settings.entity.ts
    social-activity-event.entity.ts
    social-counter.entity.ts
```

`SocialPermissionService` should be reusable from Battle, Study Together, profile, and leaderboard modules.

---

## 4. Data Model

### 4.1 `friend_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sender_id` | uuid FK → users | |
| `receiver_id` | uuid FK → users | |
| `status` | enum | `pending`, `accepted`, `declined`, `cancelled`, `expired` |
| `message` | varchar(160) nullable | Optional preset/short message |
| `expires_at` | timestamptz | Default 30 days |
| `responded_at` | timestamptz nullable | |
| `created_at` / `updated_at` | timestamptz | |

Indexes and constraints:

- sender cannot equal receiver
- partial unique index on unordered pair while status is `pending`
- index `(receiver_id, status, created_at desc)`
- requests involving a blocked pair are rejected

### 4.2 `friendships`

Store one canonical row for a mutual relation.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_low_id` | uuid FK | Lexicographically smaller UUID |
| `user_high_id` | uuid FK | Lexicographically larger UUID |
| `created_from_request_id` | uuid nullable | Audit |
| `created_at` | timestamptz | |
| `ended_at` | timestamptz nullable | Soft end |

Unique active pair:

```text
UNIQUE(user_low_id, user_high_id) WHERE ended_at IS NULL
```

### 4.3 `follows`

| Column | Type | Notes |
|---|---|---|
| `follower_id` | uuid FK | |
| `followed_id` | uuid FK | |
| `created_at` | timestamptz | |

Primary/unique key: `(follower_id, followed_id)`.

### 4.4 `user_blocks`

| Column | Type | Notes |
|---|---|---|
| `blocker_id` | uuid FK | |
| `blocked_id` | uuid FK | |
| `reason_code` | varchar nullable | User-selected category |
| `created_at` | timestamptz | |

Unique: `(blocker_id, blocked_id)`.

### 4.5 `user_reports`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `reporter_id` | uuid FK | |
| `reported_user_id` | uuid FK | |
| `context_type` | enum | `profile`, `battle`, `study_session`, `activity` |
| `context_id` | uuid nullable | |
| `reason` | enum | `spam`, `harassment`, `cheating`, `impersonation`, `other` |
| `details` | text nullable | Max 1,000 chars |
| `status` | enum | `open`, `reviewing`, `resolved`, `dismissed` |
| `created_at` | timestamptz | |

### 4.6 `social_privacy_settings`

One row per user, lazy-created.

| Field | Default |
|---|---:|
| `profile_visibility` (`public`, `followers`, `friends`, `private`) | `public` |
| `show_weekly_xp` | true |
| `show_streak` | false |
| `show_current_lesson` | false |
| `show_battle_history` | true |
| `show_study_activity` | true |
| `allow_friend_requests` | true |
| `allow_follows` | true |
| `allow_battle_invites_from` (`friends`, `followers`, `nobody`) | `friends` |
| `allow_study_invites_from` | `friends` |
| `leaderboard_visible` | true |

### 4.7 `social_activity_events`

Server-created, privacy-filtered activity items.

| Column | Type |
|---|---|
| `id` | uuid |
| `actor_id` | uuid |
| `event_type` | enum |
| `entity_type` | varchar |
| `entity_id` | uuid nullable |
| `visibility` | enum: `public`, `followers`, `friends`, `private` |
| `payload` | jsonb |
| `created_at` | timestamptz |

Allowed MVP events:

- `rank_unlocked`
- `badge_unlocked`
- `quest_completed`
- `project_completed`
- `battle_won`
- `study_partner_created`

Never publish:

- failed quizzes
- wrong answers
- missed streak details
- private lesson notes
- exact study schedule

### 4.8 `social_counters`

Optional denormalized row:

- `friends_count`
- `followers_count`
- `following_count`
- `battle_wins`
- `study_sessions_completed`

Counters are updated transactionally or through an outbox consumer and can be rebuilt from source tables.

---

## 5. Relationship State Machine

### Friend request

```text
none → pending
pending → accepted
pending → declined
pending → cancelled
pending → expired
```

Rules:

- only sender may cancel
- only receiver may accept/decline
- accepted request cannot be accepted twice
- duplicate requests return existing pending request
- if the receiver already sent a pending request in the opposite direction, the new action may auto-accept and create friendship

### Friendship removal

Removing a friend:

1. soft-ends the friendship
2. does not automatically unfollow unless the user selects “remove and unfollow”
3. cancels pending Battle/Study invites between the pair
4. does not delete prior Battle or Study history

### Blocking

Blocking transaction:

1. insert block
2. cancel pending friend requests both directions
3. soft-end friendship
4. delete follows both directions
5. cancel pending Battle invites
6. cancel pending Study Together invitations
7. remove both users from one another’s suggestions
8. invalidate cached permission results

Unblocking does not restore previous relations.

---

## 6. Permission Matrix

| Action | Public user | Follower | Friend | Blocked pair |
|---|---:|---:|---:|---:|
| View public profile | yes | yes | yes | no |
| View featured badges | privacy-dependent | yes | yes | no |
| View weekly XP | privacy-dependent | privacy-dependent | privacy-dependent | no |
| Send friend request | setting-dependent | setting-dependent | already friends | no |
| Follow | setting-dependent | already follows | yes | no |
| Invite to Battle | normally no | setting-dependent | yes | no |
| Invite to Study | normally no | setting-dependent | yes | no |

All checks use `SocialPermissionService`; controllers must not reimplement rules.

---

## 7. HTTP API (`/api/v1`, JWT)

### Discovery and profile

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/social/search?q=&cursor=` | Search allowed users |
| `GET` | `/social/suggestions?cursor=` | Suggested users |
| `GET` | `/social/users/:userId` | Privacy-filtered social profile |
| `GET` | `/social/users/:userId/mutuals` | Mutual friends/follows |
| `GET` | `/social/activity?scope=friends&cursor=` | Privacy-filtered activity |

### Friends and requests

| Method | Path |
|---|---|
| `POST` | `/social/friend-requests` |
| `GET` | `/social/friend-requests/incoming` |
| `GET` | `/social/friend-requests/outgoing` |
| `POST` | `/social/friend-requests/:id/accept` |
| `POST` | `/social/friend-requests/:id/decline` |
| `DELETE` | `/social/friend-requests/:id` |
| `GET` | `/social/friends?cursor=&online=` |
| `DELETE` | `/social/friends/:userId` |

### Following

| Method | Path |
|---|---|
| `POST` | `/social/follows/:userId` |
| `DELETE` | `/social/follows/:userId` |
| `GET` | `/social/followers?cursor=` |
| `GET` | `/social/following?cursor=` |

### Safety and settings

| Method | Path |
|---|---|
| `POST` | `/social/blocks/:userId` |
| `DELETE` | `/social/blocks/:userId` |
| `GET` | `/social/blocks` |
| `POST` | `/social/reports` |
| `GET` | `/social/privacy` |
| `PATCH` | `/social/privacy` |

---

## 8. Example Friend Request

### Request

```json
{
  "receiverId": "uuid",
  "message": "Want to learn SQL together?"
}
```

### Response

```json
{
  "request": {
    "id": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "status": "pending",
    "expiresAt": "2026-08-11T10:00:00Z"
  },
  "relationship": {
    "isFriend": false,
    "isFollowing": true,
    "requestDirection": "outgoing"
  }
}
```

Accepting returns the new friendship and updated relationship summary.

---

## 9. Suggestions Logic

Candidate sources, in order:

1. mutual friends
2. same current learning track
3. same league cohort
4. accepted Study Together/Battle history
5. contacts/referrals only when explicit permission exists

Score:

```text
suggestion_score =
  mutual_friends × 5
  + shared_skill_tags × 3
  + same_league × 2
  + similar_rank × 1
  - prior_decline_penalty
  - report_risk_penalty
```

Exclude:

- self
- blocked pairs
- existing friends
- pending requests
- recently declined users for 30 days
- accounts hidden from suggestions

---

## 10. Online Presence

For MVP, “Online” means a recent authenticated heartbeat, not a permanent socket.

- client heartbeat every 60 seconds while visible
- Redis key `presence:user:{id}` TTL 120 seconds
- friend list may show `online`, `recently_active`, or no state
- exact last-seen is private by default
- presence is not persisted as authoritative history

---

## 11. Notifications

Extend notification types:

- `friend_request`
- `friend_request_accepted`
- `new_follower`
- `friend_activity`
- `social_suggestion`

Notification examples:

- “Priya sent you a friend request.”
- “Alex accepted your friend request.”
- “Mina followed your Arlo journey.”

Deep links must point to the specific request or profile.

---

## 12. Concurrency, Idempotency, and Consistency

- accept request uses a database transaction and row lock
- all POST actions support `Idempotency-Key`
- canonical friendship pairs prevent duplicate rows
- block action wins over simultaneous accept
- counters should use an outbox event or transaction-safe update
- list responses include `relationshipVersion` so stale clients can refresh
- deleted/disabled users disappear from discovery immediately

---

## 13. Rate Limits

Suggested limits:

- search: 30/min
- friend requests: 20/day, 5/min
- follows: 100/day
- block/report: 30/day
- activity pagination: 60/min
- repeated requests to same declined user: blocked for 30 days

---

## 14. Error Codes

- `SOCIAL_USER_NOT_FOUND`
- `SOCIAL_SELF_ACTION_NOT_ALLOWED`
- `SOCIAL_BLOCKED`
- `FRIEND_REQUEST_ALREADY_PENDING`
- `FRIEND_REQUEST_NOT_FOUND`
- `FRIEND_REQUEST_NOT_RECEIVER`
- `ALREADY_FRIENDS`
- `NOT_FRIENDS`
- `FOLLOW_NOT_ALLOWED`
- `PROFILE_PRIVATE`
- `RATE_LIMITED`

---

## 15. Analytics Events

- `friend_request_sent`
- `friend_request_accepted`
- `friend_request_declined`
- `friend_removed`
- `follow_created`
- `follow_removed`
- `user_blocked`
- `social_profile_viewed`
- `study_invite_started_from_profile`
- `battle_invite_started_from_profile`

---

## 16. Acceptance Criteria

- friend requests are unique, expiring, and server-authoritative
- accepting creates one canonical friendship
- follows remain independent from friendships
- blocking removes all active social access
- privacy filters are enforced by backend serializers
- friend/follower lists support cursor pagination
- Battle and Study Together can call one shared permission service
- social activity never exposes private learning failures
- notifications deep-link to the relevant social object
- repeated or concurrent actions are idempotent

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/social/` |
| Entities | friendships, friend_requests, follows, blocks, reports, privacy, activity, counters |
| Permissions | `SocialPermissionService` — block/friends/follow + battle/study invite policies |
| Presence | `SocialPresenceService` — Redis `presence:user:{id}` TTL 120s or memory |
| APIs | search, suggestions, profile, mutuals, activity, friends CRUD, requests, follows, blocks, reports, privacy, heartbeat |
| Notifs | friend_request / accepted / new_follower on actions |
| FE | `socialApi`, Friends Following + follow/unfollow, Settings privacy toggles |

**Still thin:** dedicated friend profile page UI, Battle/Study cancel on block cascade, analytics bus, social-specific rate limits, `friend_activity` / `social_suggestion` notif types.
