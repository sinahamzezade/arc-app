# Integration Review and Change Summary

## Files Reviewed

- README and backend docs 01–06
- full product roadmap as product reference
- Arlo design-system file as UI terminology reference
- previously created Gamification, Content Pool, Course Timing, Ranking, Leagues, Social, Study Together, Battle, and Lucky Wheel specs

## Main Conflicts Corrected

1. `profiles.total_xp/gems/coins/current_rank/weekly_streak` are now compatibility mirrors, not canonical stores.
2. Lesson completion no longer credits Profile directly; it uses the Gamification ledger.
3. Lesson completion, immediate unlock, reward, and linked weekly-task progress are one atomic transaction.
4. Roadmap generation now has an explicit handoff to Course Timing and Weekly Plan.
5. Roadmap replacement/replan is versioned and preserves the current usable path until the new one is valid.
6. Shared Content Pool versions are immutable after publication and snapshotted into user lessons.
7. Course Timing owns future scheduling; Weekly Plan owns the current-week projection.
8. Weekly and daily boundaries are aligned to a 03:00 learning-day convention.
9. Replanning cancels stale notification schedules by schedule version.
10. Notifications now cover every new social, Battle, Study, Wheel, Rank, League, reward, timing, and streak event.
11. Notification creation/delivery is idempotent, preference-gated, quiet-hour-aware, capped, and deep-link-safe.
12. Rank and League XP are explicitly separated.
13. Questionnaire resubmission creates a new goal/roadmap revision instead of mutating a live path in place.
14. A transactional outbox/event envelope is defined for all cross-module work.
15. Home/bootstrap composition APIs are defined without making Home a new source of truth.

## Product Decisions Made for Consistency

- Learning day ends at 03:00 local time.
- Learning week runs Monday 03:00 to next Monday 02:59:59.999.
- Weekly seal rewards are granted through Gamification, not Weekly Plan/Profile.
- Lucky Wheel XP does not count toward Leagues.
- Normal sequential lesson unlocks rely on prerequisites/proof; XP floors are reserved for meaningful phase gates.
- Study Together gives no standalone XP; normal lesson rewards remain authoritative.
