# 01 — User Model & Authentication

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arc Next.js PWA (`arc-app`)  
**Product source:** `src/doc/Arc_MVP_Full_Technical_Roadmap.md` § Authentication, § Database Schema (`users`, `profiles`)

This doc is what frontend needs from backend for account creation, login, session, password recovery, OAuth, and the core user/profile records.

---

## 1. Goal

Ship secure auth so the web app can:

1. Sign up with email/password
2. Log in / log out
3. Persist session across refreshes
4. Verify email
5. Reset forgotten password (email → OTP → new password)
6. Sign in with Apple / Google
7. Load a minimal authenticated user + profile payload after login

---

## 2. Modules (NestJS)

Suggested layout:

```
auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  strategies/          # JWT, Google, Apple
  guards/
  dto/
users/
  users.module.ts
  users.service.ts
  entities/user.entity.ts
profiles/
  profiles.module.ts
  profiles.service.ts
  entities/profile.entity.ts
```

Create `Profile` row in same transaction as `User` on successful register / first OAuth login.

---

## 3. Data model (TypeORM)

### 3.1 `users`

Auth identity. Passwords never leave API hashed.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `uuid_generate_v4()` / TypeORM `@PrimaryGeneratedColumn('uuid')` |
| `email` | `varchar` unique, not null | Store lowercased |
| `password_hash` | `varchar` nullable | Null when user is OAuth-only |
| `email_verified_at` | `timestamptz` nullable | Null until verified |
| `auth_provider` | `enum` | `email` \| `google` \| `apple` \| `email_google` \| … (or use link table — see §3.3) |
| `is_active` | `boolean` default true | Soft lock / ban |
| `last_login_at` | `timestamptz` nullable | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` nullable | Soft delete optional for MVP |

**Password rules (align with frontend `reset-password` / register):**

- Min 8 characters
- At least one digit
- At least one special character (`[^A-Za-z0-9]`)
- Hash with **bcrypt** or **argon2** (prefer argon2id). Never store plaintext.

Register UI currently only enforces min 8; **backend must enforce the stronger reset rules** on register + reset for consistency.

### 3.2 `profiles`

App-facing identity. One-to-one with `users`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` unique FK → `users.id` | Cascade delete |
| `display_name` | `varchar` nullable | Shown as “username” in Identity UI |
| `username` | `varchar` unique nullable | Optional handle; if used, validate uniqueness |
| `avatar_url` | `varchar` nullable | Cosmetics / Avatar Studio later |
| `timezone` | `varchar` nullable | IANA, e.g. `Asia/Tehran` |
| `language` | `varchar` default `en` | |
| `current_role` | `varchar` nullable | Onboarding “where you are” |
| `target_role` | `varchar` nullable | Onboarding “where you go” |
| `years_experience` | `int` nullable | From onboarding form |
| `current_rank` | `varchar` nullable | Gamification later |
| `total_xp` | `int` default 0 | **Server-owned** |
| `coins` | `int` default 0 | **Server-owned** |
| `gems` | `int` default 0 | **Server-owned** |
| `weekly_streak` | `int` default 0 | **Server-owned** |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

MVP note: XP/coins/gems/streak columns can exist now with defaults; mutation APIs come in later reward docs. Auth must not accept client-supplied balances.

### 3.3 `auth_identities` (recommended for OAuth)

Supports linking Google/Apple to same account.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | |
| `provider` | `enum` | `google` \| `apple` |
| `provider_user_id` | `varchar` | Sub from IdP |
| `email` | `varchar` nullable | Snapshot from IdP |
| `created_at` | `timestamptz` | |
| Unique | `(provider, provider_user_id)` | |

### 3.4 `email_verification_tokens` / `password_reset_tokens`

Either dedicated tables or one `auth_challenges` table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `purpose` | `enum` | `email_verify` \| `password_reset` |
| `code_hash` | `varchar` | Store **hash** of OTP, not plaintext |
| `expires_at` | `timestamptz` | Short TTL (e.g. 10–15 min) |
| `consumed_at` | `timestamptz` nullable | One-time use |
| `attempt_count` | `int` default 0 | Lock after N fails |
| `created_at` | `timestamptz` | |

Frontend OTP flow: forgot-password → email → OTP screen → reset-password. Prefer **6-digit numeric OTP** emailed to user (matches `OtpScreen`).

### 3.5 `refresh_tokens` (if rotating refresh)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `token_hash` | `varchar` | |
| `expires_at` | `timestamptz` | |
| `revoked_at` | `timestamptz` nullable | Logout / rotation |
| `user_agent` | `varchar` nullable | Optional |
| `ip` | `varchar` nullable | Optional |
| `created_at` | `timestamptz` | |

---

## 4. Session / token strategy

**Required:** secure session management.

Recommended MVP:

