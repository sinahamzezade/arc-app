# Arc Backend — Study Together

**Version:** 2.0 integrated  
**Canonical integration:** Normal lesson completion stays in doc 05; verified shared time updates Course Timing/Weekly Plan and shared bonuses use the Gamification ledger.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL; Redis/WebSocket recommended  
**Consumers:** Study Together invite, Focus Room, friend profile, Home/notifications  
**Depends on:** `social_media.md`, `course_timing.md`, `05-Learn_Lesson_Play_API.md`, `gamification.md`, `06-notifications.md`

---

## 1. Purpose

A user invites a friend to study for a selected duration. Both users may work on their own relevant lesson while sharing a synchronized focus timer and accountability room.

MVP does not require voice or video.

---

## 2. Eligibility

- users are friends or allowed by privacy setting
- no block exists
- inviter not rate-limited
- both accounts active
- scheduled time valid
- duration allowed
- neither user in a conflicting live focus session
- target lesson belongs to the participant’s own roadmap

---

## 3. Session Options

Start choices:

- now
- within 1 hour
- scheduled later

Duration:

- 15
- 25
- 45
- 60 minutes

Subject:

- SQL
- Python
- Excel
- Data Analysis
- current track
- any

Optional message: max 160 characters.

---

## 4. State Machine

```text
draft
→ invited
→ accepted
→ scheduled/waiting
→ active
→ completed
```

Alternatives:

- declined
- expired
- cancelled
- abandoned
- partially_completed
- voided

---

## 5. Data Model

### `study_sessions`

- creator
- subject
- duration
- start mode
- scheduled start/end
- actual start/end
- status
- room token/version
- completion state
- reward transaction group
- created at

### `study_session_participants`

- session/user
- role
- invitation status
- selected lesson/task ID
- joined/left timestamps
- verified active seconds
- heartbeat count
- meaningful action completed
- completion confirmation
- reward eligibility

### `study_session_events`

Ordered:

- invite sent
- accepted
- joined
- ready
- timer started
- pause requested
- heartbeat
- task changed
- meaningful action
- left
- completed

### `study_session_heartbeats`

May be Redis-only for active room, with aggregated persistence:

- participant
- server timestamp
- app visible
- current task
- focus state

Do not trust client-reported total time.

---

## 6. Invite Flow

1. inviter selects friend, subject, start, duration, message
2. SocialPermissionService validates
3. schedule conflict check
4. create session/invitation
5. send `study_invite`
6. invite expiry:
   - start now: 10 minutes
   - within 1 hour: 60 minutes
   - scheduled: 30 minutes after scheduled start

Accept:

- participant row becomes accepted
- both receive room availability
- reminders are scheduled
- if “start now” and both ready, timer can begin

---

## 7. Focus Room

The room shows:

- both users and presence
- synchronized remaining time
- each user’s selected task
- each user’s high-level progress, if shared
- Arlo focus message
- pause/leave controls

WebSocket namespace `/study`.

Events:

- `study:join`
- `study:ready`
- `study:heartbeat`
- `study:task_selected`
- `study:pause_request`
- `study:leave`

Server:

- `study:state`
- `study:timer_started`
- `study:presence`
- `study:progress`
- `study:completed`

---

## 8. Timer Logic

- server stores authoritative start time and duration
- remaining time is derived from server time
- client timer is display only
- heartbeat every 15 seconds while visible
- background time is not automatically verified
- short disconnect grace: 60 seconds
- participant may reconnect
- pause is allowed only if both agree; max one pause, five minutes

---

## 9. Task Selection

Each participant may:

- continue current scheduled lesson
- choose another available lesson in the subject
- choose a review task
- choose a practice challenge

The two users do not need the same lesson.

Normal lesson APIs remain authoritative. Study Together does not create a duplicate completion path.

---

## 10. Completion and Qualification

A participant qualifies when:

- active for at least 80% of planned duration
- has sufficient valid heartbeats
- completes one meaningful learning action or at least five verified study minutes
- does not abandon before threshold

Session outcomes:

- `completed_by_both`
- `completed_by_creator_only`
- `completed_by_invitee_only`
- `abandoned`
- `voided`

Normal lesson XP is granted by lesson completion, not this module.

---

## 11. Shared Bonus

When both qualify:

- 15 Coins each
- 2 Gems each
- no extra XP
- maximum three rewarded sessions/week
- pair reward cap: two rewarded sessions/day

If one qualifies:

- that user keeps normal lesson rewards
- no shared bonus
- no punishment to the other user

Rewards call `GamificationService` with idempotent session/user key.

---

## 12. Schedule Integration

For scheduled sessions:

