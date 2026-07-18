"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Lock,
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

/** Vertical serpentine in a 360×340 atlas space — mirrors PathScreenSkeleton. */
const ROAD_D =
  "M180 28 C 180 56, 92 72, 92 110 S 268 148, 268 186 S 92 224, 92 262 S 180 300, 180 318";

const NODES: Array<{ cx: number; cy: number; side: "left" | "right" }> = [
  { cx: 180, cy: 28, side: "right" },
  { cx: 92, cy: 110, side: "left" },
  { cx: 268, cy: 186, side: "right" },
  { cx: 92, cy: 262, side: "left" },
  { cx: 180, cy: 318, side: "right" },
];

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
 * Path gate — atlas waking up.
 * Night dispatch hero + light clay sheet. Vertical trail is the hero plane.
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
  const broken = kind === "failed";
  const sealed = kind === "empty";

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f2eefb] font-rounded">
      {/* Night dispatch hero */}
      <header className="relative overflow-hidden bg-[#0f1220] px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-16 text-white">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-24 right-[-40px] h-72 w-72 rounded-full blur-3xl",
            broken ? "bg-arc-coral-500/35" : "bg-arc-purple-500/45",
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-32 -left-16 h-48 w-48 rounded-full bg-[#ffc928]/16 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 78% 16%, #fff, transparent), radial-gradient(1.5px 1px at 52% 48%, #fff, transparent), radial-gradient(1px 1px at 30% 72%, #fff, transparent)",
          }}
        />

        <div className="relative z-1 grid grid-cols-[1fr_auto] items-end gap-1">
          <div className="min-w-0 pb-1">
            <motion.p
              className={cn(
                "text-[11px] font-black tracking-[0.16em] uppercase",
                broken ? "text-arc-coral-300" : "text-[#ffc928]",
              )}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.04 }}
            >
              {c.eyebrow}
            </motion.p>
            <motion.h1
              className="mt-2 max-w-[11ch] font-display text-[40px] leading-[0.9] font-bold tracking-[-0.05em] text-balance"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.1 }}
            >
              {c.title}
            </motion.h1>
            <motion.p
              className="mt-3 max-w-[24ch] text-[14px] leading-snug font-semibold text-white/60"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.16 }}
            >
              {detail}
            </motion.p>
          </div>

          <motion.div
            className="relative -mb-10 -mr-3 h-[168px] w-[148px] shrink-0"
            initial={reduceMotion ? false : { opacity: 0, y: 24, rotate: 6 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0, rotate: 0 }
                : { opacity: 1, y: [0, -7, 0], rotate: 0 }
            }
            transition={
              reduceMotion
                ? softSpring
                : {
                    opacity: { ...softSpring, delay: 0.12 },
                    rotate: { ...softSpring, delay: 0.12 },
                    y: {
                      duration: 3.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.45,
                    },
                  }
            }
          >
            <Image
              src={c.arlo}
              alt={c.arloAlt}
              fill
              priority
              className="object-contain object-bottom drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)]"
              sizes="150px"
            />
          </motion.div>
        </div>
      </header>

      {/* Atlas sheet — clay trail lives here */}
      <motion.div
        className="relative z-10 -mt-7 flex flex-1 flex-col rounded-t-[28px] bg-[#f2eefb] px-5 pt-5 pb-[calc(5.25rem+env(safe-area-inset-bottom)+16px)]"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 18% 12%, transparent 48px, rgba(107,78,255,0.06) 49px 51px, transparent 52px)",
            "radial-gradient(circle at 86% 42%, transparent 56px, rgba(107,78,255,0.05) 57px 59px, transparent 60px)",
            "linear-gradient(rgba(107,78,255,0.045) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(107,78,255,0.045) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "auto, auto, 48px 48px, 48px 48px",
        }}
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: 0.14 }}
      >
        <ClayTrail
          activeStep={c.activeStep}
          broken={broken}
          sealed={sealed}
          reduceMotion={!!reduceMotion}
        />

        <p
          className="mt-4 text-center text-[11px] font-black tracking-[0.14em] text-[#6b5f8f] uppercase"
          role="status"
          aria-live="polite"
        >
          {isWorking ? (
            <>
              <span className="text-arc-purple-600">
                Step {c.activeStep} of {TRAIL_STEPS.length}
              </span>
              <span className="mx-2 text-[#cfc3ec]">·</span>
              <span>{c.status}</span>
            </>
          ) : (
            c.status
          )}
        </p>

        {needsActions ? (
          <motion.div
            className="mt-6 flex flex-col gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
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
                      className={`${authCtaClassName} inline-flex cursor-pointer items-center justify-center gap-2 !bg-white !text-[#0f1220] border-[3px] border-[#d9d0f0] shadow-[0_4px_0_#cfc3ec]`}
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
                <p
                  role="alert"
                  className="flex items-start gap-2.5 rounded-[18px] border-[3px] border-arc-coral-300 bg-arc-coral-50 px-3.5 py-3 text-[13px] font-bold text-arc-coral-800 shadow-[0_3px_0_#ffc1b8]"
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-arc-coral-500"
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
          <p className="mt-8 text-center text-[13px] font-bold text-[#6b5f8f]">
            While you wait —{" "}
            <Link
              href="/home"
              className={cn(authGhostLinkClassName, "text-arc-purple-600")}
            >
              peek home
            </Link>
          </p>
        )}
      </motion.div>
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
        className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#ddd4f5] bg-white text-[15px] font-bold text-[#2b1b57] shadow-[0_3px_0_#ddd4f5] transition-colors duration-200 hover:bg-arc-lavender-100"
      >
        <Icon className="size-5 text-arc-gold-500" aria-hidden />
        {label}
      </Link>
    </motion.div>
  );
}

