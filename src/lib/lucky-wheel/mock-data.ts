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
  segments: WheelSegment[];
};

export const luckyWheelMockData: LuckyWheelMockData = {
  title: "Lucky Wheel",
  subtitle: "One free spin every day. Land something good.",
  spinsLeft: 1,
  spinsPerDay: 1,
  segments: [
    {
      id: "coins-50",
      label: "50 Coins",
      kind: "coins",
      amount: 50,
      color: "#FFC928",
      weight: 22,
    },
    {
      id: "gems-10",
      label: "10 Gems",
      kind: "gems",
      amount: 10,
      color: "#B35CFF",
      weight: 14,
    },
    {
      id: "xp-25",
      label: "25 XP",
      kind: "xp",
      amount: 25,
      color: "#3BA5FF",
      weight: 20,
    },
    {
      id: "coins-100",
      label: "100 Coins",
      kind: "coins",
      amount: 100,
      color: "#FF8A3D",
      weight: 12,
    },
    {
      id: "try-again",
      label: "Try Again",
      kind: "try_again",
      amount: 0,
      color: "#8F97B8",
      weight: 10,
    },
    {
      id: "gems-25",
      label: "25 Gems",
      kind: "gems",
      amount: 25,
      color: "#6B4EFF",
      weight: 8,
    },
    {
      id: "xp-50",
      label: "50 XP",
      kind: "xp",
      amount: 50,
      color: "#62D84E",
      weight: 10,
    },
    {
      id: "badge",
      label: "Lucky Badge",
      kind: "badge",
      amount: 1,
      color: "#FF6D5A",
      weight: 4,
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
