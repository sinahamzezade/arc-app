# 18 — Voice & Video Calls

**Version:** 1.0
**Stack:** NestJS + WebSocket signaling (reuses doc 17 gateway) + WebRTC (browser) + self-hosted coturn (STUN/TURN)
**Consumers:** Arc Next.js PWA (`arc-app`)
**Depends on:** [00](../integration/00-system-integration.md), [17](../chat/17-chat-and-messaging.md) (conversation membership, signaling transport, safety layer)
**Feeds:** [17](../chat/17-chat-and-messaging.md) (call events as chat system messages), notifications

1:1 voice and video calling inside Arlo, launched from the chat header (the video/phone icons already in the conversation view). Calls are **peer-to-peer WebRTC** — media flows directly between the two browsers; the server only brokers the handshake and relays media when a direct path is impossible.

**MVP scope (locked):** 1:1 only · voice + video · self-hosted STUN/TURN. **Not in MVP:** group calls (would need an SFU), screen share, recording, PSTN.

**Core principle:** the server never sees call media. It authorizes who may call whom, relays signaling messages, and issues short-lived TURN credentials. Media is peer-to-peer (or TURN-relayed) and encrypted end-to-end by WebRTC (DTLS-SRTP) by default.

---

## 0. Overview

```
Caller                     Signaling (doc 17 WS)                    Callee
  │  call.invite ─────────────────►│                                  │
  │  (conversationId)              │ 1. verify membership (doc 17)    │
  │                                │ 2. check block / policy (doc 17) │
  │                                │ 3. create call row (ringing)     │
  │                                │────────── call.incoming ────────►│
  │                                │                                  │
  │                                │◄───────── call.accept ───────────┤
  │◄──────── call.accepted ────────┤                                  │
  │                                │                                  │
  │═══════ WebRTC handshake (SDP offer/answer + ICE) via signaling ══│
  │                                │                                  │
  │◄════════════ P2P media (DTLS-SRTP), or TURN relay ══════════════►│
  │                                │                                  │
  │  call.hangup ─────────────────►│────────── call.ended ───────────►│
  │                                │ 4. write duration, system message│
```

- **Signaling** = the doc 17 WebSocket gateway carries call setup messages (invite, accept, SDP, ICE candidates, hangup). No new socket infrastructure.
- **Media** = WebRTC `RTCPeerConnection` between the two browsers. Direct P2P when possible; TURN-relayed when NAT/firewall blocks it.
- **STUN/TURN** = self-hosted `coturn`. STUN helps peers discover their public address; TURN relays media when direct connection fails (~10–20% of calls).

---

## 1. Entry point — call buttons

The conversation header (doc 17) exposes two buttons, already present in the UI: a phone icon (voice) and a video icon (video).

**Contract:**
- Both are enabled only for `direct` conversations in MVP (group calls out of scope). In group conversations they are hidden or disabled.
- Tapping starts a call in the corresponding mode (`audio` or `video`); the mode is upgradeable mid-call (voice → video) but starts as tapped.
- Buttons are disabled if a call between these users is already active, if either party has blocked the other (doc 17 §9), or if the relationship policy forbids contact.
- The caller sees a "ringing / calling…" state until the callee accepts, declines, or the invite times out (§4).

---

## 2. Architecture

```
arc-app (caller) ◄──WebRTC media (P2P or TURN)──► arc-app (callee)
      │                                                  │
      └───── WS signaling (doc 17 gateway) ──────────────┘
                        │
                CallGateway / CallService
                        │
        ┌───────────────┼───────────────────┐
        │               │                    │
   Postgres         coturn (STUN/TURN)   Redis (active-call presence)
   (call records)   self-hosted          short TTL keys
```

- **`CallGateway`** extends the doc 17 socket connection — no separate handshake. Call events validate conversation membership the same way message events do.
- **`CallService`** authorizes calls, creates/updates `calls` rows, issues TURN credentials, enforces one-active-call rules.
- **`coturn`** is deployed as a self-hosted service (its own host/container), reachable by clients over UDP/TCP/TLS. It is the only media-touching component, and even then it only relays opaque encrypted packets.
- **Redis** tracks active-call state (`in_call:{userId}`) so a second incoming call can be auto-rejected as busy.

---

## 3. Self-hosted STUN/TURN (coturn)

The one piece of real infrastructure this feature needs.

- **Deploy** `coturn` on a host with a public IP, ports open: `3478` (STUN/TURN UDP+TCP), `5349` (TURN over TLS), and a UDP relay port range (e.g. `49152–65535`).
- **STUN** is free and stateless — it just tells a peer its public address.
- **TURN** relays media and consumes bandwidth; it is used only when P2P fails. Budget for it: relayed calls use server egress for the full duration of the call.
- **Credentials must be short-lived.** Never ship static TURN username/password to the client. Use coturn's **time-limited credential** mechanism: the backend issues an HMAC credential derived from a shared secret, valid for a few minutes. See §5 `GET /calls/ice-servers`.
- **TLS** on `5349` lets TURN traverse restrictive corporate firewalls that only allow 443-like TLS traffic.

