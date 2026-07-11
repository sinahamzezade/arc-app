export type WheelPrizeKind = "coins" | "gems" | "xp" | "badge" | "try_again";

export type WheelSegment = {
  id: string;
  label: string;
  kind: WheelPrizeKind;
  amount: number;
  color: string;
  weight: number;
};

export type LuckyWheelMockData = {
  title: string;
  subtitle: string;
  spinsLeft: number;
  spinsPerDay: number;
  expiresIn: string;
  previewGems: number;
  segments: WheelSegment[];
};

/** Clay toy palette — matches prize-wheel art (purple / orange / gold). */
const CLAY = {
  purple: "#6B4EFF",
  purpleDeep: "#4B2FD6",
  orange: "#FF4D2D",
  gold: "#FFD233",
} as const;

export const luckyWheelMockData: LuckyWheelMockData = {
  title: "Lucky Wheel",
  subtitle: "Daily free spin. Land the loot.",
  spinsLeft: 1,
  spinsPerDay: 1,
  expiresIn: "4h",
  previewGems: 15,
  segments: [
    {
      id: "coins-50",
      label: "50 Coins",
      kind: "coins",
      amount: 50,
      color: CLAY.gold,
      weight: 22,
    },
    {
      id: "gems-10",
      label: "10 Gems",
      kind: "gems",
      amount: 10,
      color: CLAY.purple,
      weight: 16,
    },
    {
      id: "xp-25",
      label: "25 XP",
      kind: "xp",
      amount: 25,
      color: CLAY.orange,
      weight: 20,
    },
    {
      id: "coins-100",
      label: "100 Coins",
      kind: "coins",
      amount: 100,
      color: CLAY.gold,
      weight: 12,
    },
    {
      id: "try-again",
      label: "Try Again",
      kind: "try_again",
      amount: 0,
      color: CLAY.purple,
      weight: 14,
    },
    {
      id: "badge",
      label: "Lucky Badge",
      kind: "badge",
      amount: 1,
      color: CLAY.orange,
      weight: 6,
    },
  ],
};

/** Weighted pick — UI mock only. Real rewards must be server-side. */
export function pickWeightedSegment(segments: WheelSegment[]): WheelSegment {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const segment of segments) {
    roll -= segment.weight;
    if (roll <= 0) return segment;
  }
  return segments[segments.length - 1]!;
}
