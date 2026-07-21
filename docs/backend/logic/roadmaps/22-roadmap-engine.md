# 22 — Roadmap Engine (Personalized Roadmap Generator)

**Version:** 2.0 integrated
**Integration:** Consumes a versioned `goals` revision and Content Pool published snapshots; produces one immutable roadmap instance per learner. Course Timing starts only after a valid roadmap is committed. The engine **never** authors content — it assembles it.

**Engine:** Roadmap Generator (3 of 4 — see [README](../README.md))
**Orchestration stack:** NestJS + TypeORM + PostgreSQL (`roadmaps/` module)
**Planning stack:** Python 3.12 planning service (`roadmap-engine/`, FastAPI + NetworkX + NumPy), invoked as an internal worker
**Consumers:** Course Timing, AI Coach, Lesson Play (via materialized instances), Arc Next.js PWA (`arc-app`)
**Depends on:** [`../questionnaire/02-questionnaire.md`](../questionnaire/02-questionnaire.md), [`../content-pool/08-content-pool.md`](../content-pool/08-content-pool.md), [`03-goals-and-roadmap.md`](./03-goals-and-roadmap.md)
**Source of truth for content:** Content Pool (published versions only). The engine holds **no** curriculum.

The Roadmap Engine owns **plan assembly, skill-gap math, prerequisite closure, scheduling, and explainability**. It does not own content, progress, wallet, or AI explanations.

---

## 0. Place in the four-engine system

| Engine | This doc? | Role |
| --- | --- | --- |
| Question Engine | No (02) | Adaptive AI interview → validated goal tokens → `goals` |
| Skill Graph / Content Pool | No (`../content-pool/08-content-pool.md`) | Published content DAG (skills / lessons / assessments / projects) |
| **Roadmap Generator** | **Yes** | One-shot personalized plan from `goals` + Content Pool snapshot |
| AI Coach | No (03) | Ongoing roadmap updates from progress (calls `replanRoadmap`) |

**Hard boundary:** The Roadmap Engine is a **pure planner**. It reads `goals` + Content Pool candidates and writes a roadmap instance. It never calls lesson authoring, never writes to the pool, never grants XP, and never mutates the wallet. Adding a new career = new role recipe + skill-graph content in the pool — **not** new planner code.

```
questionnaire.submitted.v1 (goalId, goalRevision)
        │
        ▼
NestJS roadmaps/  ──enqueue──▶ roadmap_generation_job
        │
        ▼
Python roadmap-engine (plan compute)      ◀── Content Pool snapshot (published)
        │  returns RoadmapPlan DTO
        ▼
NestJS persists Roadmap + Phases + Milestones (immutable instance)
        │
        └─▶ Course Timing (materialize next window) + AI Coach (watch)
```

---

## 1. Goal

Produce a backend service that, after the AI interview writes a goal revision, generates a **unique, feasible, explainable** learning roadmap:

1. Load the learner profile from the committed `goals` revision (never frontend labels).
2. Load the role recipe + required/optional skill subgraph from the Content Pool.
3. Compute the personalized skill gap (known vs required, prerequisite closure).
4. Validate the dependency graph is acyclic and satisfiable.
5. Compute a realistic study budget from weekly hours + deadline.
6. Score and select candidate content (Content Pool provides candidates; engine ranks/fits).
7. Build ordered learning phases with assessment, project, review, and buffer weeks.
8. Emit an immutable `RoadmapPlan` with a per-decision explanation trace.
9. Persist the roadmap and hand off to Course Timing; support later `replanRoadmap`.

Flow:

```
goal revision committed
  → generation job queued (keyed by goalRevision + engineVersion)
  → Python engine builds RoadmapPlan (deterministic seed per user)
  → NestJS validates + persists Roadmap instance
  → Course Timing materializes first 2–4 week window
  → /home shows plan; AI Coach begins observing
```

**Uniqueness invariant:** Two learners choosing the same career should rarely receive identical roadmaps. Selection is seeded by profile hash + assessment results, so ordering, optional-content fill, pace, and phase boundaries diverge per learner.

---

## 2. Why a separate Python service