```
# coturn time-limited credential (issued by backend, not stored)
username = "{unixExpiry}:{userId}"
password = base64(hmac_sha1(sharedSecret, username))
ttl      = 300s
```

---

## 4. Call lifecycle & states

```
              call.invite
   (none) ───────────────► ringing ──── call.accept ────► connecting ──ICE ok──► active
                              │                               │                     │
                   timeout / call.decline              ICE fail (no relay)     call.hangup
                              │                               │                     │
                              ▼                               ▼                     ▼
                          ended(missed/declined)         ended(failed)         ended(completed)
```

**States:** `ringing` → `connecting` → `active` → `ended`. Terminal `ended` carries an `end_reason`: `completed | declined | missed | busy | failed | cancelled`.

- **Invite timeout:** if the callee does not accept within ~45s, the call auto-ends as `missed`.
- **Busy:** if the callee has an active call (Redis `in_call` key set), the invite is auto-declined as `busy`.
- **Cancelled:** caller hangs up before the callee accepts.
- **Failed:** WebRTC ICE negotiation cannot establish a path even via TURN (rare; surfaced to both users as "couldn't connect").
- **Reconnection:** a brief network drop attempts ICE restart before declaring `failed`; a longer drop ends the call.

Every terminal call writes a **system message** into the chat conversation (doc 17 `type: system`) — e.g. "Video call · 4:12" or "Missed call" — so call history lives inline with the chat.

---

## 5. Signaling events & APIs

### WebSocket signaling (via doc 17 gateway)

| Event | Direction | Payload |
| --- | --- | --- |
| `call.invite` | caller → server | `{ conversationId, mode: "audio"\|"video", callId (client-gen) }` |
| `call.incoming` | server → callee | `{ callId, conversationId, fromUserId, mode }` |
| `call.accept` | callee → server | `{ callId }` |
| `call.decline` | callee → server | `{ callId }` |
| `call.accepted` / `call.declined` | server → caller | `{ callId }` |
| `call.sdp` | peer → peer (relayed) | `{ callId, sdp, type: "offer"\|"answer" }` |
| `call.ice` | peer → peer (relayed) | `{ callId, candidate }` |
| `call.hangup` | either → server | `{ callId }` |
| `call.ended` | server → both | `{ callId, endReason, durationSec }` |
| `call.upgrade` | peer → peer (relayed) | `{ callId, mode: "video" }` (voice → video mid-call) |

The server relays `call.sdp`, `call.ice`, and `call.upgrade` between the two members without inspecting them. It authoritatively owns `call.invite/accept/decline/hangup/ended` (state + records).

