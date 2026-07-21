# 19 — Engagement Layer: Active Formats, Visual Path, Coach Personality & Narrative Progression

**Version:** 2.0 (domain-generalized)
**Status:** Additive spec — extends existing modules, replaces nothing.
**Stack:** NestJS + TypeORM + PostgreSQL
**Consumers:** Arlo iOS/PWA — Home, Learn/Lesson Play, Roadmap screen, Arlo chat, League/Rank screens
**Depends on:** [00 — System Integration Contract](../integration/00-system-integration.md), [02 — Questionnaire](../questionnaire/02-questionnaire-v2-learner-profiling.md), [03 — Skill Graph, Roadmap Generator & AI Coach](../roadmaps/03-goals-and-roadmap.md), [05 — Learn / Lesson Play](../lessons/05-learn-lesson-play-api.md), [08 — Content Pool](../content-pool/08-content-pool.md), [20 — Badges](../badges/20-badges-system.md), [10 — Ranking](../ranks/10-ranking-system.md), [11 — Leagues](../leagues/11-leagues.md), [07 — Gamification](../gamification/07-gamification.md)

**What changed in 2.0:** v1.0 illustrated every feature through a single track (crypto trading). Arlo actually spans many categories — Frontend Development, Digital Marketing, Data Analytics, and more, growing over time. v2.0 rewrites every block type and example as a **domain-neutral primitive**, instantiated per-track through role-recipe content — the same pattern `../roadmaps/03-goals-and-roadmap.md` §0 already uses ("add Marketing / SEO / React / DevOps / AI = new pool documents + recipe edges. Do not change generator/coach algorithms for each domain") and `../ranks/10-ranking-system.md` §3 already uses for gate mapping. No engine, schema, or endpoint in this doc is track-specific; only the _authored content_ is. It also adds one new idea (§10, Cross-Track Discovery) that only makes sense on a multi-category platform.

---

## 0. Problem statement

Recurring user feedback: **"this is boring."**

Root cause, given the current architecture: the loop is _read compiled unit → answer MCQ → collect XP_. That is a homework loop with a UI, not a game loop, and it is identical regardless of whether the learner picked Crypto Trading, Frontend Development, or Digital Marketing as their track. The Skill Graph, Roadmap Generator, Ranks, Badges, and Leagues already give Arlo real bones (a DAG, a rank ladder, a league system, a coach). What's missing is **surface-level texture that works the same way for every category**: active decisions instead of passive reads, a path that looks like a journey, a coach that has a voice, format variety, rewards that surprise, competition that feels relevant, content that feels current, and an identity arc the user is climbing — not just a percentage bar.

This doc is deliberately **additive and domain-agnostic**. It does not change grading authority, XP/reward integrity rules, or the deterministic-selection principle in `../content-pool/08-content-pool.md` §0. The LLM still only narrates; the server still owns every gradeable fact. Every feature below is engine code that runs once — the domain flavor comes entirely from authored content and role-recipe mappings, never from a category-specific code path. It adds:

1. Active-format content blocks — generic decision/spot/order/debate/simulation primitives
2. A visual roadmap ("The Path")
3. Coach personality state for Arlo
4. Mandatory format variety in unit selection
5. Skill-proof-gated variable rewards
6. Goal-scoped ("cohort") leaderboards
7. Live/current-context content injection
8. Narrative phase titles per track (identity progression)
9. **New:** cross-track discovery nudges

---

## 1. Scope map — who owns what

