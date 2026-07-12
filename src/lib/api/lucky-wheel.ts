import { apiFetch } from "./client";

export type WheelSegmentDto = {
  id: string;
  label: string;
  kind: string;
  amount: number;
  color: string;
};

export type LuckyWheelCurrent = {
  serverNow: string;
  rewardDay: string;
  campaignSlug: string;
  spinsAvailable: number;
  spinsPerDay: number;
  nextSpinAt: string | null;
  resetsAt: string;
  layoutVersion: number;
  segments: WheelSegmentDto[];
  previewGems: number;
  timezone: string;
  respinGemPrice: number;
  paidRespinsLeft: number;
};

export type LuckyWheelSpinResult = {
  spinId: string;
  winningSegmentId: string;
  landingIndex: number;
  reward: {
    type: string;
    amount: number;
    label: string;
  };
  wallet: {
    coins: number;
    gems: number;
    lifetimeXp: number;
    version: number;
  };
  spinsAvailable: number;
  resetsAt: string | null;
  layoutVersion: number;
};

export type LuckyWheelRespinResult = {
  alreadyPurchased: boolean;
  spinsAvailable: number;
  paidRespinsLeft: number;
  wallet: {
    coins: number;
    gems: number;
    lifetimeXp: number;
    version: number;
  };
};

export const luckyWheelApi = {
  getCurrent(accessToken?: string | null) {
    return apiFetch<LuckyWheelCurrent>("/lucky-wheel", { accessToken });
  },

  spin(idempotencyKey: string, accessToken?: string | null) {
    return apiFetch<LuckyWheelSpinResult>("/lucky-wheel/spin", {
      method: "POST",
      body: { idempotencyKey },
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  purchaseRespin(idempotencyKey: string, accessToken?: string | null) {
    return apiFetch<LuckyWheelRespinResult>("/lucky-wheel/respin/purchase", {
      method: "POST",
      body: { idempotencyKey },
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  getHistory(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{
      items: Array<{
        spinId: string;
        rewardKey: string;
        reward: Record<string, unknown>;
        landingIndex: number;
        createdAt: string;
      }>;
      nextCursor: string | null;
    }>(`/lucky-wheel/history${q}`, { accessToken });
  },

  getSpin(spinId: string, accessToken?: string | null) {
    return apiFetch<LuckyWheelSpinResult>(
      `/lucky-wheel/rewards/${spinId}`,
      { accessToken },
    );
  },
};

export function formatWheelCountdown(
  targetIso: string | null | undefined,
  serverNowIso?: string,
): string {
  if (!targetIso) return "Ready";
  const now = serverNowIso ? new Date(serverNowIso).getTime() : Date.now();
  const ms = Math.max(0, new Date(targetIso).getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h <= 0 && m <= 0) return "Ready";
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
