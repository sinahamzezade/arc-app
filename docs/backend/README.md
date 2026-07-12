# Arc Backend — Implementation Specs

Frontend: **Next.js PWA** (`arc-app`). Backend: **NestJS + TypeORM** (PostgreSQL).

Product truth still lives in `src/doc/`. These files translate product + current web UI into **what backend must ship**.

## Stack

| Layer       | Choice                                                          |
| ----------- | --------------------------------------------------------------- |
| Framework   | NestJS                                                          |
| ORM         | TypeORM                                                         |
| DB          | PostgreSQL                                                      |
| Auth tokens | JWT access + refresh (httpOnly cookie or Bearer — see auth doc) |
| Validation  | `class-validator` / Zod on edge; mirror frontend Zod rules      |

## Four engines (architecture)

Personalization splits into **four independent engines**. Shared **Learning Document Pool** holds customizable content for every category/job. New domains (Marketing, SEO, React, DevOps, AI, …) = **pool documents + recipe edges only** — not generator / coach code changes.

| Engine | Owns | Nest home | Doc |
| --- | --- | --- | --- |
| **Question Engine** | Adaptive questions, branching, answer tokens → `goals` | `questionnaire/` | [02](./02-questionnaire.md) |
| **Skill Graph Engine** | Learning Document Pool — skills, lessons, assessments (any category/job) | `skill-graph/` | [03](./03-goals-and-roadmap.md) |
| **Roadmap Generator** | After questionnaire: select from pool → personalized learning path | `roadmaps/` | [03](./03-goals-and-roadmap.md) |
| **AI Coach** | Continuous replan from progress, assessments, learning behavior | `coach/` | [03](./03-goals-and-roadmap.md) |

```
Question Engine ──tokens──► goals
                               │
Skill Graph Engine ◄───────────┼── Roadmap Generator (one-shot assemble)
                               │
                               └── AI Coach (ongoing mutate roadmap instance)
```

**Boundary rules**

1. Question Engine never imports skill-graph / coach. Hands off `goal_id` (+ answer tokens on `goals`).
2. Roadmap Generator never hardcodes domain curricula — only selects from Learning Document Pool + recipes.
3. Skill Graph / pool never knows about users — shared documents only.
4. AI Coach mutates **user learning path instances**, not pool rows.
5. After questionnaire complete → Generator **must** create a personalized learning path from the pool.

## Feature docs

| #   | Doc                                                                  | Status           |
| --- | -------------------------------------------------------------------- | ---------------- |
| 01  | [User Model & Authentication](./01-user-model-and-authentication.md) | Required for MVP |
| 02  | [Questionnaire — Question Engine](./02-questionnaire.md)             | Required for MVP |
| 03  | [Skill Graph, Roadmap Generator & AI Coach](./03-goals-and-roadmap.md) | Required for MVP |
| 04  | [Weekly Plan & Lessons](./04-weekly-plan-and-lessons.md)             | Required for MVP |
| 05  | [Learn / Lesson Play](./05-Learn_Lesson_Play_API.md)                 | Required for MVP |
| 06  | [Notifications](./06-notifications.md)                               | Required for MVP |
| 07  | Subscriptions                                                        | Planned          |
| 08  | Profile & Identity                                                   | Planned          |
| 09  | Rewards (XP / Coins / Gems ledger)                                   | Planned          |

## Rules for implementers

1. **Never trust client** for XP, coins, gems, rewards, streak, or entitlements.
2. Every mutating auth/account action returns clear machine-readable error codes frontend can map.
3. AI outputs that change product state must be validated server-side (Zod) — not in this auth doc.
4. Do not invent Phase 2 features (job board, social feed, guilds, AR) in MVP APIs.
5. Prefer engine boundaries above — do not fold curriculum trees into questionnaire or Nest enums.

## Source mapping

- Auth acceptance: `src/doc/Arc_MVP_Full_Technical_Roadmap.md` § Authentication
- Schema seed: same doc § `users` / `profiles` / `goals`
- Question Engine: DB catalog `questionnaire_definitions` / `steps` / `options`; API `GET /questionnaire/schema`
- Skill Graph + Roadmap Generator: product doc § Personalized Roadmap, § Resource Discovery, § `generate_roadmap`, schema §12.4–12.9
- Weekly Plan / Seal Week vault: [04](./04-weekly-plan-and-lessons.md); product §6 Weekly Planner, §13.4 `generate_weekly_plan`
- Frontend contracts: `src/schemas/login.ts`, `register.ts`, `forgot-password.ts`, `reset-password.ts`, `questionnaire.ts` (answers only — steps from API)
