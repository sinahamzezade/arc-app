# 03 — Skill Graph, Roadmap Generator & AI Coach

**Version:** 3.2 (AI unit orchestration — propose + server validate)  
**Integration:** Shared curriculum is further specified in [08 — Content Pool](../content-pool/08-content-pool.md) v3.0, which now compiles the authoring graph into flat, self-describing **units** plus a **skills index** (the prerequisite DAG). This generator consumes that compiled projection, not the authoring tree. A generated roadmap is not Home-ready until Course Timing and the current Weekly Plan are ready.

**What changed in 3.2:** when `roadmap_ai_orchestrator_enabled` (default on for engine mode `llm`), the LLM may **propose which allow-list units to include and their order**, plus phase titles. The server **validates/repairs** (allow-list only, required coverage, prereq order, budget, sole checkpoint protection). On LLM failure → deterministic `selectUnitsPerSkill` + `packBudget` + narrator-only. See §5 and content_pool §7.

**What changed in 3.0:** gap, topo, allow-list filters, and budget floors stay deterministic backend code; the LLM never invents unit ids outside the pool.

**Engines:** Skill Graph Engine · Roadmap Generator · AI Coach (see [README](../README.md) four-engine map)  
**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Arc Next.js PWA (`arc-app`)  
**Product source:** `src/doc/Arc_MVP_Full_Technical_Roadmap.md` § Personalized Roadmap, § Resource Discovery, § DB `goals` / `roadmaps` / phases / milestones / lessons / resources, § `generate_roadmap`  
**Depends on:** [00](../integration/00-system-integration.md), [02](../questionnaire/02-questionnaire.md), [08 — Content Pool](../content-pool/08-content-pool.md)  
**Feeds:** [09 — Course Timing](../course-timing/09-course-timing.md), [04](../weeks/04-weekly-plan-and-lessons.md), [05](../lessons/05-learn-lesson-play-api.md), [07 — Gamification](../gamification/07-gamification.md)

This doc covers three engines that turn a submitted goal into a **per-user learning path** and keep it fresh.

**Core product rule:** Arlo keeps one shared **Learning Document Pool** (customizable content for every category / job). Questionnaire answers do **not** invent curriculum — they **select + order + prune** documents from that pool into a personal path.

Domain content (Marketing, SEO, React, DevOps, AI, …) lives in the **Skill Graph / pool only** — generator / coach code stays domain-agnostic.

**Question Engine contract:** answer **tokens** (`goal`, `skills`, `studyHours`, …) come from `GET /questionnaire/schema` / `goals` columns + `raw_answers`. Roadmap Generator consumes those tokens — never a second hardcoded enum list, never questionnaire UI rows.

---

## 0. Four engines (this doc = 3 of 4)

| Engine                 | Owns                                                                                         | Nest home                         |
| ---------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| Question Engine        | Adaptive Q + branching → `goals` tokens                                                      | `questionnaire/` (doc 02)         |
| **Skill Graph Engine** | **Learning Document Pool** — skills, prerequisites, modules, lessons, assessments, resources | `skill-graph/`                    |
| **Roadmap Generator**  | After questionnaire: pick from pool → personalized learning path instance                    | `roadmaps/` (+ generator service) |
| **AI Coach**           | Continuous: replan from progress, assessments, learning behavior                             | `coach/`                          |

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

| Pool piece                      | Table / seed           | Role                                                               |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| **Category / tech unit**        | `tech_stacks`          | e.g. `react`, `sql`, `marketing-seo`                               |
| **Skill node**                  | `skill_nodes`          | Graph vertex + tags that match questionnaire skill tokens          |
| **Lesson document**             | `lesson_templates`     | Customizable learning unit (video / reading / practice / quiz / …) |
| **Assessment document**         | `assessment_templates` | Checkpoints on the graph                                           |
| **External / curated resource** | `resources`            | Stable URLs + metadata (never AI-invented)                         |
| **Job → pool recipe**           | `role_recipes`         | Which stacks/phases a questionnaire `goal` token pulls             |

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

**Compiled projection (v3.0):** the generator does not traverse the authoring graph at request time. On publish, content_pool compiles the pool into self-describing **units** (each carrying `skills_taught`, `prerequisites`, `level`, `estimated_minutes`, `formats`, and its `content`) plus a **skills index** (the DAG). Step 3b above ("Load the pool subgraph") means _read the compiled units + skills index for the recipe_, cached and version-pinned — never a live tree walk.

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

