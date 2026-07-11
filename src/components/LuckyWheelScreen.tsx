"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";
import { Award, Clock, Coins, Gem, Star, Zap, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { assets } from "@/lib/assets";
import {
  luckyWheelMockData,
  pickWeightedSegment,
  type LuckyWheelMockData,
  type WheelPrizeKind,
  type WheelSegment,
} from "@/lib/lucky-wheel/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 340, damping: 28 };
const popSpring = { type: "spring" as const, stiffness: 440, damping: 32 };

type SpinPhase = "idle" | "spinning" | "result";

const prizeIcon: Record<WheelPrizeKind, typeof Coins> = {
  coins: Coins,
  gems: Gem,
  xp: Zap,
  badge: Award,
  try_again: Sparkles,
};

const RIM = "#6B4EFF";
const RIM_DEEP = "#4B2FD6";
const GOLD = "#FFD233";

/**
 * Lucky Wheel — night-hero family (Home / Identity / Wallet).
 * Navy stage + clay wheel hero; lavender sheet for prize board.
 */
export default function LuckyWheelScreen({
  data = luckyWheelMockData,
}: {
  data?: LuckyWheelMockData;
}) {
  const [phase, setPhase] = useState<SpinPhase>("idle");
  const [spinsLeft, setSpinsLeft] = useState(data.spinsLeft);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const spinningRef = useRef(false);

  const canSpin = spinsLeft > 0 && phase !== "spinning";

  const handleSpin = () => {
    if (!canSpin || spinningRef.current) return;
    spinningRef.current = true;
    setPhase("spinning");
    setResult(null);

    const winner = pickWeightedSegment(data.segments);
    const n = data.segments.length;
    const winnerIndex = data.segments.findIndex((s) => s.id === winner.id);
    const slice = 360 / n;
    const targetCenter = winnerIndex * slice + slice / 2;
    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const nextRotation =
      rotation + extraTurns * 360 + (360 - targetCenter) - (rotation % 360);

    setRotation(nextRotation);

    window.setTimeout(() => {
      setResult(winner);
      setSpinsLeft((s) => Math.max(0, s - 1));
      setPhase("result");
      spinningRef.current = false;
    }, 4200);
  };

  const dismissResult = () => {
    setPhase("idle");
    setResult(null);
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* NIGHT HERO */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-28 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
          }}
        />

        {/* Header — Identity / Wallet pattern */}
        <header className="relative z-[1] flex items-start gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Daily bonus
            </p>
            <p className="mt-0.5 text-[13px] font-bold text-white/45">
              Free spin · resets with the day
            </p>
          </div>
          <motion.div
            className="rounded-2xl bg-[#ffc928] px-3 py-2 text-[#0f1220] shadow-[0_4px_0_#c79a2e]"
            animate={
              phase === "spinning" ? { scale: [1, 1.04, 1] } : { scale: 1 }
            }
            transition={
              phase === "spinning"
                ? { duration: 0.35, repeat: Infinity }
                : softSpring
            }
          >
            <p className="text-[9px] font-black tracking-wide uppercase opacity-60">
              Spins
            </p>
            <p className="font-display text-[18px] leading-none font-bold">
              {spinsLeft}
              <span className="text-[12px] opacity-50">
                /{data.spinsPerDay}
              </span>
            </p>
          </motion.div>
        </header>

        {/* Masthead + prize-wheel art crop */}
        <div className="relative z-[1] mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0 pb-1">
            <h1 className="font-display text-[40px] leading-[0.88] font-bold tracking-[-0.04em] text-balance">
              {data.title}
            </h1>
            <p className="mt-2.5 max-w-[15rem] text-[13px] leading-snug font-bold text-white/60 text-pretty">
              {data.subtitle}
            </p>
          </div>
          <motion.div
            className="relative -mr-1 mb-[-4px] h-[96px] w-[96px] shrink-0"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={assets.home.prizeWheel}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="h-full w-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.4)]"
              priority
            />
          </motion.div>
        </div>

        {/* Status chips — same vocabulary as Home Lucky Wheel card */}
        <div className="relative z-[1] mt-5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc928] px-2.5 py-1.5 text-[11px] font-extrabold text-[#0f1220]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            {spinsLeft} spin{spinsLeft === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/15">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            {data.expiresIn}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/15">
            <Gem className="h-3.5 w-3.5 text-[#b35cff]" strokeWidth={2.5} />
            up to {data.previewGems}
          </span>
        </div>

        {/* Clay wheel stage */}
        <div className="relative z-[1] mx-auto mt-7 flex w-full max-w-[300px] flex-col items-center">
          <motion.div
            className="relative z-20 mb-[-6px]"
            animate={phase === "spinning" ? { y: [0, 4, 0] } : { y: 0 }}
            transition={
              phase === "spinning"
                ? { duration: 0.32, repeat: Infinity }
                : softSpring
            }
          >
            <div
              className="h-0 w-0 border-x-[14px] border-t-[26px] border-x-transparent"
              style={{
                borderTopColor: GOLD,
                filter: "drop-shadow(0 3px 0 #c79a2e)",
              }}
            />
          </motion.div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute top-1/2 left-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-arc-purple-500/35 blur-3xl"
            />

            <div
              className="relative rounded-full p-[16px]"
              style={{
                background: `linear-gradient(145deg, #8b6fff 0%, ${RIM} 42%, ${RIM_DEEP} 100%)`,
                boxShadow: `
                  0 18px 36px rgba(15,18,32,0.55),
                  inset 0 3px 6px rgba(255,255,255,0.35),
                  inset 0 -6px 10px rgba(40,20,120,0.45)
                `,
              }}
            >
              <motion.div
                className="relative h-[248px] w-[248px] overflow-hidden rounded-full"
                style={{
                  boxShadow:
                    "inset 0 0 0 3px rgba(255,255,255,0.2), inset 0 8px 18px rgba(0,0,0,0.18)",
                }}
                animate={{ rotate: rotation }}
                transition={
                  phase === "spinning"
                    ? { duration: 4.1, ease: [0.12, 0.8, 0.12, 1] }
                    : { duration: 0 }
                }
              >
                <ClayWheelDisc segments={data.segments} />
              </motion.div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white"
                  style={{
                    boxShadow: `
                      0 6px 0 #d4c8ef,
                      inset 0 2px 4px rgba(255,255,255,0.9),
                      0 0 0 4px ${GOLD}
                    `,
                  }}
                >
                  <Star
                    className="h-7 w-7"
                    style={{ color: GOLD, fill: GOLD }}
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </div>

            {/* Pedestal */}
            <div className="relative z-0 mx-auto -mt-1 flex flex-col items-center">
              <div
                className="h-7 w-11 rounded-b-2xl"
                style={{
                  background: `linear-gradient(180deg, ${RIM} 0%, ${RIM_DEEP} 100%)`,
                  boxShadow:
                    "inset 2px 0 4px rgba(255,255,255,0.2), inset -2px 0 4px rgba(0,0,0,0.25)",
                }}
              />
              <div
                className="-mt-1 h-5 w-[120px] rounded-full"
                style={{
                  background: `linear-gradient(180deg, #8b6fff 0%, ${RIM} 45%, ${RIM_DEEP} 100%)`,
                  boxShadow: `
                    0 8px 16px rgba(15,18,32,0.4),
                    inset 0 2px 4px rgba(255,255,255,0.35),
                    inset 0 -3px 6px rgba(40,20,120,0.4)
                  `,
                }}
              />
            </div>
          </div>

          <motion.button
            type="button"
            disabled={!canSpin}
            onClick={handleSpin}
            whileTap={canSpin ? { scale: 0.96, y: 3 } : undefined}
            transition={popSpring}
            className={cn(
              "relative z-10 mt-7 w-full max-w-[220px] rounded-[18px] py-4 font-display text-[18px] font-bold tracking-[-0.02em]",
              canSpin
                ? "bg-[#ffc928] text-[#0f1220] shadow-[0_5px_0_#c79a2e]"
                : "cursor-not-allowed bg-white/10 text-white/35 shadow-none",
            )}
          >
            {phase === "spinning"
              ? "Spinning…"
              : spinsLeft > 0
                ? "Spin"
                : "Come back tomorrow"}
          </motion.button>
        </div>
      </section>

      {/* LIGHT SHEET — prize vault */}
      <div className="relative z-10 -mt-12 flex-1 rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <PrizeBoard segments={data.segments} />
      </div>

      <AnimatePresence>
        {phase === "result" && result ? (
          <ResultOverlay result={result} onClose={dismissResult} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PrizeBoard({ segments }: { segments: WheelSegment[] }) {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  const ranked = [...segments].sort((a, b) => b.weight - a.weight);
  const jackpot = ranked[ranked.length - 1]!;
  const common = ranked[0]!;

  return (
    <section>
      {/* Night vault header — Home week/rank capsule language */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#0f1220] p-4 text-white shadow-[0_14px_32px_rgba(15,18,32,0.28)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-8 h-32 w-32 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-arc-purple-500/30 blur-3xl"
        />

        <div className="relative z-[1] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#ffc928] uppercase">
              Today&apos;s loot
            </p>
            <h2 className="mt-1 font-display text-[22px] leading-none font-bold tracking-[-0.02em]">
              Prize vault
            </h2>
            <p className="mt-2 text-[12px] font-bold text-white/55">
              {segments.length} slices · mock odds
            </p>
          </div>
          <div className="rounded-xl bg-[#ffc928] px-2.5 py-1.5 text-center text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
            <p className="text-[8px] font-black tracking-wide uppercase opacity-60">
              Rare
            </p>
            <p className="font-display text-[13px] leading-none font-bold">
              {Math.round((jackpot.weight / totalWeight) * 100)}%
            </p>
          </div>
        </div>

        {/* Odds spine — common → rare */}
        <div className="relative z-[1] mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[9px] font-extrabold tracking-wide text-white/40 uppercase">
            <span>Likely</span>
            <span>Rare</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
            {ranked.map((segment) => (
              <span
                key={`bar-${segment.id}`}
                className="h-full min-w-[6px]"
                style={{
                  width: `${(segment.weight / totalWeight) * 100}%`,
                  backgroundColor: segment.color,
                }}
                title={`${segment.label} · ${Math.round((segment.weight / totalWeight) * 100)}%`}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] font-bold text-white/50">
            Most common: {common.label} · Rarest: {jackpot.label}
          </p>
        </div>
      </div>

      {/* Clay stamp grid — zigzag, not equal scroll row */}
      <ul className="mt-3.5 grid grid-cols-2 gap-2.5">
        {segments.map((segment, i) => {
          const Icon = prizeIcon[segment.kind];
          const pct = Math.round((segment.weight / totalWeight) * 100);
          const isRare = segment.id === jackpot.id;
          const isWide = i === 0 || isRare;

          return (
            <li
              key={segment.id}
              className={cn(
                "relative overflow-hidden rounded-[18px] border-2 bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]",
                isWide ? "col-span-2" : "",
                isRare
                  ? "border-[#ffc928] shadow-[0_4px_0_#c79a2e]"
                  : "border-[#ebe4f6]",
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 -right-6 h-20 w-20 rounded-full opacity-25 blur-2xl"
                style={{ backgroundColor: segment.color }}
              />

              <div className="relative flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{
                    backgroundColor: segment.color,
                    boxShadow: `0 4px 0 ${shade(segment.color)}`,
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-display text-[16px] leading-tight font-bold text-[#0f1220]">
                      {segment.label}
                    </p>
                    {isRare ? (
                      <span className="rounded-md bg-[#ffc928]/25 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-[#855300] uppercase">
                        Jackpot
                      </span>
                    ) : null}
                  </div>

                  {/* Clay odds notches */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 gap-0.5">
                      {Array.from({ length: 5 }).map((_, notch) => {
                        const filled = pct >= (notch + 1) * 8;
                        return (
                          <span
                            key={notch}
                            className={cn(
                              "h-1.5 flex-1 rounded-full",
                              filled ? "opacity-100" : "opacity-25",
                            )}
                            style={{
                              backgroundColor: filled
                                ? segment.color
                                : "#ebe4f6",
                            }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-extrabold tabular-nums text-arc-lavender-700">
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ClayWheelDisc({ segments }: { segments: WheelSegment[] }) {
  const n = segments.length;
  const slice = 360 / n;
  const gradient = segments
    .map((s, i) => {
      const start = i * slice;
      const end = (i + 1) * slice;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-full"
      style={{ background: `conic-gradient(from -90deg, ${gradient})` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.38), transparent 42%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.12), transparent 40%)",
        }}
      />

      {segments.map((segment, i) => {
        const angle = -90 + i * slice + slice / 2;
        const Icon = prizeIcon[segment.kind];
        const darkLabel = segment.color === GOLD || segment.color === "#FFD233";
        return (
          <div
            key={segment.id}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `rotate(${angle}deg) translateY(-78px) rotate(${-angle}deg)`,
            }}
          >
            <span
              className={cn(
                "flex w-[72px] -translate-x-1/2 flex-col items-center gap-0.5 text-center",
                darkLabel ? "text-[#5c3d00]" : "text-white",
              )}
            >
              <Icon
                className="h-3.5 w-3.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                strokeWidth={2.75}
              />
              <span className="text-[8px] leading-tight font-black tracking-wide uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                {segment.label}
              </span>
            </span>
          </div>
        );
      })}

      {segments.map((_, i) => (
        <div
          key={`spoke-${i}`}
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[50%] w-[3px] origin-top rounded-full bg-white/35"
          style={{ transform: `rotate(${-90 + i * slice}deg)` }}
        />
      ))}
    </div>
  );
}

function shade(hex: string) {
  if (hex === GOLD || hex === "#FFD233") return "#c79a2e";
  if (hex === "#FF4D2D") return "#c23418";
  if (hex === RIM || hex === "#6B4EFF") return RIM_DEEP;
  return "#3a2a6e";
}

function ResultOverlay({
  result,
  onClose,
}: {
  result: WheelSegment;
  onClose: () => void;
}) {
  const Icon = prizeIcon[result.kind];
  const win = result.kind !== "try_again";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1220]/70 px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-result-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] bg-[#0f1220] p-6 text-center text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={softSpring}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-full text-white"
          style={{
            backgroundColor: result.color,
            boxShadow: `0 6px 0 ${shade(result.color)}, 0 0 0 5px ${GOLD}`,
          }}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={popSpring}
        >
          <Icon
            className={cn(
              "h-9 w-9",
              result.color === GOLD ? "text-[#5c3d00]" : "text-white",
            )}
            strokeWidth={2.4}
          />
        </motion.div>

        <p className="mt-4 text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
          {win ? "You won" : "Almost"}
        </p>
        <h2
          id="wheel-result-title"
          className="mt-1.5 font-display text-[30px] leading-none font-bold tracking-[-0.03em]"
        >
          {result.label}
        </h2>
        <p className="mt-2 text-[13px] font-bold text-white/50">
          {win
            ? "Bank it — keep the weekly streak humming."
            : "No loot this spin. Wheel resets tomorrow."}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-[18px] bg-arc-purple-500 py-3.5 font-display text-[16px] font-bold text-white shadow-[0_5px_0_var(--color-arc-purple-700)]"
        >
          Nice
        </button>
      </motion.div>
    </motion.div>
  );
}