### REST

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/calls/ice-servers` | Returns STUN URLs + short-lived TURN credentials (§3) |
| `GET` | `/calls/history` | Paginated past calls for the user (or read from chat system messages) |

`GET /calls/ice-servers` is called by the client right before starting/answering a call, so credentials are always fresh.

```json
// GET /calls/ice-servers
{
  "iceServers": [
    { "urls": "stun:turn.arc.app:3478" },
    {
      "urls": ["turn:turn.arc.app:3478", "turns:turn.arc.app:5349"],
      "username": "1737045000:user-uuid",
      "credential": "base64hmac...",
      "credentialType": "password"
    }
  ],
  "ttlSec": 300
}
```

---

## 6. Schema

### 6.1 `calls`

| Column            | Type                 | Notes                                                    |
| ----------------- | -------------------- | -------------------------------------------------------- |
| `id`              | uuid PK              | = client-generated `callId` (idempotent invites)         |
| `conversation_id` | uuid FK              | The direct conversation (doc 17)                         |
| `caller_id`       | uuid FK              | Server-set from socket/JWT                               |
| `callee_id`       | uuid FK              | Derived from conversation membership                     |
| `mode`            | varchar              | `audio` \| `video` (final mode after any upgrade)        |
| `state`           | varchar              | `ringing` \| `connecting` \| `active` \| `ended`         |
| `end_reason`      | varchar nullable     | `completed` \| `declined` \| `missed` \| `busy` \| `failed` \| `cancelled` |
| `used_turn`       | boolean default false | Whether media was TURN-relayed (cost/quality analytics)  |
| `started_at`      | timestamptz nullable | When it went `active`                                    |
| `ended_at`        | timestamptz nullable |                                                          |
| `duration_sec`    | int nullable         | `ended_at - started_at`, 0 for unanswered                |
| `created_at`      | timestamptz          | Invite time                                              |

No media, no SDP, no ICE candidates are ever persisted. Only call metadata.

---

## 7. Safety & privacy

Inherits the doc 17 safety layer — calls are not a bypass around it.

- **Blocking:** a blocked user cannot call, and their invite never rings the other side. Enforced server-side on `call.invite`.
- **Relationship policy:** the same "who can contact whom" gate as DMs (doc 17 §9) applies to calls. Stranger calls are off by default; minor accounts get the strictest policy and may have calling disabled entirely.
- **Consent to camera/mic:** the browser's native permission prompt gates media capture; the app requests only what the mode needs (mic for audio, mic+camera for video).
- **Media encryption:** WebRTC mandates DTLS-SRTP — media is encrypted in transit end-to-end, including through the TURN relay (the relay forwards opaque encrypted packets and cannot decrypt them).
- **No recording in MVP.** If recording is ever added, it requires explicit, visible consent from both parties and is out of scope here.
- **TURN credentials** are short-lived and per-user; a leaked credential expires in minutes and cannot be replayed after expiry.
- **Reporting:** a call can be reported after the fact (reuses doc 17 `chat_reports` with a `call` context); abusive calling patterns are rate-limited.

---

## 8. Rate limits & abuse

- Per-user cap on call invites per minute (prevents call-spam / ring harassment).
- Repeated declined/missed invites to the same non-responsive user back off (cooldown).
- A user already in an active call auto-rejects new invites as `busy`.
- coturn is configured with per-credential bandwidth quotas so a single abusive session cannot saturate relay egress.

---

## 9. Events

| Event | When |
| --- | --- |
| `call.started.v1` | Call reached `active` (metadata only: mode, callId) |
| `call.ended.v1` | Terminal state (`endReason`, `durationSec`, `usedTurn`) |
| `call.failed.v1` | ICE negotiation failed even via TURN (quality signal) |

Analytics carry metadata only — never media, SDP, or ICE data. `usedTurn` and `call.failed.v1` are the signals to watch for TURN capacity and NAT-traversal health.

---

## 10. Guardrails

- The server never receives, stores, or can decrypt call media. It brokers signaling and issues TURN credentials only.
- `callerId` / `calleeId` are derived server-side from authenticated membership — never from the client payload.
- Blocks and the relationship policy are enforced on `call.invite`, mirroring doc 17 §9.
- TURN credentials are always short-lived and HMAC-derived; static TURN secrets are never shipped to clients.
- Minor accounts follow the strictest calling policy; calling may be disabled for them entirely.
- SDP/ICE payloads are relayed opaquely and never persisted.
- One active call per user; concurrent invites are `busy`.

---

## 11. Error codes

| Code | When |
| --- | --- |
| `CALL_NOT_A_MEMBER` | Invite/accept on a conversation the user is not in |
| `CALL_BLOCKED` | Caller/callee block relationship exists |
| `CALL_NOT_ALLOWED` | Relationship policy forbids calling this user |
| `CALL_BUSY` | Callee already in an active call |
| `CALL_GROUP_UNSUPPORTED` | Call attempted in a group conversation (MVP is 1:1 only) |
| `CALL_RATE_LIMITED` | Too many invites in the window |
| `CALL_ICE_FAILED` | Could not establish media path even via TURN |
| `CALL_NOT_FOUND` | Unknown `callId` |

---

## 12. Acceptance criteria

- [ ] Phone/video buttons in the conversation header start an `audio`/`video` call; enabled only for direct conversations
- [ ] Group conversations return `CALL_GROUP_UNSUPPORTED` (MVP is 1:1)
- [ ] Signaling rides the existing doc 17 WebSocket gateway — no new socket handshake
- [ ] `callerId`/`calleeId` are server-derived from membership, never from payload
- [ ] Blocks and relationship policy are enforced on `call.invite`
- [ ] `GET /calls/ice-servers` returns STUN + short-lived HMAC TURN credentials (TTL minutes)
- [ ] No static TURN secret is ever sent to the client
- [ ] SDP/ICE are relayed opaquely and never persisted
- [ ] P2P connects directly when possible; TURN relay works when P2P fails (verify behind a symmetric NAT)
- [ ] Media is DTLS-SRTP encrypted end-to-end, including via the relay
- [ ] Call states progress `ringing → connecting → active → ended` with a correct `end_reason`
- [ ] Invite timeout (~45s) ends the call as `missed`; caller hangup before accept is `cancelled`
- [ ] A second incoming call while active is auto-`busy`
- [ ] Voice → video upgrade works mid-call
- [ ] Every terminal call writes a chat system message (duration or missed) into the conversation
- [ ] `calls` rows store metadata only — no media, SDP, or ICE
- [ ] Minor accounts follow the strictest calling policy
- [ ] Analytics events carry no media/SDP/ICE data; `usedTurn` and `call.failed.v1` are recorded

---

## 13. Out of scope (later)

- Group calls (requires an SFU media server — mediasoup / LiveKit / Janus)
- Screen sharing
- Call recording (requires explicit dual consent)
- PSTN / phone-number dialing
- Call transfer, hold, voicemail
- Background blur / virtual backgrounds
- Simulcast / bandwidth-adaptive layers (mostly an SFU concern)
