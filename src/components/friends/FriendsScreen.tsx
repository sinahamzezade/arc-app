"use client";

import Link from "next/link";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import {
  Copy,
  Gift,
  Search,
  Swords,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { battleFriends } from "@/lib/battle/mock-data";
import { cn } from "@/lib/utils";

const filters = ["Crew", "Following", "Requests"] as const;

/**
 * Friends = editorial contact sheet.
 * Not a settings-style list + purple invite banner.
 */
export default function FriendsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Crew");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const referral = "https://arc.app/r/soheil";
  const online = battleFriends.filter((f) => f.online);
  const filtered = battleFriends.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referral);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* MASTHEAD */}
      <header className="relative overflow-hidden bg-[#1b1433] px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-20px] h-32 w-32 rounded-full bg-arc-purple-500/30 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Social
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-none font-bold tracking-[-0.04em]">
              Your crew
            </h1>
          </div>
        </div>

        {/* Overlapping online stack */}
        <div className="relative mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold text-white/50">
              {online.length} online now
            </p>
            <div className="mt-3 flex items-center">
              {online.map((f, i) => (
                <span
                  key={f.id}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl font-display text-[16px] font-bold text-white ring-2 ring-[#1b1433]"
                  style={{
                    background: f.color,
                    marginLeft: i === 0 ? 0 : -12,
                    zIndex: online.length - i,
                  }}
                >
                  {f.initial}
                </span>
              ))}
            </div>
          </div>
          <p className="max-w-[7.5rem] text-right text-[12px] leading-snug font-semibold text-white/55">
            Battle · Study · Invite — same crew loop.
          </p>
        </div>
      </header>

      <div className="relative -mt-8 px-4 pb-10">
        {/* Referral coupon — gold tear-off, overlaps masthead */}
        <motion.button
          type="button"
          onClick={copy}
          initial={{ opacity: 0, y: 14, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          whileTap={{ scale: 0.98, rotate: 0 }}
          className="relative flex w-full overflow-hidden rounded-[18px] border-2 border-dashed border-[#c79a2e] bg-[#fff8e8] text-left shadow-[0_14px_28px_rgba(199,154,46,0.2)]"
        >
          <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center bg-[#ffc928] px-2 py-4 text-[#1b1730]">
            <Gift className="h-5 w-5" strokeWidth={2.5} />
            <p className="mt-1 text-[9px] font-black tracking-wide uppercase">
              Refer
            </p>
          </div>
          <div className="min-w-0 flex-1 px-3.5 py-3.5">
            <p className="font-display text-[16px] font-bold text-[#1b1730]">
              Invite & earn
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-[#8a6a1e]">
              100 coins signup · 20–30 gems on activation
            </p>
            <p className="mt-2 truncate font-mono text-[11px] text-[#c79a2e]">
              {referral}
            </p>
          </div>
          <div className="flex items-center pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b1730] text-white">
              <Copy className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </div>
        </motion.button>
        {copied ? (
          <p className="mt-2 text-center text-[12px] font-bold text-[#178a52]">
            Link copied
          </p>
        ) : null}

        {/* Ghost search */}
        <div className="mt-5 flex items-center gap-2 border-b border-[#d5ccec] px-0.5 pb-2">
          <Search className="h-4 w-4 text-[#b3a8d6]" strokeWidth={2.25} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find someone…"
            className="min-w-0 flex-1 bg-transparent font-display text-[16px] font-semibold text-[#1b1730] outline-none placeholder:text-[#c3badb]"
          />
        </div>

        {/* Underline filters */}
        <nav className="mt-4 flex gap-5 border-b border-[#ebe4f6]">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "relative pb-2.5 font-display text-[14px] font-semibold",
                  active ? "text-[#1b1730]" : "text-[#b3a8d6]",
                )}
              >
                {f}
                {active ? (
                  <motion.span
                    layoutId="friends-filter-line"
                    className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#ffc928]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        {filter === "Crew" ? (
          <ul className="mt-5 space-y-3">
            {filtered.map((f, i) => {
              const offset = i % 2 === 1;
              return (
                <motion.li
                  key={f.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-stretch gap-0 overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_22px_rgba(70,40,150,0.06)]",
                    offset && "ml-3",
                    !offset && "mr-3",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3.5">
                    <span
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] font-display text-[17px] font-bold text-white"
                      style={{ background: f.color }}
                    >
                      {f.initial}
                      <span
                        className={cn(
                          "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white",
                          f.online ? "bg-[#16c784]" : "bg-[#c3badb]",
                        )}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-[16px] font-semibold text-[#1b1730]">
                        {f.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                        Lv {f.level} · {f.league}
                        {f.online ? " · Live" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Vertical action rail */}
                  <div className="flex w-12 shrink-0 flex-col border-l border-[#f0ecf7]">
                    <Link
                      href={`/battle/create?opponent=${f.id}`}
                      aria-label={`Battle ${f.name}`}
                      className="flex flex-1 items-center justify-center bg-arc-purple-500 text-white"
                    >
                      <Swords className="h-4 w-4" strokeWidth={2.5} />
                    </Link>
                    <Link
                      href={`/study/invite?friend=${f.id}`}
                      aria-label={`Study with ${f.name}`}
                      className="flex flex-1 items-center justify-center bg-[#fff8e8] text-[#c79a2e]"
                    >
                      <Users className="h-4 w-4" strokeWidth={2.5} />
                    </Link>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#d5ccec] bg-white/60 px-5 py-12 text-center">
            <p className="font-display text-[18px] font-semibold text-[#8a7cb8]">
              {filter} empty
            </p>
            <p className="mt-2 text-[13px] font-semibold text-[#b3a8d6]">
              Graph wires later — crew is live now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
