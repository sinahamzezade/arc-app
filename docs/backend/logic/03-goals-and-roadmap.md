# 03 — Skill Graph, Roadmap Generator & AI Coach

**Version:** 2.0 integrated  
**Integration:** Shared curriculum is further specified in [content_pool.md](./content_pool.md). A generated roadmap is not Home-ready until Course Timing and the current Weekly Plan are ready.

**Engines:** Skill Graph Engine · Roadmap Generator · AI Coach (see [README](./README.md) four-engine map)  
**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arc Next.js PWA (`arc-app`)  
**Product source:** `src/doc/Arc_MVP_Full_Technical_Roadmap.md` § Personalized Roadmap, § Resource Discovery, § DB `goals` / `roadmaps` / phases / milestones / lessons / resources, § `generate_roadmap`  
**Depends on:** [00](./00-system-integration.md), [02](./02-questionnaire.md), [content_pool](./content_pool.md)  
**Feeds:** [course_timing](./course_timing.md), [04](./04-weekly-plan-and-lessons.md), [05](./05-Learn_Lesson_Play_API.md), [gamification](./gamification.md)

This doc covers three engines that turn a submitted goal into a **per-user learning path** and keep it fresh.

**Core product rule:** Arc keeps one shared **Learning Document Pool** (customizable content for every category / job). Questionnaire answers do **not** invent curriculum — they **select + order + prune** documents from that pool into a personal path.

Domain content (Marketing, SEO, React, DevOps, AI, …) lives in the **Skill Graph / pool only** — generator / coach code stays domain-agnostic.

**Question Engine contract:** answer **tokens** (`goal`, `skills`, `studyHours`, …) come from `GET /questionnaire/schema` / `goals` columns + `raw_answers`. Roadmap Generator consumes those tokens — never a second hardcoded enum list, never questionnaire UI rows.

---

## 0. Four engines (this doc = 3 of 4)

| Engine | Owns | Nest home |
| --- | --- | --- |
| Question Engine | Adaptive Q + branching → `goals` tokens | `questionnaire/` (doc 02) |
| **Skill Graph Engine** | **Learning Document Pool** — skills, prerequisites, modules, lessons, assessments, resources | `skill-graph/` |
| **Roadmap Generator** | After questionnaire: pick from pool → personalized learning path instance | `roadmaps/` (+ generator service) |
| **AI Coach** | Continuous: replan from progress, assessments, learning behavior | `coach/` |

```
                    ┌─────────────────────────────────────┐
                    │  Learning Document Pool (shared)    │
                    │  stacks · skills · lessons · docs   │
                    │  any category / any job             │
                    └─────────────────┬───────────────────┘
                                      │ read-only
Question Engine ──goal tokens──► Roadmap Generator ──► user learning path
                                      │
                    AI Coach ─────────┘ (later: mutate path instance only)
```

**Why separate:** add Marketing / SEO / React / DevOps / AI = new pool documents + recipe edges. **Do not** change Roadmap Generator or AI Coach algorithms for each domain.

---

## 0.1 Learning Document Pool (customizable content)

The pool is the single source of teachable content for **all** careers and categories. Authors customize it via seed JSON / CMS later — never by editing Nest generator code.

### What lives in the pool

| Pool piece | Table / seed | Role |
| --- | --- | --- |
| **Category / tech unit** | `tech_stacks` | e.g. `react`, `sql`, `marketing-seo` |
| **Skill node** | `skill_nodes` | Graph vertex + tags that match questionnaire skill tokens |
| **Lesson document** | `lesson_templates` | Customizable learning unit (video / reading / practice / quiz / …) |
| **Assessment document** | `assessment_templates` | Checkpoints on the graph |
| **External / curated resource** | `resources` | Stable URLs + metadata (never AI-invented) |
| **Job → pool recipe** | `role_recipes` | Which stacks/phases a questionnaire `goal` token pulls |

### Customizable document format (authoring contract)

Every lesson document in the pool follows the same shape so any job can reuse it:

```json
{
  "slug": "hooks-usestate-practice",
  "title": "useState in practice",
  "missionNameTemplate": "State of the union",
  "lessonType": "practice",
  "estimatedMinutes": 30,
  "difficulty": "beginner",
  "rewardClass": "standard_practice",
  "learningStyleTags": ["doing", "videos"],
  "orderHint": 2,
  "resourceSlug": "react-hooks",
  "contentOutline": {
    "objectives": ["Create local state", "Update UI from events"],
    "checklist": ["Build a counter", "Lift state once"]
  },
  "isActive": true
}
```

Stack seed file (illustrative) groups documents under a category:

```json
{
  "slug": "react",
  "name": "React",
  "category": "frontend",
  "skills": [
    {
      "slug": "hooks",
      "title": "React Hooks",
      "tags": [],
      "prereqSlugs": ["components"],
      "lessons": []
    }
  ]
}
```