NestJS owns the request/response surface, persistence, auth, queueing, and event contracts, exactly as in the other engines. The **plan computation** — graph closure, topological ordering, bin-packing content into weekly budgets, scoring — is CPU-bound graph/numeric work, so it lives in a dedicated Python service.

| Concern | Owner | Stack |
| --- | --- | --- |
| API surface, auth, DTO validation | NestJS `roadmaps/` | Nest + TypeORM |
| Job queue + retries + idempotency | NestJS | BullMQ (Redis) |
| Persistence of roadmap instances | NestJS | PostgreSQL |
| Skill-gap math, DAG closure, topo sort | Python engine | NetworkX |
| Study-budget + scheduling bin-pack | Python engine | NumPy |
| Content scoring / personalization | Python engine | NumPy (ML-ready seam) |
| Explainability trace | Python engine | structured dict → jsonb |

**Contract seam:** NestJS calls the Python engine over an internal HTTP/gRPC boundary with a versioned request DTO and a `RoadmapPlan` response DTO. The Python engine is **stateless** — it never touches PostgreSQL directly; NestJS passes a Content Pool snapshot and the goal, and persists the returned plan. This keeps the pool as the single source of truth and keeps the planner horizontally scalable.

```
roadmaps.service.ts ──POST /v1/plan──▶  FastAPI  ──▶ RoadmapPlan JSON
     (Nest)              (goal + snapshot)   (Python)     (Nest persists)
```

---

## 3. Module layout

### 3.1 NestJS orchestration (`roadmaps/`)

```text
roadmaps/
  roadmaps.module.ts
  roadmaps.controller.ts          # internal + admin endpoints
  roadmaps.service.ts             # enqueue, persist, swap-active, replan trigger
  roadmap-generation.processor.ts # BullMQ consumer of roadmap_generation_job
  roadmap-engine.client.ts        # typed client → Python engine (HTTP/gRPC)
  roadmap-snapshot.service.ts     # builds Content Pool snapshot for the engine
  roadmap-persistence.service.ts  # instance write, active-pointer swap
  roadmap-analytics.service.ts    # structured events
  entities/
    roadmap.entity.ts
    roadmap-phase.entity.ts
    roadmap-lesson.entity.ts
    roadmap-milestone.entity.ts
    roadmap-generation-job.entity.ts
```

**Must not import:** `content-pool/admin/*` write paths. May call Content Pool **read** APIs (`getRoleRecipe`, `getPersonalizationCandidates`, `materializeRoadmapContent`) and enqueue Course Timing.

### 3.2 Python planning engine (`roadmap-engine/`)

```text
roadmap-engine/
  app.py                          # FastAPI entrypoint: POST /v1/plan, /v1/replan
  engine/
    generator.py                  # orchestrates the pipeline (§6)
    profile_loader.py             # parse LearnerProfile DTO
    skill_gap.py                  # known vs required, prerequisite closure
    dependency_resolver.py        # NetworkX DAG build + topo sort + cycle guard
    study_budget.py               # weekly-hours × deadline × safety factor
    content_scorer.py             # selection_score (ML-ready)
    phase_builder.py              # group ordered skills into phases
    scheduler.py                  # weekly bin-pack + review/assessment/project/buffer
    project_selector.py           # milestone/project placement
    explainer.py                  # per-decision trace (data, not AI prose)
    replanner.py                  # incremental re-plan preserving completed work
  contracts/
    learner_profile.py            # pydantic input DTO
    content_snapshot.py           # pydantic Content Pool snapshot DTO
    roadmap_plan.py               # pydantic output DTO
  config.py                       # weights, safety factors, ENGINE_VERSION
  tests/
```

**Must not:** open a DB connection, call the Content Pool directly, generate lesson text, or produce natural-language explanations. It consumes DTOs and returns DTOs.

Bump `ENGINE_VERSION` when scoring weights, phase logic, or scheduling math change in a way that alters output for the same input.

---

## 4. Inputs

### 4.1 Learner Profile (from the AI interview)

The Question Engine now runs an **AI conversational interview** (see §5) but still commits a **structured, validated** `goals` revision. The planner consumes that structure — it never reads free-form chat. Contract is stable whether the interview was static or AI-driven.

