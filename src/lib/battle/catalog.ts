import type { BattleSetup } from "./types";

/** Fallback chips when catalog API unavailable (dev / offline). */
export const battleSubjects = [
  "SQL",
  "Python",
  "Excel",
  "Data Analysis",
  "Frontend",
] as const;

export const battleTopics: Record<string, string[]> = {
  SQL: ["SELECT", "WHERE", "JOIN", "GROUP BY", "Aggregations"],
  Python: ["Lists", "Dicts", "Pandas", "Loops"],
  Excel: ["VLOOKUP", "Pivot", "Charts"],
  "Data Analysis": ["Cleaning", "EDA", "Metrics"],
  Frontend: ["HTML", "CSS", "JS Basics"],
};

export type BattleCatalogTopic = {
  slug: string;
  name: string;
  skillNodeId: string;
  publishedCount?: number;
};

export type BattleCatalogSubject = {
  slug: string;
  name: string;
  publishedCount?: number;
  topics: BattleCatalogTopic[];
};

export const defaultBattleSetup: BattleSetup = {
  opponentId: "",
  subject: "sql",
  topic: "select",
  difficulty: "medium",
  questions: 5,
  seconds: 30,
  mode: "live",
  stake: 100,
};