| #   | Feature                      | Owning module                                    | New/changed                            |
| --- | ---------------------------- | ------------------------------------------------ | -------------------------------------- |
| 1   | Active-format blocks         | `../content-pool/08-content-pool.md`, `../lessons/05-learn-lesson-play-api.md` | new unit block types + check endpoints |
| 2   | Visual Path                  | `../roadmaps/03-goals-and-roadmap.md` (Roadmap Generator)    | new map projection + API               |
| 3   | Coach personality            | `../roadmaps/03-goals-and-roadmap.md` (AI Coach / Arlo)      | new personality/mood state             |
| 4   | Format variety               | `../content-pool/08-content-pool.md` (selection policy)             | new selection constraint               |
| 5   | Variable proof-gated rewards | `../gamification/07-gamification.md`, `../badges/20-badges-system.md`            | new reward-roll rule                   |
| 6   | Goal-scoped leaderboards     | `../leagues/11-leagues.md`                                     | new league scope                       |
| 7   | Live-context injection       | `../content-pool/08-content-pool.md`                                | new content type + freshness window    |
| 8   | Narrative phase titles       | `../roadmaps/03-goals-and-roadmap.md`, `../ranks/10-ranking-system.md`   | new template fields                    |
| 9   | Cross-track discovery        | `../roadmaps/03-goals-and-roadmap.md`, `../content-pool/08-content-pool.md`     | new optional-unit surfacing rule       |

No feature touches answer-key security, XP ledger integrity, or rank/league anti-farming rules defined elsewhere. Anything gradeable stays server-side per `../lessons/05-learn-lesson-play-api.md` §0. No feature hardcodes a track name in engine code — every example below (`crypto-trader`, `frontend-developer`, `digital-marketing-specialist`, `data-analyst`) is authored content flowing through the same generic pipeline.

---

## 2. Active-format content blocks

**Problem:** the compiled unit pool (`../content-pool/08-content-pool.md` §0) currently produces mostly `text` / `callout` / MCQ blocks (per the `LessonContentBlock` union in `../lessons/05-learn-lesson-play-api.md` §2). Reading-then-quizzing is the boring part, in every category.

**Fix:** add generic block _primitives_ to the same union. Each primitive is domain-neutral machinery; its content — setup text, options, hotspot coordinates, simulation snapshot — is authored per unit, exactly like existing text/quiz content is authored per unit today. The engine never branches on track.

### 2.1 New `LessonContentBlock` variants

```ts
type LessonContentBlock =
  | { type: "text"; body: string }
  | { type: "callout"; title: string; body: string }
  // --- new, additive, domain-neutral ---
  | { type: "scenario_decision"; setup: string; options: ScenarioOption[] }
  | { type: "visual_hotspot"; imageAssetKey: string; hotspots: Hotspot[] }
  | { type: "drag_order"; items: DragItem[]; correctOrderHash: string } // order hash server-side only
  | { type: "debate_pick"; prompt: string; sideA: string; sideB: string }
  | {
      type: "sandbox_simulation";
      simulationAssetKey: string;
      actions: string[];
    };
```

None of these types name a domain. What each one _means_ comes from the authored unit:

| Primitive            | Crypto Trading                                                  | Frontend Development                                                          | Digital Marketing                                             | Data Analytics                                                            |
| -------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `scenario_decision`  | "Price broke support on high volume — buy, sell, or hold?"      | "This layout breaks on mobile — flex, grid, or float fix?"                    | "CTR dropped 30% overnight — pause, reallocate, or A/B test?" | "This query is timing out — add an index, rewrite the join, or paginate?" |
| `visual_hotspot`     | Tap the candlestick pattern matching a head-and-shoulders setup | Tap the element in a rendered page causing a layout shift                     | Tap the weak point in a funnel/landing-page screenshot        | Tap the outlier cluster in a scatter plot                                 |
| `drag_order`         | Order the steps of a DCA strategy                               | Order the steps of the CSS cascade/specificity resolution                     | Order the stages of a campaign launch checklist               | Order the steps of an ETL pipeline                                        |
| `debate_pick`        | "Buy the dip" vs. "wait for confirmation"                       | "CSS-in-JS" vs. "utility classes"                                             | "Brand spend" vs. "performance spend"                         | "SQL" vs. "notebook-first" exploration                                    |
| `sandbox_simulation` | Trade against a stored market snapshot                          | Ship a fix against a stored repo/build snapshot, see the rendered/test result | Adjust a budget against a stored campaign-dashboard snapshot  | Tune a query/model against a stored dataset snapshot                      |

