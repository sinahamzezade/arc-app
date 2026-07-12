"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/BackButton";
import { Award, Clock, Coins, Gem, Star, Zap, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
const GOLD = "#FFD233";

function toKind(raw: string): WheelPrizeKind {
  if (raw === "lifetime_xp" || raw === "xp") return "xp";
  if (raw === "gems") return "gems";
  if (raw === "coins") return "coins";
  if (raw === "badge") return "badge";
  return "try_again";
}

function mapSegments(rows: WheelSegmentDto[]): UiSegment[] {
  return rows.map((s) => ({
    id: s.id,
    label: s.label,
    kind: toKind(s.kind),
    amount: s.amount,
    color: s.color || RIM,
  }));
}

function newIdemKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `w-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Lucky Wheel — server spin, client animation to landingIndex.
 */
export default function LuckyWheelScreen() {
  const { status } = useSession();
  const { wheel, isLoading, isError, error, refetch, invalidate, accessToken } =
    useLuckyWheel();
  const hydrateFromWallet = useEconomyStore((s) => s.hydrateFromWallet);

  const [phase, setPhase] = useState<SpinPhase>("idle");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<UiSegment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const spinningRef = useRef(false);

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
  const canSpin = spinsLeft > 0 && phase !== "spinning" && !busy && segments.length > 0;

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
      const winnerIndex = Math.max(0, Math.min(n - 1, res.landingIndex));
      const slice = 360 / n;
      const targetCenter = winnerIndex * slice + slice / 2;
      const extraTurns = 5 + Math.floor(Math.random() * 3);
      const nextRotation =
        rotation + extraTurns * 360 + (360 - targetCenter) - (rotation % 360);
      setRotation(nextRotation);

      const winnerSeg =
        segments.find((s) => s.id === res.winningSegmentId) ??
        segments[winnerIndex] ??
        {
          id: res.winningSegmentId,
          label: res.reward.label,
          kind: toKind(res.reward.type),
          amount: res.reward.amount,
          color: GOLD,
        };

      window.setTimeout(() => {
        setResult({
          ...winnerSeg,
          label: res.reward.label || winnerSeg.label,
          kind: toKind(res.reward.type),
          amount: res.reward.amount,
        });
        setPhase("result");
        spinningRef.current = false;
        setBusy(false);
        void invalidate();
      }, 4200);
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

  if (status === "loading" || (status === "authenticated" && isLoading && !wheel)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center bg-[#0f1220] text-white/60">
        Loading wheel…
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 bg-[#f3effc] px-6">
        <p className="font-display text-[20px] font-bold text-[#1b1730]">
          Sign in to spin
        </p>
        <BackButton />
      </div>
    );
  }

  if (isError && !wheel) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 bg-[#f3effc] px-6">
        <p className="font-display text-[20px] font-bold text-[#1b1730]">
          Wheel unavailable
        </p>
        <p className="text-center text-[13px] font-semibold text-[#8a7cb8]">
          {error instanceof ApiError ? error.message : "Try again"}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-full bg-[#0f1220] px-5 py-2.5 text-[13px] font-black text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md flex flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-28 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />

        <header className="relative z-[1] flex items-start gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Daily bonus
            </p>
            <p className="mt-0.5 text-[13px] font-bold text-white/45">
              Free spin · resets 03:00 local
            </p>
          </div>
          <div className="rounded-2xl bg-[#ffc928] px-3 py-2 text-[#0f1220] shadow-[0_4px_0_#c79a2e]">
            <p className="text-[9px] font-black tracking-wide uppercase opacity-60">
              Spins
            </p>
            <p className="font-display text-[18px] leading-none font-bold">
              {spinsLeft}
              <span className="text-[12px] opacity-50">/{spinsPerDay}</span>
            </p>
          </div>
        </header>

        <div className="relative z-[1] mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0 pb-1">
            <h1 className="font-display text-[40px] leading-[0.88] font-bold tracking-[-0.04em]">
              Lucky Wheel
            </h1>
            <p className="mt-2.5 max-w-[15rem] text-[13px] leading-snug font-bold text-white/60">
              Server picks the prize. Animation follows.
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

        <div className="relative z-[1] mt-5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc928] px-2.5 py-1.5 text-[11px] font-extrabold text-[#0f1220]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            {spinsLeft} spin{spinsLeft === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/15">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            {countdown}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/15">
            <Gem className="h-3.5 w-3.5 text-[#b35cff]" strokeWidth={2.5} />
            cap {wheel?.previewGems ?? 15}
          </span>
        </div>

        {toast ? (
          <p className="relative z-[1] mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-[12px] font-bold text-[#ffc928]">
            {toast}
          </p>
        ) : null}

        <div className="relative z-[1] mx-auto mt-7 flex w-full max-w-[300px] flex-col items-center">
          <div className="relative z-20 mb-[-6px]">
            <div
              className="h-0 w-0 border-x-[14px] border-t-[26px] border-x-transparent"
              style={{
                borderTopColor: GOLD,
                filter: "drop-shadow(0 3px 0 #c79a2e)",
              }}
            />
          </div>

          <div className="relative">
            <div
              className="relative rounded-full p-[16px]"
              style={{
                background: `linear-gradient(145deg, #8b6fff 0%, ${RIM} 42%, ${RIM_DEEP} 100%)`,
                boxShadow: `0 18px 36px rgba(15,18,32,0.55), inset 0 3px 6px rgba(255,255,255,0.35)`,
              }}
            >
              <motion.div
                className="relative h-[248px] w-[248px] overflow-hidden rounded-full"
                animate={{ rotate: rotation }}
                transition={
                  phase === "spinning"
                    ? { duration: 4.1, ease: [0.12, 0.8, 0.12, 1] }
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
                  className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white"
                  style={{ boxShadow: `0 6px 0 #d4c8ef, 0 0 0 4px ${GOLD}` }}
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

          {spinsLeft <= 0 && (wheel?.paidRespinsLeft ?? 0) > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void buyRespin()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[12px] font-extrabold text-white ring-1 ring-white/15 disabled:opacity-50"
            >
              <Gem className="h-3.5 w-3.5 text-[#b35cff]" strokeWidth={2.5} />
              Re-spin · {wheel?.respinGemPrice ?? 25} gems
            </button>
          ) : null}
        </div>
      </section>

      <div className="relative z-10 -mt-12 flex-1 rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <PrizeBoard segments={segments} />
      </div>

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

