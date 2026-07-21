# 06 — Notifications, Inbox & Delivery Scheduling

**Version:** 2.0 integrated  
**Stack:** NestJS + TypeORM + PostgreSQL; queue/Redis recommended  
**Consumers:** Settings alerts, notification inbox, Home badge, deep links, email/push providers  
**Depends on:** [00](../integration/00-system-integration.md), [01](../auth/01-user-model-and-authentication.md)

---

## 1. Ownership

Notifications owns:

- user notification preferences
- in-app inbox
- device/channel registrations
- scheduled reminder records
- delivery attempts
- quiet hours, caps, dedupe, and deep links

Domain modules own the facts. Notifications never awards currency, changes streak, completes lessons, or decides a Battle winner. It consumes domain events and renders approved templates.

---

## 2. Preference Model

Store one `notification_preferences` row per user.

### Channel toggles

- `inApp` — always true for critical account/system messages
- `push`
- `email`

### Topic toggles

| Key | Default | Examples |
|---|---:|---|
| `learningReminders` | true | session reminders, missed session, deadline risk |
| `weeklyProgress` | true | catch-up, weekly recap, replan suggestion |
| `streakReminders` | true | risk, protected, broken, recovered |
| `rewards` | true | reward, badge, chest, rank |
| `social` | true | friend/follow activity |
| `studyTogetherInvites` | true | study invitations and room start |
| `battleInvites` | true | Battle invitation/start/result |
| `leagueUpdates` | true | position risk and final result |
| `luckyWheel` | true | wheel ready/rare reward |
| `coachMessages` | true | Arlo contextual messages |
| `marketing` | false | product announcements |

Compatibility: the existing UI’s broad toggles map to these fields. New granular toggles can be exposed later without schema redesign.

### Quiet hours

- default: 22:00–08:00 user local time
- user-configurable
- critical security/account notifications bypass quiet hours
- other messages are delayed to the next allowed time, not discarded

---

## 3. Notification Types

### Learning and scheduling

- `study_reminder`
- `study_starting`
- `missed_session`
- `replan_suggestion`
- `deadline_risk`
- `pace_ahead`
- `pace_behind`

### Streak and week

- `streak_risk`
- `streak_protected`
- `streak_broken`
- `streak_recovered`
- `weekly_recap`
- `missed_week_recovery`

### Rewards and progression

- `reward_granted`
- `badge_unlocked`
- `rank_close`
- `rank_unlocked`
- `chest_ready`
- `lucky_wheel_ready`
- `lucky_wheel_reward`

### Social, Study Together, Battle, League

- `friend_request`
- `friend_request_accepted`
- `new_follower`
- `study_invite`
- `study_invite_accepted`
- `study_session_starting`
- `study_partner_ready`
- `study_session_completed`
- `battle_invite`
- `battle_invite_expiring`
- `battle_accepted`
- `battle_starting`
- `battle_result`
- `battle_rematch`
- `league_started`
- `league_position_risk`
- `league_finalized`
- `league_promoted`
- `league_demoted`
- `referral`

### Coach and system

- `coach_message`
- `product_update`
- `system`
- `security`

Categories for inbox filtering:

- `learning`
- `streak`
- `rewards`
- `social`
- `coach`
- `system`

---

## 4. Data Model

### 4.1 `notification_preferences`

Includes channel/topic toggles, timezone, quiet-hour local times, and digest settings. Timezone is normally copied from Profile but snapshotted for scheduling.

### 4.2 `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | |
| `type` / `category` | enum | |
| `title` / `body` | text | Rendered copy snapshot |
| `action_url` | varchar nullable | App route only or approved URL |
| `payload` | jsonb nullable | IDs and display metadata; no secrets |
| `source_event_id` | uuid nullable | Unique consumer idempotency |
| `dedupe_key` | varchar nullable | Unique in configured window |
| `priority` | enum | low, normal, high, critical |
| `unread` | boolean | |
| `read_at` | timestamptz nullable | |
| `expires_at` | timestamptz nullable | Hide stale action messages |
| `created_at` | timestamptz | |

### 4.3 `notification_schedules`

- user/type/topic
- scheduled UTC time
- timezone and schedule-version snapshot
- source entity/version
- dedupe key
- status: scheduled, queued, sent, cancelled, stale, failed
- cancellation reason

Changing/replanning a schedule cancels records whose source version is obsolete.

### 4.4 `notification_deliveries`

One row per notification/channel attempt:

- channel
- provider
- status
- attempts
- next retry
- provider message ID
- failure code
- delivered/opened timestamps

### 4.5 `push_devices`

- user/device ID
- platform/web-push endpoint/token
- encrypted provider token where applicable
- last seen
- revoked at

---

## 5. Event-Driven Creation

Domain modules write outbox events. A Notifications consumer:

1. validates event schema/version
2. maps event to notification type/template/topic
3. checks preference gate
4. checks expiry and action validity
5. creates inbox row idempotently
6. schedules or queues external channels
7. records delivery attempts

Unique `source_event_id + type + user_id` prevents duplicate inbox messages on event replay.

For direct internal creation, `NotificationsService.create()` still requires a server-owned source/dedupe key.

---

## 6. Scheduling, Dedupe and Caps

