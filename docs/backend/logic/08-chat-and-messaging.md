# 08 — Chat & Messaging

**Version:** 1.1
**Stack:** NestJS + TypeORM + PostgreSQL + WebSocket (socket.io) + Redis (presence/pubsub)
**Consumers:** Arc Next.js PWA (`arc-app`)
**Depends on:** [00](./00-system-integration.md), auth/users module, social presence, [gamification](./gamification.md) (presence hooks)
**Feeds:** notifications, homepage header (unread badge)

Real-time chat inside Arc — direct messages and group conversations. Product UI follows a clean inbox + thread pattern (Mengobrol-style layout) painted in **Arc tokens** (navy text, lavender surfaces, gold `#FFC928` / `arc-gold` accents, purple focus). This doc covers the MVP surface: text messaging, groups, presence, replies, and the safety layer.

**Core principle:** the message list is user-generated data. The server is the single authority for identity, membership, delivery state, and moderation. The client is never trusted for who sent a message, who is in a conversation, or whether a message was read.

---

## 0. Overview

```
Homepage header ──[chat button + unread badge]──► /chat
                                                    │
                          ┌─────────────────────────┴─────────────────────────┐
                          │                                                     │
                    Conversation list                                    Conversation view
                    (REST: paginated)                                    (REST history + WS live)
                          │                                                     │
                          ▼                                                     ▼
                 GET /chat/conversations                          WS: join room, send, receive
                 (last message, unread count)                     REST: GET /messages (history)
                                                                          │
                                        ┌─────────────────────────────────┤
                                        ▼                                  ▼
                                  Message lifecycle                  Presence & typing
                                  sent → delivered → read            (Redis, ephemeral)
                                        │
                                        ▼
                                  Safety layer
                                  (block · report · rate-limit · moderate)
```

Two transports work together:
- **REST** for durable operations: list conversations, fetch message history (paginated), create conversations, block/report. Survives reconnects and cold loads.
- **WebSocket** for live delivery: new messages, typing, presence, read receipts. Ephemeral; REST is the source of truth on reconnect.

---

## 1. Entry point — homepage header button

The chat entry point is a button in the homepage header, left of the profile avatar.

**Contract:**
- Icon button with an unread-count badge (red dot with number, capped display "9+").
- Unread count = sum of `unread_count` across all the user's conversations, from `GET /chat/summary`.
- Tapping routes to `/chat` (the conversation list).
- The badge updates live: the WebSocket `unread.changed` event pushes a new total without a refetch.
- When the socket is disconnected, the badge shows the last-known count and reconciles on reconnect via `GET /chat/summary`.

```json
// GET /chat/summary  → header badge
{ "unreadTotal": 4, "conversationsWithUnread": 2 }
```

The button is always visible once the user is authenticated; it is not gated behind roadmap state (unlike Home/Learn routes in doc 03 §2).

---

## 2. Architecture

```
arc-app ──REST──► ChatController ──► ChatService ──► Postgres (durable)
        │
        └─WS────► ChatGateway ──► ChatService
                       │
                       └──► Redis: presence keys, typing keys, pub/sub fan-out
```

- **`ChatGateway`** (NestJS `@WebSocketGateway`) authenticates the socket on connect using the same JWT as REST; `userId` is derived server-side from the token and never read from the socket payload.
- **Rooms**: one socket room per `conversationId`. A socket joins rooms for the conversations it is an active member of, verified against `conversation_members` on join.
- **Redis pub/sub** fans out messages across multiple server instances so a message sent on instance A reaches a socket connected to instance B.
- **Presence and typing** live only in Redis with TTLs — never persisted to Postgres.

Horizontal scale: sockets are sticky-session or use the Redis socket.io adapter; message durability never depends on which instance received the send.

---

## 3. Schema

### 3.1 `conversations`

| Column         | Type                 | Notes                                        |
| -------------- | -------------------- | -------------------------------------------- |
| `id`           | uuid PK              |                                              |
| `type`         | varchar              | `direct` \| `group`                          |
| `title`        | varchar nullable     | Group only; direct derives title from members |
| `avatar_url`   | varchar nullable     | Group only                                   |
| `created_by`   | uuid FK              |                                              |
| `last_message_at` | timestamptz nullable | Denormalized for list sort                |
| `created_at` / `updated_at` | timestamptz |                                     |

