# Arlo Backend — Central Content Pool

**Version:** 3.3 (active-format units + live-context injection + format-variety tie-breaker)
**Canonical integration:** This is the detailed published-content layer behind the Skill Graph in doc 03. It never stores user progress or wallet state.

**What changed in 3.4:** roadmap selection/order may be AI-proposed from the units allow-list with hard server validate/repair (`RoadmapUnitsOrchestratorService`); deterministic select+pack+narrator remains the fallback. See §7.6–7.7 and doc 03 §5.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL
**Consumers:** Questionnaire handoff, Roadmap Generator, Lesson Play, Battle question selection, Course Timing
**Depends on:** `02-questionnaire.md`, `03-goals-and-roadmap.md`, `05-Learn_Lesson_Play_API.md`
**Related:** [10 — Engagement Layer](./10-engagement-layer-active-learning.md) (active-format blocks, live-context injection, format-variety rule — product surface SoT; this doc owns pool data model)

---

## 0. Design principle — two layers, deterministic selection

The pool is split into two layers that serve different masters:

1. **Authoring graph (source of truth).** Careers, recipes, skill nodes, course/module/lesson templates, versions, the question bank, resources, datasets. It is tree-shaped, deeply versioned, and optimized for editing and governance. Consumers never traverse it at request time.

2. **Compiled unit pool (read model).** On publish, the authoring graph is compiled into flat, **self-describing units** plus a **skills index** (the prerequisite DAG). Each unit carries everything the matcher needs — the skill it teaches, its prerequisite skills, difficulty level, time, formats, and its own body — so selection requires no tree-walking.

Everything selectable or gradeable is decided by **deterministic backend code**, not by a model:

- **Ordering** comes from the prerequisite DAG via topological sort. It is repeatable and cannot violate prerequisites.
- **Selection and budgeting** are arithmetic over compiled units, computed in code.
- **The LLM may propose unit include/order from the allow-list only.** Server validate/repair enforces coverage, prereqs, and budget; invented ids are dropped. Deterministic select+pack remains the fallback. It never grades or invents pool content.
- **Determinism is validated, not hoped for.** DAG acyclicity, prerequisite resolution, budget feasibility, and version pinning are checked in code with tests.

Invariant (unchanged, now enforced at both layers):

> Pool rows are shared authoring content. User roadmaps contain immutable, version-pinned instances of compiled units. User progress never mutates the pool.

---

## 1. Coverage and boundary

The existing Skill Graph / Learning Document Pool is the correct foundation. This file does **not** introduce a second content system. It formalizes the same shared pool as an independently managed, versioned platform, and adds the compiled-unit read layer described in §0.

The compiled layer is a _projection_ of the authoring graph, never a parallel store. If the two disagree, the authoring graph wins and the projection is rebuilt.

---

## 2. Responsibilities

Owns:

- careers and role recipes
- subjects / technologies
- skill graph and prerequisites (the DAG)
- course, module, lesson, assessment, and project templates
- structured lesson content
- the question bank used by quizzes and Battles
- resources and downloadable datasets
- localization
- content versioning and publishing
- **compilation of the authoring graph into self-describing units + skills index**
- quality, moderation, and retirement
- personalization metadata

Does **not** own:

- user progress
- wallet rewards
- weekly schedules
- Battle results
- rank / league state

---

## 3. Module layout

```text
content-pool/
  content-pool.module.ts
  content-query.service.ts
  content-publication.service.ts
  content-version.service.ts
  content-compiler.service.ts          # NEW: authoring graph → compiled units
  content-personalization.service.ts   # legacy personalization helpers
  roadmap-pipeline.service.ts          # gap → allow-list → orchestrate|select+pack (§7)
  roadmap-units-orchestrator.service.ts # AI propose + validate (§7.6)
  question-pool.service.ts
  admin/
  entities/
    content-category.entity.ts
    career-role.entity.ts
    role-recipe.entity.ts
    subject.entity.ts
    skill-node.entity.ts
    skill-prerequisite.entity.ts
    course-template.entity.ts
    module-template.entity.ts
    lesson-template.entity.ts
    lesson-version.entity.ts
    assessment-template.entity.ts
    question-template.entity.ts
    question-version.entity.ts
    resource.entity.ts
    dataset.entity.ts
    content-tag.entity.ts
    compiled-unit.entity.ts             # NEW: flattened read model
    skills-index.entity.ts              # NEW: compiled DAG snapshot
```