| Layer                                               | Engine                                         | Shared?                  | Mutates per user? |
| --------------------------------------------------- | ---------------------------------------------- | ------------------------ | ----------------- |
| **Learning Document Pool** (authoring graph)        | Skill Graph                                    | Yes (admin/content)      | No                |
| **Compiled units + skills index** (read projection) | content_pool compiler                          | Yes (derived on publish) | No                |
| **Role recipes**                                    | Skill Graph (job → pool entry)                 | Yes                      | No                |
| **User learning path**                              | Roadmap Generator (create) / AI Coach (update) | No                       | Yes               |
| **Progress**                                        | Coach inputs + gamification docs               | No                       | Yes               |

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

| Goal column          | Answer field                     | Schema step `id` | Notes                                         |
| -------------------- | -------------------------------- | ---------------- | --------------------------------------------- |
| `target_roles`       | `goal[]`                         | `goal`           | Multi; primary = index 0                      |
| `motivation`         | `motivation` + `motivationOther` | `motivation`     | jsonb `{ values, other? }`                    |
| `current_profession` | `currentJob`                     | `currentJob`     | single (+ other text)                         |
| `skills`             | `skills` + `skillsOther`         | `skills`         | jsonb; `none` exclusive                       |
| `weekly_hours`       | `studyHours`                     | `studyHours`     | **token** — decode before sizing              |
| `availability`       | `schedule`                       | `schedule`       | `{ days, times }` from schema schedule config |
| `target_deadline`    | `deadline`                       | `deadline`       | **token** — decode before sizing              |
| `learning_styles`    | `learningStyle` + other          | `learningStyle`  | jsonb                                         |
| `confidence`         | `confidence`                     | `confidence`     | single token                                  |
| `quit_reasons`       | `quitReasons` + other            | `quitReasons`    | coaching bias later; optional for MVP size    |
| `raw_answers`        | full object                      | —                | includes `schemaVersion` at save time         |

#### 4.0.1 Answer tokens (schema_version = 1 seed)

Source: `seed-data.ts` / active `GET /questionnaire/schema`. If schema bumps, update decoder maps + recipes — do not hardcode a parallel list in frontend.

**`goal` (→ `role_recipes.target_role_slug`):**

| Token                  | Recipe title (suggested) |
| ---------------------- | ------------------------ |
| `data-analyst`         | Data Analyst             |
| `front-end-developer`  | Front End Developer      |
| `back-end-developer`   | Back End Developer       |
| `marketing-specialist` | Marketing Specialist     |

**`skills` (→ prune / tag match on `skill_nodes.tags`):**

`excel` · `sql` · `python` · `javascript` · `html-css` · `data-viz` · `communication` · `marketing-seo` · `none`

Note: seed has **no** `react` skill option. Prior React exposure arrives via `skillsOther` free text or later schema options — treat `skillsOther` as soft signal for AI/prune heuristics only.

**`studyHours` → approximate weekly hours (midpoint):**

| Token   | Hours/week used for sizing |
| ------- | -------------------------- |
| `lt-3`  | 2                          |
| `3-5`   | 4                          |
| `5-8`   | 6.5                        |
| `8-12`  | 10                         |
| `gt-12` | 14                         |

**`deadline` → timeline weeks (cap recipe default):**

| Token  | Timeline weeks                  |
| ------ | ------------------------------- |
| `1-3`  | 8                               |
| `3-6`  | 16                              |
| `6-12` | 24                              |
| `12+`  | 40                              |
| `none` | recipe `default_timeline_weeks` |

**`learningStyle` (→ `lesson_templates.learning_style_tags`):**

`doing` · `videos` · `reading` · `quizzes` · `guides`

**`confidence` (ordered low → high for `include_if_confidence_gte`):**

`starting` < `beginner` < `somewhat` < `confident` < `very`

---

### 4.1 Skill Graph — `tech_stacks`

One row per technology / track unit (React, SQL, Excel, TypeScript, …).

