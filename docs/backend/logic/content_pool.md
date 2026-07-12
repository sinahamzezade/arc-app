# Arc Backend — Central Content Pool

**Version:** 2.0 integrated  
**Canonical integration:** This is the detailed published-content layer behind the Skill Graph in doc 03. It never stores user progress or wallet state.

See [00 — System Integration Contract](./00-system-integration.md).

**Stack:** NestJS + TypeORM + PostgreSQL  
**Consumers:** Questionnaire handoff, Roadmap Generator, Lesson Play, Battle question selection, Course Timing  
**Depends on:** `02-questionnaire.md`, `03-goals-and-roadmap.md`, `05-Learn_Lesson_Play_API.md`

---

## 1. Existing Coverage and Boundary

The existing Skill Graph/Learning Document Pool is the correct foundation. This file does **not** introduce a second content system. It formalizes the same shared pool as an independently managed, versioned content platform.

Invariant:

> Pool rows are shared authoring content. User roadmaps contain immutable/versioned instances. User progress never mutates the pool.

---

## 2. Content Pool Responsibilities

- careers and role recipes
- subjects/technologies
- skill graph and prerequisites
- course, module, lesson, assessment, and project templates
- structured lesson content
- question bank used by quizzes and Battles
- resources and downloadable datasets
- localization
- content versioning and publishing
- quality, moderation, and retirement
- personalization metadata

It does not own:

- user progress
- wallet rewards
- weekly schedules
- Battle results
- rank/league state

---

## 3. Module Layout

```text
content-pool/
  content-pool.module.ts
  content-query.service.ts
  content-publication.service.ts
  content-version.service.ts
  content-personalization.service.ts
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
```

Existing `skill-graph/` entities may retain their names. Migration should extend, not duplicate, them.

---

## 4. Content Hierarchy

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

---

## 5. Publication Lifecycle

Statuses:

```text
draft → review → published → retired
```

Rules:

- only `published` versions can enter new roadmaps
- existing user instances retain the version they were generated from
- critical safety fixes can mark a version `blocked`
- retiring content prevents new use but does not erase history
- publishing is immutable; editing creates a new version
- every version records author, reviewer, change note, and schema version

---

## 6. Core Data Model

### 6.1 `career_roles`

- `slug`
- `title`
- `description`
- `category`
- `is_active`

Examples: `data-analyst`, `front-end-developer`, `marketing-specialist`.

### 6.2 `role_recipes`

Maps questionnaire role token to content.

- `career_role_id`
- `version`
- `default_timeline_weeks`
- `required_skill_node_ids`
- `optional_skill_node_ids`
- `phase_blueprint` jsonb
- `minimum_assessment_rules`
- `is_active`

### 6.3 `skill_nodes`

- subject/stack
- title/slug
- description
- difficulty
- estimated mastery minutes
- tags matching questionnaire tokens
- prerequisite edges
- proof requirements
- active state

The skill graph must remain acyclic. Validate DAG on publication.

### 6.4 `course_templates`

- role/subject applicability
- title
- learning outcome
- difficulty range
- required/optional flag
- estimated total minutes
- quality score
- language
- publication status/version

### 6.5 `lesson_templates`

Metadata shared across versions:

- stable slug
- skill node
- lesson type
- estimated minutes
- difficulty
- learning-style tags
- modality requirements
- prerequisite lesson/skill IDs
- default reward class, not final wallet amount
- scheduling tags: `short`, `deep_work`, `commute_safe`
- content safety flags

### 6.6 `lesson_versions`

Structured body:

```json
{
  "schemaVersion": 2,
  "objective": "Use WHERE to filter rows.",
  "sections": [
    {
      "id": "s1",
      "title": "Why filters matter",
      "blocks": [
        {"type": "text", "body": "..."},
        {"type": "code", "language": "sql", "code": "..."},
        {"type": "arlo_callout", "body": "..."}
      ]
    }
  ],
  "practiceIds": ["question_uuid"],
  "quizIds": ["question_uuid"],
  "resourceIds": ["resource_uuid"]
}
```

