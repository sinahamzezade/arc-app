# Arc Backend — Integrated Implementation Specs

**Version:** 2.0  
**Frontend:** Next.js PWA (`arc-app`)  
**Backend:** NestJS + TypeORM + PostgreSQL

Start with [00 — System Integration Contract](./00-system-integration.md). It defines ownership, atomic transactions, events, time boundaries, and the full handoff between roadmap, scheduling, lessons, rewards, streaks, ranks, leagues, social systems, and notifications.

---

## Architecture

Arc uses four personalization engines plus cross-cutting product services.

| Engine / service | Owns | Main docs |
|---|---|---|
| Question Engine | Adaptive intake and goal tokens | [02](./02-questionnaire.md) |
| Content Pool / Skill Graph | Published reusable curriculum and question bank | [03](./03-goals-and-roadmap.md), [content_pool](./content_pool.md) |
| Roadmap Generator | Versioned personalized path instance | [03](./03-goals-and-roadmap.md) |
| AI Coach | Contextual help and safe replan requests | [03](./03-goals-and-roadmap.md) |
| Course Timing | Feasibility, future slots, dynamic ETA | [course_timing](./course_timing.md) |
| Weekly Plan | Current-week commitment projection and seal | [04](./04-weekly-plan-and-lessons.md) |
| Lesson Play | Content delivery, grading, progress, completion orchestration | [05](./05-Learn_Lesson_Play_API.md) |
| Gamification | Wallet, ledger, rewards, store, unlock evaluation, streaks | [gamification](./gamification.md) |
| Ranking / Leagues | Permanent rank and weekly competition | [ranking](./ranking_system.md), [leagues](./leagues.md) |
| Social / Study / Battle | Relationships and cooperative/competitive flows | [social](./social_media.md), [study](./study_together.md), [battle](./battle_mode.md) |
| Lucky Wheel | Daily bonus entitlement and secure reward selection | [wheel](./lucky_wheel.md) |
| Notifications | Inbox, preferences, scheduled/delivered messages | [06](./06-notifications.md) |

---

## Document Set

| # | Document | Status |
|---:|---|---|
| 00 | [System Integration Contract](./00-system-integration.md) | Required |
| 01 | [User Model & Authentication](./01-user-model-and-authentication.md) | Required |
| 02 | [Questionnaire / Goal Interview](./02-questionnaire.md) | Required |
| 03 | [Goals, Content Graph, Roadmap Generator & AI Coach](./03-goals-and-roadmap.md) | Required |
| 04 | [Weekly Plan & Lessons Projection](./04-weekly-plan-and-lessons.md) | Required |
| 05 | [Learn / Lesson Play API](./05-Learn_Lesson_Play_API.md) | Required |
| 06 | [Notifications](./06-notifications.md) | Required |
| 07 | [Gamification](./gamification.md) | Required for economy |
| 08 | [Content Pool](./content_pool.md) | Required for scalable curriculum |
| 09 | [Course Timing](./course_timing.md) | Required for personalization |
| 10 | [Ranking System](./ranking_system.md) | Required for rank UI |
| 11 | [Leagues](./leagues.md) | Required for League UI |
| 12 | [Social Media](./social_media.md) | Required for Friends Hub |
| 13 | [Study Together](./study_together.md) | Required for shared focus |
| 14 | [Battle Mode](./battle_mode.md) | Required for Battles |
| 15 | [Lucky Wheel](./lucky_wheel.md) | Required for daily bonus |

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