| Column                      | Type             | Notes                                                                |
| --------------------------- | ---------------- | -------------------------------------------------------------------- |
| `id`                        | uuid PK          |                                                                      |
| `slug`                      | varchar unique   | `react`, `sql`, `excel`, `typescript`                                |
| `name`                      | varchar          | Display: `React`                                                     |
| `category`                  | varchar          | `frontend` \| `backend` \| `data` \| `tooling` \| `soft-skills` \| … |
| `description`               | text             | Short blurb                                                          |
| `icon_key`                  | varchar nullable | Frontend asset key                                                   |
| `default_difficulty`        | varchar          | `beginner` \| `intermediate` \| `advanced`                           |
| `is_active`                 | boolean          | Soft-disable without delete                                          |
| `metadata`                  | jsonb            | Extensible (docs URLs, tags)                                         |
| `created_at` / `updated_at` | timestamptz      |                                                                      |

**Dynamic:** add Vue, Next.js, GraphQL later via seed/admin — no migration of “role enums” required.

---

### 4.2 Skill Graph — `skill_nodes`

Directed learning graph inside / across stacks. **This table family is the Skill Graph Engine.**

| Column                   | Type                    | Notes                                                         |
| ------------------------ | ----------------------- | ------------------------------------------------------------- |
| `id`                     | uuid PK                 |                                                               |
| `tech_stack_id`          | uuid FK → `tech_stacks` |                                                               |
| `slug`                   | varchar                 | Unique per stack: `hooks`, `select-basics`                    |
| `title`                  | varchar                 | `React Hooks`                                                 |
| `description`            | text                    |                                                               |
| `order_hint`             | int                     | Default order inside stack                                    |
| `estimated_hours`        | numeric                 | Rough content weight                                          |
| `difficulty`             | varchar                 |                                                               |
| `prerequisite_skill_ids` | uuid[] or join table    | Edges for DAG                                                 |
| `tags`                   | text[]                  | Match questionnaire skill **tokens** (`sql`, `javascript`, …) |
| `is_active`              | boolean                 |                                                               |

Prefer join table `skill_prerequisites (skill_id, requires_skill_id)` if graph gets large.

---

### 4.3 Skill Graph — `lesson_templates` (pool learning documents)

**Primary Learning Document Pool unit.** Reusable, customizable lesson documents bound to a skill node (not yet a user lesson). Same schema for every category / job — see §0.1 authoring contract.

| Column                  | Type                           | Notes                                                                          |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `id`                    | uuid PK                        |                                                                                |
| `skill_node_id`         | uuid FK                        |                                                                                |
| `slug`                  | varchar                        | Stable authoring id                                                            |
| `title`                 | varchar                        |                                                                                |
| `mission_name_template` | varchar nullable               | e.g. `Hook the dragon`                                                         |
| `lesson_type`           | varchar                        | `video` \| `reading` \| `practice` \| `quiz` \| `reflection` \| `mini_project` |
| `estimated_minutes`     | int                            |                                                                                |
| `difficulty`            | varchar                        |                                                                                |
| `reward_class`          | varchar                        | Input to Gamification calculator; optional preview snapshot only               |
| `learning_style_tags`   | text[]                         | Same tokens as schema `learningStyle` options                                  |
| `order_hint`            | int                            |                                                                                |
| `default_resource_id`   | uuid FK nullable → `resources` |                                                                                |
| `content_outline`       | jsonb                          | Objectives, checklist — customizable; AI may expand copy on instance           |
| `is_active`             | boolean                        | Soft-remove from pool without delete                                           |

---

### 4.4 Skill Graph — `resources` (product §12.8 / §10.2)

| Column              | Type                 | Notes                                                |
| ------------------- | -------------------- | ---------------------------------------------------- |
| `id`                | uuid PK              |                                                      |
| `title`             | varchar              |                                                      |
| `url`               | text                 | Curated only in MVP — **no invented URLs from AI**   |
| `provider`          | varchar              |                                                      |
| `resource_type`     | varchar              | `video` \| `article` \| `docs` \| `course` \| `tool` |
| `skill_tags`        | text[]               |                                                      |
| `tech_stack_ids`    | uuid[] or M2M        | Optional link                                        |
| `difficulty`        | varchar              |                                                      |
| `estimated_minutes` | int nullable         |                                                      |
| `language`          | varchar              | default `en`                                         |
| `quality_score`     | numeric nullable     |                                                      |
| `is_free`           | boolean              |                                                      |
| `last_checked_at`   | timestamptz nullable |                                                      |
| `is_active`         | boolean              |                                                      |

MVP: semi-curated library. AI may **pick** from this table by id/slug; must not invent links (product §9.3).