### 6.7 `question_templates`

Question bank used by lesson quiz, assessment, and Battle.

Fields:

- subject and skill node
- question type
- prompt version
- option/answer version
- difficulty calibrated score
- estimated seconds
- explanation
- allowed contexts: lesson, assessment, battle
- exposure limit
- discrimination/quality metrics
- status and version

Correct answers are never sent in normal play payloads.

### 6.8 `datasets`

- immutable file/object-storage key
- schema metadata
- preview rows
- license/source
- checksum
- size and format
- allowed lesson IDs
- active state

### 6.9 `resources`

Curated URLs only:

- provider
- URL
- type
- language
- free/paid
- last checked
- quality score
- active status

AI may select IDs but cannot invent URLs.

---

## 7. Questionnaire → Personalized Content Selection

Questionnaire submit produces validated goal tokens. The Content Personalization service consumes the saved `goals` row, not frontend labels.

Inputs:

- target role
- current profession
- known skills
- learning styles
- confidence
- weekly hours
- availability
- deadline
- motivation/quit reasons
- language

### 7.1 Skill-gap calculation

1. load role recipe
2. load required/optional skill subgraph
3. map known-skill tokens to skill nodes
4. mark known nodes as `candidate_refresh`, not automatically mastered
5. require diagnostic assessment for high-confidence skip
6. calculate missing prerequisite closure

### 7.2 Content scoring

```text
selection_score =
role_fit × 0.30
+ skill_gap_fit × 0.25
+ prerequisite_readiness × 0.15
+ learning_style_fit × 0.10
+ time_fit × 0.10
+ quality_score × 0.10
```

Hard filters:

- published
- correct language or fallback
- all required licenses valid
- active resources
- compatible modality
- no blocked version

### 7.3 Time-budget selection

```text
budget_minutes =
weekly_minutes
× target_weeks
× 0.85 safety_factor
```

Required content is selected first. Optional content fills remaining capacity. If required content exceeds budget, return a feasibility result to Course Timing rather than silently deleting required skills.

### 7.4 Learning-style balance

Preferences bias selection but do not create a one-format course.

Every major skill should normally include:

- explanation
- guided example
- active practice
- checkpoint
- recap/project evidence

---

## 8. User Content Instances

When a roadmap is generated, copy references and snapshots into user instance rows:

- source template ID
- source version ID
- title/mission snapshot
- estimated minutes snapshot
- reward class snapshot
- order/prerequisite snapshot
- resource version references

Do not deep-copy large videos/files; reference immutable object keys.

A later content update does not silently change an active lesson. Migration to a new version is an explicit operation.

---

## 9. Rolling Content Window

For large paths:

- full roadmap stores skill/milestone outline
- next 2–4 weeks of lessons are materialized
- Course Timing requests the next content batch as the user progresses
- this permits pace adjustment without rewriting completed history
- locked future batches can use new published versions after validation

---

## 10. Battle Question Selection

`QuestionPoolService.selectBattleSet()` accepts:

- subject
- topic
- difficulty mix
- count
- user exposure history
- opponent exposure history
- mode: live or async

Rules:

- live: same question version for both players
- async: equivalent calibrated questions
- exclude recently exposed questions
- minimum pool size: 5× requested count
- snapshot questions into the Battle so later edits do not alter results
- AI-generated questions are allowed only after offline review/publication, not live generation in MVP

---

## 11. APIs

### Internal APIs

```ts
getRoleRecipe(roleSlug)
getPersonalizationCandidates(goalId)
materializeRoadmapContent(roadmapId, window)
getPlayableLessonVersion(lessonId)
selectAssessmentQuestions(input)
selectBattleQuestions(input)
```

### Admin API