### Dedupe examples

- session reminder: `study_reminder:{slotId}:{scheduleVersion}`
- streak risk: `streak_risk:{localDate}`
- Battle invite: `battle_invite:{battleId}`
- rank unlock: `rank_unlocked:{rankLevel}`

### Caps

Default optional-delivery caps:

- maximum two actionable push notifications/day
- maximum one streak-risk push/day
- maximum one league-risk push/day
- social invitations are event-based but abuse/rate limits apply upstream
- critical security messages excluded

When cap is reached, retain a useful in-app inbox item when allowed, but suppress/delay external delivery.

---

## 7. Deep-Link Rules

`actionUrl` must be generated from an allowlisted route mapper, never arbitrary user input.

Examples:

- `/learn/:lessonId`
- `/week`
- `/roadmap`
- `/friends/requests`
- `/study/:sessionId`
- `/battle/:battleId`
- `/league`
- `/rewards`
- `/rank`
- `/lucky-wheel`

If an entity is expired/deleted, the app resolves to a safe parent route.

---

## 8. HTTP API (`/api/v1`, JWT)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/notifications?filter=&cursor=&limit=` | Cursor-paginated inbox |
| `GET` | `/notifications/unread-count` | Home badge |
| `GET` | `/notifications/preferences` | Settings model |
| `PATCH` | `/notifications/preferences` | Partial preference update |
| `PATCH` | `/notifications/:id/read` | Mark read/unread |
| `POST` | `/notifications/read-all` | Mark selected category/all read |
| `DELETE` | `/notifications/:id` | Hide user inbox row where policy allows |
| `POST` | `/notifications/devices` | Register push/web-push device |
| `DELETE` | `/notifications/devices/:id` | Revoke device |

### Inbox response

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "study_reminder",
      "category": "learning",
      "title": "Your SQL mission is ready",
      "body": "Filtering with WHERE takes about 25 minutes.",
      "actionUrl": "/learn/uuid",
      "unread": true,
      "createdAt": "2026-07-12T10:00:00Z",
      "expiresAt": "2026-07-12T18:00:00Z"
    }
  ],
  "nextCursor": null
}
```

---

## 9. Internal API

```ts
await notifications.create({
  userId,
  type: NotificationType.StudyReminder,
  sourceEventId,
  dedupeKey: `study_reminder:${slotId}:${scheduleVersion}`,
  templateData: { lessonTitle, minutes },
  action: { route: 'lesson', params: { lessonId } },
  channels: ['in_app', 'push'],
  scheduledAt,
  expiresAt,
});
```

The service returns an existing result for the same idempotent source/dedupe key.

---

## 10. Templates

Templates are versioned and localized:

- template key/type
- language
- title/body format
- allowed variables
- channel variants
- version/status

Do not allow unrestricted HTML or arbitrary template variables. Arlo tone can vary, but facts and actions come from server payloads.

---

## 11. Delivery Providers

Provider adapters:

- in-app: PostgreSQL
- web push / FCM / APNs
- email provider

Providers may initially be stub-logged, but scheduling, preference, idempotency, and attempt records must already follow the final contract.

Retries use exponential backoff. Permanent invalid tokens are revoked.

---

## 12. Security and Privacy

- do not put correct answers, private messages, reset tokens, or sensitive goal details into push payloads
- encrypt provider tokens where appropriate
- authenticate all inbox/device APIs
- verify notification ownership
- sanitize templates and payloads
- rate-limit preference/device mutation
- audit marketing consent changes

---

## 13. Error Codes

- `NOTIFICATION_NOT_FOUND`
- `NOTIFICATION_NOT_OWNED`
- `NOTIFICATION_PREFERENCE_INVALID`
- `NOTIFICATION_DEVICE_INVALID`
- `NOTIFICATION_ROUTE_NOT_ALLOWED`
- `NOTIFICATION_SCHEDULE_STALE`
- `NOTIFICATION_DELIVERY_FAILED`
- `VERSION_CONFLICT`

---

## 14. Acceptance Criteria

- every notification is traceable to a server event or approved system command
- event replay cannot create duplicates
- reminders are cancelled/rebuilt after schedule version changes
- quiet hours, user preferences, topic gates, caps, and expiry are respected
- inbox is cursor-paginated and unread count is consistent
- all social/Battle/Study/League/Rank/Wheel types are supported
- action URLs are allowlisted and safe
- provider failures do not roll back the domain action
- critical account/security messages remain deliverable

---

## 15. File map (implementation)

### Backend (`arc-backend`)

- `arc-backend/src/notifications/entities/*` — prefs, inbox, devices, schedules, deliveries
- `arc-backend/src/notifications/notifications.service.ts` — dedupe, quiet hours, caps, allowlist, outbox fan-in
- `arc-backend/src/notifications/notifications.controller.ts` — cursor list, delete, devices, prefs
- `arc-backend/src/gamification/gamification.service.ts` — `processPendingOutbox` → notifications

### Frontend (`arc-app`)

- `src/lib/api/notifications.ts`
- `src/hooks/useNotificationPreferences.ts`
- `src/hooks/useNotifications.ts`
- `src/components/settings/SettingsScreen.tsx`
