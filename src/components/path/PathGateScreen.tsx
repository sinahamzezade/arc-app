"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  ClipboardList,
  Home,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

export type PathGateKind = "loading" | "building" | "failed" | "empty";

type PathGateScreenProps = {
  kind: PathGateKind;
  message?: string;
  onRetry?: () => void;
  /** Goal role has no learning recipe — offer change-goal path. */
  recipeMissing?: boolean;
  retryError?: string;
};

const TRAIL_STEPS = [
  { key: "scan", label: "Scan" },
  { key: "pool", label: "Pool" },
  { key: "match", label: "Match" },
  { key: "ink", label: "Ink" },
  { key: "live", label: "Live" },
] as const;

const copy: Record<
  PathGateKind,
  {
    eyebrow: string;
    title: ReactNode;
    subtitle: string;
    arlo: string;
    arloAlt: string;
    status: string;
    /** 1-based active step on the trail (0 = none lit) */
    activeStep: number;
  }
> = {
  loading: {
    eyebrow: "Unfolding map",
    title: (
      <>
        Checking
        <br />
        your trail
      </>
    ),
    subtitle: "Pulling the latest path from your goal.",
    arlo: assets.arlo.thinking,
    arloAlt: "Arlo thinking",
    status: "Loading trail data",
    activeStep: 1,
  },
  building: {
    eyebrow: "Content pool live",
    title: (
      <>
        Drawing
        <br />
        your roadmap
      </>
    ),
    subtitle: "Arlo picks published lessons from the shared content pool.",
    arlo: assets.arlo.wand,
    arloAlt: "Arlo mapping",
    status: "Traversing skill nodes",
    activeStep: 3,
  },
  failed: {
    eyebrow: "Trail blocked",
    title: (
      <>
        Map didn&apos;t
        <br />
        stick
      </>
    ),
    subtitle: "Something snagged while charting your path.",
    arlo: assets.arlo.thinking,
    arloAlt: "Arlo puzzled",
    status: "Redraw the route",
    activeStep: 0,
  },
  empty: {
    eyebrow: "No trail yet",
    title: (
      <>
        Path still
        <br />
        sealed
      </>
    ),
    subtitle: "Finish the questionnaire so Arlo can ink your learning path.",
    arlo: assets.arlo.waveHand,
    arloAlt: "Arlo waving",
    status: "Unlock the trail",
    activeStep: 0,
  },
};

/**
 * Path gate — night cartographer.
 * Full-bleed sky, ink trail as hero, Arlo on the route.
 * Actions dock only when the user must act.
 */
