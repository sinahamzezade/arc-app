# Arc Backend — Integrated Implementation Specs

**Version:** 2.0  
**Frontend:** Next.js PWA (`arc-app`)  
**Backend:** NestJS + TypeORM + PostgreSQL

Docs live under `docs/backend/logic/<module>/`, matching `arc-backend/src/<module>/`.

Start with [00 — System Integration Contract](./integration/00-system-integration.md). It defines ownership, atomic transactions, events, time boundaries, and the full handoff between roadmap, scheduling, lessons, rewards, streaks, ranks, leagues, social systems, and notifications.

---

## Architecture

Arc uses four personalization engines plus cross-cutting product services.

| Engine / service | Owns | Main docs |
|---|---|---|
| Question Engine | Adaptive intake and goal tokens | [02](./questionnaire/02-questionnaire.md) |
| Content Pool / Skill Graph | Published reusable curriculum and question bank | [03](./roadmaps/03-goals-and-roadmap.md), [08](./content-pool/08-content-pool.md) |
| Roadmap Generator | Versioned personalized path instance | [03](./roadmaps/03-goals-and-roadmap.md), [22](./roadmaps/22-roadmap-engine.md) |
| AI Coach | Contextual help and safe replan requests | [03](./roadmaps/03-goals-and-roadmap.md) |
| Course Timing | Feasibility, future slots, dynamic ETA | [09](./course-timing/09-course-timing.md) |
| Weekly Plan | Current-week commitment projection and seal | [04](./weeks/04-weekly-plan-and-lessons.md) |
| Lesson Play | Content delivery, grading, progress, completion orchestration | [05](./lessons/05-learn-lesson-play-api.md) |
| Gamification | Wallet, ledger, rewards, store, unlock evaluation, streaks | [07](./gamification/07-gamification.md) |
| Ranking / Leagues | Permanent rank and weekly competition | [10](./ranks/10-ranking-system.md), [11](./leagues/11-leagues.md) |
| Social / Study / Battle | Relationships and cooperative/competitive flows | [12](./social/12-social-media.md), [13](./study-together/13-study-together.md), [14](./battles/14-battle-mode.md) |
| Lucky Wheel | Daily bonus entitlement and secure reward selection | [15](./lucky-wheel/15-lucky-wheel.md) |
| Notifications | Inbox, preferences, scheduled/delivered messages | [06](./notifications/06-notifications.md) |
| Chat / Calls | Messaging and WebRTC signaling | [17](./chat/17-chat-and-messaging.md), [18](./calls/18-voice-and-video-calls.md) |
| Badges / Referrals | Achievements and growth loops | [20](./badges/20-badges-system.md), [21](./referrals/21-referral-system.md) |

---

## Document Set

| # | Document | Nest module | Status |
|---:|---|---|---|
| 00 | [System Integration Contract](./integration/00-system-integration.md) | `integration/` (cross-cutting) | Required |
| 01 | [User Model & Authentication](./auth/01-user-model-and-authentication.md) | `auth/`, `users/`, `profiles/` | Required |
| 02 | [Questionnaire / Goal Interview](./questionnaire/02-questionnaire.md) | `questionnaire/` | Required |
| 02v2 | [Questionnaire v2 Learner Profiling](./questionnaire/02-questionnaire-v2-learner-profiling.md) | `questionnaire/` | Proposed |
| 03 | [Skill Graph, Roadmap Generator & AI Coach](./roadmaps/03-goals-and-roadmap.md) | `skill-graph/`, `roadmaps/`, `coach/` | Required |
| 04 | [Weekly Plan & Lessons Projection](./weeks/04-weekly-plan-and-lessons.md) | `weeks/` | Required |
| 05 | [Learn / Lesson Play API](./lessons/05-learn-lesson-play-api.md) | `lessons/` | Required |
| 06 | [Notifications](./notifications/06-notifications.md) | `notifications/` | Required |
| 07 | [Gamification](./gamification/07-gamification.md) | `gamification/` | Required |
| 08 | [Content Pool](./content-pool/08-content-pool.md) | `content-pool/`, `catalog/` | Required |
| 09 | [Course Timing](./course-timing/09-course-timing.md) | `course-timing/` | Required |
| 10 | [Ranking System](./ranks/10-ranking-system.md) | `ranks/` | Required |
| 11 | [Leagues](./leagues/11-leagues.md) | `leagues/` | Required |
| 12 | [Social Media](./social/12-social-media.md) | `social/` | Required |
| 13 | [Study Together](./study-together/13-study-together.md) | `study-together/` | Required |
| 14 | [Battle Mode](./battles/14-battle-mode.md) | `battles/` | Required |
| 15 | [Lucky Wheel](./lucky-wheel/15-lucky-wheel.md) | `lucky-wheel/` | Required |
| 16 | [Roadmap Completion & Re-enrollment](./roadmaps/16-roadmap-completion-and-reenrollment.md) | `roadmaps/` | Required |
| 17 | [Chat & Messaging](./chat/17-chat-and-messaging.md) | `chat/` | Required |
| 18 | [Voice & Video Calls](./calls/18-voice-and-video-calls.md) | `calls/` | Required |
| 19 | [Engagement Layer](./engagement/19-engagement-layer-active-learning.md) | (extends lessons/coach/pool) | Additive |
| 20 | [Badges & Achievements](./badges/20-badges-system.md) | `badges/` | Required |
| 21 | [Referral System](./referrals/21-referral-system.md) | `referrals/` | Required |
| 22 | [Roadmap Engine](./roadmaps/22-roadmap-engine.md) | `roadmaps/` | Companion to 03 |

---

## Canonical Ownership Rules

1. `profiles` owns identity, not the economy.
2. Wallet + immutable ledger own XP, Gems, and Coins.
3. Streak records own daily/weekly streak; profile fields may mirror them.
4. Published Content Pool versions own teachable content.
5. Roadmap instances own what a user should learn.
6. Course Timing owns future scheduling; Weekly Plan owns the current-week projection.
7. Lesson Progress owns what the user completed.
8. Rank and League are independent systems.
9. Notifications consume domain events; they never infer or create rewards.
10. The client never submits authoritative reward, answer, unlock, rank, streak, or winner values.

---

## Recommended Implementation Order

1. Integration/outbox/idempotency foundation
2. Auth + profile bootstrap
3. Questionnaire + immutable goal revision
4. Content Pool + Roadmap generation
5. Course Timing + Weekly Plan
6. Lesson Play + authoritative grading
7. Gamification ledger + streak/unlock hooks
8. Notifications
9. Ranking + Leagues
10. Social + Study Together + Battle
11. Lucky Wheel
12. Chat + Calls
13. Badges + Referrals
14. Engagement layer polish

---

## Required Shared Infrastructure

- migrations; never production `synchronize: true`
- global validation and stable error codes
- idempotency command table or unique command keys
- transactional outbox + retry/dead-letter handling
- correlation IDs and structured logs
- IANA timezone library
- cursor pagination
- OpenAPI contracts
- integration tests for the flows in doc 00
