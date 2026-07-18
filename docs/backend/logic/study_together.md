# Arlo Backend — Study Together

**Version:** 3.0 co-roadmap  
**Canonical integration:** Normal lesson completion stays in doc 05; verified shared time updates Course Timing/Weekly Plan and shared bonuses use the Gamification ledger.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL; Socket.IO WebSocket  
**Consumers:** Study Together hub, path invite, episode Focus Room, friend profile, Home/notifications  
**Depends on:** `social_media.md`, `course_timing.md`, `05-Learn_Lesson_Play_API.md`, `gamification.md`, `06-notifications.md`

---

## 1. Purpose

A user invites a friend onto a **Unit co-roadmap** (content-pool unit slug). They share reading progress across that unit. Timed **episode rooms** are sessions inside the path: synchronized timer, “I read” gate, and chat. The path persists across episodes.

MVP does not require voice or video. Always **1:1** (creator + partner).

```text
Invite → study_paths (unitId)
       → episode rooms (study_sessions.path_id)
       → shared content_step on the path
```

---

## 2. Eligibility

Path invite / episode create:

- users are friends or allowed by privacy setting
- no block exists
- inviter not rate-limited
- both accounts active
- unit is a reading unit present on the creator’s ready roadmap (or `lessonId` resolves to such a unit)
- soft caps: `STUDY_MAX_ACTIVE_PATHS` (20) non-terminal paths per user; `STUDY_MAX_CONCURRENT_ROOMS` live episodes
- at most one non-terminal path per `(pair, unitId)` (either user ordering)

Episode start additionally:

- path `status = active`
- duration allowed (15 / 25 / 45 / 60)
- start mode valid
- neither user over concurrent live-room cap

---

## 3. Co-roadmap options

**Bind:** content-pool `unitId` (slug). Optional create input `lessonId` resolves unit via creator lesson.

**Category:** denormalized from `Unit.domain` or `Unit.stack` at create — hub grouping.

**Invite message:** optional, max 160 characters.

**Episodes (rooms):**

Start choices: `now` | `within_1_hour` | `scheduled`  
Duration: 15 / 25 / 45 / 60 minutes

---

## 4. State machines

### Path (`study_paths`)

```text
invited → active → completed
alternatives: declined | cancelled | abandoned
```

### Episode (`study_sessions`)

```text
draft → invited → accepted → waiting → active → completed
alternatives: declined | expired | cancelled | abandoned | partially_completed | voided
```

Legacy sessions without `path_id` keep working until natural end. New creates set `path_id`.

---

## 5. Data model

### `study_paths`

- `id`, `creator_id`, `partner_id` (1:1)
- `unit_id` (varchar, pool slug)
- `creator_lesson_id` (UUID — creator’s materialized reading lesson for play content)
- `category`, `title` (denormalized)
- `status`: invited | active | completed | declined | cancelled | abandoned
- `content_step`, `step_count` — **shared progress source of truth**
- `progress_percent` — `((content_step+1)/step_count)*100` while active; `100` when completed
- `invite_message`, `invite_expires_at`, timestamps

No separate path_participants table for MVP.

### `study_sessions` (episodes)

- existing room fields
- `path_id` → `study_paths` (required for new creates; nullable for legacy)
- `content_step` / `step_count` — **episode snapshot**, synced from path on start and write-through on `ackRead`

### `study_session_participants`

Unchanged: role, invitation status, heartbeats, readiness, qualification flags. Participants attach to **episodes**, not paths.

### `study_session_events` / heartbeats

Unchanged for episodes. Do not trust client-reported total time.

---

## 6. Invite + episode flow

### Path invite

1. Creator picks partner + unit (or lesson → unit)
2. `SocialPermissionService` validates
3. Soft path-cap + pair+unit uniqueness
4. Create `study_paths` (`status = invited`), notify partner
5. Partner accept → `active`; decline → `declined`; creator cancel → `cancelled`

### Episode start

1. Either participant on an **active** path calls `POST …/paths/:id/episodes`
2. Session copies path `content_step` / `step_count` (resume, not reset to 0)
3. Sets `path_id`; room invite / ready / timer flow as before
4. Live list via `GET /study-together/rooms`

### Progress write-through

- Both-ack / solo-advance logic stays on the episode
- After advance, `ackRead` updates path `content_step` / `progress_percent`
- Last beat completed → path `status = completed`, `progress_percent = 100`
- Hub progress bars read **path** fields

---

## 7. Focus room (episode)

Unchanged surface: presence, synchronized remaining time, shared reading content, “I read” gate, chat (text / voice / image).

WebSocket namespace `/study` (no new namespace). On `ack_read` advance: persist path, then emit `step` / `state_dirty` as today.

---

## 8. Timer + heartbeat

- server stores authoritative start time and duration
- remaining time derived from server time
- heartbeat every ~15s while visible
- background time not automatically verified
- short disconnect grace: 60 seconds
- pause only if both agree; max one pause, five minutes (when implemented)

---

## 9. Content

Episode play content comes from the path’s `creator_lesson_id` (creator’s unit materialization). Invitee does not need the same unit on their personal roadmap for MVP.

Normal lesson APIs remain the only source of **personal** lesson completion XP. Study Together does not invent a second completion path for roadmap progress.

---

## 10. Completion and qualification (episode)

A participant qualifies when:

- active for at least 80% of planned duration
- has sufficient valid heartbeats
- completes one meaningful learning action or at least five verified study minutes
- does not abandon before threshold

