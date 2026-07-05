# Arc — AI Career Coach

@AGENTS.md

## What Arc is

Arc is **not** a course app. It is an AI personal coach that helps working adults
complete a career transformation. Core loop:

**Goal → Roadmap → Weekly Plan → Lesson → Practice → Reward → Progress → Replan**

MVP focus: "Office worker → Data Analyst". North-star metric: **Week-8 active
learning retention**. The app must, within 5 seconds, tell the user *what to do
next* and make them *feel motivated to do it*.

Arlo is the persistent AI coach mascot — funny, dramatic, encouraging, never
insulting. Adults are **not** punished with daily streaks; retention uses
**weekly commitment streaks**.

Full product + technical spec: `src/doc/Arc_MVP_Full_Technical_Roadmap.md`.
The roadmap doc targets iOS/SwiftUI/Supabase — **this repo is the Next.js
web/PWA implementation**. Treat the doc as product truth (features, flows,
schema, gamification rules, AI guardrails), not stack truth.

## Stack (this repo)

- **Next.js 16** (App Router, Turbopack) + **React 19**, TypeScript everywhere — no `.js` files
- **HeroUI v3** (`@heroui/react`, `@heroui/styles`) — React Aria based, Tailwind v4
- **Tailwind CSS v4** (PostCSS, no `tailwind.config.ts`; tokens live in `src/styles/`)
- **Zustand** — client state (`src/store/`)
- **TanStack React Query** — server state (`src/hooks/`)
- **Zod** + **React Hook Form** (`@hookform/resolvers`) — forms/validation (`src/schemas/`)
- **framer-motion** — reward/celebration animations
- **next-pwa** — PWA (disabled in dev)
- `lucide-react`, `clsx`, `tailwind-merge`, `tailwind-variants`

## Layout

```
src/
├── app/            # App Router. providers.tsx (HeroUI) wraps query-provider.tsx (React Query)
├── components/     # ui/ = HeroUI component wrappers; feature components at root
├── store/          # Zustand stores
├── schemas/        # Zod schemas
├── hooks/          # React Query hooks
├── lib/            # API clients, utils, assets
├── styles/         # arc-tokens.css, arc-components.css, heroui-arc.css
└── doc/            # product spec (source of truth for features)
```

## Conventions

- **Read `node_modules/next/dist/docs/` before writing Next.js code** — this Next.js
  has breaking changes vs training data (see AGENTS.md). Heed deprecation notices.
- Mark client-interactive components `"use client"`.
- Every AI output that affects product state must be validated JSON (Zod schema).
  Prompts are versioned (`goal_interview_v1`, `roadmap_generator_v1`, …).
- AI guardrails (hard rules): never promise guaranteed jobs, never invent resource
  URLs, never claim job-ready without assessment, never fake certificates.
- Reward/XP/chest logic is **server-side** — never trust the client. No repeat-farming XP.
- Do not build Phase 2+ features in MVP: job board, coach marketplace, social feed,
  guilds, AR. Build the core loop first.

## Brand tokens

Primary purple `#6B4EFF`, deep navy `#101923`, soft lavender `#F6F2FF`,
success green `#62D84E`, coin yellow `#FFC928`, gem purple `#B35CFF`,
alert orange `#FF8A3D`. Mood: playful, premium, motivational, clean.

## Commands

```bash
npm run dev     # next dev --turbopack
npm run build   # next build --turbopack
npm run lint    # eslint
```