For `direct` conversations, a unique constraint on the sorted member pair prevents duplicate DMs between the same two users.

### 3.2 `conversation_members`

| Column         | Type                 | Notes                                             |
| -------------- | -------------------- | ------------------------------------------------- |
| `id`           | uuid PK              |                                                   |
| `conversation_id` | uuid FK           |                                                   |
| `user_id`      | uuid FK              |                                                   |
| `role`         | varchar              | `member` \| `admin` (group management)            |
| `joined_at`    | timestamptz          |                                                   |
| `last_read_message_id` | uuid nullable | Drives unread count + read receipts             |
| `muted`        | boolean default false | Suppresses notifications, not delivery           |
| `left_at`      | timestamptz nullable | Soft-leave; preserves history reference           |

Unique `(conversation_id, user_id)`.

### 3.3 `messages`

| Column          | Type                 | Notes                                            |
| --------------- | -------------------- | ------------------------------------------------ |
| `id`            | uuid PK              |                                                  |
| `conversation_id` | uuid FK            |                                                  |
| `sender_id`     | uuid FK              | Server-set from socket/JWT, never client         |
| `client_msg_id` | uuid                 | Client-generated idempotency key                 |
| `type`          | varchar              | `text` \| `image` \| `file` \| `system`          |
| `body`          | text nullable        | Sanitized before store                           |
| `attachment_id` | uuid FK nullable     | → `chat_attachments`                             |
| `reply_to_id`   | uuid FK nullable     | Threaded reply reference                         |
| `edited_at`     | timestamptz nullable |                                                  |
| `deleted_at`    | timestamptz nullable | Soft delete; body cleared, tombstone kept        |
| `created_at`    | timestamptz          |                                                  |

Unique `(conversation_id, sender_id, client_msg_id)` — makes send idempotent under retries.

### 3.4 `chat_attachments`

| Column        | Type    | Notes                                       |
| ------------- | ------- | ------------------------------------------- |
| `id`          | uuid PK |                                             |
| `uploader_id` | uuid FK |                                             |
| `object_key`  | varchar | Immutable object-storage key                |
| `mime_type`   | varchar | Validated against allow-list                |
| `size_bytes`  | int     | Enforced max                                |
| `scan_status` | varchar | `pending` \| `clean` \| `blocked`           |
| `created_at`  | timestamptz |                                         |

Attachments are delivered only after `scan_status = clean` (§9).

### 3.5 `chat_blocks`

| Column       | Type    | Notes                            |
| ------------ | ------- | -------------------------------- |
| `id`         | uuid PK |                                  |
| `blocker_id` | uuid FK |                                  |
| `blocked_id` | uuid FK |                                  |
| `created_at` | timestamptz |                              |

Unique `(blocker_id, blocked_id)`.

### 3.6 `chat_reports`

| Column         | Type    | Notes                                              |
| -------------- | ------- | -------------------------------------------------- |
| `id`           | uuid PK |                                                    |
| `reporter_id`  | uuid FK |                                                    |
| `message_id`   | uuid FK nullable | Reported message (if message-level)       |
| `reported_user_id` | uuid FK |                                              |
| `reason`       | varchar | `spam` \| `harassment` \| `inappropriate` \| `safety` \| `other` |
| `detail`       | text nullable |                                              |
| `status`       | varchar | `open` \| `reviewing` \| `actioned` \| `dismissed` |
| `created_at`   | timestamptz |                                                |

Append-only from the user's side; status is moderator-updated.

---

## 4. Real-time gateway (WebSocket)

**Connection:** client connects with the JWT in the handshake auth. On connect, the gateway resolves `userId`, marks presence `online` in Redis, and joins the socket to rooms for every conversation the user is an active member of.

### Client → server events

| Event | Payload | Effect |
| --- | --- | --- |
| `message.send` | `{ conversationId, clientMsgId, type, body?, attachmentId?, replyToId? }` | Persist + fan out (§6) |
| `message.read` | `{ conversationId, lastReadMessageId }` | Advance `last_read_message_id`, emit receipts |
| `typing.start` / `typing.stop` | `{ conversationId }` | Set/clear Redis typing key (TTL 5s) |