(`lessons` array holds lesson documents in the format above.)

**Customization rules**

1. Same document format for Frontend, Data, Marketing, DevOps, AI — only `category`, tags, and recipe edges change.
2. One lesson document may appear in many user paths (copied into instance rows); pool row stays shared.
3. Turn content off with `isActive: false` — no code deploy.
4. New job = new `role_recipes` row pointing at existing pool stacks (or new seed files). Generator unchanged.
5. Cross-category reuse allowed (e.g. `communication` stack in Data Analyst **and** Marketing recipes).

### Pool → path (after questionnaire)

```
1. User finishes questionnaire (doc 02)
2. Question Engine upserts goals + enqueues generate_roadmap(goal_id)
3. Roadmap Generator:
     a. Resolve role_recipe from goals.target_roles[0]
     b. Load Learning Document Pool subgraph for that recipe
     c. Prune documents tagged with skills user already has
     d. Size / order documents to hours + deadline + learning styles
     e. Persist user learning path (phases → milestones → lessons)
4. Frontend polls GET /roadmaps/current until ready → /path UI
```

**Invariant:** questionnaire never embeds lesson trees. Pool never stores per-user progress. Path instance never mutates pool rows.

---

## 1. Goal

After questionnaire submit (only when `profile.questionnaireStatus === completed`):

1. Read active `goals` row (mapped from schema-validated answers — see §4.0 / doc 02 §7)
2. **Roadmap Generator** builds a **learning path** by selecting documents from the **Learning Document Pool** (Skill Graph) — not hard-coded per role in app code
3. Personalize: prune known skill tokens, size to decoded weekly hours + deadline, prefer learning-style lesson types
4. Persist phases → milestones → lessons (with resource links) = **user path instance**
5. Expose status + tree APIs so frontend can poll generation and render `/path`
6. **AI Coach** later adjusts that instance from progress / assessments / behavior (does not rewrite pool)

MVP seeds **Data Analyst** + **Front End (React)** (and recipes for all questionnaire goals). Data model must support any stack / category without schema rewrites. New questionnaire goal options → new `role_recipes` + optional pool seeds.

---

## 2. Core idea: pool (shared) vs path instance (per user)

| Layer | Engine | Shared? | Mutates per user? |
| --- | --- | --- | --- |
| **Learning Document Pool** | Skill Graph | Yes (admin/content) | No |
| **Role recipes** | Skill Graph (job → pool entry) | Yes | No |
| **User learning path** | Roadmap Generator (create) / AI Coach (update) | No | Yes |
| **Progress** | Coach inputs + gamification docs | No | Yes |

**Rule:** Never bake “React curriculum” into TypeScript enums only. Store it as pool documents. Generator **selects + orders + prunes** pool nodes into a user path. Coach **rewrites the path instance**, not the pool.

```
POST /questionnaire/submit  (Question Engine)
  → upsert goals (target_roles, skills, weekly_hours, …, raw_answers)
  → profile.questionnaireStatus = completed
  → enqueue generate_roadmap(goal_id)  → jobId in response
      → Roadmap Generator:
          resolve role_recipes by goals.target_roles[0]
          decode studyHours / deadline tokens → numeric capacity
          load Learning Document Pool (stacks + skill nodes + lesson docs + assessments)
          personalize (prune mastered, hours, deadline, styles, confidence)
          optional AI titles / order within constraints (generator prompt)
          validate roadmap JSON (Zod)
          INSERT roadmaps + phases + milestones + lessons (+ resource FKs)
          = versioned personalized learning path for this user
      → emit `roadmap.generated.v1`
      → Course Timing builds schedule + current Weekly Plan
  → later: AI Coach requests validated roadmap/schedule revisions; it never directly edits completed history
```

Implemented today: real job rows + deterministic generator + pool seed (`skill-graph/seeds/catalog.seed.ts`) + optional OpenAI enrich (`roadmap_generator_v1`, soft-fail). Optional Bull queue still later.

Gate: frontend blocks normal Home/Learn routes until questionnaire is complete. After submit, show a generation state and poll bootstrap/job status. Home becomes actionable only when the active roadmap and initial schedule/current week projection are ready.

---

## 3. Modules (NestJS)

```
goals/                         # bridge row from Question Engine (exists)
skill-graph/                   # Skill Graph Engine = Learning Document Pool
  skill-graph.module.ts
  skill-graph.service.ts       # seed pool + load subgraph by recipe
  entities/
    tech-stack.entity.ts
    skill-node.entity.ts
    lesson-template.entity.ts  # learning documents
    assessment-template.entity.ts
    resource.entity.ts
    role-recipe.entity.ts      # job → pool selection plan
  seeds/
    catalog.seed.ts            # customizable pool content (all categories)
roadmaps/                      # Roadmap Generator (path create + APIs)
  roadmaps.module.ts
  roadmaps.controller.ts       # GET /roadmaps/current, GET /jobs/:id
  roadmaps.service.ts          # enqueue + get current tree
  roadmap-generator.service.ts # pool → personalized path
  roadmap-jobs.processor.ts    # async worker
  entities/
    roadmap.entity.ts          # user learning path root
    roadmap-phase.entity.ts
    milestone.entity.ts
    lesson.entity.ts           # instance copy of pool lesson document
    lesson-progress.entity.ts
    roadmap-generation-job.entity.ts
coach/                         # AI Coach Engine
  coach.module.ts
  coach.service.ts             # replanFromProgress / assessment hooks
```