| Profile field | Source (`goals` column) | Planner use |
| --- | --- | --- |
| career goal | `target_roles` | role recipe lookup |
| motivation | `motivation` jsonb | pace/tone bias, buffer sizing |
| current profession | `current_profession` | prior-knowledge prior |
| known skills | `skills` jsonb | skill-gap seed (candidate refresh) |
| confidence | `confidence` | diagnostic-skip gating |
| weekly study hours | `weekly_hours` | study budget |
| preferred schedule | `availability` | weekly workload shape |
| deadline | `target_deadline` | budget + feasibility |
| learning style | `learning_styles` | content scoring bias |
| learning obstacles | `quit_reasons` | buffer + recovery weeks |
| language | `language` | content hard filter |

### 4.2 Content Pool snapshot (read-only)

Supplied by `RoadmapSnapshotService` from **published** versions only:

- role recipe (`required_skill_node_ids`, `optional_skill_node_ids`, `phase_blueprint`, `default_timeline_weeks`)
- skill subgraph (nodes + prerequisite edges, `estimated mastery minutes`, difficulty, tags)
- lesson templates + published version IDs (estimated minutes, learning-style tags, modality, scheduling tags)
- assessments and projects
- resources (IDs only; engine never invents URLs)

The snapshot carries `contentVersion` per row so the plan pins exact versions (mirrors Content Pool §8 instance rule).

---

## 5. AI-driven interview seam (Question Engine mode)

> Interview internals stay in `../questionnaire/02-questionnaire.md`; the planner contract is unchanged.

**Status:** Conversational intake is implemented in Question Engine (`/questionnaire/chat/*`, `/intake/chat` UI). Form and chat both commit the same validated `goals` revision. Optional title-only enrich uses `LLM_ROADMAP_MODEL` after the Python plan; the engine still assembles curriculum.

1. The AI interviewer asks adaptive follow-ups (e.g. probes "known skills" until it can map tokens to skill-graph tags).
2. Every turn is normalized into the **same** validated token set (`target_roles`, `skills`, `weekly_hours`, …). Free text is mapped to schema tokens server-side; unknown tokens are rejected exactly as today.
3. On completion it writes the same `goals` revision and emits `questionnaire.submitted.v1`.

**Boundary preserved:** the AI may *elicit and classify* answers, but it must emit **validated tokens**, not curriculum and not raw prose. The Roadmap Engine therefore needs **zero** changes to consume an AI interview. Confidence/skill signals from the interview may additionally populate an optional `interview_signals` jsonb used as a soft prior in scoring (never as a hard skip — diagnostic assessment still gates skips, per Content Pool §7.1).

| Interview mode | Planner input | Planner change |
| --- | --- | --- |
| Static schema (v1) | validated `goals` | — |
| AI conversational (v2) | validated `goals` (+ optional `interview_signals`) | none required; signals used as soft prior only |

---

## 6. Planning pipeline

Each stage is a pure function in the Python engine; the whole pipeline is deterministic given `(profile, snapshot, seed)` where `seed = hash(userId + goalRevision)`.

### 6.1 Load learner profile
Parse the `goals` revision into `LearnerProfile`. Reject if `target_roles` empty → `ROADMAP_ROLE_NOT_FOUND`. Compute `seed`.

### 6.2 Load role recipe
Resolve each target role to its role recipe from the snapshot. Missing/unpublished recipe → `ROADMAP_ROLE_NOT_FOUND`. Multi-role goals merge required sets (union) and mark overlaps once.

### 6.3 Load content graph
Build the skill subgraph (required ∪ optional closure) as a NetworkX `DiGraph` from snapshot nodes + prerequisite edges. Missing referenced node → `ROADMAP_CONTENT_NOT_FOUND`.

### 6.4 Resolve prerequisites
Compute the **prerequisite closure**: for every required node, pull all transitive prerequisites into the plan even if not listed on the recipe. This guarantees no lesson is scheduled before its dependency. Failure to close (dangling edge) → `ROADMAP_PREREQUISITE_FAILED`.

### 6.5 Detect skill gaps
Map `known skills` tokens to nodes and mark them `candidate_refresh` (not mastered), per Content Pool §7.1. Gap = required closure − confidently-mastered. High-confidence known nodes are flagged for a diagnostic assessment rather than silently removed.