Existing `skill-graph/` entities keep their names. The compiler **extends**, it does not duplicate: compiled units are derived rows keyed back to their source template + version.

---

## 4. Content model — authoring graph and its projection

### 4.1 Authoring graph (source of truth)

```text
Career Role
  → Role Recipe
      → Subjects / Tech Stacks
          → Skill Nodes (DAG)
              → Course Templates
                  → Module Templates
                      → Lesson Templates
                          → Published Lesson Version
              → Assessments / Projects
              → Question Templates
```

A lesson can be reused across multiple courses and careers through join tables.

### 4.2 Compiled units (read model)

The compiler walks the authoring graph once per publish and emits one self-describing unit per playable lesson, copying down the parent skill's identity and prerequisites and deriving the fields the matcher needs:

```json
{
  "id": "css-intro-read",
  "title": "Selectors, colors and the cascade",
  "skills_taught": ["html-css:css-intro"],
  "prerequisites": ["html-css:html-intro"],
  "level": 1,
  "difficulty": 2,
  "serves_stage": [1, 2],
  "unit_role": "foundation",
  "estimated_minutes": 50,
  "formats": ["reading"],
  "lesson_type": "reading",
  "domain": "frontend",
  "stack": "html-css",
  "provider": "MDN",
  "url": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
  "xp": 40,
  "source_template_id": "uuid",
  "source_version_id": "uuid",
  "content": { "objective": "…", "sections": ["…"], "keyTakeaways": ["…"] }
}
```

`lesson_type` is not limited to passive formats. Alongside `reading | video | practice | quiz | project`, it also accepts the active-format values `scenario | visual_hotspot | debate | sandbox_simulation` (see [10 — Engagement Layer](./10-engagement-layer-active-learning.md) §2 for the corresponding block shapes). A `sandbox_simulation` unit additionally carries `simulation_asset_key` and `action_vocabulary[]`, pointing to an immutable stored snapshot the server resolves the outcome against — never live external data at grading time, keeping resolution deterministic and replayable like every other graded fact in this pool.

`serves_stage` and `unit_role` let selection adapt to what a learner already knows (§7.1). `serves_stage` lists the learner stages (1–5) a unit is *for* — distinct from `difficulty` (how hard the lesson is): a refresher and a full foundation lesson can share a difficulty but serve different stages. `unit_role` is one of `foundation | refresher | checkpoint | project | proof`, so a partially-known skill can be served by a checkpoint or refresher rather than taught from scratch.

Alongside the units, a **skills index** snapshots the DAG the topological sort runs on:

```json
{
  "id": "html-css:css-intro",
  "title": "CSS Basics",
  "prerequisites": ["html-css:html-intro"],
  "level": 1
}
```

### 4.3 Field derivation (the compile pass)

| Compiled field      | Source in authoring graph                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| `skills_taught`     | parent skill node's namespaced slug                                          |
| `prerequisites`     | parent skill node's `prereqSlugs`, namespaced                                |
| `estimated_minutes` | lesson template `estimatedMinutes`                                           |
| `formats`           | lesson template `learningStyleTags` (+ `lesson_type`)                        |
| `domain` / `stack`  | subject / tech-stack category                                                |
| `content`           | published `lesson_version` body                                              |
| `difficulty`        | lesson template `difficulty` (1–5)                                           |
| `serves_stage`      | authored on the lesson template (which learner stages the unit is for)       |
| `unit_role`         | authored on the lesson template (`foundation` \| `refresher` \| `checkpoint` \| `project` \| `proof`) |
| `level`             | **derived** — recipe phase → level (foundations = 1, core = 2, advanced = 3) |
| `simulation_asset_key` | authored on the lesson template, `sandbox_simulation` units only — points to an immutable stored snapshot |
| `action_vocabulary` | authored on the lesson template, `sandbox_simulation` units only — unit-scoped action strings |

`level` intentionally does light work: the real sequencing comes from `prerequisites` through the topological sort. `level` is used only to match a learner's starting point and to break ordering ties, so a coarse per-phase constant is sufficient. Finer granularity, if ever needed, is derived from prerequisite-chain depth within a stack — never hand-tuned per lesson.

### 4.4 Compile rules

