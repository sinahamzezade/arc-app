import type { BattleSetup } from "./types";

/** Fallback chips when catalog API unavailable (dev / offline). */
export const battleSubjects = [
  "Web Foundations",
  "HTML & CSS",
  "JavaScript",
  "React",
] as const;

export const battleTopics: Record<string, string[]> = {
  "Web Foundations": [
    "What Is the Web?",
    "How Browsers Turn Code into Pixels",
    "Your Developer Setup",
  ],
  "HTML & CSS": [
    "Your First HTML Page",
    "Text, Links, Images & Lists",
    "CSS Basics: Selectors & the Cascade",
  ],
  JavaScript: [
    "Variables, Types & Operators",
    "Conditionals & Loops",
    "Functions & Scope",
  ],
  React: [
    "Why React & Thinking in Components",
    "JSX & Props",
    "State & Events",
  ],
};

export type BattleCatalogTopic = {
  slug: string;
  name: string;
  skillNodeId: string;
};

export type BattleCatalogSubject = {
  slug: string;
  name: string;
  topics: BattleCatalogTopic[];
};

export const defaultBattleSetup: BattleSetup = {
  opponentId: "",
  subject: "javascript",
  topic: "js-first-steps",
  difficulty: "medium",
  questions: 5,
  seconds: 30,
  mode: "live",
  stake: 100,
};