### 6.6 Remove mastered skills
Only nodes proven by (a) passed diagnostic assessment or (b) prior completed roadmap history (passed in by NestJS) are removed from the active path. Removed nodes are recorded in the explanation trace as `skipped_known`.

### 6.7 Validate dependency graph
Run a cycle check (`networkx.is_directed_acyclic_graph`). Any cycle → `ROADMAP_GRAPH_INVALID` (should never happen; pool validates on publish, this is defense-in-depth). Produce a topological order as the canonical learning sequence.

### 6.8 Calculate study budget
Compute available minutes over the horizon (see §7). If required content cannot fit before the deadline → return a **feasibility result** (`ROADMAP_DEADLINE_UNREALISTIC`) with the earliest realistic date, rather than dropping required skills (mirrors Content Pool §7.3).

### 6.9 Score candidate content
For each skill node, score its candidate lesson/resource variants and pick the best fit for this learner (§8). Selection is seeded, so tie-breaks differ per learner → divergent roadmaps.

### 6.10 Build phases
Group the topologically-ordered nodes into phases using the recipe `phase_blueprint` as a template, then adjust boundaries to the learner's pace and budget. Each phase gets a milestone.

### 6.11 Schedule weekly learning
Bin-pack selected lessons into weeks honoring weekly budget, prerequisite order, and schedule shape. Insert review, assessment, project, and buffer weeks (§7).

### 6.12 Select lessons
Pin exact published lesson version IDs from the snapshot into `RoadmapLesson` entries (version-locked). Required first, optional fills remaining weekly capacity.

### 6.13 Select projects
Place projects/assessments at phase boundaries as milestones; ensure each major skill has practice + a checkpoint (Content Pool §7.4 format diversity).

### 6.14 Generate roadmap instance
Assemble the `RoadmapPlan` DTO: phases → milestones → weekly lessons, each with `sourceTemplateId`, `sourceVersionId`, estimate snapshot, and an `explanation` object.

### 6.15 Save roadmap
Python returns the DTO; **NestJS** persists `Roadmap` + `RoadmapPhase` + `RoadmapLesson` + `RoadmapMilestone` in one transaction and swaps the active pointer only after validation (mirrors questionnaire §13.3 swap safety).

### 6.16 Return roadmap
Emit `roadmap_generated`, hand off to Course Timing to materialize the first window, and notify AI Coach to begin observing.

---

## 7. Scheduling engine

Budget and pacing math live in `study_budget.py` + `scheduler.py`. Formula style matches Content Pool §7.3.

### 7.1 Study budget

```text
weekly_minutes = weekly_hours × 60
horizon_weeks  = min(deadline_weeks, recipe.default_timeline_weeks × pace_factor)

budget_minutes =
  weekly_minutes
  × horizon_weeks
  × 0.85 safety_factor          # protects against overrun / life events
```

`pace_factor` derives from confidence + obstacles (low confidence or many `quit_reasons` → slower pace, more buffer).

### 7.2 Weekly workload

```text
target_weekly_load = clamp(
  weekly_minutes × 0.9,          # leave 10% weekly slack
  min = shortest_lesson_minutes,
  max = weekly_minutes
)
```

Lessons are packed per week without exceeding `target_weekly_load` and without violating topological order. Schedule shape (`availability`) biases `deep_work` lessons to long slots and `short`/`commute_safe` lessons to short slots (Content Pool §6.5 scheduling tags).

### 7.3 Special weeks

| Week type | Rule |
| --- | --- |
| Review week | Inserted every N phases (N from pace); no new skills, only recap/practice |
| Assessment week | At phase boundary where recipe `minimum_assessment_rules` require proof |
| Project week | At milestone; project minutes reserved before packing normal lessons |
| Recovery buffer | Auto-inserted proportional to `quit_reasons` risk; absorbs slips without moving the deadline |

### 7.4 Estimated completion

```text
estimated_weeks =
  ceil( total_selected_minutes / (target_weekly_load) )
  + review_weeks + assessment_weeks + project_weeks + buffer_weeks

estimated_completion_date = start_date + estimated_weeks
```

If `estimated_completion_date > deadline` after optional content is trimmed to zero and required content still overflows → feasibility failure (§6.8), returned with the earliest achievable date.

### 7.5 Adaptation inputs

