"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  ChevronLeft,
  Coins,
  Gem,
  Sparkles,
  Zap,
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

export default function LuckyWheelScreen({
  data = luckyWheelMockData,
}: {
  data?: LuckyWheelMockData;
}) {
  const router = useRouter();
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
    // Pointer at top (0°). Segment i centered at i*slice + slice/2 from starting orientation.
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
    setPhase(spinsLeft > 0 ? "idle" : "idle");
    setResult(null);
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section
        className="relative overflow-hidden px-[18px] pt-[calc(env(safe-area-inset-top)+12px)] pb-16"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 20%, rgba(255,201,40,0.22) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 85% 0%, rgba(107,78,255,0.45) 0%, transparent 50%), #18142e",
        }}
      >
        <header className="relative z-[1] flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white backdrop-blur-sm"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold tracking-[0.14em] text-white/55 uppercase">
              Daily bonus
            </p>
            <h1 className="font-display text-[26px] leading-none font-bold tracking-[-0.03em] text-white">
              {data.title}
            </h1>
          </div>
          <span className="rounded-full bg-arc-gold-400/20 px-3 py-1.5 text-[12px] font-black text-arc-gold-300">
            {spinsLeft}/{data.spinsPerDay}
          </span>
        </header>

        <p className="relative z-[1] mt-3 max-w-[20rem] text-[13.5px] font-bold text-white/70">
          {data.subtitle}
        </p>

        <div className="relative z-[1] mx-auto mt-8 flex w-full max-w-[320px] flex-col items-center">
          {/* Pointer */}
          <div className="relative z-10 mb-[-10px]">
            <motion.div
              animate={
                phase === "spinning"
                  ? { y: [0, 3, 0], rotate: [0, -4, 4, 0] }
                  : { y: 0, rotate: 0 }
              }
              transition={
                phase === "spinning"
                  ? { duration: 0.35, repeat: Infinity }
                  : softSpring
              }
              className="h-0 w-0 border-x-[12px] border-t-[22px] border-x-transparent border-t-arc-gold-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
              style={{ filter: "drop-shadow(0 2px 0 #c98a00)" }}
            />
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-full bg-arc-purple-500/25 blur-2xl"
            />
            <motion.div
              className="relative h-[280px] w-[280px] rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_0_0_6px_rgba(255,255,255,0.12)]"
              animate={{ rotate: rotation }}
              transition={
                phase === "spinning"
                  ? {
                      duration: 4.1,
                      ease: [0.12, 0.8, 0.12, 1],
                    }
                  : { duration: 0 }
              }
            >
              <WheelDisc segments={data.segments} />
            </motion.div>

            {/* Hub */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_6px_0_#cfc3ec]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-arc-purple-500">
                  <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            disabled={!canSpin}
            onClick={handleSpin}
            whileTap={canSpin ? { scale: 0.96, y: 3 } : undefined}
            className={cn(
              "mt-8 w-full max-w-[240px] rounded-2xl py-4 font-display text-[18px] font-bold tracking-[-0.02em]",
              canSpin
                ? "bg-[linear-gradient(145deg,#ffd34d,#f0a81e)] text-[#5c3d00] shadow-[0_6px_0_#c98a00]"
                : "cursor-not-allowed bg-white/12 text-white/40 shadow-none",
            )}
          >
            {phase === "spinning"
              ? "Spinning…"
              : spinsLeft > 0
                ? "Spin"
                : "Come back tomorrow"}
          </motion.button>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-6 rounded-t-[28px] bg-[#f3effc]"
        />
      </section>

      <div className="relative z-[1] -mt-2 px-[18px] pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <PrizeLegend segments={data.segments} />
      </div>

      <AnimatePresence>
        {phase === "result" && result ? (
          <ResultOverlay result={result} onClose={dismissResult} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function WheelDisc({ segments }: { segments: WheelSegment[] }) {
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
      {segments.map((segment, i) => {
        const angle = -90 + i * slice + slice / 2;
        return (
          <div
            key={segment.id}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `rotate(${angle}deg) translateY(-92px) rotate(${-angle}deg)`,
            }}
          >
            <span className="block w-[70px] -translate-x-1/2 text-center text-[9px] leading-tight font-black tracking-wide text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {segment.label}
            </span>
          </div>
        );
      })}

      {/* Spoke lines */}
      {segments.map((_, i) => (
        <div
          key={`spoke-${i}`}
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[50%] w-[2px] origin-top bg-white/25"
          style={{ transform: `rotate(${-90 + i * slice}deg)` }}
        />
      ))}
    </div>
  );
}

function PrizeLegend({ segments }: { segments: WheelSegment[] }) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_28px_rgba(70,40,150,0.08)]">
      <h2 className="font-display text-[16px] font-semibold tracking-[-0.02em] text-[#2b1b57]">
        Today&apos;s prizes
      </h2>
      <p className="mt-0.5 text-[12.5px] font-bold text-arc-lavender-600">
        Weighted odds · mock spin only
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {segments.map((segment) => {
          const Icon = prizeIcon[segment.kind];
          return (
            <li
              key={segment.id}
              className="flex items-center gap-2.5 rounded-2xl bg-[#faf8ff] px-2.5 py-2"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: segment.color }}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 text-[12.5px] font-extrabold text-[#2b1b57]">
                {segment.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#18142e]/55 px-[18px] pb-[calc(env(safe-area-inset-bottom)+24px)] backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-result-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={softSpring}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] text-white"
          style={{ backgroundColor: result.color }}
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={softSpring}
        >
          <Icon className="h-9 w-9" strokeWidth={2.4} />
        </motion.div>

        <p className="mt-4 text-[11px] font-extrabold tracking-[0.14em] text-arc-lavender-500 uppercase">
          {win ? "You won" : "Almost"}
        </p>
        <h2
          id="wheel-result-title"
          className="mt-1 font-display text-[28px] leading-none font-bold tracking-[-0.03em] text-[#2b1b57]"
        >
          {result.label}
        </h2>
        <p className="mt-2 text-[14px] font-bold text-arc-lavender-600">
          {win
            ? "Arlo says: bank it and keep the streak humming."
            : "No loot this spin — tomorrow’s wheel still waits."}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-arc-purple-500 py-3.5 font-display text-[16px] font-semibold text-white shadow-[0_5px_0_#4b2fd6]"
        >
          Nice
        </button>
      </motion.div>
    </motion.div>
  );
}