- Compilation runs on `publish` and on `retire`; it is idempotent and fully rebuildable from the authoring graph.
- A compiled unit is always keyed to `source_template_id` + `source_version_id`. Editing never mutates a unit in place — a new version compiles a new unit.
- Compilation **fails closed**: if the skills index would contain a cycle, or a unit's prerequisite does not resolve to a known skill, publication is rejected (`CONTENT_GRAPH_CYCLE`, `CONTENT_PREREQ_UNRESOLVED`).

---

## 5. Publication lifecycle

Statuses:

```text
draft → review → published → retired
```

Rules:

- only `published` versions compile into the unit pool and can enter new roadmaps
- existing user instances retain the version they were generated from
- critical safety fixes can mark a version `blocked`; blocked units are dropped from the read pool immediately
- retiring content prevents new use but does not erase history
- publishing is immutable; editing creates a new version and recompiles
- every version records author, reviewer, change note, and schema version
- **every publish triggers a recompile** of the affected units + skills index, followed by DAG validation

---

## 6. Core data model

### 6.1 `career_roles`

`slug`, `title`, `description`, `category`, `is_active`.
Examples: `data-analyst`, `front-end-developer`, `marketing-specialist`.

### 6.2 `role_recipes`

Maps a questionnaire role token to content.

`career_role_id`, `version`, `default_timeline_weeks`, `required_skill_node_ids`, `optional_skill_node_ids`, `phase_blueprint` jsonb, `minimum_assessment_rules`, `is_active`.

The `phase_blueprint` also drives the `level` derivation in §4.3.

### 6.3 `skill_nodes`

subject/stack, title/slug, description, difficulty, estimated mastery minutes, tags matching questionnaire tokens, prerequisite edges, proof requirements, active state.

The skill graph must remain acyclic — validated on every publish/compile.

### 6.4 `course_templates`

role/subject applicability, title, learning outcome, difficulty range, required/optional flag, estimated total minutes, quality score, language, publication status/version.

### 6.5 `lesson_templates`

Metadata shared across versions:

stable slug, skill node, lesson type, estimated minutes, difficulty, learning-style tags, modality requirements, prerequisite lesson/skill IDs, default reward class (not final wallet amount), scheduling tags (`short`, `deep_work`, `commute_safe`), content safety flags.

### 6.6 `lesson_versions`