Keep AI prompt IDs versioned (`roadmap_generator_v1`, later `ai_coach_replan_v1`) per product §9.4. Validate every AI payload with Zod before write.

**Generator must not import Question Engine internals** — only `goals` (+ optional `raw_answers`). **Coach must not mutate pool / skill-graph rows.**

---

## 4. Data model

### 4.0 Inputs from questionnaire → `goals` (do not re-parse UI)

Submit path (already implemented) maps answers → `goals`. Generator reads **`goals`**, not the questionnaire response row, except `raw_answers` / `schema_version` when needed.

| Goal column | Answer field | Schema step `id` | Notes |
| --- | --- | --- | --- |
| `target_roles` | `goal[]` | `goal` | Multi; primary = index 0 |
| `motivation` | `motivation` + `motivationOther` | `motivation` | jsonb `{ values, other? }` |
| `current_profession` | `currentJob` | `currentJob` | single (+ other text) |
| `skills` | `skills` + `skillsOther` | `skills` | jsonb; `none` exclusive |
| `weekly_hours` | `studyHours` | `studyHours` | **token** — decode before sizing |
| `availability` | `schedule` | `schedule` | `{ days, times }` from schema schedule config |
| `target_deadline` | `deadline` | `deadline` | **token** — decode before sizing |
| `learning_styles` | `learningStyle` + other | `learningStyle` | jsonb |
| `confidence` | `confidence` | `confidence` | single token |
| `quit_reasons` | `quitReasons` + other | `quitReasons` | coaching bias later; optional for MVP size |
| `raw_answers` | full object | — | includes `schemaVersion` at save time |

#### 4.0.1 Answer tokens (schema_version = 1 seed)

Source: `seed-data.ts` / active `GET /questionnaire/schema`. If schema bumps, update decoder maps + recipes — do not hardcode a parallel list in frontend.

**`goal` (→ `role_recipes.target_role_slug`):**

| Token | Recipe title (suggested) |
| --- | --- |
| `data-analyst` | Data Analyst |
| `front-end-developer` | Front End Developer |
| `back-end-developer` | Back End Developer |
| `marketing-specialist` | Marketing Specialist |

**`skills` (→ prune / tag match on `skill_nodes.tags`):**

`excel` · `sql` · `python` · `javascript` · `html-css` · `data-viz` · `communication` · `marketing-seo` · `none`

Note: seed has **no** `react` skill option. Prior React exposure arrives via `skillsOther` free text or later schema options — treat `skillsOther` as soft signal for AI/prune heuristics only.

**`studyHours` → approximate weekly hours (midpoint):**

| Token | Hours/week used for sizing |
| --- | --- |
| `lt-3` | 2 |
| `3-5` | 4 |
| `5-8` | 6.5 |
| `8-12` | 10 |
| `gt-12` | 14 |

**`deadline` → timeline weeks (cap recipe default):**

| Token | Timeline weeks |
| --- | --- |
| `1-3` | 8 |
| `3-6` | 16 |
| `6-12` | 24 |
| `12+` | 40 |
| `none` | recipe `default_timeline_weeks` |

**`learningStyle` (→ `lesson_templates.learning_style_tags`):**

`doing` · `videos` · `reading` · `quizzes` · `guides`

**`confidence` (ordered low → high for `include_if_confidence_gte`):**

`starting` < `beginner` < `somewhat` < `confident` < `very`

---

### 4.1 Skill Graph — `tech_stacks`

One row per technology / track unit (React, SQL, Excel, TypeScript, …).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `slug` | varchar unique | `react`, `sql`, `excel`, `typescript` |
| `name` | varchar | Display: `React` |
| `category` | varchar | `frontend` \| `backend` \| `data` \| `tooling` \| `soft-skills` \| … |
| `description` | text | Short blurb |
| `icon_key` | varchar nullable | Frontend asset key |
| `default_difficulty` | varchar | `beginner` \| `intermediate` \| `advanced` |
| `is_active` | boolean | Soft-disable without delete |
| `metadata` | jsonb | Extensible (docs URLs, tags) |
| `created_at` / `updated_at` | timestamptz | |

**Dynamic:** add Vue, Next.js, GraphQL later via seed/admin — no migration of “role enums” required.

---

### 4.2 Skill Graph — `skill_nodes`