function PrizeBoard({ segments }: { segments: UiSegment[] }) {
  return (
    <section>
      <div className="relative overflow-hidden rounded-[22px] bg-[#0f1220] p-4 text-white shadow-[0_14px_32px_rgba(15,18,32,0.28)]">
        <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#ffc928] uppercase">
          Today&apos;s loot
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-none font-bold">
          Prize vault
        </h2>
        <p className="mt-2 text-[12px] font-bold text-white/55">
          {segments.length} slices · odds server-side
        </p>
      </div>
      <ul className="mt-3.5 grid grid-cols-2 gap-2.5">
        {segments.map((segment, i) => {
          const Icon = prizeIcon[segment.kind];
          return (
            <li
              key={segment.id}
              className={cn(
                "relative overflow-hidden rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]",
                i === 0 && "col-span-2",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: segment.color }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <p className="font-display text-[16px] font-bold text-[#0f1220]">
                  {segment.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ClayWheelDisc({ segments }: { segments: UiSegment[] }) {
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
              <Icon className="h-3.5 w-3.5" strokeWidth={2.75} />
              <span className="text-[8px] leading-tight font-black tracking-wide uppercase">
                {segment.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1220]/70 px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-[28px] bg-[#0f1220] p-6 text-center text-white ring-1 ring-white/10"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24 }}
        transition={softSpring}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-full"
          style={{ backgroundColor: result.color, boxShadow: `0 0 0 5px ${GOLD}` }}
        >
          <Icon className="h-9 w-9 text-white" strokeWidth={2.4} />
        </div>
        <p className="mt-4 text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
          {win ? "You won" : "Try again"}
        </p>
        <h2 className="mt-1.5 font-display text-[30px] leading-none font-bold">
          {result.label}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-[18px] bg-arc-purple-500 py-3.5 font-display text-[16px] font-bold text-white"
        >
          Nice
        </button>
      </motion.div>
    </motion.div>
  );
}