The schedule adapts to `weekly_hours`, `deadline`, and observed `learner pace` (fed on replan). Changing any of these triggers a recompute of §7.1–7.4 without touching completed weeks.

---

## 8. Content scoring

Ranks candidate variants supplied by the Content Pool. The pool applies hard filters (Content Pool §7.2); the engine ranks survivors. ML-ready: today a weighted linear score, later a learned model behind the same interface.

```text
selection_score =
    role_fit               × 0.30
  + skill_gap_fit          × 0.25
  + prerequisite_readiness × 0.15
  + learning_style_fit     × 0.10
  + time_fit               × 0.10
  + quality_score          × 0.10
```

Hard filters (must pass before scoring): `published`, correct language or fallback, valid licenses, active resources, compatible modality, no `blocked` version.

Per-learner divergence comes from `learning_style_fit`, `time_fit`, the diagnostic-driven gap, and seeded tie-breaks — so identical careers rarely yield identical plans.

**Explainability:** every selection stores why it was chosen:

```json
{
  "skillNode": "react-hooks",
  "chosenLessonVersion": "lesson_v_1a2b",
  "reason": "required_gap",
  "scoreBreakdown": {
    "role_fit": 0.30, "skill_gap_fit": 0.25,
    "prerequisite_readiness": 0.15, "learning_style_fit": 0.08,
    "time_fit": 0.09, "quality_score": 0.09
  },
  "alternativesConsidered": 3
}
```

This trace is **data**, not AI prose — the AI Coach may later turn it into natural language, but the engine never generates explanations itself.

---

## 9. Adaptive replanning

`replanRoadmap` re-runs the pipeline **incrementally** from the learner's current position. It is triggered by the AI Coach or Course Timing, never by the engine itself.

**Invariant:** the planner never modifies completed lessons, completed weeks, or past history. It only rewrites the **future** portion of the path, then atomically swaps the active pointer (questionnaire §13.3 pattern).

| Trigger | Engine action |
| --- | --- |
| Repeated failure on a skill (e.g. React Hooks) | Insert remedial prerequisite lessons before the skill; push later milestones back |
| Faster-than-expected progress | Unlock advanced/optional modules; compress future weeks |
| Missed multiple weeks | Recalculate schedule from today; grow buffers; keep completed work intact |
| Deadline changed | Recompute budget (§7); re-fit or return feasibility failure |
| Diagnostic proves a skill | Remove that node from the future path; mark `skipped_known` |

```
failure signal (React Hooks ×3)
   ↓ replanRoadmap(current_position)
insert prerequisite lessons  ──▶  delay future milestones  ──▶  swap active future path
   (completed weeks untouched)
```

Replans are version-locked to the Content Pool snapshot at replan time for **future** batches only (Content Pool §9 rolling window); already-materialized lessons keep their original version.

---

## 10. Internal APIs

### 10.1 NestJS (`roadmaps.service.ts`)

```ts
generateRoadmap(goalId, goalRevision): Promise<RoadmapId>   // enqueue + persist
replanRoadmap(roadmapId, trigger): Promise<RoadmapId>       // incremental future re-plan
getActiveRoadmap(userId): Promise<Roadmap>
swapActiveRoadmap(oldId, newId): Promise<void>              // atomic pointer swap
```

### 10.2 Python engine (`engine/generator.py`, exposed via FastAPI)

```python
def generate_roadmap(profile: LearnerProfile,
                     snapshot: ContentSnapshot,
                     seed: int) -> RoadmapPlan: ...

def calculate_skill_gap(profile, graph) -> SkillGap: ...
def calculate_study_budget(profile) -> StudyBudget: ...
def select_learning_content(gap, snapshot, profile, seed) -> list[SelectedLesson]: ...
def build_learning_phases(order, recipe, budget) -> list[Phase]: ...
def schedule_roadmap(phases, budget, availability) -> Schedule: ...
def replan_roadmap(current_state, snapshot, seed) -> RoadmapPlan: ...
def validate_dependencies(graph) -> None:   # raises on cycle / dangling edge
def estimate_completion(schedule) -> Estimate: ...
```

FastAPI surface (internal only, called by `roadmap-engine.client.ts`):