Directed learning graph inside / across stacks. **This table family is the Skill Graph Engine.**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `tech_stack_id` | uuid FK → `tech_stacks` | |
| `slug` | varchar | Unique per stack: `hooks`, `select-basics` |
| `title` | varchar | `React Hooks` |
| `description` | text | |
| `order_hint` | int | Default order inside stack |
| `estimated_hours` | numeric | Rough content weight |
| `difficulty` | varchar | |
| `prerequisite_skill_ids` | uuid[] or join table | Edges for DAG |
| `tags` | text[] | Match questionnaire skill **tokens** (`sql`, `javascript`, …) |
| `is_active` | boolean | |

Prefer join table `skill_prerequisites (skill_id, requires_skill_id)` if graph gets large.

---

### 4.3 Skill Graph — `lesson_templates` (pool learning documents)

**Primary Learning Document Pool unit.** Reusable, customizable lesson documents bound to a skill node (not yet a user lesson). Same schema for every category / job — see §0.1 authoring contract.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `skill_node_id` | uuid FK | |
| `slug` | varchar | Stable authoring id |
| `title` | varchar | |
| `mission_name_template` | varchar nullable | e.g. `Hook the dragon` |
| `lesson_type` | varchar | `video` \| `reading` \| `practice` \| `quiz` \| `reflection` \| `mini_project` |
| `estimated_minutes` | int | |
| `difficulty` | varchar | |
| `reward_class` | varchar | Input to Gamification calculator; optional preview snapshot only |
| `learning_style_tags` | text[] | Same tokens as schema `learningStyle` options |
| `order_hint` | int | |
| `default_resource_id` | uuid FK nullable → `resources` | |
| `content_outline` | jsonb | Objectives, checklist — customizable; AI may expand copy on instance |
| `is_active` | boolean | Soft-remove from pool without delete |

---

### 4.4 Skill Graph — `resources` (product §12.8 / §10.2)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `title` | varchar | |
| `url` | text | Curated only in MVP — **no invented URLs from AI** |
| `provider` | varchar | |
| `resource_type` | varchar | `video` \| `article` \| `docs` \| `course` \| `tool` |
| `skill_tags` | text[] | |
| `tech_stack_ids` | uuid[] or M2M | Optional link |
| `difficulty` | varchar | |
| `estimated_minutes` | int nullable | |
| `language` | varchar | default `en` |
| `quality_score` | numeric nullable | |
| `is_free` | boolean | |
| `last_checked_at` | timestamptz nullable | |
| `is_active` | boolean | |

MVP: semi-curated library. AI may **pick** from this table by id/slug; must not invent links (product §9.3).

---

### 4.5 Skill Graph — `role_recipes`

Maps questionnaire goal slugs → ordered stack plan.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `target_role_slug` | varchar unique | Exact `goal` option value from questionnaire schema |
| `title` | varchar | `Front End Developer` (match option label) |
| `summary` | text | |
| `default_timeline_weeks` | int | Baseline before personalization |
| `stack_plan` | jsonb | See below |
| `prompt_hints` | jsonb | Extra context for AI generator |
| `is_active` | boolean | |

#### `stack_plan` shape

```json
{
  "phases": [
    {
      "key": "foundations",
      "title": "Web Foundations",
      "tech_stack_slugs": ["html-css", "javascript"],
      "required": true
    },
    {
      "key": "react-core",
      "title": "React Core",
      "tech_stack_slugs": ["react"],
      "required": true
    },
    {
      "key": "react-advanced",
      "title": "Advanced React & Tooling",
      "tech_stack_slugs": ["typescript", "react", "testing-library"],
      "required": false,
      "include_if_confidence_gte": "somewhat"
    },
    {
      "key": "portfolio",
      "title": "Portfolio & Interview",
      "tech_stack_slugs": ["portfolio", "interview-prep"],
      "required": true
    }
  ]
}
```

Multi-goal questionnaire (`target_roles: ["front-end-developer", "data-analyst"]`): MVP pick **primary** = first role; optional later: merge recipes with capped lesson count.

---

### 4.6 Instance — `roadmaps` (user learning path root · product §12.4)

Created **after questionnaire submit**. This is the personalized path assembled from the Learning Document Pool — not the pool itself.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `goal_id` | uuid FK | |
| `title` | varchar | |
| `description` | text | |
| `primary_role_slug` | varchar | |
| `timeline_weeks` | int | Personalized |
| `weekly_hours_target` | numeric nullable | From goal |
| `status` | enum | `generating` \| `ready` \| `failed` \| `archived` |
| `current_phase_id` | uuid nullable | |
| `progress_percent` | numeric default 0 | |
| `generated_by_prompt_version` | varchar | e.g. `roadmap_generator_v1` |
| `generation_meta` | jsonb | Inputs snapshot, skipped skills, recipe id |
| `created_at` / `updated_at` | timestamptz | |

Unique partial index: one **active/ready** roadmap per `goal_id` (or per user MVP).