---

### 4.5 Skill Graph — `role_recipes`

Maps questionnaire goal slugs → ordered stack plan.

| Column                   | Type           | Notes                                               |
| ------------------------ | -------------- | --------------------------------------------------- |
| `id`                     | uuid PK        |                                                     |
| `target_role_slug`       | varchar unique | Exact `goal` option value from questionnaire schema |
| `title`                  | varchar        | `Front End Developer` (match option label)          |
| `summary`                | text           |                                                     |
| `default_timeline_weeks` | int            | Baseline before personalization                     |
| `stack_plan`             | jsonb          | See below                                           |
| `prompt_hints`           | jsonb          | Extra context for AI generator                      |
| `is_active`              | boolean        |                                                     |

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

| Column                        | Type              | Notes                                             |
| ----------------------------- | ----------------- | ------------------------------------------------- |
| `id`                          | uuid PK           |                                                   |
| `user_id`                     | uuid FK           |                                                   |
| `goal_id`                     | uuid FK           |                                                   |
| `title`                       | varchar           |                                                   |
| `description`                 | text              |                                                   |
| `primary_role_slug`           | varchar           |                                                   |
| `timeline_weeks`              | int               | Personalized                                      |
| `weekly_hours_target`         | numeric nullable  | From goal                                         |
| `status`                      | enum              | `generating` \| `ready` \| `failed` \| `archived` |
| `current_phase_id`            | uuid nullable     |                                                   |
| `progress_percent`            | numeric default 0 |                                                   |
| `generated_by_prompt_version` | varchar           | e.g. `roadmap_generator_v1`                       |
| `generation_meta`             | jsonb             | Inputs snapshot, skipped skills, recipe id        |
| `created_at` / `updated_at`   | timestamptz       |                                                   |

Unique partial index: one **active/ready** roadmap per `goal_id` (or per user MVP).

---

### 4.7 Instance — `roadmap_phases` (§12.5)

| Column          | Type                 | Notes                   |
| --------------- | -------------------- | ----------------------- |
| `id`            | uuid PK              |                         |
| `roadmap_id`    | uuid FK              |                         |
| `tech_stack_id` | uuid FK nullable     | Traceability to catalog |
| `title`         | varchar              |                         |
| `description`   | text                 |                         |
| `order_index`   | int                  |                         |
| `locked`        | boolean default true | Unlock sequentially     |
| `completed_at`  | timestamptz nullable |                         |

---

### 4.8 Instance — `milestones` (§12.6)

| Column            | Type                 | Notes                                                |
| ----------------- | -------------------- | ---------------------------------------------------- |
| `id`              | uuid PK              |                                                      |
| `phase_id`        | uuid FK              |                                                      |
| `skill_node_id`   | uuid FK nullable     | Source skill                                         |
| `title`           | varchar              |                                                      |
| `description`     | text                 |                                                      |
| `type`            | varchar              | `skill` \| `assessment` \| `project`                 |
| `order_index`     | int                  |                                                      |
| `reward_rule_key` | varchar nullable     | Milestone reward input; final grant via Gamification |
| `completed_at`    | timestamptz nullable |                                                      |

---

### 4.9 Instance — `lessons` (§12.7)

| Column               | Type             | Notes                                                                               |
| -------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `id`                 | uuid PK          |                                                                                     |
| `milestone_id`       | uuid FK          |                                                                                     |
| `lesson_template_id` | uuid FK nullable | Provenance                                                                          |
| `title`              | varchar          |                                                                                     |
| `mission_name`       | varchar nullable |                                                                                     |
| `description`        | text             |                                                                                     |
| `lesson_type`        | varchar          |                                                                                     |
| `estimated_minutes`  | int              |                                                                                     |
| `difficulty`         | varchar          |                                                                                     |
| `reward_class`       | varchar          | Gamification rule input                                                             |
| `reward_preview_xp`  | int nullable     | Non-binding UI snapshot                                                             |
| `order_index`        | int              |                                                                                     |
| `resource_id`        | uuid FK nullable | From catalog                                                                        |
| `status`             | varchar nullable | Compatibility only; serializer should derive state from progress + unlock evaluator |

---

### 4.10 Instance — `lesson_progress` (§12.9)