Session outcomes: `completed_by_both` | `completed_by_creator_only` | `completed_by_invitee_only` | `abandoned` | `voided`

Path completion is separate: finishing the last reading beat on the shared path.

---

## 11. Shared bonus

When both qualify on an episode:

- 15 Coins each
- 2 Gems each
- no extra XP
- max three rewarded sessions/week
- pair reward cap: two rewarded sessions/day

Rewards call `GamificationService` with idempotent session/user key.

---

## 12. Schedule integration

For scheduled episodes:

- Course Timing may reserve a study slot
- after completion, weekly progress updates from verified lesson/time
- cancelled → original slot remains or is replanned

---

## 13. API

### Paths (hub primary)

| Method | Path | Role |
|---|---|---|
| `POST` | `/study-together/paths` | Create path invite (`partnerId`, `unitId` and/or `lessonId`, optional message) |
| `GET` | `/study-together/paths` | List my paths (active + invited) + partner, category, progress, optional `activeSessionId` |
| `GET` | `/study-together/paths/:id` | Path detail + recent episodes |
| `POST` | `/study-together/paths/:id/accept` | Partner accepts |
| `POST` | `/study-together/paths/:id/decline` | Partner declines |
| `POST` | `/study-together/paths/:id/cancel` | Creator cancels |
| `POST` | `/study-together/paths/:id/episodes` | Start episode room (duration + startMode) |

### Episodes / rooms

| Method | Path |
|---|---|
| `GET` | `/study-together/rooms` |
| `GET` | `/study-together/invites` |
| `GET` | `/study-together/history?cursor=` |
| `POST` | `/study-together` | Legacy one-shot create (prefer paths) |
| `POST` | `/study-together/:id/accept` \| `decline` \| `cancel` |
| `POST` | `/study-together/:id/task` |
| `POST` | `/study-together/:id/ready` |
| `POST` | `/study-together/:id/heartbeat` |
| `GET` | `/study-together/:id/content` |
| `POST` | `/study-together/:id/ack-read` | Advances episode **and** path |
| `GET`/`POST` | `/study-together/:id/messages` (+ media, read) |
| `GET` | `/study-together/:id/state` |
| `POST` | `/study-together/:id/leave` |
| `POST` | `/study-together/:id/complete` |

---

## 14. Notifications

Types:

- `study_invite` / path invite
- `study_invite_accepted`
- `study_session_starting`
- `study_partner_ready`
- `study_session_completed`
- `study_session_missed`

Examples:

- “Priya invited you onto SQL Joins.”
- “Your Study Partner is ready.”
- “Both of you focused for 25 minutes — shared bonus unlocked.”

---

## 15. Privacy and safety

- invite message sanitized
- presence shared only within active episode
- block terminates future interaction
- report session available
- minors: friends-only invites
- users may disable Study Together

---

## 16. Anti-abuse

- verified server timer and heartbeat
- background idle time excluded
- reward weekly/pair caps
- repeated join/leave does not create time
- no reward for two accounts on same device when risk rules trigger
- no XP solely for presence
- completion and reward are idempotent
- path + episode caps limit spam invites / concurrent rooms

---

## 17. Error codes

- `STUDY_INVITE_NOT_ALLOWED`
- `STUDY_INVITE_EXPIRED`
- `STUDY_SESSION_CONFLICT`
- `STUDY_SESSION_ALREADY_STARTED`
- `STUDY_SESSION_NOT_PARTICIPANT`
- `STUDY_DURATION_INVALID`
- `STUDY_TASK_NOT_AVAILABLE`
- `STUDY_COMPLETION_NOT_QUALIFIED`
- `STUDY_REWARD_CAP_REACHED`
- path soft-cap / unit eligibility surfaced via existing `STUDY_*` / validation errors

---

## 18. Analytics

- `study_path_invite_sent`
- `study_path_accepted`
- `study_episode_started`
- `study_invite_sent` / `study_invite_accepted` (episode-level, legacy)
- `study_session_started`
- `study_session_completed`
- `study_shared_reward_granted`
- `study_path_completed`

---

## 19. Acceptance criteria

- invite a friend onto a Unit; path shows on hub grouped by category with progress
- accept/decline/cancel at path level
- start episode from active path; new episode resumes path `content_step`
- `ackRead` advances shared path progress; last beat completes the path
- second episode resumes mid-path step
- timer is server-authoritative; shared bonuses require both to qualify
- no voice/video dependency for MVP
- live pill deep-links to single live episode; multi → hub

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/study-together/` |
| Entities | `study_paths`, `study_sessions` (+ `path_id`), participants, events |
| Migration | `arc-backend/scripts/migrations/20260716-study-paths.sql` |
| Caps | `STUDY_MAX_ACTIVE_PATHS`, `STUDY_MAX_CONCURRENT_ROOMS` |
| REST | path CRUD/accept + episodes; room routes unchanged; `ack-read` → path |
| WS | `/study` gateway; ack advances path then emits step |
| Ledger | `RewardReasonType.StudyTogether` — 15 coins + 2 gems; weekly 3 / pair daily 2 |
| FE | `lib/api/study.ts`, `pickableStudyUnits`, `StudyHubScreen`, `StudyInviteScreen`, `StudyPathScreen`, `StudyRoomScreen` |

**Out of scope (this pass):** multi-friend paths; invitee must own unit; Redis multi-replica sticky; backfill all historical sessions into paths.
