"use client";

export function ScoreBreakdownPanel({
  breakdown,
  proofWeightedXp,
  activeDays,
}: {
  breakdown: Record<string, number>;
  proofWeightedXp: number;
  activeDays: number;
}) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    return (
      <p className="rounded-[18px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-3 text-[12px] font-semibold text-[#8a7cb8]">
        No League XP sources yet this season.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
        {entries.map(([source, xp], i) => (
          <li
            key={source}
            className={
              i < entries.length - 1
                ? "flex items-center justify-between border-b border-[#f0ecf7] px-4 py-3"
                : "flex items-center justify-between px-4 py-3"
            }
          >
            <span className="text-[13px] font-semibold capitalize text-[#1b1730]">
              {source.replace(/_/g, " ")}
            </span>
            <span className="font-display text-[13px] font-bold text-[#6b4eff]">
              {xp.toLocaleString()} XP
            </span>
          </li>
        ))}
      </ul>
      <p className="px-0.5 text-[11px] font-bold text-[#8a7cb8]">
        Tie-break: proof XP {proofWeightedXp.toLocaleString()} · active days{" "}
        {activeDays}
      </p>
    </div>
  );
}
