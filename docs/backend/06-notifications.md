# 06 — Notifications

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arc Next.js PWA (`Settings` alerts tab, `/notifications` inbox, home badge)  
**Product source:** `Arc_MVP_Full_Technical_Roadmap.md` §10 / §17, battle/referral notification copy  
**Depends on:** [01 — User Model & Authentication](./01-user-model-and-authentication.md)

---

## Scope (MVP)

1. **Preference toggles** — match Settings → Alerts UI
2. **In-app inbox** — list / filter / mark read / unread count
3. **Create API for other modules** — preference-gated; push/email delivery stubbed (log only)

Out of MVP: FCM/APNs providers, quiet hours scheduler, tone preference, battle accept deep-links beyond `actionUrl`.

---

## Preference toggles

| API key | UI label | Default | Gates |
| --- | --- | --- | --- |
| `push` | Push notifications | `true` | Push channel delivery |
| `email` | Email digests | `true` | Email channel delivery |
| `streakReminders` | Streak reminders | `true` | `study_reminder`, `streak_risk` create |
| `battleInvites` | Battle invites | `true` | `battle_invite` create |
| `marketing` | Product updates | `false` | `product_update` create |

Table: `notification_preferences` (1 row per user, lazy-created on first read/write).

---

## Notification types & categories

| Type | Category | Notes |
| --- | --- | --- |
| `study_reminder` | streak | Planned session |
| `streak_risk` | streak | Day-end nudge |
| `weekly_recap` | system | Progress summary |
| `missed_week_recovery` | coach | Guilt-free replan |
| `badge_unlocked` | rewards | |
| `replan_suggestion` | coach | |
| `battle_invite` | social | |
| `league_update` | social | |
| `referral` | social | |
| `product_update` | system | Marketing |
| `coach_message` | coach | Arlo |
| `system` | system | |

Inbox filters: `all` | `unread` | `rewards` | `social`.

---

## HTTP API (`/api/v1`, JWT)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/notifications` | List (`filter`, `limit`, `offset`) |
| `GET` | `/notifications/unread-count` | Home badge |
| `GET` | `/notifications/preferences` | Prefs + Settings toggle rows |
| `PATCH` | `/notifications/preferences` | Partial toggle update |
| `PATCH` | `/notifications/:id/read` | Mark one read |
| `POST` | `/notifications/read-all` | Mark all read |

### Preferences response shape

```json
{
  "preferences": {
    "push": true,
    "email": true,
    "streakReminders": true,
    "battleInvites": true,
    "marketing": false
  },
  "toggles": [
    {
      "id": "push",
      "label": "Push notifications",
      "detail": "Streak, battles, league cuts",
      "on": true
    }
  ]
}
```

### Inbox item shape

```json
{
  "id": "…",
  "type": "streak_risk",
  "category": "streak",
  "title": "Streak reminder",
  "body": "Complete a lesson today to reach your 8-day streak.",
  "actionUrl": "/path",
  "payload": null,
  "unread": true,
  "readAt": null,
  "createdAt": "2026-07-12T10:00:00.000Z"
}
```

---

## Internal create (other Nest modules)

Inject `NotificationsService` and call `create()`:

```ts
await this.notifications.create({
  userId,
  type: NotificationType.StreakRisk,
  title: 'Streak reminder',
  body: 'One 5-minute mission keeps your daily streak alive.',
  actionUrl: '/path',
  channels: [NotificationChannel.InApp, NotificationChannel.Push],
});
```

- Returns `null` when blocked by prefs (not an error).
- Push / email currently **stub-logged** until providers land.
- Persists inbox row when `in_app` is among delivered channels.

Rules from product:

- Never trust client for creating reward/streak notifications.
- Prefer ≤1–2 actionable pings/day (scheduler later).
- Respect preference gates before any channel send.

---

## Nest home

`arc-backend/src/notifications/`

| File | Role |
| --- | --- |
| `entities/notification.entity.ts` | Inbox rows |
| `entities/notification-preference.entity.ts` | Toggle row |
| `notifications.service.ts` | Prefs + inbox + create |
| `notifications.controller.ts` | HTTP |
| `notifications.constants.ts` | Type→category + preference gates |