### Server → client events

| Event | Payload |
| --- | --- |
| `message.new` | full message object |
| `message.delivered` | `{ messageId, conversationId, userId }` |
| `message.read` | `{ conversationId, userId, lastReadMessageId }` |
| `typing` | `{ conversationId, userId, isTyping }` |
| `presence` | `{ userId, status, lastSeen }` |
| `unread.changed` | `{ unreadTotal }` (drives header badge) |

**Membership enforcement:** every inbound event validates that `userId` is an active member of `conversationId` server-side. A socket cannot send to or read a conversation it is not a member of, regardless of payload.

---

## 5. REST APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/chat/summary` | Header badge: unread total |
| `GET` | `/chat/conversations` | Paginated list; last message + unread + peer online |
| `POST` | `/chat/conversations` | Create **direct** (`peerUserId`) or **group** (`title` + `memberIds`) |
| `GET` | `/chat/conversations/:id` | Single conversation (list item shape) |
| `GET` | `/chat/conversations/:id/presence` | Online status for other members (privacy-gated) |
| `GET` | `/chat/conversations/:id/messages` | Paginated history (cursor-based, before/after) |
| `POST` | `/chat/conversations/:id/messages` | Send (REST fallback; supports `replyToId`) |
| `POST` | `/chat/conversations/:id/attachments` | Multipart image/file upload |
| `GET` | `/chat/attachments/:id` | Auth'd attachment binary |
| `PATCH` | `/chat/messages/:id` | Edit own message |
| `DELETE` | `/chat/messages/:id` | Soft-delete own message |
| `POST` | `/chat/conversations/:id/read` | Mark read up to a message |
| `POST` | `/chat/conversations/:id/members` | Add member (group admin only) |
| `DELETE` | `/chat/conversations/:id/members/:userId` | Remove/leave |
| `POST` | `/chat/blocks` | Block a user (wraps social blocks) |
| `DELETE` | `/chat/blocks/:userId` | Unblock |
| `POST` | `/chat/reports` | Report a message or user |

History pagination is cursor-based on `(created_at, id)` — never offset — so it stays stable as new messages arrive.

**Group create:** `POST /chat/conversations` with `{ type: "group", title, memberIds[] }`. Creator becomes `admin`. Every invitee must pass `canMessage` with the creator. Groups show sender name in list previews (`Bima : …`).

**Who can start a conversation (§9):** DMs gated by relationship policy (friends / shared study|battle). Groups: creator may invite any users they are allowed to message.

---

## 6. Message lifecycle

```
Client                     Server                        Recipients
  │  message.send            │                               │
  │  (clientMsgId)           │                               │
  ├─────────────────────────►│                               │
  │                          │ 1. verify membership          │
  │                          │ 2. check block (§9)           │
  │                          │ 3. rate-limit (§9)            │
  │                          │ 4. sanitize body              │
  │                          │ 5. moderation hook (§9)       │
  │                          │ 6. persist (idempotent)       │
  │  message.new (echo)      │                               │
  │◄─────────────────────────┤──────────────────────────────►│ message.new
  │                          │                               │
  │                          │◄──── ack (delivered) ─────────┤
  │  message.delivered       │                               │
  │◄─────────────────────────┤                               │
  │                          │◄──── message.read ────────────┤ (when opened)
  │  message.read            │                               │
  │◄─────────────────────────┤                               │
```

**Delivery states:** `sent` (persisted) → `delivered` (reached at least one recipient socket) → `read` (recipient advanced `last_read_message_id` past it).

**Idempotency:** the `(conversationId, senderId, clientMsgId)` unique constraint means a resend after a flaky connection returns the existing message rather than creating a duplicate. The client generates `clientMsgId` before the first attempt.

**Optimistic UI:** the client renders the message immediately with a pending state keyed by `clientMsgId`, then reconciles when the `message.new` echo returns the server id.

---

## 7. Presence & typing

