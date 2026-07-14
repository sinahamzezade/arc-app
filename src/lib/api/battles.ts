import { apiFetch } from "./client";

export type BattleStatusDto =
  | "draft"
  | "invited"
  | "accepted"
  | "funding"
  | "ready"
  | "in_progress"
  | "sudden_death"
  | "completed"
  | "declined"
  | "expired"
  | "cancelled"
  | "forfeited"
  | "voided"
  | "refunded";

export type BattleModeDto = "live" | "async";
export type BattleDifficultyDto =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "mixed";

export type BattleQuestionDto = {
  id: string;
  orderIndex: number;
  round: number;
  isSuddenDeath: boolean;
  questionVersionId: string;
  difficulty: string;
  timeLimitMs: number;
  openedAt: string | null;
  revealedAt: string | null;
  prompt: Record<string, unknown>;
  stem: string;
  options: Array<{ id: string; label: string }>;
  correctOptionIds?: string[];
  explanation?: string;
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

export type BattleDto = {
  id: string;
  status: BattleStatusDto;
  mode: BattleModeDto;
  subject: string;
  topic: string | null;
  difficulty: BattleDifficultyDto;
  questionCount: number;
  secondsPerQuestion: number;
  stakePerPlayer: number;
  pot: number;
  currentRound: number;
  inviteExpiresAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  playExpiresAt: string | null;
  winnerId: string | null;
  resultReason: string | null;
  role: "challenger" | "opponent" | null;
  yourScore: number;
  theirScore: number;
  youReady: boolean;
  opponentReady: boolean;
  youAnswered?: boolean;
  opponentAnswered?: boolean;
  youOnline?: boolean;
  opponentOnline?: boolean;
  suddenDeathCount?: number;
  isSuddenDeath?: boolean;
  opponent: {
    userId: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  currentQuestion: BattleQuestionDto | null;
  serverTimestamp: string;
};

export type BattleHistoryItemDto = {
  id: string;
  opponentId: string;
  opponentName: string;
  subject: string;
  topic: string | null;
  result: "win" | "loss" | "draw";
  yourScore: number;
  theirScore: number;
  stake: number;
  coinsDelta: number;
  accuracy: number;
  avgAnswerMs: number;
  xpAwarded: number;
  createdAt: string;
};

export type BattleStatsDto = {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  winStreak: number;
  favoriteSubject: string;
  bestTopic?: string | null;
};

export type CreateBattleInput = {
  opponentId: string;
  subject: string;
  topic?: string;
  difficulty: BattleDifficultyDto;
  questions: number;
  secondsPerQuestion: number;
  mode: BattleModeDto;
  stake: number;
  idempotencyKey: string;
};

function idemKey(seed?: string): string {
  if (!seed) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`.slice(
      0,
      64,
    );
  }
  if (seed.length <= 64) return seed;
  // Deterministic compress so retries keep same key.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  const prefix = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 52);
  return `${prefix}${hex}`.slice(0, 64);
}

function mutationOpts(key: string, accessToken?: string | null) {
  return {
    method: "POST" as const,
    body: { idempotencyKey: key },
    accessToken,
    headers: { "Idempotency-Key": key },
  };
}

export const battlesApi = {
  create(input: CreateBattleInput, accessToken?: string | null) {
    return apiFetch<BattleDto>("/battles", {
      method: "POST",
      body: input,
      accessToken,
      headers: { "Idempotency-Key": input.idempotencyKey },
    });
  },

  invites(accessToken?: string | null) {
    return apiFetch<{ items: BattleDto[] }>("/battles/invites", {
      accessToken,
    });
  },

  accept(id: string, accessToken?: string | null, key = idemKey(`accept:${id}`)) {
    return apiFetch<BattleDto>(`/battles/${id}/accept`, mutationOpts(key, accessToken));
  },

  decline(id: string, accessToken?: string | null, key = idemKey(`decline:${id}`)) {
    return apiFetch<BattleDto>(`/battles/${id}/decline`, mutationOpts(key, accessToken));
  },

  cancel(id: string, accessToken?: string | null, key = idemKey(`cancel:${id}`)) {
    return apiFetch<BattleDto>(`/battles/${id}/cancel`, mutationOpts(key, accessToken));
  },

  ready(id: string, accessToken?: string | null, key = idemKey(`ready:${id}`)) {
    return apiFetch<BattleDto>(`/battles/${id}/ready`, mutationOpts(key, accessToken));
  },

  get(id: string, accessToken?: string | null) {
    return apiFetch<BattleDto>(`/battles/${id}`, { accessToken });
  },

  state(id: string, accessToken?: string | null) {
    return apiFetch<BattleDto>(`/battles/${id}/state`, { accessToken });
  },

  heartbeat(id: string, accessToken?: string | null) {
    return apiFetch<BattleDto>(`/battles/${id}/heartbeat`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  submitAnswer(
    id: string,
    body: {
      battleQuestionId: string;
      selectedOptionId?: string;
      timedOut?: boolean;
      responseMs: number;
      idempotencyKey?: string;
    },
    accessToken?: string | null,
  ) {
    // Stable per battle+question for retries. Backend scopes by userId so
    // both players never collide on the unique idempotency_key index.
    const key =
      body.idempotencyKey ??
      idemKey(`ans:${id}:${body.battleQuestionId}`);
    return apiFetch<BattleDto>(`/battles/${id}/answers`, {
      method: "POST",
      body: { ...body, idempotencyKey: key },
      accessToken,
      headers: { "Idempotency-Key": key },
    });
  },

  continuePlay(id: string, accessToken?: string | null) {
    return apiFetch<BattleDto>(`/battles/${id}/continue`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  forfeit(id: string, accessToken?: string | null, key = idemKey(`forfeit:${id}`)) {
    return apiFetch<BattleDto>(`/battles/${id}/forfeit`, mutationOpts(key, accessToken));
  },

  rematch(id: string, accessToken?: string | null, key = idemKey()) {
    return apiFetch<BattleDto>(`/battles/${id}/rematch`, mutationOpts(key, accessToken));
  },

  history(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{
      items: BattleHistoryItemDto[];
      nextCursor: string | null;
    }>(`/battles/history${q}`, { accessToken });
  },

  statsMe(accessToken?: string | null) {
    return apiFetch<BattleStatsDto>("/battles/stats/me", { accessToken });
  },

  catalog(accessToken?: string | null) {
    return apiFetch<{
      subjects: Array<{
        slug: string;
        name: string;
        topics: Array<{
          slug: string;
          name: string;
          skillNodeId: string;
        }>;
      }>;
    }>("/battles/catalog", { accessToken });
  },
};
