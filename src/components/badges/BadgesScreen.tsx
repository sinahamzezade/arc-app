"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Award, Lock, Star, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  badgeFilters,
  badgesMockData,
  type BadgeItem,
  type BadgesMockData,
} from "@/lib/badges/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

type FilterId = (typeof badgeFilters)[number]["id"];

/**
 * Trophy hall — night hero + filter overhang + stamp grid.
 * Matches Arc night-hero family.
 */
export default function BadgesScreen({
  data = badgesMockData,
}: {
  data?: BadgesMockData;
}) {
  const [filter, setFilter] = useState<FilterId>("all");

  const featured = data.items.filter((b) => data.featuredIds.includes(b.id));

  const visible = useMemo(() => {
    if (filter === "earned") return data.items.filter((b) => b.status === "earned");
    if (filter === "locked") return data.items.filter((b) => b.status === "locked");
    return data.items;
  }, [data.items, filter]);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Collection
            </p>
            <h1 className="mt-0.5 font-display text-[26px] leading-none font-bold tracking-[-0.03em]">
              Badges
            </h1>
          </div>
          <Award className="h-5 w-5 text-[#ffc928]" strokeWidth={2.25} />
        </div>

        <div className="relative mt-7 grid grid-cols-[1.2fr_1fr] items-end gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              Progress
            </p>
            <p className="mt-1 font-display text-[56px] leading-[0.88] font-bold tracking-[-0.05em]">
              {data.earned}
              <span className="text-[22px] font-semibold text-white/35">
                /{data.total}
              </span>
            </p>
            <p className="mt-2 text-[13px] font-bold text-white/45">
              earned · keep stacking proof
            </p>
          </div>

          <div className="relative flex h-[96px] items-end justify-end">
            <div className="flex -space-x-3">
              {featured.slice(0, 3).map((b, i) => (
                <motion.div
                  key={b.id}
                  className={cn(
                    "relative h-16 w-16 overflow-hidden rounded-2xl bg-white/10 ring-2 ring-[#0f1220]",
                    i === 0 && "-rotate-6 z-[3]",
                    i === 1 && "rotate-0 z-[2] -translate-y-2",
                    i === 2 && "rotate-6 z-[1]",
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...softSpring, delay: 0.08 + i * 0.05 }}
                >
                  <Image
                    src={b.image}
                    alt={b.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-[1] -mt-5 px-4">
        <nav
          role="tablist"
          aria-label="Badge filters"
          className="flex gap-1 rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(70,40,150,0.1)]"
        >
          {badgeFilters.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(chip.id)}
                className={cn(
                  "flex-1 rounded-[14px] py-2.5 font-display text-[13px] font-semibold",
                  active
                    ? "bg-[#0f1220] text-[#ffc928]"
                    : "text-[#8a7cb8]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={softSpring}
            className="grid grid-cols-2 gap-3"
          >
            {visible.map((badge, i) => (
              <BadgeStamp key={badge.id} badge={badge} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {visible.length === 0 ? (
          <p className="mt-8 text-center text-[13px] font-extrabold text-[#b3a8d6]">
            Nothing in this shelf yet
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BadgeStamp({ badge, index }: { badge: BadgeItem; index: number }) {
  const earned = badge.status === "earned";
  const Icon =
    badge.category === "streak"
      ? Star
      : badge.category === "social"
        ? Trophy
        : Award;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: index % 2 === 0 ? -1.5 : 1.5,
      }}
      transition={{ ...softSpring, delay: Math.min(index * 0.03, 0.24) }}
      className={cn(
        "relative overflow-hidden rounded-[22px] border p-3",
        earned
          ? "border-[#ebe4f6] bg-white shadow-[0_10px_24px_rgba(70,40,150,0.08)]"
          : "border-dashed border-[#d5ccec] bg-white/60",
        index % 3 === 1 && "mt-3",
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[20px]",
          earned ? "bg-[#faf8ff]" : "bg-[#f0ecf7]",
        )}
      >
        <Image
          src={badge.image}
          alt=""
          width={88}
          height={88}
          className={cn(
            "h-full w-full object-cover",
            !earned && "opacity-35 grayscale",
          )}
        />
        {!earned ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[#0f1220]/25">
            <Lock className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-display text-[13px] font-bold",
              earned ? "text-[#1b1730]" : "text-[#8a7cb8]",
            )}
          >
            {badge.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold text-[#8a7cb8]">
            {badge.blurb}
          </p>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            earned ? "bg-arc-purple-500 text-white" : "bg-[#ebe4f6] text-[#b3a8d6]",
          )}
        >
          <Icon className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </div>

      {earned && badge.earnedOn ? (
        <p className="mt-2 text-[10px] font-black tracking-wide text-[#ffc928] uppercase">
          {badge.earnedOn}
        </p>
      ) : (
        <p className="mt-2 text-[10px] font-black tracking-wide text-[#c3badb] uppercase">
          Locked
        </p>
      )}
    </motion.article>
  );
}