| Token | Lifetime | Storage (web) | Use |
| --- | --- | --- | --- |
| Access JWT | 15–60 min | Memory or short-lived cookie | `Authorization: Bearer` on API |
| Refresh token | 7–30 days | httpOnly Secure SameSite cookie **or** returned once + stored securely | Rotate on refresh |

JWT claims (minimum):

```json
{
  "sub": "<user_uuid>",
  "email": "user@example.com",
  "email_verified": true
}
```

Do **not** put XP/coins/roles that change often in long-lived JWT without revalidation.

Guards:

- `JwtAuthGuard` on protected routes
- Optional `EmailVerifiedGuard` for post-onboarding product routes (signup may allow limited access until verified — product choice; document in API responses)

Logout:

- Revoke refresh token(s)
- Client discards access token

---

## 5. API contracts frontend needs

Base path suggestion: `/api/v1/auth` and `/api/v1/me`.

All JSON. Errors use stable `code` + human `message`.

### 5.1 Error shape

```json
{
  "statusCode": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect"
}
```

Auth error codes (minimum):

| Code | When |
| --- | --- |
| `VALIDATION_ERROR` | Bad body |
| `EMAIL_TAKEN` | Register |
| `INVALID_CREDENTIALS` | Login |
| `EMAIL_NOT_VERIFIED` | If policy blocks unverified login |
| `ACCOUNT_DISABLED` | Soft-locked user |
| `INVALID_OR_EXPIRED_TOKEN` | Refresh / OTP / reset |
| `OTP_INVALID` | Wrong OTP |
| `OTP_EXPIRED` | Expired OTP |
| `OTP_RATE_LIMITED` | Too many sends/attempts |
| `PASSWORD_TOO_WEAK` | Register / reset |
| `OAUTH_FAILED` | Apple/Google failure |
| `OAUTH_EMAIL_CONFLICT` | IdP email already tied to other account |

### 5.2 `POST /auth/register`

**Body** (align with `src/schemas/register.ts`):

```json
{
  "email": "soheil@arc.app",
  "password": "Secret1!",
  "agreeToTerms": true
}
```

**Server:**

1. Validate email + password strength + `agreeToTerms === true`
2. Reject if email exists → `EMAIL_TAKEN`
3. Hash password, create `User` + empty `Profile` (transaction)
4. Send verification email (OTP or link)
5. Return tokens **or** require verify-before-login (pick one; frontend currently goes to check-email style flows — prefer return user + session only after verify **or** return session with `emailVerified: false`)

**Response `201`:**

```json
{
  "user": {
    "id": "uuid",
    "email": "soheil@arc.app",
    "emailVerified": false
  },
  "profile": {
    "id": "uuid",
    "displayName": null,
    "username": null,
    "avatarUrl": null,
    "timezone": null,
    "language": "en",
    "currentRole": null,
    "targetRole": null,
    "yearsExperience": null
  },
  "accessToken": "...",
  "expiresIn": 3600
}
```

(`refreshToken` via Set-Cookie preferred.)

### 5.3 `POST /auth/login`

**Body** (`src/schemas/login.ts`):

```json
{
  "email": "soheil@arc.app",
  "password": "Secret1!"
}
```

**Response `200`:** same shape as register (with `emailVerified`, profile).

Failed login → `401 INVALID_CREDENTIALS` (do not reveal which field failed).

### 5.4 `POST /auth/logout`

Auth required. Revoke refresh. `204` or `{ "ok": true }`.

### 5.5 `POST /auth/refresh`

Uses refresh cookie/body. Returns new access token (+ rotated refresh).

### 5.6 `GET /me` (or `/users/me`)

Auth required. Current user + profile for app bootstrap (home, settings, identity).

```json
{
  "user": {
    "id": "uuid",
    "email": "soheil@arc.app",
    "emailVerified": true,
    "createdAt": "ISO-8601"
  },
  "profile": {
    "id": "uuid",
    "displayName": "Soheil",
    "username": "soheil",
    "avatarUrl": null,
    "timezone": "Asia/Tehran",
    "language": "en",
    "currentRole": "Office worker",
    "targetRole": "Data Analyst",
    "yearsExperience": 3,
    "totalXp": 1250,
    "coins": 2450,
    "gems": 350,
    "weeklyStreak": 7
  }
}
```

Frontend uses this to replace mock profile/settings email + identity username.

### 5.7 Email verification

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| Send / resend | `POST /auth/verify-email/request` | `{ "email": "..." }` | Rate limit; always return generic success |
| Confirm OTP | `POST /auth/verify-email/confirm` | `{ "email": "...", "otp": "123456" }` | Sets `email_verified_at` |

### 5.8 Forgot / reset password (matches UI flow)

| Step | Path | Body | Frontend screen |
| --- | --- | --- | --- |
| 1 Request | `POST /auth/forgot-password` | `{ "email" }` | Forgot password |
| 2 Verify OTP | `POST /auth/forgot-password/verify-otp` | `{ "email", "otp" }` | OTP screen → returns short-lived `resetToken` |
| 3 Reset | `POST /auth/reset-password` | `{ "resetToken", "password", "confirmPassword" }` | Reset password |

