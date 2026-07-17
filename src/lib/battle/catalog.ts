import type { BattleSetup } from "./types";

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
  subject: "",
  topic: "",
  difficulty: "medium",
  questions: 5,
  seconds: 30,
  mode: "live",
  stake: 100,
};