| Method | Path |
|---|---|
| `GET` | `/admin/content/*` |
| `POST` | `/admin/content/lessons` |
| `POST` | `/admin/content/lessons/:id/versions` |
| `POST` | `/admin/content/versions/:id/submit-review` |
| `POST` | `/admin/content/versions/:id/publish` |
| `POST` | `/admin/content/versions/:id/retire` |
| `POST` | `/admin/content/validate-graph` |

Admin routes require role-based access and audit logging.

---

## 12. Caching and Search

- PostgreSQL is source of truth
- cache published recipe/graph snapshots in Redis
- cache key includes recipe/content version
- invalidate on publish/retire
- use PostgreSQL full-text search for admin content discovery
- object media delivered through signed/CDN URLs
- checksums protect dataset/file integrity

---

## 13. Quality Metrics

Record:

- completion rate
- median time vs estimate
- quiz pass rate
- hint/solution rate
- user rating
- dropout point
- Battle answer discrimination
- resource failure rate

Do not auto-retire solely from one metric. Flag for review.

---

## 14. Security and Integrity

- correct answers encrypted or access-restricted at rest where appropriate
- play APIs never expose grading keys
- admin actions audited
- file uploads scanned
- external resources checked periodically
- content HTML sanitized
- graph publication rejects cycles
- AI output validated against IDs and schemas
- content deletion uses soft retirement

---

## 15. Error Codes

- `CONTENT_ROLE_RECIPE_MISSING`
- `CONTENT_VERSION_NOT_PUBLISHED`
- `CONTENT_GRAPH_CYCLE`
- `CONTENT_REQUIRED_BUDGET_EXCEEDED`
- `CONTENT_LANGUAGE_UNAVAILABLE`
- `CONTENT_RESOURCE_INACTIVE`
- `CONTENT_QUESTION_POOL_TOO_SMALL`
- `CONTENT_VERSION_BLOCKED`
- `CONTENT_ADMIN_FORBIDDEN`

---

## 16. Analytics Events

- `content_version_published`
- `content_selected_for_roadmap`
- `content_skipped_known_skill`
- `content_batch_materialized`
- `content_resource_failed`
- `content_quality_flagged`
- `battle_question_set_created`

---

## 17. Acceptance Criteria

- one shared pool powers every career/domain
- questionnaire answers select content; they never store curriculum trees
- content is versioned and published before use
- required prerequisites form a validated DAG
- user path instances preserve source versions
- learning-style personalization keeps format diversity
- impossible deadlines return a feasibility decision
- Battle questions come from reviewed pool content
- correct answers are never leaked in play payloads
- new careers can be added through content and recipes without generator code changes

---

## Implementation map (arc-backend)

| Doc area | Code |
|----------|------|
| Shared pool + publication lifecycle | `content-publication.service.ts`, `content-version.service.ts` |
| Lesson/question versions | `entities/lesson-version.entity.ts`, `question-version.entity.ts` |
| Battle pool | `question-pool.service.ts` → battles |
| Courses / modules / datasets / prereqs | `content-catalog.service.ts`, admin routes |
| Personalization + language | `content-personalization.service.ts` (profile language, diagnostic skip) |
| Rolling window materialize | `ContentQueryService.materializeRoadmapContent` after roadmap assemble |
| `sourceVersionId` on user lessons | `roadmaps/entities/lesson.entity.ts`, generator + `lesson-content.service` |
| Cache / FTS stub | `content-cache.service.ts` (in-memory; Redis-ready) |
| Quality metrics | `content-quality.service.ts` ← lesson complete + battle settle |
| Analytics events | `content-analytics.service.ts` (structured logs) |
| Admin RBAC | `AdminRolesGuard` + `User.isAdmin` on `/admin/content/*` |
| Answer encryption / HTML sanitize | `content-security.util.ts`, `question-answer.util.ts` |

**Still thin:** real Redis, CDN asset pipeline, upload malware scan, full Postgres FTS, dedicated admin FE.

**Error codes added:** `CONTENT_ADMIN_FORBIDDEN` (plus existing §15 set).
