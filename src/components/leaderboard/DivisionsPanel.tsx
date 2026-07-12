"use client";

import type { LeagueDivision } from "@/lib/leaderboard/mock-data";
import { DivisionRow } from "./DivisionRow";

export function DivisionsPanel({ divisions }: { divisions: LeagueDivision[] }) {
  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h2 className="font-display text-[20px] font-bold text-[#1b1730]">
          Division ladder
        </h2>
        <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
          Climb by weekly League XP
        </p>
      </div>

      <div className="relative pl-1">
        <div
          aria-hidden
          className="absolute top-5 bottom-5 left-[21px] w-0.5 bg-[#ebe4f6]"
        />
        {divisions.map((d, i) => (
          <DivisionRow key={d.id} division={d} index={i} />
        ))}
      </div>
    </div>
  );
}