Rules:

- Always respond success on step 1 even if email unknown (anti-enumeration)
- OTP hashed at rest; expire quickly; limit attempts
- Step 3 enforces password strength; invalidate all refresh tokens after reset
- Optional: allow `{ "email", "otp", "password" }` in one call — but two-step matches current UI better

### 5.9 OAuth — Google & Apple

Product requires both for MVP.

| Path | Purpose |
| --- | --- |
| `GET /auth/google` or `POST /auth/google` | Start / exchange Google ID token |
| `GET /auth/apple` or `POST /auth/apple` | Start / exchange Apple identity token |

**Web-friendly approach:** client obtains IdP ID token (Google One Tap / Apple JS) → `POST` token to backend → backend verifies with Google/Apple → upsert user + identity → issue Arc tokens.

**Response:** same as login.

Linking rules:

- Same verified email from Google/Apple → attach to existing user when safe
- Conflict with different password account → `OAUTH_EMAIL_CONFLICT` with guidance

---

## 6. Profile fields frontend will write soon (auth-adjacent)

Not full Profile feature doc, but register/onboarding needs these mutations after auth:

### 6.1 `PATCH /me/profile`

Auth required.

```json
{
  "displayName": "Soheil",
  "username": "soheil",
  "timezone": "Asia/Tehran",
  "language": "en",
  "currentRole": "Office worker",
  "targetRole": "Data Analyst",
  "yearsExperience": 3
}
```

Used by:

- Onboarding form (`currentRole`, `targetRole`, `yearsExperience`) — `src/schemas/onboarding.ts`
- Identity screen username edit — `IdentityScreen`

Reject client attempts to set `totalXp`, `coins`, `gems`, `weeklyStreak`.

---

## 7. What frontend screens map to

| UI | Route (app) | Backend needed |
| --- | --- | --- |
| Welcome | `/` / welcome | Public |
| Register | `/register` | `POST /auth/register` |
| Login | `/login` | `POST /auth/login` |
| Check email / OTP | OTP flows | verify-email or forgot OTP |
| Forgot password | `/forgot-password` | `POST /auth/forgot-password` |
| OTP | OTP screen | verify OTP |
| Reset password | `/reset-password` | `POST /auth/reset-password` |
| Onboarding roles | onboarding | `PATCH /me/profile` |
| Settings email display | `/settings` | `GET /me` |
| Identity username | identity | `GET/PATCH /me/profile` |
| App bootstrap | any protected | `GET /me` + refresh |

Today these screens log to console / use mocks — they are waiting on this API.

---

## 8. Security requirements

- HTTPS only in production
- Rate limit: login, register, forgot-password, OTP verify (per IP + per email)
- Constant-time password compare
- CORS allow Arc web origin only
- Helmet / secure headers
- No password in logs
- Refresh rotation + reuse detection (optional but preferred)
- Soft delete / disable must block new tokens
- Email normalization: trim + lowercase before unique check

---

## 9. NestJS implementation checklist

- [ ] TypeORM entities: `User`, `Profile`, `AuthIdentity`, token tables
- [ ] Migrations (no `synchronize: true` in prod)
- [ ] `AuthModule` with register / login / logout / refresh
- [ ] Password hashing service
- [ ] JWT access + refresh strategy
- [ ] Email provider (SendGrid / SES / Resend) for OTP
- [ ] Google token verify
- [ ] Apple token verify (incl. private key / team id / client id config)
- [ ] Global validation pipe
- [ ] Auth e2e tests: register → verify → login → me → logout; forgot → otp → reset → login
- [ ] OpenAPI (`@nestjs/swagger`) for frontend handoff

---

## 10. Env vars backend needs

```bash
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_TTL=30d
COOKIE_DOMAIN=
CORS_ORIGIN=https://app.arc.example
GOOGLE_CLIENT_ID=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
EMAIL_FROM=
EMAIL_PROVIDER_API_KEY=
```

---

## 11. Out of scope (later docs)

- Avatar Studio inventory / cosmetics persistence
- Friends, battles, referrals
- Subscription / IAP restore
- Push notification device tokens (settings toggles only need prefs later)
- Reward grant endpoints

---

## 12. Acceptance criteria (MVP)

From product + this contract:

- [ ] User can sign up with email/password
- [ ] User can log in and log out
- [ ] Session persists (refresh works after reload)
- [ ] Failed login returns safe error (no user enumeration)
- [ ] Email verification works
- [ ] Forgot password → OTP → reset works
- [ ] Google login works
- [ ] Apple login works
- [ ] `GET /me` returns user + profile frontend can render
- [ ] Profile row always exists for every user
- [ ] Password hashes never exposed in API responses