---

### 4.7 Instance — `roadmap_phases` (§12.5)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `roadmap_id` | uuid FK | |
| `tech_stack_id` | uuid FK nullable | Traceability to catalog |
| `title` | varchar | |
| `description` | text | |
| `order_index` | int | |
| `locked` | boolean default true | Unlock sequentially |
| `completed_at` | timestamptz nullable | |

---

### 4.8 Instance — `milestones` (§12.6)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `phase_id` | uuid FK | |
| `skill_node_id` | uuid FK nullable | Source skill |
| `title` | varchar | |
| `description` | text | |
| `type` | varchar | `skill` \| `assessment` \| `project` |
| `order_index` | int | |
| `reward_rule_key` | varchar nullable | Milestone reward input; final grant via Gamification |
| `completed_at` | timestamptz nullable | |

---

### 4.9 Instance — `lessons` (§12.7)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `milestone_id` | uuid FK | |
| `lesson_template_id` | uuid FK nullable | Provenance |
| `title` | varchar | |
| `mission_name` | varchar nullable | |
| `description` | text | |
| `lesson_type` | varchar | |
| `estimated_minutes` | int | |
| `difficulty` | varchar | |
| `reward_class` | varchar | Gamification rule input |
| `reward_preview_xp` | int nullable | Non-binding UI snapshot |
| `order_index` | int | |
| `resource_id` | uuid FK nullable | From catalog |
| `status` | varchar nullable | Compatibility only; serializer should derive state from progress + unlock evaluator |

---

### 4.10 Instance — `lesson_progress` (§12.9)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `lesson_id` | uuid FK | |
| `status` | varchar | `not_started` \| `in_progress` \| `completed` |
| `started_at` / `completed_at` | timestamptz nullable | |
| `time_spent_minutes` | int default 0 | |
| `xp_awarded` | int default 0 | Server-set only |
| `retry_count` | int default 0 | |

Unique `(user_id, lesson_id)`.

---

### 4.11 Jobs — `roadmap_generation_jobs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | = `jobId` returned on questionnaire submit |
| `goal_id` | uuid FK | |
| `user_id` | uuid FK | |
| `status` | enum | `queued` \| `processing` \| `ready` \| `failed` |
| `roadmap_id` | uuid nullable | Set when ready |
| `error_code` / `error_message` | varchar/text nullable | |
| `attempts` | int | |
| `created_at` / `updated_at` / `finished_at` | timestamptz | |

Questionnaire submit already returns `{ status, jobId, roadmapId }` — keep that contract; fill real rows here.

---

## 5. Roadmap Generator algorithm (must be per-user)

**Trigger:** questionnaire complete → enqueue. **Input:** `goals` tokens. **Source:** Learning Document Pool. **Output:** user learning path instance.

Domain-agnostic: same steps for React, Marketing, DevOps — only pool documents + recipe data change.

Inputs (from `goals` + profile):

- `target_roles[]` — schema `goal` tokens
- `skills.values[]` (+ `other`) — schema `skills` tokens; ignore prune if only `none`
- `weekly_hours` / `target_deadline` — **decode tokens** (§4.0.1) before math
- `availability` — days/times for later weekly plan (doc 04); optional soft bias now
- `learning_styles.values[]`
- `confidence` — ordered compare for optional phases
- `quit_reasons` — optional: shorter milestones / more encouragement copy in AI pass
- `raw_answers` + response `schema_version` — audit / AI context

Steps:

1. **Resolve recipe** — `role_recipes` where `target_role_slug = goals.target_roles[0]`. Missing → `ROLE_RECIPE_MISSING`.
2. **Decode capacity** — map `weekly_hours` + `target_deadline` tokens → `hoursPerWeek` × `timelineWeeks` = budget minutes.
3. **Load pool subgraph** — `tech_stacks` + `skill_nodes` + `lesson_templates` (learning documents) + assessments for each phase in `stack_plan`.
4. **Prune known skills** — if `skills.values` (minus `none`) intersect `skill_nodes.tags`, skip or compress those nodes to short “refresh” milestones. Never mutate pool rows.
5. **Size to time** — sum document minutes vs budget. Over → drop `required: false` phases / advanced nodes first. Under + confidence ≥ `confident` → keep optional advanced phase.
6. **Style bias** — prefer lesson documents whose `learning_style_tags` intersect user styles; keep ≥1 `practice` per skill when possible.
7. **Order** — topological sort by prerequisites; then `order_hint`.
8. **AI pass (optional, still Generator)** — pruned pool snapshot + `raw_answers` + goal summary → `roadmap_generator_v1` via OpenAI (`RoadmapAiService`):
   - titles / mission names
   - order tweaks within constraints (existing ids only)
   - pick `resource_id`s **only from provided ids**
   - structured JSON validated with Zod (`roadmap-ai.schema.ts`)
