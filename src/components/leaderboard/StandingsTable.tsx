"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { LeaderboardData } from "@/lib/leaderboard/mock-data";
import { StandingsRow } from "./StandingsRow";

export function StandingsTable({ data }: { data: LeaderboardData }) {
  const sorted = [...data.entries].sort((a, b) => a.rank - b.rank);
  const promoteTop = data.stats.promoteTop;
  const demoteFloor = data.stats.cohortSize - data.stats.demoteBottom + 1;

  const promoteRows = sorted.filter((e) => e.rank <= promoteTop);
  const midRows = sorted.filter(
    (e) => e.rank > promoteTop && e.rank < demoteFloor,
  );
  const demoteRows = sorted.filter((e) => e.rank >= demoteFloor);

  return (
    <section aria-label="League standings table">
      <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
        <div>
          <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#1b1730]">
            Standings
          </h2>
          <p className="text-[11px] font-extrabold text-[#8a7cb8]">
            Weekly League XP · resets Monday
          </p>
        </div>
        <span className="rounded-full bg-[#0f1220] px-2.5 py-1 text-[10px] font-black tracking-wide text-[#ffc928] uppercase">
          Auto · 20s
        </span>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#f0ecf7] bg-[#faf8ff] text-[10px] font-black tracking-[0.08em] text-[#8a7cb8] uppercase">
                <th scope="col" className="w-11 px-3 py-3 font-black">
                  #
                </th>
                <th scope="col" className="px-2 py-3 font-black">
                  Learner
                </th>
                <th scope="col" className="w-16 px-2 py-3 text-center font-black">
                  Streak
                </th>
                <th scope="col" className="w-14 px-3 py-3 text-right font-black">
                  XP
                </th>
                <th scope="col" className="w-11 px-2 py-3">
                  <span className="sr-only">Cheer</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {promoteRows.map((entry) => (
                <StandingsRow key={entry.id} entry={entry} zone="promote" />
              ))}

              <tr>
                <td colSpan={5} className="p-0">
                  <div className="flex items-center justify-center gap-1.5 border-y border-dashed border-[#d4eedf] bg-[#f6fbf8] px-3 py-2 text-[10px] font-black tracking-[0.06em] text-[#16a56b] uppercase">
                    <ArrowUp className="h-3 w-3" strokeWidth={3} />
                    Promote cut · top {promoteTop}
                    <ArrowUp className="h-3 w-3" strokeWidth={3} />
                  </div>
                </td>
              </tr>

              {midRows.map((entry) => (
                <StandingsRow key={entry.id} entry={entry} zone="mid" />
              ))}

              {demoteRows.length > 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="flex items-center justify-center gap-1.5 border-y border-dashed border-[#f5c4c6] bg-[#fff5f6] px-3 py-2 text-[10px] font-black tracking-[0.06em] text-[#e5484d] uppercase">
                      <ArrowDown className="h-3 w-3" strokeWidth={3} />
                      Demote zone · bottom {data.stats.demoteBottom}
                      <ArrowDown className="h-3 w-3" strokeWidth={3} />
                    </div>
                  </td>
                </tr>
              ) : null}

              {demoteRows.map((entry) => (
                <StandingsRow key={entry.id} entry={entry} zone="demote" />
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-[#f0ecf7] px-4 py-3 text-[12px] leading-snug font-medium text-[#8a7cb8]">
          {data.footerNote}
        </p>
      </div>
    </section>
  );
}