| Column                        | Type                 | Notes                                         |
| ----------------------------- | -------------------- | --------------------------------------------- |
| `id`                          | uuid PK              |                                               |
| `user_id`                     | uuid FK              |                                               |
| `lesson_id`                   | uuid FK              |                                               |
| `status`                      | varchar              | `not_started` \| `in_progress` \| `completed` |
| `started_at` / `completed_at` | timestamptz nullable |                                               |
| `time_spent_minutes`          | int default 0        |                                               |
| `xp_awarded`                  | int default 0        | Server-set only                               |
| `retry_count`                 | int default 0        |                                               |

Unique `(user_id, lesson_id)`.

---

### 4.11 Jobs — `roadmap_generation_jobs`

| Column                                      | Type                  | Notes                                           |
| ------------------------------------------- | --------------------- | ----------------------------------------------- |
| `id`                                        | uuid PK               | = `jobId` returned on questionnaire submit      |
| `goal_id`                                   | uuid FK               |                                                 |
| `user_id`                                   | uuid FK               |                                                 |
| `status`                                    | enum                  | `queued` \| `processing` \| `ready` \| `failed` |
| `roadmap_id`                                | uuid nullable         | Set when ready                                  |
| `error_code` / `error_message`              | varchar/text nullable |                                                 |
| `attempts`                                  | int                   |                                                 |
| `created_at` / `updated_at` / `finished_at` | timestamptz           |                                                 |

Questionnaire submit already returns `{ status, jobId, roadmapId }` — keep that contract; fill real rows here.

---

## 5. Roadmap Generator algorithm (must be per-user)

**Trigger:** questionnaire complete → enqueue. **Input:** `goals` tokens. **Source:** Learning Document Pool. **Output:** user learning path instance.

Domain-agnostic: same steps for React, Marketing, DevOps — only pool documents + recipe data change.

Inputs — the versioned **`RoadmapGenerationProfile`** snapshot from the Question Engine (doc 02 §10), consumed by id. The generator does **not** re-parse raw answer tokens for skill state; the profile has already derived per-skill stages.

- `primaryTrackSlug` — resolves the role recipe
- `targetStage` + per-skill `skillEstimates[]` (`{ skillSlug, stage 1–5, confidence }`) — drive the stage-aware gap (replaces the old `skills` token prune)
- `capacity.effectiveWeeklyMinutes`, `preferredSessionMinutes`, `days`, `timeWindows`, `timezone`, `paceClass` — capacity + later weekly plan
- `preferences.learningStyleWeights` — format filter / style bias
- `preferences.motivationTags`, `blockerTags` — narration/framing bias (e.g. a "no clear path" blocker)
- `placement.required` + `reasonCodes` — gate high-confidence skips behind a diagnostic
- `targetDeadline?` — timeline sizing
- `profilingModelVersion` — recorded in `generation_meta`

Steps (deterministic prep → AI propose+validate, with deterministic fallback):

