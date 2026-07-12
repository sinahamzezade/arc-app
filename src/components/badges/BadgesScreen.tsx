"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Award, Lock, Star, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import {
  badgesApi,
  type BadgeItemDto,
  type MyBadgesResponse,
} from "@/lib/api/badges";
import { badgeImageFor } from "@/lib/badges/icons";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

const filters = [
  { id: "all" as const, label: "All" },
  { id: "earned" as const, label: "Earned" },
  { id: "locked" as const, label: "Locked" },
];

type FilterId = (typeof filters)[number]["id"];

/**
 * Trophy hall — live Badges API (36 core catalog + progress).
 */
export default function BadgesScreen() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [data, setData] = useState<MyBadgesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuring, setFeaturing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await badgesApi.me();
      setData(res);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load badges",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const featured = useMemo(() => {
    if (!data) return [];
    return data.featuredCodes
      .map((code) => data.badges.find((b) => b.code === code))
      .filter(Boolean) as BadgeItemDto[];
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === "earned") {
      return data.badges.filter((b) => b.status === "earned");
    }
    if (filter === "locked") {
      return data.badges.filter((b) => b.status !== "earned");
    }
    return data.badges;
  }, [data, filter]);

  async function toggleFeatured(code: string) {
    if (!data || featuring) return;
    const earned = data.badges.find(
      (b) => b.code === code && b.status === "earned",
    );
    if (!earned) return;

    setFeaturing(code);
    try {
      const next = data.featuredCodes.includes(code)
        ? data.featuredCodes.filter((c) => c !== code)
        : [...data.featuredCodes, code].slice(0, 4);
      const res = await badgesApi.setFeatured(next);
      setData(res);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not update featured",
      );
    } finally {
      setFeaturing(null);
    }
  }

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
              {loading ? "…" : (data?.summary.earned ?? 0)}
              <span className="text-[22px] font-semibold text-white/35">
                /{data?.summary.totalCore ?? 36}
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
                  key={b.code}
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
                    src={badgeImageFor(b.iconAssetKey)}
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
          {filters.map((chip) => {
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
        {error ? (
          <p className="mb-4 rounded-2xl bg-[#fdecef] px-3.5 py-2.5 text-center text-[12px] font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="py-10 text-center text-[13px] font-bold text-[#8a7cb8]">
            Loading collection…
          </p>
        ) : (
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
                <BadgeStamp
                  key={badge.code}
                  badge={badge}
                  index={i}
                  featured={Boolean(data?.featuredCodes.includes(badge.code))}
                  onToggleFeatured={() => void toggleFeatured(badge.code)}
                  busy={featuring === badge.code}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && visible.length === 0 ? (
          <p className="mt-8 text-center text-[13px] font-extrabold text-[#b3a8d6]">
            Nothing in this shelf yet
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BadgeStamp({
  badge,
  index,
  featured,
  onToggleFeatured,
  busy,
}: {
  badge: BadgeItemDto;
  index: number;
  featured: boolean;
  onToggleFeatured: () => void;
  busy: boolean;
}) {
  const earned = badge.status === "earned";
  const inProgress = badge.status === "in_progress";
  const Icon =
    badge.category === "consistency"
      ? Star
      : badge.category === "social" || badge.category === "battle"
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
      <button
        type="button"
        disabled={!earned || busy}
        onClick={onToggleFeatured}
        aria-label={
          earned
            ? featured
              ? `Unfeature ${badge.name}`
              : `Feature ${badge.name}`
            : undefined
        }
        className={cn(
          "relative mx-auto flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[20px]",
          earned ? "bg-[#faf8ff]" : "bg-[#f0ecf7]",
        )}
      >
        <Image
          src={badgeImageFor(badge.iconAssetKey)}
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
        ) : featured ? (
          <span className="absolute top-1 right-1 rounded-md bg-[#ffc928] px-1.5 py-0.5 text-[8px] font-black text-[#0f1220]">
            ★
          </span>
        ) : null}
      </button>

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
            {badge.description}
          </p>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            earned
              ? "bg-arc-purple-500 text-white"
              : "bg-[#ebe4f6] text-[#b3a8d6]",
          )}
        >
          <Icon className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </div>

      {earned ? (
        <p className="mt-2 text-[10px] font-black tracking-wide text-[#ffc928] uppercase">
          {badge.rarity}
          {featured ? " · featured" : ""}
        </p>
      ) : inProgress && badge.progress ? (
        <p className="mt-2 text-[10px] font-black tracking-wide text-arc-purple-500 uppercase">
          {badge.progress.current}/{badge.progress.target} ·{" "}
          {badge.progress.percent}%
        </p>
      ) : (
        <p className="mt-2 text-[10px] font-black tracking-wide text-[#c3badb] uppercase">
          Locked
        </p>
      )}
    </motion.article>
  );
}
