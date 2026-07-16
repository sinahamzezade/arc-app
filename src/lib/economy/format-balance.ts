/** Compact display for wallet chips (184, 1.2k, 12k, 1.5m). */
export function formatBalance(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000)
      .toFixed(n >= 10_000_000 ? 0 : 1)
      .replace(/\.0$/, "")}m`;
  }
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return n.toLocaleString();
}
