"use client";

import { History } from "lucide-react";
import type { LeagueHistoryResponse } from "@/lib/api/leagues";

export function HistoryPanel({
  history,
  loading,
}: {
  history?: LeagueHistoryResponse | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p className="py-8 text-center text-[13px] font-bold text-[#8a7cb8]">
        Loading history…
      </p>
    );
  }

  const items = history?.items ?? [];
  if (!items.length) {
    return (
      <div className="rounded-[22px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-8 text-center">
        <History className="mx-auto h-6 w-6 text-[#b35cff]" strokeWidth={2.25} />
        <p className="mt-2 font-display text-[15px] font-semibold text-[#1b1730]">
          No seasons yet
        </p>
        <p className="mt-1 text-[12px] font-semibold text-[#8a7cb8]">
          Finish this week — results land here after Monday reset.
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.06)]">
      {items.map((row, i) => (
        <li
          key={row.id}
          className={
            i < items.length - 1
              ? "border-b border-[#f0ecf7] px-4 py-3.5"
              : "px-4 py-3.5"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-[14px] font-semibold capitalize text-[#1b1730]">
                #{row.finalPosition} · {row.promotionResult.replace(/_/g, " ")}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                {row.oldLeague.tier} {row.oldLeague.division} →{" "}
                {row.newLeague.tier} {row.newLeague.division}
              </p>
            </div>
            <p className="shrink-0 font-display text-[13px] font-bold text-[#6b4eff]">
              {row.finalXp.toLocaleString()} XP
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