- Course Timing may reserve the session as a study slot
- accepted room can replace an individual slot only with explicit user choice
- after completion, both users’ own weekly progress updates from verified lesson/time
- if cancelled, original study slot remains or is replanned
- stale reminders are removed on time change

---

## 13. API

| Method | Path |
|---|---|
| `POST` | `/study-together` |
| `GET` | `/study-together/invites` |
| `POST` | `/study-together/:id/accept` |
| `POST` | `/study-together/:id/decline` |
| `POST` | `/study-together/:id/cancel` |
| `POST` | `/study-together/:id/task` |
| `POST` | `/study-together/:id/ready` |
| `GET` | `/study-together/:id/state` |
| `POST` | `/study-together/:id/leave` |
| `POST` | `/study-together/:id/complete` |
| `GET` | `/study-together/history?cursor=` |

---

## 14. Notifications

Types:

- `study_invite`
- `study_invite_accepted`
- `study_session_starting`
- `study_partner_ready`
- `study_session_completed`
- `study_session_missed`

Triggers:

| Event | Notification |
|---|---|
| Invite created | immediately |
| Accepted | notify inviter |
| Scheduled session | 30m and 5m before, preference permitting |
| Both ready | room-ready notification |
| Completion | shared summary |
| Missed | no-guilt reschedule prompt |

Example:

- “Priya invited you to study SQL for 25 minutes.”
- “Your Study Partner is ready.”
- “Both of you focused for 25 minutes — shared bonus unlocked.”

---

## 15. Privacy and Safety

- no free-text chat required for MVP
- optional message sanitized
- presence shared only within active room
- task title sharing follows privacy setting
- block immediately terminates future interaction and hides history from the blocked user where appropriate
- report session available
- minors use friends-only invites
- users may disable Study Together

---

## 16. Anti-Abuse

- verified server timer and heartbeat
- background idle time excluded
- reward weekly/pair caps
- repeated join/leave does not create time
- no reward for two accounts on same device when risk rules trigger
- no XP solely for presence
- completion and reward are idempotent
- suspicious sessions may grant normal lesson reward but hold shared bonus

---

## 17. Error Codes

- `STUDY_INVITE_NOT_ALLOWED`
- `STUDY_INVITE_EXPIRED`
- `STUDY_SESSION_CONFLICT`
- `STUDY_SESSION_ALREADY_STARTED`
- `STUDY_SESSION_NOT_PARTICIPANT`
- `STUDY_DURATION_INVALID`
- `STUDY_TASK_NOT_AVAILABLE`
- `STUDY_COMPLETION_NOT_QUALIFIED`
- `STUDY_REWARD_CAP_REACHED`

---

## 18. Analytics

- `study_invite_sent`
- `study_invite_accepted`
- `study_session_started`
- `study_participant_joined`
- `study_session_completed`
- `study_session_partial`
- `study_session_abandoned`
- `study_shared_reward_granted`
- `study_rescheduled`

---

## 19. Acceptance Criteria

- users can invite an allowed friend for a chosen duration/start time
- notifications deep-link to invite/room
- timer is server-authoritative
- both users can work on separate own-roadmap tasks
- normal lesson APIs remain the only source of lesson completion
- shared bonuses require both users to qualify
- no voice/video dependency exists for MVP
- disconnect/reconnect and expiry are defined
- reward abuse is capped and auditable

---

## Implementation map (arc-backend + arc-app)

| Doc area | Code |
|----------|------|
| Module | `arc-backend/src/study-together/` |
| Entities | `study_sessions`, `study_session_participants`, `study_session_events` |
| Permissions | `SocialPermissionService.canStudyInvite` on create |
| REST | create, invites, accept/decline/cancel, task, ready, state, leave, complete, history + `POST …/heartbeat` (REST stand-in for WS) |
| Timer | Server `actualStartAt` / `plannedEndAt`; `remainingSeconds` derived; heartbeats accumulate `verifiedActiveSeconds` |
| Qual | ≥80% active + (meaningful action OR ≥5 verified min); both qualify → shared bonus |
| Ledger | `RewardReasonType.StudyTogether` — 15 coins + 2 gems each; weekly cap 3 / pair daily cap 2; no XP / no league |
| Notifs | invite, accepted, starting, partner ready, completed, **missed** |
| Errors | `STUDY_*` in `auth-error.codes.ts` |
| FE | `lib/api/study.ts`, live `StudyInviteScreen` / `StudyRoomScreen` |

**Still thin:** native WS `/study` gateway, Course Timing slot reserve, pause-both, scheduled 30m/5m reminders, analytics bus, same-device risk hold.