1. **Resolve recipe** — `role_recipes` where `target_role_slug = profile.primaryTrackSlug`. Missing → `ROLE_RECIPE_MISSING`.
2. **Decode capacity (in code)** — `budgetMinutes = capacity.effectiveWeeklyMinutes × timelineWeeks × 0.85`, where `timelineWeeks` comes from `targetDeadline` (or recipe default). `effectiveWeeklyMinutes` is already schedule-discounted by doc 02 §8. Computed once, passed downstream as a single number. **Never** recomputed by the model.
3. **Load compiled units + skills index** — read the version-pinned compiled projection for each stack in `stack_plan` (content_pool §4.2, §6.7–6.8). No authoring-tree traversal.
4. **Gap (stage-aware)** — resolve each `skillEstimate.skillSlug` onto its `domain:*` skill nodes (content_pool §7.1); each node inherits an **entry stage**. Per node, choose an action from entry stage + confidence: verified mastered → omit; provisional-mastered high-confidence → `checkpoint`; provisional-mastered lower-confidence → `refresher`; claimed-high-but-low-confidence with `placement.required` → `placement` first; stage 1 / unknown → `foundation` (full teaching path through the target stage). Then compute the missing-prerequisite closure over the skills index. Never mutate pool rows.
5. **Order skills (topological sort)** — sort the gap skills topologically over the skills index; break ties by `level` then `order_hint`.
6. **Build allow-list (in code)** — union of per-skill candidates after stage/role preference + style-evidence keep (same filters as deterministic selection). Candidates only — not the final pick. The LLM may only choose ids from this list.
7. **AI orchestration (default when `roadmap_ai_orchestrator_enabled`)** — `RoadmapUnitsOrchestratorService` proposes ordered unit ids + 3–6 phase titles from the allow-list. Server validate/repair: drop unknown ids; ensure every required skill has ≥1 unit (insert cheapest matching allow-list unit, prefer planned `unit_role`); reorder for skill topo / unit prerequisites; never drop sole checkpoint/proof for a required skill; trim trailing optionals over budget (`CONTENT_REQUIRED_BUDGET_EXCEEDED` if required alone won't fit). Emit `content_orchestration_applied` / `content_orchestration_repaired`. On success, hydrate with AI phases (skip separate narrator).
8. **Deterministic fallback** — if orchestrator off, LLM unconfigured/timeout/bad JSON, or repair cannot cover required skills → `selectUnitsPerSkill` + `packBudget` + narrator-only (titles/grouping; may not add/drop/reorder). Emit `content_orchestration_fallback`. Narrator repairs emit `content_narration_repaired`.
9. **Persist learning path** — transaction: job → roadmap → phases → milestones → lessons (instance snapshots of compiled units); unlock first phase.
10. **Fail soft** — roadmap always ships via fallback when orchestration fails. `generation_meta.aiMode` = `orchestrator` | `narrator`; `aiUsedFallback` records repair or deterministic path.

**Authority model:** AI proposes; server validates. The allow-list, required coverage, prereq order, and budget floors are never optional. Kill-switch: `roadmap_ai_orchestrator_enabled=false` → narrator path only without changing `ROADMAP_ENGINE_MODE`.

Store in `roadmaps.generation_meta`: `{ schemaVersion, recipeId, contentCatalogVersion, learnerProfileId, profilingModelVersion, entryStagesBySkill, decodedWeeks, budgetMinutes, skippedSkillNodeIds, promptVersion, aiMode, aiModel?, aiUsedFallback?, narrationRepaired? }`.

---

## 5.1 AI Coach (continuous — after initial generate)

Separate from one-shot Roadmap Generator. Coach **patches the user roadmap instance** when signals change.

| Input signal                      | Coach action (examples)                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| Lesson / assessment pass/fail     | Insert remediation nodes from Skill Graph; skip ahead if mastery proven |
| Pace vs `weekly_hours` / deadline | Compress optional phases; extend timeline weeks                         |
| Learning-style / quit-reason bias | Prefer practice vs video templates already on graph                     |
| Stuck / missed week               | Soft replan (product `weekly_replanner_v1` — may live under Coach)      |

Rules:

1. Read Skill Graph (compiled units + skills index) + current instance + progress — **never** invent catalog URLs or skill nodes.
2. Write only instance tables (`roadmaps` / phases / milestones / lessons / progress meta).
3. Version prompts (`ai_coach_replan_v1`); Zod-validate before apply.
4. Idempotent jobs; respect lock state (do not unlock arbitrary future phases without product rules).
5. **Any reorder the Coach proposes is re-validated against the skills index** (same check as §5 step 8). A proposed order that violates a prerequisite is rejected or repaired from the DAG — the Coach never finalizes ordering itself.

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

| Stack slug        | Skill nodes (abbrev.)                                                 | Tags overlap questionnaire                                          |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `html-css`        | selectors, layout, responsive                                         | `html-css`                                                          |
| `javascript`      | es6, async, modules                                                   | `javascript`                                                        |
| `react`           | jsx-basics, components, hooks, state, effects, routing, data-fetching | (none in v1 skills — always taught unless `skillsOther` heuristics) |
| `typescript`      | types-basics, react-typescript                                        | —                                                                   |
| `testing-library` | component-tests                                                       | —                                                                   |
| `portfolio`       | project-plan, ship-app                                                | —                                                                   |
| `interview-prep`  | fe-system-design-lite, common-questions                               | —                                                                   |

Generator behavior:

1. Recipe: Foundations → React Core → Advanced (confidence ≥ `somewhat`) → Portfolio.
2. Gap (stage-aware): the profile reports `html-css` at stage 3 (high confidence) and `javascript` at stage 2 (medium). `html-css` nodes → `checkpoint` units (fast validation, not re-teaching); `javascript` nodes → `refresher` units at entry stage 2. React nodes default to stage 1 → `foundation`.
3. Topological sort over the skills index orders the gap (html-css checkpoints → JS refreshers → React Core → optional Advanced → Portfolio); React Core is the main bulk.
4. Per skill, foundation keeps the stage path toward the target, while checkpoint/refresher units must match the entry stage and planned role; intersect formats with `learningStyleWeights` without dropping the only proof/checkpoint. Pack against `budgetMinutes`. Drop the optional Advanced phase first if over.
5. Narration pass (if enabled) names the phases and writes copy — it does not change the order or the set. Deterministic order stands if the AI pass is skipped.
6. A learner reporting all skills at stage 1 gets full foundations; this learner at stage 3/2 gets checkpoints + refreshers — **same compiled pool, different entry stages, different path instance**.

---

## 7. API contracts

### 7.1 Already exists (keep) — see doc 02

| Endpoint                     | Role for roadmap                                                             |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `GET /questionnaire/schema`  | Source of allowed answer tokens (roles, skills, hours, …)                    |
| `POST /questionnaire/submit` | Creates/updates `goals`, returns `{ roadmap: { status, jobId, roadmapId } }` |
| `GET /me`                    | `questionnaireStatus` gate before home / roadmap UI                          |

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
- **The LLM may propose unit include/order only from the server allow-list.** Invented ids are dropped; required coverage, prereqs, and budget are repaired in code (§5 steps 6–8). It never grades or invents pool content.
- **Allow-list filters, required floors, and budget enforcement are deterministic** — correct with orchestrator or fallback.

---

## 10. Error codes

| Code                               | When                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GOAL_NOT_FOUND`                   | Generate for missing goal                                                                          |
| `ROLE_RECIPE_MISSING`              | No recipe for target role                                                                          |
| `CATALOG_EMPTY`                    | Stack has no active skill nodes                                                                    |
| `ROADMAP_GENERATION_FAILED`        | Worker exhausted retries                                                                           |
| `ROADMAP_NOT_READY`                | Client fetched tree while generating                                                               |
| `ROADMAP_NOT_FOUND`                | No roadmap for user                                                                                |
| `CONTENT_REQUIRED_BUDGET_EXCEEDED` | Required content exceeds `budgetMinutes`; feasibility returned to Course Timing (content_pool §15) |
| `CONTENT_NARRATION_INVALID`        | LLM phasing added/dropped/reordered units or referenced unknown ids (content_pool §15)             |

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
- [ ] Generator reads the compiled units + skills index projection, not the authoring tree, at request time
- [ ] Lesson skill order respects topo/prereqs after server repair — regardless of AI proposal
- [ ] `budgetMinutes` is computed in code and never recomputed by the model
- [ ] AI orchestrator proposes from allow-list only; validation repairs coverage/order/budget; fallback to select+pack+narrator on failure
- [ ] `generation_meta.aiMode` is `orchestrator` or `narrator`; kill-switch `roadmap_ai_orchestrator_enabled` works without changing engine mode
- [ ] Lesson instances are pinned to `source_template_id` + `source_version_id` at generation time
- [ ] Generator consumes the versioned `RoadmapGenerationProfile` (per-skill entry stages), not raw `goals` skill tokens
- [ ] A partially-known skill produces a `checkpoint`/`refresher` at the learner's entry stage, not omission or full re-teaching
- [ ] `placement.required` gates any high-confidence skip until the diagnostic clears

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
- [ ] `SkillGraphService` load subgraph by recipe (no user logic) — served from compiled units + skills index
- [ ] `RoadmapGeneratorService.assemble(goalId)` deterministic gap → topo-sort → format-filter → budget-pack (stages 2–6)
- [x] Generator AI — **orchestrator propose+validate** (`RoadmapUnitsOrchestratorService`) with deterministic select+pack+narrator fallback; kill-switch `roadmap_ai_orchestrator_enabled`
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

- stable lesson template ID (`source_template_id`)
- published lesson/compiled-unit version ID (`source_version_id`)
- source skill node/version
- content/reward-class snapshot

These are the same provenance fields carried on compiled units (content_pool §4.2, §6.7). A later Content Pool edit recompiles new units but does not silently alter a lesson already assigned to a user; migration to a newer version is an explicit operation.

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

Roadmap/template reward fields are previews or reward-class inputs. Final XP/Gems/Coins come from `../gamification/07-gamification.md` at completion. Roadmap code never credits Profile or Wallet.

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