`sandbox_simulation.actions` is an **authored string vocabulary per unit** (e.g. `["buy","sell","hold"]`, `["use_grid","use_flex","use_float"]`, `["increase_budget","pause","reallocate"]`, `["add_index","rewrite_join","paginate"]`) — the check endpoint validates the submitted action against that unit's own vocabulary and stored snapshot, never against a hardcoded domain enum. This is the same "role recipes map a generic gate key to a track-specific milestone" pattern `../ranks/10-ranking-system.md` §3 already establishes for rank gates.

All of these are **secret-stripped on `GET /play`** exactly like existing MCQ/quiz blocks — correct answer, resolution branch, and outcome copy are withheld until `POST .../check`, per `../lessons/05-learn-lesson-play-api.md` §0.

### 2.2 Compiled unit schema addition (`../content-pool/08-content-pool.md`)

```json
{
  "slug": "campaign-ctr-drop-decision",
  "title": "CTR just dropped — now what?",
  "lessonType": "scenario",
  "blockTypes": ["scenario_decision"],
  "estimatedMinutes": 6,
  "difficulty": "beginner",
  "rewardClass": "standard_practice",
  "learningStyleTags": ["doing", "scenario"],
  "domain": "digital-marketing",
  "stack": "campaign-analytics"
}
```

```json
{
  "slug": "flexbox-layout-fix-sim",
  "title": "Ship the fix",
  "lessonType": "sandbox_simulation",
  "blockTypes": ["sandbox_simulation"],
  "estimatedMinutes": 10,
  "difficulty": "intermediate",
  "rewardClass": "standard_practice",
  "learningStyleTags": ["doing"],
  "domain": "frontend",
  "stack": "css",
  "simulationAssetKey": "flexbox-mobile-break-v1",
  "actionVocabulary": ["use_grid", "use_flex", "use_float"]
}
```

`lessonType: "scenario"` (and siblings `"visual_hotspot"`, `"debate"`, `"sandbox_simulation"`) join the existing `lessonType` enum (`text | video | practice | quiz | project | scenario | visual_hotspot | debate | sandbox_simulation`). The two examples above are two different tracks compiled through the exact same schema — no field is track-specific; `domain`/`stack` are the same columns every other compiled unit already carries (`../content-pool/08-content-pool.md` §6.7).

### 2.3 New check endpoint family

Extends the existing `POST /api/v1/lessons/:id/practice/check` / `.../quiz/check` pattern from `../lessons/05-learn-lesson-play-api.md` §4:

| Method | Path                                             | Notes                                                                                                                |
| ------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/lessons/:id/scenario/:blockId/check`           | body: `{ optionId }` → returns outcome copy + correctness + XP                                                       |
| `POST` | `/lessons/:id/visual-hotspot/:blockId/check`     | body: `{ hotspotId }`                                                                                                |
| `POST` | `/lessons/:id/drag-order/:blockId/check`         | body: `{ orderedIds[] }`, server hashes and compares                                                                 |
| `POST` | `/lessons/:id/sandbox-simulation/:blockId/check` | body: `{ actions[] }`, validated against the unit's own `actionVocabulary` and resolved against `simulationAssetKey` |

Same idempotency-key and content-version-check rules as existing check endpoints (`../lessons/05-learn-lesson-play-api.md` §0) apply unchanged, regardless of track.

---

## 3. Visual Path (roadmap as a map, not a list)

**Problem:** the Roadmap Generator (`../roadmaps/03-goals-and-roadmap.md`) already produces an ordered, phase-grouped, prerequisite-safe sequence of units for _any_ role recipe. What's missing is a _spatial_ projection of that sequence for the client — the thing that makes Duolingo's tree feel like a journey instead of a checklist, for any track the user picked.

**Fix:** add a read-only map projection computed from the existing roadmap instance. No new ordering logic — this is purely a rendering layer on top of `03`'s deterministic output, and it works identically no matter which role recipe generated the roadmap.

### 3.1 New endpoint

```
GET /roadmaps/current/map
```

```json
{
  "roadmapId": "rm_8842",
  "goalToken": "frontend-developer",
  "phases": [
    {
      "phaseId": "phase_1",
      "title": "Building Blocks",
      "narrativeTitle": "Layout Apprentice",
      "lane": 0,
      "nodes": [
        {
          "unitId": "u_2001",
          "x": 0,
          "y": 0,
          "type": "lesson",
          "state": "completed",
          "icon": "book"
        },
        {
          "unitId": "u_2002",
          "x": 1,
          "y": 0,
          "type": "scenario",
          "state": "unlocked",
          "icon": "compass"
        },
        {
          "unitId": "u_2003",
          "x": 2,
          "y": 0,
          "type": "checkpoint",
          "state": "locked",
          "icon": "shield"
        }
      ]
    }
  ],
  "branchPoints": [
    { "afterUnitId": "u_2003", "branches": ["phase_2a_react", "phase_2b_vue"] }
  ]
}
```

- `x`/`y`/`lane` are deterministic layout hints computed server-side from the existing prerequisite DAG order (topological position → x, phase/branch index → lane/y). No client-side guessing about ordering, and no per-track layout code.
- `state` (`locked | unlocked | completed`) is derived from the same completion/prerequisite facts Lesson Play already tracks — not a new source of truth.
- `branchPoints` surface only where the Skill Graph already has genuine alternative paths for that role recipe (React vs. Vue specialization for a frontend track; DeFi vs. technical-analysis for a crypto track; paid vs. organic specialization for a marketing track) — this doesn't invent branches that don't exist in the graph, and the endpoint doesn't know or care which of those it's rendering.

### 3.2 Frontend rendering

This is intentionally a thin contract so the client can render any path/map visual style (winding trail, subway map, etc.) without backend changes to the underlying roadmap logic, and without a per-category rendering theme baked into the backend.

---

## 4. Coach personality (Arlo)

**Problem:** `../roadmaps/03-goals-and-roadmap.md` §"AI Coach" already owns motivational language and contextual support, for every track. Today it's stateless per-message. A coach the user has a running relationship with is worth more than a smarter one — and that's true whether the user is learning to trade, code, or run ad campaigns.

**Fix:** add a lightweight, server-owned personality/mood state that Arlo's prompts read from — still narration-only, still no grading authority (`05` §0 boundary unchanged), still identical machinery for every track.

### 4.1 New table: `coach_relationship_state`

- `user_id`
- `rapport_score` (int, bounded, increments on streak maintenance / positive check-ins, decays slowly on long inactivity — never punitive, floor at neutral)
- `last_tone` (`encouraging | playful | steady | welcome_back`)
- `running_jokes` (jsonb — small set of callback facts Arlo may reference, e.g. user's stated goal, a nickname they picked)
- `updated_at`

### 4.2 Tone selection rule (deterministic, code-owned)

```text
if user just returned after >5 inactive days      → tone = welcome_back
else if streak just hit a milestone (7/30/100)     → tone = playful (celebratory)
else if rapport_score high and recent completion   → tone = playful
else if user just failed/skipped                   → tone = encouraging
else                                                → tone = steady
```

The tone is selected by code and passed into the Arlo prompt as a constraint; the LLM narrates within that tone but never decides the tone itself, consistent with `../content-pool/08-content-pool.md` §0's determinism principle. The user's `goalToken` (already available on the profile, `../questionnaire/02-questionnaire-v2-learner-profiling.md` Q1) is passed as narration context so Arlo's _examples_ match the user's track — the tone-selection logic itself never branches on it.

### 4.3 Notification copy examples (tone-tagged, same event bus as `../notifications/06-notifications.md`)

- `welcome_back`: "Look who's back. Your roadmap didn't go anywhere — pick up right where you left off?"
- `playful` (streak milestone): "7 days straight. You're basically unstoppable at this point."
- `encouraging` (post-skip): "That one was rough — happens to everyone. Want an easier warm-up before round two?"

(Same three lines work verbatim for a trader, a developer, or a marketer — track flavor, where wanted, comes from Arlo's narration pass referencing the goal token, not from separate copy per track.)

---

## 5. Mandatory format variety

**Problem:** even good active-format content (§2) gets stale if the same block type repeats for ten units in a row — in any track.

**Fix:** a selection constraint inside the Roadmap Generator's deterministic unit-selection step (`../content-pool/08-content-pool.md` §7.4 — folded in as a tie-breaker, see that doc's 3.3 changelog).

### 5.1 Rule

```text
No more than 2 consecutive units in a phase may share the same lessonType.
When candidates tie on selection_score, prefer the unit whose
lessonType differs from the previous unit's lessonType.
```

This is a soft tie-breaker only — it never violates a prerequisite edge, and it never overrides a mandatory checkpoint or role-milestone gate already defined in `03` and `../ranks/10-ranking-system.md` §3. It runs identically over the compiled-unit pool regardless of which `stack`/`domain` those units belong to.

### 5.2 Compiled unit tag requirement

Every compiled unit must declare exactly one `lessonType` from the enum in §2.2, so the tie-breaker has something deterministic to compare — this is an authoring requirement, not a per-track engine change.

---

## 6. Skill-proof-gated variable rewards

**Problem:** fixed, fully-predictable XP-per-unit is weaker than variable reward schedules for habit formation — but variability must never touch passive "content consumed" actions, only real proof of skill (this is also required by `../ranks/10-ranking-system.md` §11 anti-farming and `../badges/20-badges-system.md`'s "server-verified facts only" rule). This applies equally to a checkpoint quiz in SQL and a checkpoint quiz in copywriting.

### 6.1 Rule

```text
Reward roll applies ONLY to:
  - checkpoint / quiz passes at ≥80% (existing "strong completion" rule, 02 §16)
  - sandbox_simulation / scenario_decision correct resolutions
  - project and challenge completions