| Method | Path | Body → Response |
| --- | --- | --- |
| `POST` | `/v1/plan` | `{profile, snapshot, seed}` → `RoadmapPlan` |
| `POST` | `/v1/replan` | `{currentState, snapshot, seed}` → `RoadmapPlan` |
| `GET` | `/v1/health` | → `{status, engineVersion}` |

The engine is stateless and idempotent per `(seed, snapshot.contentVersion, ENGINE_VERSION)`.

---

## 11. Caching

Mirrors Content Pool §12 (PostgreSQL is truth; Redis caches snapshots).

| Cache | Key | Invalidation |
| --- | --- | --- |
| Role-recipe + skill-graph snapshot | `recipe:{slug}:{contentVersion}` | On pool publish/retire of that recipe/subgraph |
| Content candidate set | `candidates:{roleSlug}:{lang}:{contentVersion}` | On pool publish/retire |
| Generated roadmap instance | `roadmap:{roadmapId}` | On replan / active swap |
| Engine plan result (dedupe) | `plan:{seed}:{contentVersion}:{ENGINE_VERSION}` | On new goal revision or engine version bump |

- Snapshots are cached in Redis by the NestJS side and passed to the stateless Python engine; the engine keeps **no** cross-request state.
- Cache keys always include `contentVersion` + `ENGINE_VERSION` so a pool publish or engine upgrade never serves a stale plan.
- Active roadmap instances are cached read-through; writes go through PostgreSQL first, then bust the key.

---

## 12. Error codes

Errors returned as `{ statusCode, code, message }` (matches questionnaire §6.1).

| Code | When |
| --- | --- |
| `ROADMAP_ROLE_NOT_FOUND` | Goal has no role, or role recipe missing/unpublished |
| `ROADMAP_GRAPH_INVALID` | Skill subgraph contains a cycle (defense-in-depth) |
| `ROADMAP_PREREQUISITE_FAILED` | Prerequisite closure cannot be resolved (dangling edge) |
| `ROADMAP_CONTENT_NOT_FOUND` | Snapshot references a node/lesson version that does not exist |
| `ROADMAP_DEADLINE_UNREALISTIC` | Required content cannot fit before deadline (feasibility result) |
| `ROADMAP_GENERATION_FAILED` | Engine crashed / DTO invalid / timeout; job retried then dead-lettered |
| `ROADMAP_ENGINE_VERSION_CONFLICT` | Snapshot/engine version mismatch on persist |
| `ROADMAP_REPLAN_CONFLICT` | Concurrent replan for same roadmap; idempotency guard |

Generation runs as a retryable BullMQ job; terminal failures emit `roadmap_generation_failed` and leave any existing active roadmap untouched.

---

## 13. Analytics

Structured events emitted by `roadmap-analytics.service.ts` (matches Content Pool §16 style). The engine emits **no** XP/wallet events.

| Event | Payload highlights |
| --- | --- |
| `roadmap_generated` | `roadmapId`, `goalRevision`, `engineVersion`, `estimatedWeeks`, `phaseCount` |
| `roadmap_replanned` | `roadmapId`, `trigger`, `weeksShifted`, `lessonsInserted` |
| `roadmap_phase_completed` | `roadmapId`, `phaseId`, `actualVsEstimateRatio` |
| `roadmap_estimation_changed` | `roadmapId`, `oldDate`, `newDate`, `reason` |
| `roadmap_generation_failed` | `goalRevision`, `code`, `stage` |
| `roadmap_feasibility_returned` | `goalRevision`, `earliestRealisticDate` |

---

## 14. Security & integrity

- Internal endpoints only; the Python engine is not publicly routable (network-isolated, called by NestJS).
- Engine is stateless and never holds DB credentials; it cannot read or write the pool.
- All content references are validated against the snapshot's version IDs before persist (`AI/engine output validated against IDs`, Content Pool §14).
- Own-user only: a roadmap instance is bound to one `userId`; NestJS guards enforce ownership.
- Deterministic seed logged with each plan for reproducibility/audit.
- Active-pointer swap is transactional — a learner is never left with a half-written roadmap (questionnaire §13.5).
- Feasibility failures are a first-class result, never a silent drop of required skills.

---

## 15. Acceptance criteria

