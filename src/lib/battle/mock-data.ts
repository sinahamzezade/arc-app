export type BattleDifficulty = "easy" | "medium" | "hard" | "mixed";
export type BattleMode = "live" | "async";
export type BattleResult = "win" | "loss" | "draw" | "pending";

export type BattleFriend = {
  id: string;
  name: string;
  initial: string;
  color: string;
  league: string;
  level: number;
  online: boolean;
};

export type BattleQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
};

export type BattleHistoryItem = {
  id: string;
  opponentId: string;
  opponentName: string;
  subject: string;
  difficulty: BattleDifficulty;
  yourScore: number;
  theirScore: number;
  result: BattleResult;
  stake: number;
  coinsDelta: number;
};

export type BattleInvite = {
  id: string;
  from: BattleFriend;
  subject: string;
  topic: string;
  questions: number;
  seconds: number;
  mode: BattleMode;
  stake: number;
  difficulty: BattleDifficulty;
  rewards: { xp: number; gems: number };
  expiresIn: string;
};

export type BattleSetup = {
  opponentId: string;
  subject: string;
  topic: string;
  difficulty: BattleDifficulty;
  questions: number;
  seconds: number;
  mode: BattleMode;
  stake: number;
};

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

export const battleFriends: BattleFriend[] = [
  {
    id: "f1",
    name: "Sara K.",
    initial: "S",
    color: "#6B4EFF",
    league: "Silver",
    level: 6,
    online: true,
  },
  {
    id: "f2",
    name: "Alex M.",
    initial: "A",
    color: "#2DB7F5",
    league: "Gold",
    level: 9,
    online: true,
  },
  {
    id: "f3",
    name: "Mina R.",
    initial: "M",
    color: "#FF8A3D",
    league: "Bronze",
    level: 4,
    online: false,
  },
  {
    id: "f4",
    name: "John T.",
    initial: "J",
    color: "#16C784",
    league: "Silver",
    level: 7,
    online: true,
  },
];

export const battleQuestions: BattleQuestion[] = [
  {
    id: "bq1",
    prompt: "Which clause filters rows in SQL?",
    options: [
      { id: "a", label: "ORDER BY" },
      { id: "b", label: "WHERE" },
      { id: "c", label: "GROUP BY" },
      { id: "d", label: "HAVING only" },
    ],
    correctOptionId: "b",
    explanation: "WHERE filters rows before aggregation. HAVING filters groups.",
  },
  {
    id: "bq2",
    prompt: "What does SELECT * FROM users return?",
    options: [
      { id: "a", label: "Only user ids" },
      { id: "b", label: "All columns from users" },
      { id: "c", label: "A single random row" },
      { id: "d", label: "Nothing without WHERE" },
    ],
    correctOptionId: "b",
    explanation: "* means every column in the table.",
  },
  {
    id: "bq3",
    prompt: "JOIN combines rows based on…",
    options: [
      { id: "a", label: "Matching keys" },
      { id: "b", label: "Alphabetical order" },
      { id: "c", label: "Table size" },
      { id: "d", label: "Random sample" },
    ],
    correctOptionId: "a",
    explanation: "JOIN matches related keys across tables.",
  },
  {
    id: "bq4",
    prompt: "Which query counts all rows?",
    options: [
      { id: "a", label: "SELECT COUNT(*) FROM t" },
      { id: "b", label: "SELECT SUM(*) FROM t" },
      { id: "c", label: "SELECT ALL FROM t" },
      { id: "d", label: "SELECT ROWS FROM t" },
    ],
    correctOptionId: "a",
    explanation: "COUNT(*) tallies rows, including nulls in other columns.",
  },
  {
    id: "bq5",
    prompt: "GROUP BY is used to…",
    options: [
      { id: "a", label: "Sort results" },
      { id: "b", label: "Aggregate per category" },
      { id: "c", label: "Delete duplicates only" },
      { id: "d", label: "Rename columns" },
    ],
    correctOptionId: "b",
    explanation: "GROUP BY buckets rows so aggregates run per group.",
  },
];

export const incomingInvite: BattleInvite = {
  id: "inv-1",
  from: battleFriends[0],
  subject: "SQL",
  topic: "WHERE",
  questions: 5,
  seconds: 30,
  mode: "live",
  stake: 100,
  difficulty: "medium",
  rewards: { xp: 25, gems: 3 },
  expiresIn: "14m",
};

export const battleHistory: BattleHistoryItem[] = [
  {
    id: "h1",
    opponentId: "f2",
    opponentName: "Alex M.",
    subject: "SQL",
    difficulty: "medium",
    yourScore: 420,
    theirScore: 380,
    result: "win",
    stake: 100,
    coinsDelta: 100,
  },
  {
    id: "h2",
    opponentId: "f4",
    opponentName: "John T.",
    subject: "Python",
    difficulty: "easy",
    yourScore: 280,
    theirScore: 310,
    result: "loss",
    stake: 50,
    coinsDelta: -50,
  },
];

export const battleHubStats = {
  played: 24,
  wins: 15,
  losses: 7,
  draws: 2,
  winRate: 63,
  winStreak: 3,
  favoriteSubject: "SQL",
};

export const defaultBattleSetup: BattleSetup = {
  opponentId: "f1",
  subject: "SQL",
  topic: "WHERE",
  difficulty: "medium",
  questions: 5,
  seconds: 30,
  mode: "live",
  stake: 100,
};