Reward roll NEVER applies to:
  - plain text/video/audio content marked "read" / "watched"
  - practice attempts without a pass threshold
```

### 6.2 Roll table (example, tunable, identical across tracks)

| Outcome        |                                Roll | Weight |
| -------------- | ----------------------------------: | -----: |
| Base XP        |                     fixed, as today |      — |
| Bonus XP       |                             +10–40% |    60% |
| Surprise Gem   |                           +2–5 Gems |    25% |
| Mystery unlock | unlocks a bonus/cosmetic unit early |    12% |
| Jackpot        |        2x XP + badge progress nudge |     3% |

This sits entirely inside `../gamification/07-gamification.md`'s existing reward-grant transaction — it changes _which amount_ is granted, never _whether_ a grant is legitimate, so all existing anti-farming and idempotency rules apply unchanged, for every track.

---

## 7. Goal-scoped leaderboards

**Problem:** a global leaderboard puts an aspiring crypto trader against a frontend developer and a marketer — including entirely unrelated tracks — low relevance, low motivation.

**Fix:** add a scoped view on top of the existing League system (`../leagues/11-leagues.md`), keyed by the same `target track` token the Questionnaire already captures for every user regardless of track (`../questionnaire/02-questionnaire-v2-learner-profiling.md` Q1: `goal` token, e.g. `data-analyst`, `crypto-trader`, `frontend-developer`, `digital-marketing-specialist`).

### 7.1 New API

```
GET /leagues/me?scope=goal
```

```json
{
  "scope": "goal",
  "goalToken": "digital-marketing-specialist",
  "league": { "tier": "Silver", "weekStart": "2026-07-13" },
  "standings": [
    { "rank": 1, "displayName": "...", "weeklyXp": 940 },
    { "rank": 7, "displayName": "you", "weeklyXp": 410 }
  ]
}
```

No new XP source is introduced — this reuses the existing weekly League XP ledger, just filtered/grouped by `goalToken` instead of (or alongside) the global cohort. Privacy filtering follows the same rules as `../ranks/10-ranking-system.md` §9's `/ranks/users/:userId`. Because the grouping key is the existing `goalToken` column, **a brand-new track added to the platform gets a goal-scoped league automatically** — no code change, only a new `career_roles` row (`../content-pool/08-content-pool.md` §6.1).

---

## 8. Live/current-context content injection

**Problem:** generic evergreen content feels disconnected from what's actually happening _right now_ in a fast-moving field — and every track Arlo offers has its own version of "right now": markets move, browser/framework releases ship, ad-platform algorithms change, new datasets and tools appear.

**Fix:** a new, clearly-separated content type in the pool — curated, not model-invented, per `../content-pool/08-content-pool.md`'s "resources are stable URLs, never AI-invented" principle (see `../content-pool/08-content-pool.md` §6.12, added in v3.3).

### 8.1 Table: `live_context_snippets` (see `../content-pool/08-content-pool.md` §6.12 for the canonical schema)

- `id`
- `track_tag` — matches a `domain`/`stack` value, not a hardcoded enum: `crypto-trader`, `frontend-developer`, `digital-marketing-specialist`, `data-analyst`, etc.
- `headline`
- `body` (short, curator- or editorially-reviewed, length-limited)
- `source_url`
- `published_at`
- `expires_at` (freshness window — e.g. 7 days; expired snippets are never served)
- `related_skill_tags`

### 8.2 What "current" means per track (examples, not an exhaustive list — curators add tracks freely)

| Track                | Example live-context snippet                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Crypto Trading       | "BTC broke a key support level this week — here's the volume pattern that preceded it."                 |
| Frontend Development | "Chrome shipped native `:has()` support this month — here's what it replaces."                          |
| Digital Marketing    | "A major ad platform changed its attribution window this week — here's what it means for reported CTR." |
| Data Analytics       | "The latest pandas release changed default copy-on-write behavior — here's what breaks."                |

### 8.3 Block type (unchanged, domain-neutral)

```ts
{
  type: "live_context";
  snippetId: string;
}
```

`GET /play` resolves `live_context` blocks to the most recent non-expired snippet matching the unit's `track_tag` at read time. If none is fresh enough, the block is simply omitted (never backfilled with stale or fabricated content) — this preserves the "never AI-invented resource" rule identically across tracks.

This block type is explicitly **narration/context only** — it never carries a check/grade endpoint, so it cannot become a farming vector in any category.

---

## 9. Narrative phase titles per track

**Problem:** `../ranks/10-ranking-system.md` already gives permanent, playful rank names (Curious Egg → Job-Ready Eagle) with domain-neutral gate mapping (§3) that already work across tracks. The Roadmap's own phases, however, are currently generic ("Phase 1", "Phase 2"). Pairing the rank ladder with phase-level narrative titles closes the loop: the user should feel like they're leveling up an identity, not just finishing modules — and that identity should read naturally for _their_ track.

### 9.1 New field on `roadmap_phases` (03 doc)

- `narrative_title_template` (string, per role-recipe) — one ordered list of phase titles per track.

Role recipes already map generic gate keys to track-specific milestones (`../ranks/10-ranking-system.md` §3: Query Warrior → SQL / React / campaign-analysis challenge, depending on track). This extends the same recipe table with narrative phase titles, so no new authoring system is required — just additional columns on the existing role-recipe rows, populated once per track by content authors.

### 9.2 Examples across tracks (same field, different authored content)

```json
[
  {
    "roleToken": "crypto-trader",
    "phaseNarrativeTitles": [
      "Junior Analyst",
      "Chart Reader",
      "Position Trader",
      "Risk Manager",
      "Independent Trader"
    ]
  },
  {
    "roleToken": "frontend-developer",
    "phaseNarrativeTitles": [
      "Layout Apprentice",
      "Component Builder",
      "Interface Engineer",
      "Performance Tuner",
      "Production-Ready Engineer"
    ]
  },
  {
    "roleToken": "digital-marketing-specialist",
    "phaseNarrativeTitles": [
      "Content Rookie",
      "Channel Operator",
      "Campaign Strategist",
      "Growth Analyst",
      "Marketing Lead"
    ]
  }
]
```

The visual Path (§3) displays `narrativeTitle` per phase instead of "Phase N", and the Home dashboard can show "You are: Component Builder" (or "Chart Reader", or "Channel Operator") pulled from the current phase, alongside the permanent Rank badge from `../ranks/10-ranking-system.md`. The two systems stay independent (phase titles are per-track and roadmap-scoped; Ranks remain the permanent, cross-track ladder) — this doc does not merge them, and adding a new track only means adding one more row like the ones above.

---

## 10. New: Cross-track discovery nudges

**Problem this only makes sense on a multi-category platform.** A single-track app (a pure crypto-trading app, say) has no "other courses" to point to. Arlo does. Today, a Digital Marketing learner never sees that Data Analytics skills would sharpen their campaign reporting, and a Frontend Development learner never sees that a Digital Marketing unit on conversion copy would make their landing pages convert better. That's a discovery gap unique to a multi-category platform, and it's currently unaddressed.

### 10.1 Rule

```text
After a checkpoint/phase completion, the Roadmap Generator may surface at most
one OPTIONAL cross-track unit per week, drawn from a different active role
recipe's foundation units, when:
  - the unit's skill tag overlaps a "complementary_skill_tags" edge
    declared on the user's current role recipe, AND
  - the unit fits within remaining weekly budget_minutes as slack, never
    displacing required content (08-content-pool.md §7.5)