Structured body (compiled into a unit's `content`):

```json
{
  "schemaVersion": 2,
  "objective": "Use WHERE to filter rows.",
  "sections": [
    {
      "id": "s1",
      "title": "Why filters matter",
      "blocks": [
        { "type": "text", "body": "..." },
        { "type": "code", "language": "sql", "code": "..." },
        { "type": "arlo_callout", "body": "..." }
      ]
    }
  ],
  "practiceIds": ["question_uuid"],
  "quizIds": ["question_uuid"],
  "resourceIds": ["resource_uuid"]
}
```

### 6.7 `compiled_units` (NEW)

The read model of §4.2. Derived rows, never hand-edited.

`id` (unit slug), `skills_taught[]`, `prerequisites[]`, `level`, `difficulty`, `serves_stage[]`, `unit_role`, `estimated_minutes`, `formats[]`, `lesson_type`, `domain`, `stack`, `provider`, `url`, `xp`, `source_template_id`, `source_version_id`, `content` jsonb, `compiled_at`, `active`, `simulation_asset_key` nullable (3.3, `sandbox_simulation` units only), `action_vocabulary[]` (3.3).

Query patterns the matcher uses: by `skills_taught`, by `stack`, filtered on `active` + `formats`. No joins to the authoring tree at request time.

### 6.8 `skills_index` (NEW)

Snapshot DAG: `id`, `title`, `prerequisites[]`, `level`, `recipe_version`. Rebuilt on publish; topological sort reads only this.

### 6.9 `question_templates`

Question bank for lesson quiz and assessment (legacy / shared authoring). **Battles select from active quiz units** (`units` with `lesson_type = quiz`), not from this table — see §10.

### 6.10 `datasets`

immutable object-storage key, schema metadata, preview rows, license/source, checksum, size and format, allowed lesson IDs, active state.

### 6.11 `resources`

Curated URLs only: provider, URL, type, language, free/paid, last checked, quality score, active status.
**AI may select resource IDs but cannot invent URLs.**

**Authoring requirement (role coverage).** Because stage-aware selection (§7.1, §7.3) substitutes a `checkpoint` or `refresher` for a partially-known skill, those units must *exist*. The course-authoring prompt requires every skill to include at least one `foundation` unit and at least one `checkpoint`/`refresher` spanning the stage range; a compiled skill lacking that coverage falls back to foundation-only and is flagged for authoring.

### 6.12 `live_context_snippets` (NEW, 3.3)

Curated, editorially-reviewed current-events content, deliberately kept **outside** the authoring graph and the `compiled_units` read model — it is not versioned curriculum, has no prerequisites, and is never selected by the Stage 1–6 pipeline in §7.

`id`, `track_tag` (matches a `stack`/`domain` value, e.g. `crypto-trader`), `headline`, `body` (short, length-limited), `source_url`, `published_at`, `expires_at`, `related_skill_tags[]`, `active`.

A unit references live context only through a `live_context` block referencing a `track_tag`, resolved to the freshest non-expired row at `GET /play` time (see [10 — Engagement Layer](./10-engagement-layer-active-learning.md) §8). If no row is fresh, the block is omitted — never backfilled with stale or fabricated content, matching the `resources` rule above that **AI may select but cannot invent** source content.

---

## 7. Questionnaire → personalized selection (AI propose + server validate)

The questionnaire (doc 02 v2) emits a versioned **`RoadmapGenerationProfile`**. Personalization builds a deterministic **allow-list** (gap → topo → stage/role + style filters). By default the LLM **proposes** which allow-list units to include and their order; the server **validates/repairs**. Kill-switch / LLM failure → deterministic select+pack + narrator-only.

### 7.1 Stage 1 — Skill-gap calculation (stage-aware)

The profile speaks in coarse `skillSlug` (`"python"`); units teach namespaced concepts (`teaches: "python:variables"`). Resolve the two, then plan each node by the learner's *entry stage* rather than including/skipping whole skills:

1. load the role recipe and the required/optional skill subgraph from the skills index
2. **resolve `skillSlug` → domain**: a `skillSlug` estimate applies to every `domain:*` node sharing that prefix (convention: unit `domain` = the prefix of its `teaches` ids; or supply an explicit `slugToDomain` map). Each node inherits an **entry stage** from the matching estimate, defaulting to stage 1 (full foundations) when unknown.
3. per node, choose an action from entry stage + confidence (mirrors doc 02 §10.1 steps 5–7, §10.2):
   - **verified mastered** → omit or mark completed-by-assessment
   - **provisional mastered, high confidence** → `checkpoint` (fast validation, not re-teaching)
   - **provisional mastered, lower confidence** → `refresher` (condensed)
   - **claims high stage but low confidence** (and `placement.required`) → `placement` task first
   - **stage 1 / unknown** → `foundation` (full teaching path spanning the learner's entry stage through the target stage)
4. compute the missing-prerequisite closure over the DAG for every non-omitted node
5. `placement.required` gates any high-confidence skip until the diagnostic clears

The gap is the prerequisite-closed set of skills the learner still needs, each tagged with a chosen `unit_role` and entry stage.

### 7.2 Stage 2 — Ordering (topological sort)

Order the gap skills by running a topological sort over the skills index. This guarantees a skill never precedes its prerequisites (Flexbox cannot come before CSS basics). Within the topological constraint, break ties by `level` (low → high) and keep same-skill units contiguous.

Ordering is graph-derived, **not** score-derived and **not** anti-catalog. Two learners differ in order only because their gaps and entry stages differ.

### 7.3 Stage 3 — Format filter and per-skill selection (stage + role aware)

For each ordered skill, gather candidate compiled units, then filter on **both** the chosen `unit_role` and the learner's stage path:

- for `foundation`, keep units whose `serves_stage` overlaps the path from the node's entry stage to the learner's target stage, so a beginner receives reading → practice/proof → checkpoint instead of only stage-1/2 readings;
- for `checkpoint` / `refresher`, first prefer units whose `serves_stage` includes the node's entry stage **and** whose `unit_role` matches the planned action;
- if authoring lacks that role, fall back to `required` foundation units so a skill is never left empty;
- among survivors, drop a unit only if its `formats` share nothing with `learningStyleWeights` **and** another candidate still covers the skill; never drop the only `checkpoint` / `proof` unit that can produce stage evidence;
- rank the remainder with the within-skill score below.

```text
selection_score =                     # ranks units WITHIN a skill, never across skills
    role_fit                × 0.30
  + skill_gap_fit           × 0.25
  + prerequisite_readiness  × 0.15
  + learning_style_fit      × 0.10
  + time_fit                × 0.10
  + quality_score           × 0.10
```

Hard filters (applied before scoring): published, correct language or fallback, valid licenses, active resources, compatible modality, no blocked version.

### 7.4 Stage 4 — Format balance

Preferences bias selection but never produce a single-format course. Every major skill normally retains: explanation, guided example, active practice, checkpoint, and recap/project evidence.

**Consecutive-type tie-breaker (3.3).** Within that constraint, when two or more surviving candidates for a slot are otherwise tied on §7.3's `selection_score`, prefer the one whose `lesson_type` differs from the immediately preceding unit's `lesson_type`, and never allow more than 2 consecutive units in a phase to share the same `lesson_type`. This is a tie-breaker only: it never overrides a prerequisite edge, never drops the sole `checkpoint`/`proof` unit for a skill, and never violates the required-role coverage in §7.3 — it only chooses *which* equally-valid candidate goes next, so back-to-back readings or back-to-back quizzes don't dominate a phase.

### 7.5 Stage 5 — Budget packing

```text
budget_minutes = capacity.effectiveWeeklyMinutes × target_weeks × 0.85 (safety_factor)
```

`effectiveWeeklyMinutes` already accounts for declared capacity discounted by schedule realism and pace class (doc 02 §8). Required content is packed first; optional content fills remaining capacity. `budget_minutes` is **precomputed in code and passed as a single number** to any downstream step — it is never recomputed by the model.

If required content exceeds budget, return a **feasibility result** to Course Timing rather than silently dropping required skills (`CONTENT_REQUIRED_BUDGET_EXCEEDED`).

### 7.6 Stage 6 — AI unit orchestration (propose + validate)

Default path (`roadmap_ai_orchestrator_enabled`): hand the allow-list + learner packet to `RoadmapUnitsOrchestratorService`. The model proposes a subset of unit indices/ids, study order, and 3–6 phase titles. It must not invent ids outside the allow-list.

Server validate/repair before hydrate:

- drop unknown / duplicate ids;
- ensure every **required** gap skill has ≥1 selected unit (insert cheapest allow-list match; prefer planned `unit_role`);
- reorder for skill topo / unit prerequisites;
- never drop the sole checkpoint/proof for a required skill when the allow-list has one;
- trim trailing optionals over `budget_minutes`; required alone over budget → `CONTENT_REQUIRED_BUDGET_EXCEEDED`.

Analytics: `content_orchestration_applied` / `content_orchestration_repaired` / `content_orchestration_fallback`.

### 7.7 Fallback — deterministic select + narrator

When the orchestrator is off or fails: Stages 3–5 style `selectUnitsPerSkill` + `packBudget`, then the narrator model groups contiguous slices into 3–6 phases and writes titles only (may not add/drop/reorder). Narrator repairs emit `content_narration_repaired`.

---

## 8. User content instances

When a roadmap is generated, snapshot the selected compiled units into user instance rows:

- `source_template_id`
- `source_version_id`
- title / mission snapshot
- estimated-minutes snapshot
- reward-class snapshot
- order / prerequisite snapshot
- resource version references

Do not deep-copy large videos/files; reference immutable object keys.

A later content update does not silently change an active lesson. Migrating an instance to a newer compiled unit is an explicit operation.

---

## 9. Rolling content window

For large paths:

- the full roadmap stores the skill/milestone outline (the ordered gap from §7.2)
- the next 2–4 weeks of units are materialized
- Course Timing requests the next content batch as the learner progresses
- this permits pace adjustment without rewriting completed history
- locked future batches may adopt newer published versions after validation

**Intake body personalization (optional, LLM-narrates-only).** When `lesson_body_ai_enabled` is on and an LLM is configured, `materializeRoadmapContent` enqueues async jobs that rewrite teaching copy (`objective`, Arlo lines, `content[]` pages) onto the user lesson's `play_content` from the questionnaire + intake chat. **Practice and quiz stay scaffold** — the model never authors gradeable items. Pool templates and published version rows are never mutated. Soft-fail leaves the scaffold body immediately playable.

---

## 10. Battle question selection

`QuestionPoolService.selectBattleSet()` reads **active quiz units** (`lesson_type = quiz`), flattens `content.questions`, and filters by stack (subject) / `skills_taught` (topic). Accepts: subject, topic, difficulty mix, count, user exposure history, opponent exposure history, mode (live | async).

Rules:

- live: same question snapshot for both players
- async: equivalent calibrated questions (same difficulty band twins when available)
- exclude recently exposed questions (by deterministic unit+index version id)
- minimum pool size: 5× requested count (`CONTENT_QUESTION_POOL_TOO_SMALL` otherwise)
- snapshot questions into the Battle so later unit edits do not alter results
- never live AI generation — gradeable stems come only from authored quiz units

---

## 11. APIs

### Internal

```ts
getRoleRecipe(roleSlug);
compileFromAuthoringGraph(scope); // NEW: (re)build compiled units + skills index
getSkillsIndex(recipeVersion); // NEW: the DAG for topo-sort
getCompiledUnits(query); // NEW: self-describing read model
getPersonalizationCandidates(goalId); // runs the §7 pipeline
materializeRoadmapContent(roadmapId, window);
getPlayableLessonVersion(lessonId);
selectAssessmentQuestions(input);
selectBattleQuestions(input);
```

### Admin

| Method | Path                                        |
| ------ | ------------------------------------------- |
| `GET`  | `/admin/content/*`                          |
| `POST` | `/admin/content/lessons`                    |
| `POST` | `/admin/content/lessons/:id/versions`       |
| `POST` | `/admin/content/versions/:id/submit-review` |
| `POST` | `/admin/content/versions/:id/publish`       |
| `POST` | `/admin/content/versions/:id/retire`        |
| `POST` | `/admin/content/validate-graph`             |
| `POST` | `/admin/content/recompile`                  |

Admin routes require role-based access and audit logging.

---

## 12. Caching and search

- PostgreSQL is the source of truth
- cache the compiled units + skills index snapshot in Redis, keyed by recipe/content version
- invalidate on publish/retire/recompile
- PostgreSQL full-text search for admin content discovery
- object media delivered through signed / CDN URLs
- checksums protect dataset/file integrity

Because consumers read the cached compiled projection, request-time cost does not grow with authoring-graph depth.

---

## 13. Quality metrics

Record: completion rate, median time vs estimate, quiz pass rate, hint/solution rate, user rating, dropout point, Battle answer discrimination, resource failure rate.

Do not auto-retire from a single metric — flag for review.

---

## 14. Security and integrity

- correct answers are encrypted or access-restricted at rest; they are never compiled into units and never sent in play payloads
- play APIs never expose grading keys (see 05 §4.1)
- admin actions audited
- file uploads scanned
- external resources checked periodically
- content HTML sanitized
- graph publication rejects cycles and unresolved prerequisites
- **AI output is validated against pool IDs and schemas** before it reaches a learner (URLs must resolve to a `resources` row; unit references must resolve to compiled units)
- content deletion uses soft retirement

---

## 15. Error codes

- `CONTENT_ROLE_RECIPE_MISSING`
- `CONTENT_VERSION_NOT_PUBLISHED`
- `CONTENT_GRAPH_CYCLE`
- `CONTENT_PREREQ_UNRESOLVED` _(new — compile-time prerequisite that maps to no skill)_
- `CONTENT_REQUIRED_BUDGET_EXCEEDED`
- `CONTENT_LANGUAGE_UNAVAILABLE`
- `CONTENT_RESOURCE_INACTIVE`
- `CONTENT_QUESTION_POOL_TOO_SMALL`
- `CONTENT_VERSION_BLOCKED`
- `CONTENT_ADMIN_FORBIDDEN`
- `CONTENT_NARRATION_INVALID` _(new — LLM phasing added/dropped/reordered units)_
- `LIVE_CONTEXT_NONE_FRESH` _(3.3 — no non-expired snippet for a track; block is omitted, not surfaced as a user-facing error)_

---

## 16. Analytics events

- `content_version_published`
- `content_compiled` _(new — units + skills index rebuilt)_
- `content_selected_for_roadmap`
- `content_skipped_known_skill`
- `content_batch_materialized`
- `content_resource_failed`
- `content_quality_flagged`
- `content_narration_repaired` _(new — DAG repair after invalid phasing)_
- `content_live_context_served` _(3.3)_
- `content_live_context_expired_skip` _(3.3)_
- `battle_question_set_created`

---

## 17. Acceptance criteria

- [ ] one shared pool powers every career/domain; the compiled layer is a projection of it, never a second store
- [ ] questionnaire answers select content; they never store curriculum trees
- [ ] content is versioned and published before use, and every publish recompiles units + skills index
- [ ] required prerequisites form a validated acyclic DAG; a cycle or unresolved prerequisite blocks publication
- [ ] lesson ordering is produced by topological sort over the skills index — deterministic and prerequisite-safe — not by model output or catalog index
- [ ] `budget_minutes` is computed in code and never recomputed by the model
- [ ] the LLM may propose include/order from the allow-list; server validate/repair enforces coverage/prereqs/budget; fallback is deterministic select+pack+narrator
- [ ] user path instances preserve source template + version
- [ ] selection consumes the versioned `RoadmapGenerationProfile` (per-skill entry stages), not raw skill tokens
- [ ] a partially-known skill is served by a `checkpoint`/`refresher` unit at the learner's entry stage, not omitted wholesale or re-taught from scratch
- [ ] every published skill carries role coverage — at least one `foundation` unit and at least one `checkpoint`/`refresher` across the stage range — validated before publish
- [ ] foundation paths include proof/checkpoint units; learning-style personalization must not reduce a beginner to reading-only content
- [ ] impossible deadlines return a feasibility decision, never a silently pruned required skill
- [ ] Battle questions come from reviewed pool content
- [ ] correct answers are never compiled into units, exposed in play payloads, or sent to the model
- [ ] new careers can be added through content + recipes without generator code changes
- [ ] (3.3) active-format `lesson_type` values (`scenario` \| `visual_hotspot` \| `debate` \| `sandbox_simulation`) are secret-stripped on read and graded only server-side, same as `quiz`/`practice`
- [ ] (3.3) `sandbox_simulation` units resolve outcomes against an immutable `simulation_asset_key` snapshot and unit `action_vocabulary`, never live external data, keeping resolution deterministic and replayable
- [ ] (3.3) `live_context_snippets` are curated, never model-invented, and omitted rather than fabricated when no fresh row exists
- [ ] (3.3) the format-variety tie-breaker never overrides a prerequisite edge, drops a sole checkpoint/proof unit, or bypasses required-role coverage from §7.3

---

## Implementation map (arc-backend)

| Doc area                                     | Code                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Shared pool + publication lifecycle          | `content-publication.service.ts`, `content-version.service.ts`                                              |
| Authoring graph → compiled units             | `content-compiler.service.ts` → `compiled-unit.entity.ts`, `skills-index.entity.ts`                         |
| Lesson/question versions                     | `entities/lesson-version.entity.ts`, `question-version.entity.ts`                                           |
| Deterministic allow-list + fallback select (§7) | `roadmap-pipeline.service.ts` (gap → topo → allow-list → select/pack) |
| AI orchestrate + validate/repair (§7.6)         | `roadmap-units-orchestrator.service.ts` (+ `.validate.ts`)            |
| Narration fallback (§7.7)                       | `roadmap-narrator.service.ts`                                         |
| Battle pool                                  | `question-pool.service.ts` ← quiz units (`unit-battle-question.util.ts`) → battles                          |
| Courses / modules / datasets / prereqs       | `content-catalog.service.ts`, admin routes                                                                  |
| Rolling window materialize                   | `ContentQueryService.materializeRoadmapContent` after roadmap assemble                                      |
| Intake lesson-body AI (async, narrates only) | `LessonBodyPersonalizerService` via `lesson_body_personalization` queue; writes `lessons.play_content` only |
| `sourceVersionId` on user lessons            | `roadmaps/entities/lesson.entity.ts`, generator + `lesson-content.service`                                  |
| Cache / FTS stub                             | `content-cache.service.ts` (in-memory; Redis-ready)                                                         |
| Quality metrics                              | `content-quality.service.ts` ← lesson complete + battle settle                                              |
| Analytics events                             | `content-analytics.service.ts` (structured logs)                                                            |
| Admin RBAC                                   | `AdminRolesGuard` + `User.isAdmin` on `/admin/content/*`                                                    |
| Answer encryption / HTML sanitize            | `content-security.util.ts`, `question-answer.util.ts`                                                       |

**Still thin:** real Redis, CDN asset pipeline, upload malware scan, full Postgres FTS, dedicated admin FE.

**Codes added this revision:** `CONTENT_PREREQ_UNRESOLVED`, `CONTENT_NARRATION_INVALID` (plus existing §15 set).
