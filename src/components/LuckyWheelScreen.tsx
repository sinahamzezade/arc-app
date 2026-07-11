"use client";

import { useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import {
  Award,
  Coins,
  Gem,
  Star,
  Zap,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  luckyWheelMockData,
  pickWeightedSegment,
  type LuckyWheelMockData,
  type WheelPrizeKind,
  type WheelSegment,
} from "@/lib/lucky-wheel/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 320, damping: 28 };

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
 * Lucky Wheel — clay toy arcade booth.
 * Thick purple rim, star hub, pedestal stand (matches prize-wheel art).
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
      {/* ARCADE NIGHT BOOTH */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-28 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 -right-16 h-56 w-56 rounded-full bg-arc-purple-500/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 16% 18%, #fff, transparent), radial-gradient(1px 1px at 78% 12%, #fff, transparent), radial-gradient(1.5px 1px at 42% 55%, #fff, transparent)",
          }}
        />

        <header className="relative z-[1] flex items-start gap-3">
          <BackButton />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Daily bonus
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-[0.92] font-bold tracking-[-0.04em]">
              {data.title}
            </h1>
            <p className="mt-2 max-w-[16rem] text-[13px] leading-snug font-bold text-white/50">
              {data.subtitle}
            </p>
          </div>

          <div className="-rotate-2 rounded-2xl bg-[#ffc928] px-3 py-2 text-[#0f1220] shadow-[0_4px_0_#c79a2e]">
            <p className="text-[9px] font-black tracking-wide uppercase opacity-60">
              Spins
            </p>
            <p className="font-display text-[18px] leading-none font-bold">
              {spinsLeft}
              <span className="text-[12px] opacity-50">/{data.spinsPerDay}</span>
            </p>
          </div>
        </header>

        {/* CLAY WHEEL + PEDESTAL */}
        <div className="relative z-[1] mx-auto mt-6 flex w-full max-w-[300px] flex-col items-center">
          {/* Gold pointer (top) */}
          <motion.div
            className="relative z-20 mb-[-6px]"
            animate={
              phase === "spinning"
                ? { y: [0, 4, 0], rotate: [0, -6, 6, 0] }
                : { y: 0, rotate: 0 }
            }
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
                filter: `drop-shadow(0 3px 0 #c79a2e)`,
              }}
            />
          </motion.div>

          <div className="relative">
            {/* Soft glow behind wheel */}
            <div
              aria-hidden
              className="absolute top-1/2 left-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-arc-purple-500/35 blur-3xl"
            />

            {/* Thick clay rim */}
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
                  boxShadow: `
                    inset 0 0 0 3px rgba(255,255,255,0.2),
                    inset 0 8px 18px rgba(0,0,0,0.18)
                  `,
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

              {/* Star hub — fixed (doesn't spin with labels conceptually sits on axle) */}
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

            {/* Pedestal neck + pill base */}
            <div className="relative z-0 mx-auto -mt-1 flex flex-col items-center">
              <div
                className="h-7 w-11 rounded-b-2xl"
                style={{
                  background: `linear-gradient(180deg, ${RIM} 0%, ${RIM_DEEP} 100%)`,
                  boxShadow: `inset 2px 0 4px rgba(255,255,255,0.2), inset -2px 0 4px rgba(0,0,0,0.25)`,
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

      {/* PRIZE STRIP — overlapping dock, not white card */}
      <div className="relative z-[1] -mt-12 flex-1 rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-[#b3a8d6] uppercase">
              Today&apos;s loot
            </p>
            <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#0f1220]">
              Prize board
            </h2>
          </div>
          <p className="text-[11px] font-bold text-[#8a7cb8]">Mock odds</p>
        </div>

        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.segments.map((segment, i) => {
            const Icon = prizeIcon[segment.kind];
            return (
              <li
                key={segment.id}
                className={cn(
                  "flex w-[108px] shrink-0 flex-col items-start gap-2 rounded-[16px] border-2 border-[#ebe4f6] bg-white p-3 shadow-[0_3px_0_#ebe4f6]",
                  i % 2 === 1 && "mt-3",
                )}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-[12px] text-white"
                  style={{
                    backgroundColor: segment.color,
                    boxShadow: `0 3px 0 ${shade(segment.color)}`,
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="text-[12px] leading-tight font-extrabold text-[#0f1220]">
                  {segment.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence>
        {phase === "result" && result ? (
          <ResultOverlay result={result} onClose={dismissResult} />
        ) : null}
      </AnimatePresence>
    </div>
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
      style={{
        background: `conic-gradient(from -90deg, ${gradient})`,
      }}
    >
      {/* Soft clay gloss */}
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
        const darkLabel =
          segment.color === GOLD || segment.color === "#FFD233";
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

      {/* Soft spoke seams */}
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
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={softSpring}
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
          className="mt-6 w-full rounded-[18px] bg-arc-purple-500 py-3.5 font-display text-[16px] font-bold text-white shadow-[0_5px_0_#4b2fd6]"
        >
          Nice
        </button>
      </motion.div>
    </motion.div>
  );
}