9. **Validate** — Zod; reject unknown ids; scale lesson count already applied in deterministic sizing.
10. **Persist learning path** — transaction: job → roadmap → phases → milestones → lessons (instance copies of pool documents); unlock first phase.
11. **Fail soft** — missing `OPENAI_API_KEY`, timeout, invalid JSON, or Zod failure → deterministic pool assembly still ships a path. `generation_meta.aiUsed` / `aiSkippedReason` records outcome.

**Deterministic fallback is required for MVP reliability.**

Store in `roadmaps.generation_meta`: `{ schemaVersion, recipeId, decodedHours, decodedWeeks, skippedSkillNodeIds, promptVersion, aiUsed, aiModel?, aiSkippedReason? }`.

---

## 5.1 AI Coach (continuous — after initial generate)

Separate from one-shot Roadmap Generator. Coach **patches the user roadmap instance** when signals change.

| Input signal | Coach action (examples) |
| --- | --- |
| Lesson / assessment pass/fail | Insert remediation nodes from Skill Graph; skip ahead if mastery proven |
| Pace vs `weekly_hours` / deadline | Compress optional phases; extend timeline weeks |
| Learning-style / quit-reason bias | Prefer practice vs video templates already on graph |
| Stuck / missed week | Soft replan (product `weekly_replanner_v1` — may live under Coach) |

Rules:

1. Read Skill Graph + current instance + progress — **never** invent catalog URLs or skill nodes.
2. Write only instance tables (`roadmaps` / phases / milestones / lessons / progress meta).
3. Version prompts (`ai_coach_replan_v1`); Zod-validate before apply.
4. Idempotent jobs; respect lock state (do not unlock arbitrary future phases without product rules).

MVP: Coach can be stubbed; Generator alone ships first path. Wire Coach after progress APIs (doc 04/05).

---

## 6. Example: Front End Developer → React path

Assume validated submit answers (schema v1 tokens):

```json
{
  "goal": ["front-end-developer"],
  "motivation": ["career", "growth"],
  "currentJob": "employed-unrelated",
  "skills": ["html-css", "javascript"],
  "skillsOther": "some React tutorials",
  "studyHours": "5-8",
  "schedule": { "days": ["Mon", "Wed", "Sat"], "times": ["evening"] },
  "deadline": "6-12",
  "learningStyle": ["doing", "videos"],
  "confidence": "somewhat",
  "quitReasons": ["direction", "time"]
}
```

Decoded: ~6.5 h/week × 24 weeks ≈ 156h budget.

Catalog seed (illustrative):

| Stack slug | Skill nodes (abbrev.) | Tags overlap questionnaire |
| --- | --- | --- |
| `html-css` | selectors, layout, responsive | `html-css` |
| `javascript` | es6, async, modules | `javascript` |
| `react` | jsx-basics, components, hooks, state, effects, routing, data-fetching | (none in v1 skills — always taught unless `skillsOther` heuristics) |
| `typescript` | types-basics, react-typescript | — |
| `testing-library` | component-tests | — |
| `portfolio` | project-plan, ship-app | — |
| `interview-prep` | fe-system-design-lite, common-questions | — |

Generator behavior:

1. Recipe: Foundations → React Core → Advanced (confidence ≥ `somewhat`) → Portfolio.
2. Compress `html-css` + deep JS foundations (skills already selected); keep thin “JS for React” refresh.
3. React Core = main bulk; lessons bias `video` + `practice`.
4. Fit ~80–100 lessons into budget; drop advanced if over.
5. User with `skills: ["none"]` gets full foundations; user with `html-css`+`javascript` skips ahead — **same Learning Document Pool, different path instance**.

---

## 7. API contracts

### 7.1 Already exists (keep) — see doc 02

| Endpoint | Role for roadmap |
| --- | --- |
| `GET /questionnaire/schema` | Source of allowed answer tokens (roles, skills, hours, …) |
| `POST /questionnaire/submit` | Creates/updates `goals`, returns `{ roadmap: { status, jobId, roadmapId } }` |
| `GET /me` | `questionnaireStatus` gate before home / roadmap UI |

Worker must persist real `jobId` from submit. Idempotent re-submit re-queues (current stub behavior) — decide later whether to no-op if roadmap `ready`.

### 7.2 `GET /roadmaps/current`

Auth required. Current user’s active roadmap tree (or generating status).

```json
{
  "job": {
    "id": "uuid",
    "status": "processing",
    "roadmapId": null
  },
  "roadmap": null
}
```

When ready:

