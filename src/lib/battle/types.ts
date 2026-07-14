export type BattleDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "mixed";
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
  /**
   * Local play only. Live pool play payloads never include this —
   * server grades via battle check API.
   */
  correctOptionId?: string;
  explanation?: string;
  /** Content-pool version id when sourced from QuestionPool. */
  questionVersionId?: string;
  isSuddenDeath?: boolean;
  answers?: Array<{
    participantId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    questionScore: number;
    responseMs: number;
    timedOut: boolean;
    isYou?: boolean;
  }>;
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