- [ ] Every roadmap is assembled **only** from published Content Pool versions
- [ ] The engine never authors lessons, resources, quizzes, or AI explanations
- [ ] No duplicated content within a roadmap
- [ ] Skill subgraph is validated acyclic before scheduling
- [ ] Prerequisite closure guarantees no lesson precedes its dependency
- [ ] Known skills require diagnostic proof before removal (no silent skip)
- [ ] Study budget respects weekly hours + deadline with a safety factor
- [ ] Impossible deadlines return a feasibility decision, not a broken plan
- [ ] Two learners on the same career rarely get identical roadmaps (seeded divergence)
- [ ] Each selection carries an explainability trace (data, not prose)
- [ ] Replanning never modifies completed lessons or past weeks
- [ ] Active roadmap swap is atomic; no half-swapped state
- [ ] Version-locked instances: later pool edits never mutate active lessons
- [ ] Supports unlimited careers/technologies via recipes + content only (no planner code change)
- [ ] Engine is stateless and horizontally scalable to millions of users
- [ ] Scoring interface is ML-ready (linear today, learned model later)

---

## 16. Env

```bash
ROADMAP_ENGINE_URL=http://roadmap-engine.internal:8080
ROADMAP_ENGINE_VERSION=2
ROADMAP_GENERATION_TIMEOUT_MS=15000
ROADMAP_SAFETY_FACTOR=0.85
ROADMAP_WEEKLY_SLACK=0.10
ROADMAP_GENERATION_MAX_RETRIES=3
```

(Scoring weights and `ENGINE_VERSION` also pinned in the Python `config.py`; env is the NestJS-side override / documentation.)

---

## 17. Out of scope

- Content authoring, versioning, publication (Content Pool)
- Progress tracking, XP, wallet, streaks (Lesson Play / rewards)
- Natural-language explanations of the plan (AI Coach)
- Weekly reminders / calendar tasks (Course Timing)
- Battle question selection (Content Pool §10)
- The AI interview's conversational internals (Question Engine, doc 02)

---

## 18. Implementation map

| Doc area | Code |
| --- | --- |
| Enqueue + persist + active swap | `roadmaps/roadmaps.service.ts`, `roadmap-persistence.service.ts` |
| Job consumer | `roadmaps/roadmap-generation.processor.ts` (BullMQ) |
| Typed client → Python engine | `roadmaps/roadmap-engine.client.ts` |
| Content Pool snapshot builder | `roadmaps/roadmap-snapshot.service.ts` → `getPersonalizationCandidates`, `getRoleRecipe` |
| Pipeline orchestration | `roadmap-engine/engine/generator.py` |
| Skill-gap math | `roadmap-engine/engine/skill_gap.py` |
| DAG build + topo sort + cycle guard | `roadmap-engine/engine/dependency_resolver.py` (NetworkX) |
| Study budget | `roadmap-engine/engine/study_budget.py` |
| Content scoring (ML-ready) | `roadmap-engine/engine/content_scorer.py` |
| Phase building | `roadmap-engine/engine/phase_builder.py` |
| Weekly scheduling + special weeks | `roadmap-engine/engine/scheduler.py` |
| Project/milestone placement | `roadmap-engine/engine/project_selector.py` |
| Explainability trace | `roadmap-engine/engine/explainer.py` |
| Incremental replanning | `roadmap-engine/engine/replanner.py` |
| DTO contracts | `roadmap-engine/contracts/*.py` (pydantic) |
| Entities | `roadmaps/entities/roadmap.entity.ts`, `roadmap-phase.entity.ts`, `roadmap-lesson.entity.ts`, `roadmap-milestone.entity.ts` |
| Analytics events | `roadmaps/roadmap-analytics.service.ts` |
| Cache (Redis-ready) | snapshot + plan cache in `roadmap-snapshot.service.ts` |

**Entities:** `Roadmap`, `RoadmapPhase`, `RoadmapLesson`, `RoadmapMilestone`, `RoadmapGenerationJob`.

**Still thin:** learned scoring model (linear weights today), gRPC transport (HTTP first), autoscaling policy for the Python worker pool, multi-role merge heuristics beyond union.

**Error codes added:** `ROADMAP_ENGINE_VERSION_CONFLICT`, `ROADMAP_REPLAN_CONFLICT` (plus the base §12 set).