export default function PathGateScreen({
  kind,
  message,
  onRetry,
  recipeMissing = false,
  retryError,
}: PathGateScreenProps) {
  const reduceMotion = useReducedMotion();
  const c = copy[kind];
  const detail =
    message && (kind === "failed" || kind === "empty") ? message : c.subtitle;
  const needsActions = kind === "failed" || kind === "empty";
  const isWorking = kind === "loading" || kind === "building";

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-arc-navy-950 font-rounded">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(107,78,255,0.42),transparent_52%),radial-gradient(ellipse_at_92%_12%,rgba(255,201,40,0.2),transparent_42%),radial-gradient(ellipse_at_50%_100%,rgba(107,78,255,0.18),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 72% 12%, #fff, transparent), radial-gradient(1.5px 1px at 48% 42%, #fff, transparent), radial-gradient(1px 1px at 28% 68%, #fff, transparent), radial-gradient(1px 1px at 88% 58%, #fff, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-1 flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {/* Brand + headline — one composition */}
        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
          <div className="min-w-0 pt-1">
            <motion.p
              className={cn(
                "text-[11px] font-black tracking-[0.16em] uppercase",
                kind === "failed" ? "text-[#ffb4a8]" : "text-[#ffc928]",
              )}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.04 }}
            >
              {c.eyebrow}
            </motion.p>
            <motion.h1
              className="mt-2 max-w-[12ch] font-display text-[36px] leading-[0.92] font-bold tracking-[-0.045em] text-white text-balance"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.1 }}
            >
              {c.title}
            </motion.h1>
            <motion.p
              className="mt-3 max-w-[22ch] text-[13px] leading-snug font-semibold text-white/55"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.16 }}
            >
              {detail}
            </motion.p>
          </div>

          <motion.div
            className="relative -mr-2 h-[148px] w-[132px] shrink-0"
            initial={reduceMotion ? false : { opacity: 0, y: 20, rotate: 8 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0, rotate: 2 }
                : { opacity: 1, y: [0, -8, 0], rotate: 2 }
            }
            transition={
              reduceMotion
                ? softSpring
                : {
                    opacity: { ...softSpring, delay: 0.12 },
                    rotate: { ...softSpring, delay: 0.12 },
                    y: {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4,
                    },
                  }
            }
          >
            <Image
              src={c.arlo}
              alt={c.arloAlt}
              fill
              priority
              className="object-contain object-bottom drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
              sizes="140px"
            />
          </motion.div>
        </div>

        {/* Ink trail — dominant visual plane */}
        <motion.div
          className="relative mt-6 flex-1"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.18 }}
        >
          <InkTrail
            activeStep={c.activeStep}
            broken={kind === "failed"}
            sealed={kind === "empty"}
            reduceMotion={!!reduceMotion}
          />

          <p
            className="mt-5 text-center text-[11px] font-black tracking-[0.14em] text-white/40 uppercase"
            role="status"
            aria-live="polite"
          >
            {isWorking ? (
              <>
                <span className="text-[#ffc928]">
                  Step {c.activeStep} of {TRAIL_STEPS.length}
                </span>
                <span className="mx-2 text-white/20">·</span>
                <span>{c.status}</span>
              </>
            ) : (
              c.status
            )}
          </p>
        </motion.div>

        {/* Action dock — only when user must act */}
        {needsActions ? (
          <motion.div
            className="mt-6 flex flex-col gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: 0.22 }}
          >
            {kind === "failed" ? (
              <>
                <motion.div whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                  <Button
                    className={cn(
                      authCtaClassName,
                      "inline-flex cursor-pointer items-center justify-center gap-2",
                    )}
                    onPress={() => onRetry?.()}
                  >
                    <RefreshCw className="size-5" aria-hidden />
                    Redraw map
                  </Button>
                </motion.div>
                {recipeMissing ? (
                  <motion.div
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
                    <Link
                      href="/questionnaire/1?change=1"
                      className={`${authCtaClassName} inline-flex cursor-pointer items-center justify-center gap-2 !bg-white !text-[#0f1220] border border-[#d9d0f0]`}
                    >
                      <ClipboardList className="size-5" aria-hidden />
                      Change goal
                    </Link>
                  </motion.div>
                ) : null}
                <SecondaryLink
                  href="/home"
                  icon={Home}
                  label="Back home"
                  reduceMotion={!!reduceMotion}
                />
                <p className="flex items-start gap-2 rounded-arc-md border-2 border-[#ff8a7a]/35 bg-[#ff8a7a]/10 px-3.5 py-3 text-[12px] font-bold text-[#ffb4a8]">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <span>
                    {retryError ||
                      message ||
                      (recipeMissing
                        ? "That goal isn’t in the learning catalog yet — pick a role with a learning path, or add one in admin."
                        : "Try again from home.")}
                  </span>
                </p>
              </>
            ) : null}

            {kind === "empty" ? (
              <>
                <motion.div whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                  <Link
                    href="/questionnaire"
                    className={`${authCtaClassName} inline-flex cursor-pointer items-center justify-center gap-2`}
                  >
                    <ClipboardList className="size-5" aria-hidden />
                    Open questionnaire
                  </Link>
                </motion.div>
                <SecondaryLink
                  href="/home"
                  icon={Home}
                  label="Back home"
                  reduceMotion={!!reduceMotion}
                />
              </>
            ) : null}
          </motion.div>
        ) : (
          <p className="mt-6 text-center text-[13px] font-bold text-white/40">
            While you wait —{" "}
            <Link
              href="/home"
              className={cn(authGhostLinkClassName, "text-[#ffc928]/90")}
            >
              peek home
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function SecondaryLink({
  href,
  icon: Icon,
  label,
  reduceMotion,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.div whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
      <Link
        href={href}
        className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-arc-md border-2 border-white/15 bg-white/5 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-white/10"
      >
        <Icon className="size-5 text-[#ffc928]" aria-hidden />
        {label}
      </Link>
    </motion.div>
  );
}

/** Large S-curve ink trail — progress lives on the path, not in a card */
function InkTrail({
  activeStep,
  broken,
  sealed,
  reduceMotion,
}: {
  activeStep: number;
  broken?: boolean;
  sealed?: boolean;
  reduceMotion: boolean;
}) {
  const nodes = [
    { cx: 36, cy: 168, label: TRAIL_STEPS[0].label },
    { cx: 108, cy: 128, label: TRAIL_STEPS[1].label },
    { cx: 180, cy: 96, label: TRAIL_STEPS[2].label },
    { cx: 252, cy: 64, label: TRAIL_STEPS[3].label },
    { cx: 324, cy: 36, label: TRAIL_STEPS[4].label },
  ];

  const stroke = broken
    ? "#ff8a7a66"
    : sealed
      ? "#ffffff22"
      : "#6b4eff88";

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <svg
        aria-hidden
        className="h-[210px] w-full"
        viewBox="0 0 360 200"
        fill="none"
      >
        {/* Soft glow under path */}
        <motion.path
          d="M28 172 C 90 142, 130 132, 180 100 S 270 58, 332 34"
          stroke={broken ? "#ff8a7a22" : "#6b4eff33"}
          strokeWidth="14"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M28 172 C 90 142, 130 132, 180 100 S 270 58, 332 34"
          stroke={stroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={broken ? "9 11" : sealed ? "4 8" : "0"}
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 1.05,
            ease: [0.22, 1, 0.36, 1],
            delay: reduceMotion ? 0 : 0.05,
          }}
        />

        {nodes.map((n, i) => {
          const step = i + 1;
          const done = activeStep > 0 && step < activeStep;
          const current = activeStep > 0 && step === activeStep;
          const fill = broken
            ? "#ff8a7a55"
            : sealed
              ? "#ffffff18"
              : current
                ? "#ffc928"
                : done
                  ? "#6b4eff"
                  : "#ffffff22";

          return (
            <g key={n.label}>
              <motion.circle
                cx={n.cx}
                cy={n.cy}
                r={current ? 9 : done ? 7 : 5.5}
                fill={fill}
                stroke="#100d22"
                strokeWidth="2.5"
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{
                  scale:
                    !reduceMotion && current ? [1, 1.22, 1] : 1,
                  opacity: 1,
                }}
                transition={{
                  scale:
                    !reduceMotion && current
                      ? {
                          duration: 1.25,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : { ...softSpring, delay: 0.22 + i * 0.07 },
                  opacity: { ...softSpring, delay: 0.22 + i * 0.07 },
                }}
                style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
              />
              {/* Label under/near node — color not sole cue */}
              <motion.text
                x={n.cx}
                y={n.cy + (i % 2 === 0 ? 22 : -16)}
                textAnchor="middle"
                fill={
                  current
                    ? "#ffc928"
                    : done
                      ? "#c9b8ff"
                      : "rgba(255,255,255,0.35)"
                }
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                }}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{
                  opacity: current ? 0.95 : done ? 0.7 : 0.35,
                }}
                transition={{ ...softSpring, delay: 0.28 + i * 0.07 }}
              >
                {n.label.toUpperCase()}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
