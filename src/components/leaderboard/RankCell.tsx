export function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="font-display text-[15px] font-bold text-[#c79a2e]">1</span>
    );
  }
  if (rank === 2) {
    return (
      <span className="font-display text-[15px] font-bold text-[#8a9198]">2</span>
    );
  }
  if (rank === 3) {
    return (
      <span className="font-display text-[15px] font-bold text-[#c08457]">3</span>
    );
  }
  return (
    <span className="font-display text-[15px] font-bold tabular-nums text-[#b3a8d6]">
      {rank}
    </span>
  );
}
