/** Stake caps — mirror backend battle.constants maxStakeForRankLevel */

export function maxStakeForRankLevel(rankLevel: number): number {
  if (rankLevel >= 10) return 1_000;
  if (rankLevel >= 7) return 500;
  if (rankLevel >= 5) return 250;
  return 100;
}

export const STAKE_PRESETS = [50, 100, 250, 500, 1000] as const;

export function stakeOptionsForRank(rankLevel: number): number[] {
  const max = maxStakeForRankLevel(rankLevel);
  return STAKE_PRESETS.filter((s) => s <= max);
}