```

This never changes the user's primary roadmap, never counts toward required proof gates, and never affects rank/league scoring for the _primary_ track — it's a strictly optional, budget-slack-only surfacing, gated by an explicit authored edge between role recipes (not a model guess).

### 10.2 New field on `role_recipes`

- `complementary_skill_tags[]` — e.g. `digital-marketing-specialist` recipe declares `["data-analytics:funnel-metrics", "frontend:landing-page-basics"]`.

### 10.3 Example surfacing

```text
User track: digital-marketing-specialist, just passed a checkpoint
  → complementary_skill_tags includes "data-analytics:funnel-metrics"
  → one optional unit from the data-analyst foundation pool is surfaced:
    "Reading a funnel drop-off chart" (8 min, optional, no XP change to primary track)
```

If the user completes it, it's tracked as evidence toward _that_ track's own learner profile (`../questionnaire/02-questionnaire-v2-learner-profiling.md` §16 lesson-evidence loop) — so genuine cross-track exploration is never wasted, but it's opt-in and never forced into the primary path.

---

## 11. Data model changes — summary

| Table                                   | Change                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| compiled unit (pool)                    | add `lessonType` values: `scenario`, `visual_hotspot`, `debate`, `sandbox_simulation`; add `simulationAssetKey`, `actionVocabulary[]` |
| `roadmap_phases`                        | add `narrative_title_template`                                                                                                        |
| `role_recipes`                          | add `phaseNarrativeTitles[]`, add `complementary_skill_tags[]`                                                                        |
| new: `coach_relationship_state`         | rapport score, last tone, running jokes                                                                                               |
| new: `live_context_snippets`            | curated track-scoped current-events content (see `../content-pool/08-content-pool.md` §6.12)                                                             |
| reward-grant transaction (gamification) | add roll table, gated to proof-events only                                                                                            |
| leagues read model                      | add `scope=goal` grouping (no new ledger)                                                                                             |

No change to: answer-key security model, XP ledger schema, rank/league anti-farming rules, badge revocation rules. No table or column here is named after or scoped to a single track.

---

## 12. New/changed APIs — summary

| Method | Path                                             | Feature |
| ------ | ------------------------------------------------ | ------- |
| `POST` | `/lessons/:id/scenario/:blockId/check`           | §2      |
| `POST` | `/lessons/:id/visual-hotspot/:blockId/check`     | §2      |
| `POST` | `/lessons/:id/drag-order/:blockId/check`         | §2      |
| `POST` | `/lessons/:id/sandbox-simulation/:blockId/check` | §2      |
| `GET`  | `/roadmaps/current/map`                          | §3      |
| `GET`  | `/leagues/me?scope=goal`                         | §7      |

---

## 13. Events

- `lesson.scenario_resolved.v1`
- `lesson.visual_hotspot_resolved.v1`
- `lesson.drag_order_resolved.v1`
- `lesson.sandbox_simulation_resolved.v1`
- `reward.variable_roll_applied.v1`
- `coach.tone_selected.v1` (analytics only, never affects grading)
- `content.live_context_served.v1`
- `content.live_context_expired_skip.v1`
- `content.cross_track_unit_surfaced.v1`
- `content.cross_track_unit_completed.v1`

Consumers deduplicate by event ID, matching existing conventions (`02` §14, `../ranks/10-ranking-system.md` §14).

---

## 14. Error codes

| Code                                | Meaning                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `SCENARIO_BLOCK_ALREADY_RESOLVED`   | Idempotent re-submit of a resolved scenario                                                         |
| `SANDBOX_SIMULATION_SNAPSHOT_STALE` | Simulation snapshot version mismatch                                                                |
| `SANDBOX_SIMULATION_ACTION_INVALID` | Submitted action not in the unit's own `actionVocabulary`                                           |
| `LIVE_CONTEXT_NONE_FRESH`           | No non-expired snippet for this track — block omitted, not an error surfaced to the user            |
| `LEAGUE_SCOPE_INVALID`              | Unknown `scope` query param                                                                         |
| `REWARD_ROLL_INELIGIBLE_ACTION`     | Attempted roll on a non-proof action (defense-in-depth, should never trigger from a correct client) |
| `CROSS_TRACK_BUDGET_EXCEEDED`       | No slack minutes remain this week — nudge withheld, primary roadmap unaffected                      |

---

## 15. Acceptance criteria

- Every new content block type is secret-stripped on `GET /play` and graded only via a dedicated `check` endpoint, matching `05` §0.
- No block schema, table, or endpoint in this doc contains a track-specific field name or hardcoded domain enum — track flavor lives only in authored `content`, `domain`/`stack`, and role-recipe rows.
- `sandbox_simulation` actions are validated against the authoring unit's own `actionVocabulary`, never a global action list.
- Variable reward rolls never apply to passive read/watch actions — verified in the reward-grant transaction, not just the client.
- The Visual Path endpoint is a pure read projection of the existing roadmap DAG — it introduces no new ordering or prerequisite logic and no per-track layout code.
- Format-variety tie-breaking never overrides a prerequisite edge or a mandatory checkpoint/milestone gate, for any track.
- Coach tone is selected by deterministic code; the LLM narrates within the given tone (optionally flavored by `goalToken`) and cannot self-select a tone or grant rewards.
- Live-context snippets are curator-sourced, never model-invented, and are omitted (not fabricated) when no fresh snippet exists for a track.
- Narrative phase titles are additive metadata on existing role-recipe rows; they do not change rank-ladder logic in `../ranks/10-ranking-system.md`, and adding a new track requires only a new recipe row, no code change.
- Goal-scoped leaderboards read from the existing League XP ledger; no parallel scoring system is created; a new track automatically gets a scoped league.
- Cross-track nudges are strictly optional, budget-slack-only, and never displace required content or alter primary-track rank/league scoring.

---

## 16. Implementation checklist

- [ ] Extend `LessonContentBlock` union + compiled unit schema with new block/lesson types (domain-neutral)
- [ ] Add 4 new `check` endpoints, secret-stripped `GET /play` for each
- [ ] Add format-variety tie-breaker to Roadmap Generator selection step (already folded into `../content-pool/08-content-pool.md` §7.4)
- [ ] Add `GET /roadmaps/current/map` projection endpoint
- [ ] Create `coach_relationship_state` table + tone-selection service
- [ ] Add variable reward roll table to reward-grant transaction, gated to proof-events
- [ ] Confirm `live_context_snippets` table (see `../content-pool/08-content-pool.md` §6.12) + curation/admin entry point + freshness-window job, seeded across at least 3 tracks
- [ ] Add `phaseNarrativeTitles` to `role_recipes`; author for all active tracks; surface in map + Home
- [ ] Add `complementary_skill_tags[]` to `role_recipes`; author initial cross-track edges
- [ ] Add `GET /leagues/me?scope=goal`
- [ ] Add cross-track discovery surfacing rule + events
- [ ] Unit/integration tests per §15 acceptance criteria, run against at least 2 distinct tracks to prove domain-agnosticism