- **Presence** syncs with social heartbeat (`presence:user:{id}`, TTL ~120s) plus chat socket connect/heartbeat. Chat gateway calls social presence on connect so inbox + friends share one online signal.
- Conversation list includes `peerOnline` for DMs. Thread header shows **Online** / **Offline** (or `N online` for groups) via `GET /chat/conversations/:id/presence`.
- Active-friends strip on `/chat` uses `GET /social/friends?online=true` (horizontal avatars with green online dots).
- **Typing** is Redis `typing:{conversationId}:{userId}` TTL 5s. `typing.start` / `typing.stop`; self-expires on drop.
- **Privacy:** `presence_visibility` (`everyone` \| `contacts` \| `nobody`); minors default `nobody`. `canSeePresence` gates all online displays.

## 7b. Client UI contract (Arc × Mengobrol)

**Inbox (`/chat`)** — light surface (`#fff` / lavender tint), not the night-hero pattern:
- Title **Messages** + search affordance
- Horizontal **Active** row (online friends; tap → open/create DM)
- **Chats** section header
- Rows: circular avatar (+ green online dot), name, preview (group: `Sender : body`), time, yellow unread pill, gray/gold double-check when last message is mine (sent/seen)
- Bottom capsule **New Chat** (opens DM/group composer); Home/Profile shortcuts optional

**Thread (`/chat/:id`)**:
- Light header: back, avatar, name, Online/Offline subtitle; call icons may render disabled (voice/video out of scope)
- Date chips; received = light gray bubbles; sent = **gold** bubbles (`arc-gold` / `#FFC928`) with dark text
- Reply quote block inside bubble (accent bar + name + snippet); long-press/swipe → set `replyToId`
- Status under last own message: Sending → Delivered → Seen
- Typing dots bubble; composer: `+` attach, pill input, send (mic reserved / stub)

Colors: navy text `#0f1220` / `#1a1530`, muted `#8a82a8`, gold accent unread + sent bubbles + seen checks, purple focus rings.

---

## 8. Media & attachments

- Upload flow: client requests a signed upload URL → uploads directly to object storage → posts the `attachmentId` with the message.
- Allow-list MIME types (images, common docs); reject executables and archives by default.
- Enforce a max size in code before issuing the signed URL.
- Every attachment is virus/malware scanned; `scan_status` starts `pending` and the attachment is not delivered to recipients until `clean`. A `blocked` result removes the message and notifies the sender.
- Never place user identifiers or tokens in object keys or URLs; use opaque keys and signed, expiring URLs.

---

## 9. Safety & moderation

This section is required for launch, not optional. A messaging feature reaches real people, some of whom may be minors.

**Blocking.** A user can block another. When A blocks B: B cannot start a new conversation with A, B's messages to shared conversations are hidden from A, and neither sees the other's presence. Blocks are enforced server-side on every send.

**Reporting.** Any message or user can be reported with a reason. Reports create `chat_reports` rows for moderator review. A `safety` reason is prioritized in the review queue.

**Who can message whom.** Direct messages are gated by a relationship policy rather than open to all users:
- default: DMs allowed only between users who share a context (same cohort, study group, or battle) or who have mutually connected;
- unsolicited DMs from strangers are off by default;
- accounts flagged as **minors** get the strictest policy — messaging limited to approved contexts, presence defaulted to `nobody`, and stranger DM fully disabled.

**Content moderation.** Inbound message bodies pass a moderation hook before fan-out. Bodies are HTML-sanitized (no active content). A configurable classifier flags disallowed content; flagged messages can be held, dropped, or routed to review depending on severity. The hook is server-side and cannot be bypassed by the client.

**Rate limiting.** Per-user send limits (messages per minute, new-conversation creations per hour) protect against spam and abuse. Exceeding a limit returns `CHAT_RATE_LIMITED` and does not persist the message.

**Data handling.** Deleted messages are soft-deleted with the body cleared but a tombstone kept for moderation history. Reported content is retained for review even if the sender deletes it.

---

## 10. Notifications integration

- A new message to a conversation the recipient is not currently viewing triggers a push/in-app notification, unless the member has `muted` that conversation.
- Notifications respect quiet hours and per-user preferences (owned by the notifications module, not here).
- The header badge (`unread.changed`) and notifications are independent: the badge always reflects true unread count even when notifications are muted.

