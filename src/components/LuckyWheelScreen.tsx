"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/BackButton";
import { LuckyWheelSkeleton } from "@/components/lucky-wheel/LuckyWheelSkeleton";
import {
  Award,
  Clock,
  Coins,
  Gem,
  RotateCcw,
  Star,
  Zap,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ApiError } from "@/lib/api/errors";
import {
  formatWheelCountdown,
  luckyWheelApi,
  type WheelSegmentDto,
} from "@/lib/api/lucky-wheel";
import { assets } from "@/lib/assets";
import { useLuckyWheel } from "@/hooks/useLuckyWheel";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 340, damping: 28 };
const popSpring = { type: "spring" as const, stiffness: 440, damping: 32 };

type SpinPhase = "idle" | "spinning" | "result";
type WheelPrizeKind = "coins" | "gems" | "xp" | "badge" | "try_again";

type UiSegment = {
  id: string;
  label: string;
  kind: WheelPrizeKind;
  amount: number;
  color: string;
};

const prizeIcon: Record<WheelPrizeKind, typeof Coins> = {
  coins: Coins,
  gems: Gem,
  xp: Zap,
  badge: Award,
  try_again: Sparkles,
};

const RIM = "#6B4EFF";
const RIM_DEEP = "#4B2FD6";
const GOLD = "#FFC928";

const KIND_COLORS: Record<WheelPrizeKind, string> = {
  coins: "#FFC928",
  gems: "#B35CFF",
  xp: "#2D8CFF",
  badge: "#FF8A3D",
  try_again: "#3A415C",
};

function toKind(raw: string): WheelPrizeKind {
  if (raw === "lifetime_xp" || raw === "xp") return "xp";
  if (raw === "gems") return "gems";
  if (raw === "coins") return "coins";
  if (raw === "badge") return "badge";
  return "try_again";
}

function mapSegments(rows: WheelSegmentDto[]): UiSegment[] {
  return rows.map((s) => {
    const kind = toKind(s.kind);
    return {
      id: s.id,
      label: s.label,
      kind,
      amount: s.amount,
      color: KIND_COLORS[kind],
    };
  });
}

function shortPrizeLabel(s: UiSegment): string {
  if (s.kind === "try_again") return "AGAIN";
  if (s.kind === "badge") return "BADGE";
  if (s.kind === "xp") return `${s.amount} XP`;
  if (s.kind === "gems") return `${s.amount}`;
  if (s.kind === "coins") return `${s.amount}`;
  return s.label.slice(0, 8);
}

function labelInk(kind: WheelPrizeKind): string {
  return kind === "coins" || kind === "badge" ? "#0f1220" : "#ffffff";
}

