"use client";

import { ArrowDown, ArrowUp, Trophy } from "lucide-react";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/leaderboard/types";
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

  if (sorted.length === 0) {
    return (
      <section aria-label="League standings">
        <Header />
        <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-10 text-center">
          <Trophy
            className="mx-auto h-8 w-8 text-arc-purple-500"
            strokeWidth={2}
          />
          <p className="mt-3 font-display text-[16px] font-bold text-[#0f1220]">
            Standings empty
          </p>
          <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
            Earn League XP this week — you&apos;ll show up here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="League standings">
      <Header />

      <div className="space-y-3">
        {promoteRows.length > 0 ? (
          <ZoneBlock
            tone="promote"
            label={`Promote · top ${promoteTop}`}
            icon={<ArrowUp className="h-3 w-3" strokeWidth={3} />}
            rows={promoteRows}
          />
        ) : null}

        {midRows.length > 0 ? (
          <ZoneBlock
            tone="mid"
            label="Safe midfield"
            rows={midRows}
          />
        ) : null}

        {demoteRows.length > 0 ? (
          <ZoneBlock
            tone="demote"
            label={`Demote · bottom ${data.stats.demoteBottom}`}
            icon={<ArrowDown className="h-3 w-3" strokeWidth={3} />}
            rows={demoteRows}
          />
        ) : null}
      </div>

      <p className="mt-3 px-0.5 text-[12px] leading-snug font-medium text-arc-lavender-600">
        {data.footerNote}
      </p>
    </section>
  );
}

function Header() {
  return (
    <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
      <div>
        <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#0f1220]">
          Standings
        </h2>
        <p className="text-[11px] font-extrabold text-arc-lavender-600">
          Weekly League XP · resets Monday
        </p>
      </div>
    </div>
  );
}

function ZoneBlock({
  tone,
  label,
  icon,
  rows,
}: {
  tone: "promote" | "mid" | "demote";
  label: string;
  icon?: React.ReactNode;
  rows: LeaderboardEntry[];
}) {
  const banner =
    tone === "promote"
      ? "border-[#d4eedf] bg-[#f6fbf8] text-[#16a56b]"
      : tone === "demote"
        ? "border-[#f5c4c6] bg-[#fff5f6] text-[#e5484d]"
        : "border-[#ebe4f6] bg-[#faf8ff] text-arc-lavender-600";

  return (
    <div className="overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6]">
      <div
        className={`flex items-center justify-center gap-1.5 border-b px-3 py-2 text-[10px] font-black tracking-[0.08em] uppercase ${banner}`}
      >
        {icon}
        {label}
        {icon}
      </div>
      <ul className="divide-y divide-[#f0ecf7]">
        {rows.map((entry) => (
          <li key={entry.id}>
            <StandingsRow entry={entry} zone={tone} />
          </li>
        ))}
      </ul>
    </div>
  );
}