/** Chunky clay trail — progress lives on the path, not in a card */
function ClayTrail({
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
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <svg
        aria-hidden
        className="h-[340px] w-full"
        viewBox="0 0 360 340"
        fill="none"
      >
        {/* Soft underglow */}
        <motion.path
          d={ROAD_D}
          stroke={broken ? "rgba(255,109,90,0.18)" : "rgba(107,78,255,0.14)"}
          strokeWidth="22"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 1.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
        <motion.path
          d={ROAD_D}
          stroke={
            broken ? "#ff9e91" : sealed ? "rgba(107,78,255,0.22)" : "#6b4eff"
          }
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={broken ? "10 12" : sealed ? "5 9" : "0"}
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.95,
            ease: [0.22, 1, 0.36, 1],
            delay: reduceMotion ? 0 : 0.06,
          }}
        />

      </svg>

      {/* Clay nodes as HTML for chunky shadows */}
      {NODES.map((n, i) => {
        const step = i + 1;
        const label = TRAIL_STEPS[i].label;
        const isRift = broken && i === 2;
        // Failed: first two stops cleared, then the rift — story over status.
        const done =
          (activeStep > 0 && step < activeStep) || (broken && i < 2);
        const current = activeStep > 0 && step === activeStep && !broken;
        const labelOnLeft = n.side === "left";

        return (
          <motion.div
            key={label}
            className="absolute"
            style={{
              left: `${(n.cx / 360) * 100}%`,
              top: `${(n.cy / 340) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...softSpring, delay: 0.2 + i * 0.07 }}
          >
            <div className="relative">
              <motion.div
                className={cn(
                  "flex items-center justify-center rounded-full border-[3.5px]",
                  isRift
                    ? "h-11 w-11 border-arc-coral-400 bg-arc-coral-50 shadow-[0_4px_0_#ffc1b8]"
                    : sealed
                      ? "h-10 w-10 border-[#ddd4f5] bg-white shadow-[0_3px_0_#ddd4f5]"
                      : current
                        ? "h-12 w-12 border-[#e69b00] bg-[#ffc928] shadow-[0_4px_0_#e69b00]"
                        : done
                          ? "h-10 w-10 border-arc-purple-700 bg-arc-purple-500 shadow-[0_3px_0_#4b2fd6]"
                          : "h-10 w-10 border-[#ddd4f5] bg-white shadow-[0_3px_0_#ddd4f5]",
                )}
                animate={
                  !reduceMotion && current
                    ? { y: [0, -3, 0] }
                    : !reduceMotion && isRift
                      ? { rotate: [0, -4, 4, 0] }
                      : undefined
                }
                transition={
                  current
                    ? {
                        duration: 1.35,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : isRift
                      ? {
                          duration: 2.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : undefined
                }
              >
                {sealed ? (
                  <Lock
                    className="size-3.5 text-[#8a7cb8]"
                    strokeWidth={2.75}
                    aria-hidden
                  />
                ) : current ? (
                  <span className="text-[13px] font-black text-[#563500]">
                    {step}
                  </span>
                ) : done ? (
                  <span className="text-[12px] font-black text-white">
                    {step}
                  </span>
                ) : isRift ? (
                  <AlertTriangle
                    className="size-4 text-arc-coral-500"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : (
                  <span className="text-[12px] font-black text-[#b3a8d6]">
                    {step}
                  </span>
                )}
              </motion.div>

              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-[10px] font-black tracking-[0.1em] uppercase",
                  labelOnLeft ? "right-[calc(100%+10px)]" : "left-[calc(100%+10px)]",
                  current
                    ? "text-arc-gold-700"
                    : done
                      ? "text-arc-purple-700"
                      : isRift
                        ? "text-arc-coral-600"
                        : "text-[#8a7cb8]",
                )}
              >
                {label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