/** Degrees CW from top → SVG point (y-down). */
function polar(cx: number, cy: number, degFromTopCw: number, radius: number) {
  const rad = (degFromTopCw * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

function wedgePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) {
  const a = polar(cx, cy, startDeg, r);
  const b = polar(cx, cy, endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function newIdemKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `w-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Lucky Wheel — night stage, clay disc, server-driven spin.
 */
export default function LuckyWheelScreen() {
  const { status } = useSession();
  const reduceMotion = useReducedMotion();
  const { wheel, isLoading, isError, error, refetch, invalidate, accessToken } =
    useLuckyWheel();
  const hydrateFromWallet = useEconomyStore((s) => s.hydrateFromWallet);

  const [phase, setPhase] = useState<SpinPhase>("idle");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<UiSegment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const spinningRef = useRef(false);
  const bootedRef = useRef(false);

  const segments = useMemo(
    () => (wheel ? mapSegments(wheel.segments) : []),
    [wheel],
  );
  const spinsLeft = wheel?.spinsAvailable ?? 0;
  const spinsPerDay = wheel?.spinsPerDay ?? 1;
  const countdown = formatWheelCountdown(
    wheel?.nextSpinAt ?? wheel?.resetsAt,
    wheel?.serverNow,
  );
  const canSpin =
    spinsLeft > 0 && phase !== "spinning" && !busy && segments.length > 0;

  useEffect(() => {
    if (bootedRef.current || segments.length === 0) return;
    bootedRef.current = true;
    setRotation(-(360 / segments.length) / 2);
  }, [segments.length]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refetch]);

  const handleSpin = async () => {
    if (!canSpin || spinningRef.current || !wheel) return;
    spinningRef.current = true;
    setBusy(true);
    setPhase("spinning");
    setResult(null);

    try {
      const res = await luckyWheelApi.spin(newIdemKey(), accessToken);
      hydrateFromWallet({
        lifetimeXp: res.wallet.lifetimeXp,
        gems: res.wallet.gems,
        coins: res.wallet.coins,
        version: res.wallet.version,
      });

      const n = segments.length || 6;
      const byId = segments.findIndex((s) => s.id === res.winningSegmentId);
      const winnerIndex =
        byId >= 0 ? byId : Math.max(0, Math.min(n - 1, res.landingIndex));
      const slice = 360 / n;
      const centerFromTop = winnerIndex * slice + slice / 2;
      const finalMod = (360 - centerFromTop) % 360;
      const currentMod = ((rotation % 360) + 360) % 360;
      const delta = (finalMod - currentMod + 360) % 360;
      const turns = reduceMotion ? 1 : 5 + Math.floor(Math.random() * 3);
      const spinMs = reduceMotion ? 900 : 4200;
      setRotation(rotation + turns * 360 + delta);

      const winnerSeg =
        segments[winnerIndex] ??
        segments.find((s) => s.id === res.winningSegmentId) ??
        {
          id: res.winningSegmentId,
          label: res.reward.label,
          kind: toKind(res.reward.type),
          amount: res.reward.amount,
          color: KIND_COLORS[toKind(res.reward.type)],
        };

      window.setTimeout(() => {
        setResult({
          ...winnerSeg,
          label: res.reward.label || winnerSeg.label,
          kind: toKind(res.reward.type),
          amount: res.reward.amount,
          color: KIND_COLORS[toKind(res.reward.type)],
        });
        setPhase("result");
        spinningRef.current = false;
        setBusy(false);
        void invalidate();
      }, spinMs);
    } catch (err) {
      spinningRef.current = false;
      setBusy(false);
      setPhase("idle");
      setToast(err instanceof ApiError ? err.message : "Spin failed");
    }
  };

  const buyRespin = async () => {
    if (busy || !wheel || wheel.paidRespinsLeft <= 0) return;
    setBusy(true);
    try {
      const res = await luckyWheelApi.purchaseRespin(newIdemKey(), accessToken);
      hydrateFromWallet({
        lifetimeXp: res.wallet.lifetimeXp,
        gems: res.wallet.gems,
        coins: res.wallet.coins,
        version: res.wallet.version,
      });
      setToast(
        res.alreadyPurchased ? "Re-spin already bought" : "Re-spin unlocked",
      );
      void invalidate();
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : "Purchase failed");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return <LuckyWheelSkeleton mode="loading" />;
  }

  if (status !== "authenticated") {
    return <LuckyWheelSkeleton mode="signin" />;
  }

  if (isLoading && !wheel) {
    return <LuckyWheelSkeleton mode="loading" />;
  }

  if (isError && !wheel) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-8 font-rounded text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <header className="relative z-[1]">
          <BackButton fallbackHref="/home" tone="dark" />
        </header>
        <div className="relative z-[1] mt-auto mb-auto flex flex-col items-center px-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Sparkles className="h-7 w-7 text-[#ffc928]" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 font-display text-[24px] font-bold tracking-[-0.02em]">
            Wheel unavailable
          </h1>
          <p className="mt-2 max-w-xs text-[13px] font-bold text-white/50">
            {error instanceof ApiError ? error.message : "Try again in a moment."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 cursor-pointer rounded-[18px] bg-[#ffc928] px-6 py-3.5 font-display text-[15px] font-bold text-[#0f1220] shadow-[0_5px_0_#c79a2e] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#0f1220] font-rounded">
      <section className="relative flex flex-1 flex-col overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+24px)] text-white">
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
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 48% 58%, #fff, transparent)",
          }}
        />

        <header className="relative z-[1] flex items-start gap-3">
          <BackButton fallbackHref="/home" tone="dark" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Daily bonus
            </p>
            <p className="mt-0.5 text-[13px] font-bold text-white/45">
              Free spin · resets 03:00 local
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[#0f1220] bg-[#ffc928] px-3 py-2 text-[#0f1220] shadow-[0_4px_0_#c79a2e]">
            <p className="text-[9px] font-black tracking-wide uppercase opacity-60">
              Spins
            </p>
            <p className="font-display text-[18px] leading-none font-bold tabular-nums">
              {spinsLeft}
              <span className="text-[12px] opacity-50">/{spinsPerDay}</span>
            </p>
          </div>
        </header>

        <div className="relative z-[1] mt-5 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0 pb-1">
            <h1 className="font-display text-[40px] leading-[0.88] font-bold tracking-[-0.04em]">
              Lucky Wheel
            </h1>
            <p className="mt-2.5 max-w-[15rem] text-[13px] leading-snug font-bold text-white/55">
              One tap. Fair spin. Claim your bonus.
            </p>
          </div>
          <div className="relative -mr-1 mb-[-4px] h-[96px] w-[96px] shrink-0">
            <Image
              src={assets.home.prizeWheel}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="h-full w-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.4)]"
              priority
            />
          </div>
        </div>

        <div className="relative z-[1] mt-4 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc928] px-2.5 py-1.5 text-[11px] font-extrabold text-[#0f1220]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            {spinsLeft} spin{spinsLeft === 1 ? "" : "s"} left
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/15">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            {countdown}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/15">
            <Gem className="h-3.5 w-3.5 text-[#b35cff]" strokeWidth={2.5} />
            up to {wheel?.previewGems ?? 15}
          </span>
        </div>

        {toast ? (
          <p
            role="status"
            className="relative z-[1] mt-3 rounded-xl border border-[#ffc928]/30 bg-[#ffc928]/12 px-3 py-2 text-center text-[12px] font-bold text-[#ffc928]"
          >
            {toast}
          </p>
        ) : null}

        <div className="relative z-[1] mx-auto mt-auto flex w-full max-w-[320px] flex-col items-center pt-8 pb-2">
          <div className="relative z-20 mb-[-10px] flex flex-col items-center">
            <div
              className="h-0 w-0 border-x-[12px] border-t-[22px] border-x-transparent"
              style={{
                borderTopColor: GOLD,
                filter: "drop-shadow(0 3px 0 #c79a2e)",
              }}
            />
            <div className="mt-[-2px] h-2.5 w-2.5 rounded-full bg-[#0f1220] ring-2 ring-[#ffc928]" />
          </div>

          <div className="relative">
            <div
              className="relative rounded-full p-[14px]"
              style={{
                background: `linear-gradient(160deg, #9b7bff 0%, ${RIM} 45%, ${RIM_DEEP} 100%)`,
                boxShadow:
                  "0 16px 36px rgba(15,18,32,0.55), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.2)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[6px] rounded-full"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(from 0deg, #ffc928 0deg 6deg, transparent 6deg 30deg)",
                  opacity: 0.55,
                  maskImage:
                    "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
                  WebkitMaskImage:
                    "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
                }}
              />

              <motion.div
                className="relative h-[260px] w-[260px] overflow-hidden rounded-full bg-[#0f1220] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.12)]"
                animate={{ rotate: rotation }}
                transition={
                  phase === "spinning"
                    ? {
                        duration: reduceMotion ? 0.85 : 4.1,
                        ease: [0.12, 0.8, 0.12, 1],
                      }
                    : { duration: 0 }
                }
              >
                {segments.length ? (
                  <ClayWheelDisc segments={segments} />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] font-bold text-white/40">
                    No layout
                  </div>
                )}
              </motion.div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white"
                  style={{
                    boxShadow: `0 6px 0 #d4c8ef, 0 0 0 5px ${GOLD}, 0 0 0 8px ${RIM_DEEP}`,
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
          </div>

          <motion.button
            type="button"
            disabled={!canSpin}
            onClick={() => void handleSpin()}
            whileTap={canSpin && !reduceMotion ? { scale: 0.96, y: 3 } : undefined}
            transition={popSpring}
            className={cn(
              "relative z-10 mt-7 w-full max-w-[240px] rounded-[18px] py-4 font-display text-[18px] font-bold tracking-[-0.02em] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220]",
              canSpin
                ? "cursor-pointer bg-[#ffc928] text-[#0f1220] shadow-[0_5px_0_#c79a2e] hover:opacity-95"
                : "cursor-not-allowed bg-white/10 text-white/35 shadow-none",
            )}
          >
            {phase === "spinning"
              ? "Spinning…"
              : spinsLeft > 0
                ? "Spin now"
                : "Come back tomorrow"}
          </motion.button>

          {spinsLeft <= 0 && (wheel?.paidRespinsLeft ?? 0) > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void buyRespin()}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2.5 text-[12px] font-extrabold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Re-spin · {wheel?.respinGemPrice ?? 25}
              <Gem className="h-3.5 w-3.5 text-[#b35cff]" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      </section>

      <AnimatePresence>
        {phase === "result" && result ? (
          <ResultOverlay
            result={result}
            onClose={() => {
              setPhase("idle");
              setResult(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ClayWheelDisc({ segments }: { segments: UiSegment[] }) {
  const n = segments.length;
  const slice = 360 / n;
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden>
      {segments.map((segment, i) => {
        const start = i * slice;
        const end = (i + 1) * slice;
        const mid = start + slice / 2;
        const Icon = prizeIcon[segment.kind];
        const ink = labelInk(segment.kind);
        const labelPos = polar(cx, cy, mid, r * 0.62);
        const tickOuter = polar(cx, cy, start, r - 1);
        const tickInner = polar(cx, cy, start, r * 0.38);

        return (
          <g key={segment.id}>
            <path d={wedgePath(cx, cy, r, start, end)} fill={segment.color} />
            <line
              x1={tickInner.x}
              y1={tickInner.y}
              x2={tickOuter.x}
              y2={tickOuter.y}
              stroke="rgba(15,18,32,0.35)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <foreignObject
              x={labelPos.x - 36}
              y={labelPos.y - 28}
              width={72}
              height={56}
            >
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-0.5"
                style={{ color: ink }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(15,18,32,0.18)" }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.75} />
                </span>
                <span className="max-w-[68px] truncate text-center font-display text-[10px] leading-none font-bold tracking-wide uppercase">
                  {shortPrizeLabel(segment)}
                </span>
              </div>
            </foreignObject>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.28} fill="#0f1220" opacity={0.12} />
    </svg>
  );
}

function ResultOverlay({
  result,
  onClose,
}: {
  result: UiSegment;
  onClose: () => void;
}) {
  const Icon = prizeIcon[result.kind];
  const win = result.kind !== "try_again";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1220]/75 px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-result-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] border-2 border-white/10 bg-[#0f1220] p-6 text-center text-white shadow-[0_20px_48px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24 }}
        transition={softSpring}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-full"
          style={{
            backgroundColor: result.color,
            boxShadow: `0 6px 0 rgba(0,0,0,0.25), 0 0 0 5px ${GOLD}`,
          }}
        >
          <Icon
            className={cn(
              "h-9 w-9",
              result.kind === "coins" || result.kind === "badge"
                ? "text-[#0f1220]"
                : "text-white",
            )}
            strokeWidth={2.4}
          />
        </div>
        <p className="mt-4 text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
          {win ? "You won" : "Try again"}
        </p>
        <h2
          id="wheel-result-title"
          className="mt-1.5 font-display text-[30px] leading-none font-bold"
        >
          {result.label}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full cursor-pointer rounded-[18px] bg-arc-purple-500 py-3.5 font-display text-[16px] font-bold text-white shadow-[0_5px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
        >
          Nice
        </button>
      </motion.div>
    </motion.div>
  );
}