```json
{
  "job": { "id": "uuid", "status": "ready", "roadmapId": "uuid" },
  "roadmap": {
    "id": "uuid",
    "title": "Front End Developer Path",
    "primaryRoleSlug": "front-end-developer",
    "timelineWeeks": 24,
    "progressPercent": 0,
    "currentPhaseId": "uuid",
    "phases": [
      {
        "id": "uuid",
        "title": "React Core",
        "orderIndex": 1,
        "locked": false,
        "techStackSlug": "react",
        "milestones": [
          {
            "id": "uuid",
            "title": "Hooks",
            "orderIndex": 2,
            "lessons": [
              {
                "id": "uuid",
                "title": "useState in practice",
                "missionName": "State of the union",
                "lessonType": "practice",
                "estimatedMinutes": 30,
                "rewardClass": "standard_practice",
                "status": "available",
                "resource": {
                  "id": "uuid",
                  "title": "React docs: useState",
                  "url": "https://react.dev/reference/react/useState",
                  "provider": "react.dev"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 7.3 `GET /roadmaps/jobs/:jobId`

Poll single job (questionnaire redirect / home banner).

### 7.4 Admin/content (later OK)

- CRUD or seed-only for Learning Document Pool
- MVP: TypeORM sync + `catalog.seed.ts` for Data Analyst + Front-end (React) + all four recipes
- Future CMS: edit lesson documents / recipes without redeploying generator code

---

## 8. Seed strategy (Learning Document Pool)

1. Ship pool seeds: `skill-graph/seeds/catalog.seed.ts` (MVP) and/or per-domain files (`react.json`, `sql.json`, `marketing.json`, `seo.json`, …).
2. Each seed: stack meta + skill nodes + **lesson documents** (customizable format §0.1) + assessment templates + resource refs + prerequisite edges.
3. `RoleRecipe` seed: one row per questionnaire `goal` option value (`data-analyst`, `front-end-developer`, `back-end-developer`, `marketing-specialist`) — maps job → which pool slices to use.
4. `skill_nodes.tags` must reuse questionnaire `skills` tokens where overlap exists (`sql`, `python`, `excel`, `javascript`, `html-css`, `data-viz`, …).
5. Adding a new career / category → optional Question Engine option **and** matching `role_recipes` + pool documents — **Roadmap Generator + AI Coach core unchanged**.
6. Adding “Next.js” / “SEO technical” only → new pool seed + recipe phase — no Question Engine change required.
7. Authors customize titles, minutes, styles, outlines, resources in seed data — not in generator TypeScript.

Do not embed full lesson trees in Nest providers. Do not duplicate questionnaire option enums inside roadmap/coach code — import decoder maps keyed by schema version, or read active schema option values at boot for validation.

---

## 9. Guardrails

From product §9.3 — enforce in generator + validators:

- No invented resource URLs (only catalog ids)
- No “guaranteed job” / fake certificates in AI copy
- No job-ready claim without assessments
- Cap roadmap size (max lessons / phases) to protect DB + UI
- Never trust client for XP on complete (doc 05)

---

## 10. Error codes

| Code | When |
| --- | --- |
| `GOAL_NOT_FOUND` | Generate for missing goal |
| `ROLE_RECIPE_MISSING` | No recipe for target role |
| `CATALOG_EMPTY` | Stack has no active skill nodes |
| `ROADMAP_GENERATION_FAILED` | Worker exhausted retries |
| `ROADMAP_NOT_READY` | Client fetched tree while generating |
| `ROADMAP_NOT_FOUND` | No roadmap for user |

---

## 11. Acceptance criteria

- [ ] Learning Document Pool tables exist; lesson documents use the customizable format (§0.1)
- [ ] Pool seeds cover Data Analyst **and** Front End (React) at minimum; recipes for all questionnaire goals
- [ ] `role_recipes.target_role_slug` matches every active questionnaire `goal` option value
- [ ] `studyHours` / `deadline` tokens decode via §4.0.1 (not invent new hour strings)
- [ ] Skill prune uses schema skill tokens (`sql`, `javascript`, …); `none` skips prune
- [ ] Questionnaire submit enqueues real job → personalized **learning path** created from pool
- [ ] Job transitions `queued → processing → ready|failed`; frontend can poll `/roadmaps/current`
- [ ] Two users with different skills/hours get **different** paths from the **same** pool
- [ ] Path API returns phases → milestones → lessons + resources
- [ ] AI path validates Zod schema; fallback works without AI keys
- [ ] Progress % updates when lessons complete (hook for doc 04/05 + AI Coach)
- [ ] Generator has no hard-coded “only Data Analyst” branch — role from recipe + pool data
- [ ] New category/job seed works without editing Roadmap Generator / Coach algorithms

---

## 12. Out of scope (later docs)

- Weekly plan scheduling (uses `availability`) → **04 Weekly Plan & Lessons**
- XP / coins / gems on complete → **05 Rewards**
- Full AI Coach replan loop (scaffold exists; product `weekly_replanner_v1` may fold in)
- Admin CMS for Question Engine or Skill Graph edits
- Multi-active goals / career switch mid-roadmap rules
- Employer skill verification

---

## 13. Implementer checklist

- [ ] Migrations: skill-graph catalog + roadmap instance + jobs + progress
- [ ] Token decoders for `studyHours` + `deadline` (schema v1); versioned if schema bumps
- [ ] Seed recipes for all four goal options; stacks: React path + Data Analyst (SQL/Excel/Python/…)
- [ ] Tag skill nodes with questionnaire skill tokens where applicable
- [ ] `SkillGraphService` load subgraph by recipe (no user logic)
- [ ] `RoadmapGeneratorService.assemble(goalId)` deterministic traverse + prune
- [x] Optional generator AI enrich + Zod validate (`RoadmapAiService`, soft-fail)
- [x] Queue processor wired from `RoadmapsService.enqueueGenerate`
- [ ] `CoachService` stub hooks for progress/assessment events
- [ ] `GET /roadmaps/current` + job poll
- [ ] e2e: schema-valid submit (`front-end-developer`, `studyHours: "5-8"`, …) → job ready → React phase present
- [ ] Unit tests: prune `html-css`/`javascript`; `lt-3`+`1-3` drops optional phases; missing recipe errors
- [ ] Prove new domain seed (e.g. Marketing) needs **zero** generator code change

---

## 14. Integrated Roadmap Lifecycle, Scheduling and Rewards

### 14.1 Roadmap status and versioning

Use:

- `queued`
- `generating`
- `validating`
- `ready`
- `active`
- `replanning`
- `failed`
- `archived`

Add `version`, `source_goal_id`, `source_goal_revision`, `content_catalog_version`, and `activated_at`.

Only one roadmap is active per user. A replacement roadmap is generated/validated off to the side and swapped atomically after Course Timing can produce a feasible initial schedule.

### 14.2 Published content versions

Each lesson instance references:

- stable lesson template ID
- published lesson version ID
- source skill node/version
- content/reward-class snapshot

A later Content Pool edit does not silently alter a lesson already assigned to a user.

### 14.3 Roadmap generation completion

Generation is successful only when:

1. graph/prerequisite validation passes
2. every required node has published playable content
3. reward classes and estimated minutes are valid
4. Course Timing feasibility is calculated
5. at least the first rolling content window can be materialized

Then emit `roadmap.generated.v1`. Course Timing creates schedule slots and doc 04 projects the current week.

### 14.4 Rolling materialization

Persist the full skill/milestone outline, but materialize detailed lessons for the next 2–4 weeks. Expand the window as the user progresses. Completed lesson versions never change.

### 14.5 Unlock ownership

Roadmap stores prerequisite/gate definitions and user path nodes. Unlock Evaluator in Gamification determines whether a node is actionable from:

- prerequisite completion
- assessment/milestone proof
- XP floor where explicitly configured
- entitlement/paywall rules

`GET /roadmaps/current` serializes `locked`, `available`, `in_progress`, or `completed`; the client does not calculate unlocks.

### 14.6 Reward ownership

Roadmap/template reward fields are previews or reward-class inputs. Final XP/Gems/Coins come from `gamification.md` at completion. Roadmap code never credits Profile or Wallet.

### 14.7 Progress calculation

Roadmap percentage is a projection derived from `lesson_progress`, milestone, challenge, and project records. Prefer weighted required progress rather than raw lesson count when projects/assessments carry more proof value.

### 14.8 AI Coach mutation boundary

Coach may propose:

- reorder incomplete optional nodes
- insert review/remediation
- request Course Timing replan
- request a replacement roadmap version after material goal/skill change

Coach may not:

- mutate published pool rows
- delete completed progress
- directly unlock required gates
- award currency
- change rank/league state
- schedule reminders directly

All proposed state changes are validated and audited.

### 14.9 Current mission and Home

Roadmap does not independently select Today’s Mission. Course Timing + Weekly Plan select the next actionable task. A read-only Home composition API may include roadmap phase/milestone summaries.

### 14.10 Events

- `roadmap.generation_requested.v1`
- `roadmap.generated.v1`
- `roadmap.generation_failed.v1`
- `roadmap.activated.v1`
- `roadmap.regenerated.v1`
- `milestone.completed.v1`

All generation jobs are unique by goal revision and generator version.

### 14.11 Integration acceptance

- active roadmap is never replaced by a failed/infeasible draft
- generated path always hands off to Course Timing/current week
- lesson instances reference published content versions
- final rewards are not hardcoded/credited by roadmap
- unlock states are server-derived
- Coach changes preserve completed history and use versioned commands

## 15. Env

```env
ROADMAP_QUEUE_NAME=roadmap-generate
ROADMAP_GENERATOR_PROMPT_VERSION=roadmap_generator_v1
OPENAI_ROADMAP_MODEL=gpt-4o-mini
# Align with questionnaire schema version used at goal creation
QUESTIONNAIRE_SCHEMA_VERSION=1
# Optional — if unset, generator ships deterministic path (soft-fail)
OPENAI_API_KEY=
```

Docker Compose passes `${OPENAI_API_KEY:-}` into the app. Put the key in local `.env` only (gitignored). Never commit secrets.