---

## 11. Events

| Event | When |
| --- | --- |
| `chat.message_sent.v1` | Message persisted (analytics; no body in payload) |
| `chat.conversation_created.v1` | New conversation |
| `chat.user_blocked.v1` | Block created |
| `chat.report_filed.v1` | Report created (routes to moderation) |
| `chat.attachment_blocked.v1` | Scan returned `blocked` |

Analytics events carry ids and metadata only — never message bodies. Event emission is fire-and-forget and never blocks message delivery.

---

## 12. Guardrails

- `senderId` and membership are always derived server-side from the authenticated socket/JWT — never from the message payload.
- A socket cannot join, read, or send to a conversation it is not an active member of.
- Message bodies are sanitized and moderation-checked before fan-out; the client cannot bypass this.
- Blocks and the relationship policy are enforced on every send, not just at conversation creation.
- Minors get the strictest messaging and presence defaults; stranger DM is disabled for them.
- Attachments are never delivered before a clean scan result.
- No message content in analytics events or logs.
- Rate limits are enforced server-side.

---

## 13. Error codes

| Code | When |
| --- | --- |
| `CHAT_NOT_A_MEMBER` | Send/read/join a conversation the user is not in |
| `CHAT_BLOCKED` | Send to a user who has blocked the sender (or vice-versa) |
| `CHAT_DM_NOT_ALLOWED` | Relationship policy forbids starting this DM |
| `CHAT_RATE_LIMITED` | Send/create rate limit exceeded |
| `CHAT_MESSAGE_TOO_LARGE` | Body or attachment exceeds max |
| `CHAT_ATTACHMENT_REJECTED` | MIME not allowed or scan blocked |
| `CHAT_CONVERSATION_NOT_FOUND` | Unknown conversation id |
| `CHAT_NOT_MESSAGE_OWNER` | Edit/delete a message the user did not send |
| `CHAT_ADMIN_REQUIRED` | Group member management without admin role |

---

## 14. Acceptance criteria

- [ ] Homepage header shows a chat button with a live unread badge from `GET /chat/summary`
- [ ] Badge updates live via `unread.changed` and reconciles on reconnect
- [ ] Socket authenticates with JWT; `userId` is derived server-side, never from payload
- [ ] A socket only joins rooms for conversations it is an active member of
- [ ] `message.send` verifies membership, block, and rate limit before persisting
- [ ] Sending is idempotent under retries via `(conversationId, senderId, clientMsgId)`
- [ ] Message history is cursor-paginated and stable as new messages arrive
- [ ] Delivery states progress `sent → delivered → read`; read receipts update `last_read_message_id`
- [ ] Typing and presence live only in Redis with TTLs; a dropped connection never leaves stuck state
- [ ] Direct-message duplicates between the same two users are prevented
- [ ] Users can create a **group** with title + member multi-select; creator is admin
- [ ] Inbox/thread show **online** status (privacy-gated) with green avatar dots / Online label
- [ ] Replies (`replyToId`) render quote UI in bubbles; list shows group sender prefix
- [ ] Blocking hides messages/presence both ways and is enforced on every send
- [ ] Reporting creates a review row; `safety` reports are prioritized
- [ ] Minor accounts default to the strictest messaging + presence policy; stranger DM disabled
- [ ] Message bodies are sanitized and moderation-checked before fan-out
- [ ] Attachments are scanned and not delivered until `clean`
- [ ] Analytics events and logs never contain message bodies
- [ ] REST send works as a fallback when the socket is down, with the same idempotency
- [ ] Multi-instance delivery works via the Redis adapter (message on instance A reaches a socket on B)
- [ ] Chat UI matches §7b (Mengobrol layout + Arc colors)

---

## 15. Out of scope (later)

- Voice / video calls
- Public channels / broadcast lists
- Bots and slash-command integrations
- End-to-end encryption
- Message reactions and read-by-everyone lists for large groups
- Disappearing / self-destructing messages
- Message search across all conversations
- Cross-device message sync history beyond server-stored history
