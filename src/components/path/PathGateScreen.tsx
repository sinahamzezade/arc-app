"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ClipboardList,
  Compass,
  Home,
  RefreshCw,
  Route,
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

const copy: Record<
  PathGateKind,
  {
    stamp: string;
    eyebrow: string;
    title: ReactNode;
    subtitle: string;
    arlo: string;
    arloAlt: string;
    dockEyebrow: string;
    dockTitle: string;
    trailLit: number;
  }
> = {
  loading: {
    stamp: "SCAN",
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
    dockEyebrow: "Stand by",
    dockTitle: "Charting coordinates",
    trailLit: 1,
  },
  building: {
    stamp: "DRAW",
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
    dockEyebrow: "In flight",
    dockTitle: "Trail under ink",
    trailLit: 3,
  },
  failed: {
    stamp: "HOLD",
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
    dockEyebrow: "Retry desk",
    dockTitle: "Redraw the route",
    trailLit: 0,
  },
  empty: {
    stamp: "LOCK",
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
    dockEyebrow: "First step",
    dockTitle: "Unlock the trail",
    trailLit: 0,
  },
};

/**
 * Path gate — cartographer desk.
 * Diagonal night trail + Arlo on a node + lavender action sheet.
 * Not a centered spinner. Not a 404 clone.
 */
export default function PathGateScreen({
  kind,
  message,
  onRetry,
  recipeMissing = false,
  retryError,
}: PathGateScreenProps) {
  const c = copy[kind];
  const detail =
    message && (kind === "failed" || kind === "empty") ? message : c.subtitle;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pb-[5.5rem] pt-[calc(env(safe-area-inset-top)+14px)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-48px] h-64 w-64 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-40px] h-44 w-44 rounded-full bg-[#ffc928]/18 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 24%, #fff, transparent), radial-gradient(1px 1px at 78% 16%, #fff, transparent), radial-gradient(1.5px 1px at 58% 58%, #fff, transparent), radial-gradient(1px 1px at 32% 72%, #fff, transparent)",
          }}
        />

        <DiagonalTrail lit={c.trailLit} broken={kind === "failed"} />

        <motion.div
          className="absolute top-[calc(env(safe-area-inset-top)+12px)] right-3 z-20 rotate-[8deg]"
          initial={{ opacity: 0, scale: 0.8, rotate: 18 }}
          animate={{ opacity: 1, scale: 1, rotate: 8 }}
          transition={{ ...softSpring, delay: 0.18 }}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1 font-display text-[12px] font-bold tracking-[0.14em] uppercase",
              kind === "failed"
                ? "border-[#ff8a7a]/60 bg-[#ff8a7a]/15 text-[#ffb4a8]"
                : kind === "empty"
                  ? "border-white/25 bg-white/10 text-white/70"
                  : "border-[#ffc928]/70 bg-[#ffc928]/15 text-[#ffc928]",
            )}
          >
            <Compass className="size-3.5" aria-hidden />
            {c.stamp}
          </span>
        </motion.div>

        <div className="relative z-10 grid grid-cols-12 items-end gap-2 pt-6">
          <div className="col-span-7 col-start-1 pb-2">
            <motion.p
              className="text-[10px] font-black tracking-[0.16em] text-[#ffc928] uppercase"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.04 }}
            >
              {c.eyebrow}
            </motion.p>
            <motion.h1
              className="mt-2 font-display text-[36px] leading-[0.92] font-bold tracking-[-0.045em]"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.1 }}
            >
              {c.title}
            </motion.h1>
            <motion.p
              className="mt-3 max-w-[13.5rem] text-[13px] leading-snug font-semibold text-white/60"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.16 }}
            >
              {detail}
            </motion.p>
          </div>

          <motion.div
            className="relative col-span-5 -mr-4 mb-[-1.25rem] h-[156px] w-full justify-self-end"
            initial={{ opacity: 0, y: 28, rotate: 6 }}
            animate={{ opacity: 1, y: [0, -7, 0], rotate: 2 }}
            transition={{
              opacity: { ...softSpring, delay: 0.14 },
              rotate: { ...softSpring, delay: 0.14 },
              y: {
                duration: 3.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.45,
              },
            }}
          >
            <Image
              src={c.arlo}
              alt={c.arloAlt}
              fill
              priority
              className="object-contain object-bottom"
              sizes="160px"
            />
          </motion.div>
        </div>
      </section>

      <motion.div
        className="relative z-10 -mt-10 flex flex-1 flex-col rounded-t-[28px] bg-[#f3effc] px-4 pt-7 pb-[calc(env(safe-area-inset-bottom)+22px)] shadow-[0_-14px_40px_rgba(0,0,0,0.22)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black tracking-[0.12em] text-arc-lavender-600 uppercase">
              {c.dockEyebrow}
            </p>
            <h2 className="mt-1 font-display text-[22px] font-bold tracking-[-0.03em] text-[#0f1220]">
              {c.dockTitle}
            </h2>
          </div>
          <Route
            className="mb-1 size-7 shrink-0 text-arc-purple-500/35"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>

        {(kind === "loading" || kind === "building") && (
          <NodeMarch active={kind === "building"} className="mt-5" />
        )}

        <div className="mt-5 flex flex-col gap-3">
          {kind === "failed" ? (
            <>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className={cn(
                    authCtaClassName,
                    "inline-flex items-center justify-center gap-2",
                  )}
                  onPress={() => onRetry?.()}
                >
                  <RefreshCw className="size-5" aria-hidden />
                  Redraw map
                </Button>
              </motion.div>
              {recipeMissing ? (
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/questionnaire/1?change=1"
                    className={`${authCtaClassName} inline-flex items-center justify-center gap-2 !bg-white !text-[#0f1220] border border-[#d9d0f0]`}
                  >
                    <ClipboardList className="size-5" aria-hidden />
                    Change goal
                  </Link>
                </motion.div>
              ) : null}
              <SecondaryLink href="/home" icon={Home} label="Back home" />
            </>
          ) : null}

          {kind === "empty" ? (
            <>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Link
                  href="/intake/chat"
                  className={`${authCtaClassName} inline-flex items-center justify-center gap-2`}
                >
                  <ClipboardList className="size-5" aria-hidden />
                  Open questionnaire
                </Link>
              </motion.div>
              <SecondaryLink href="/home" icon={Home} label="Back home" />
            </>
          ) : null}
        </div>

        {kind === "failed" ? (
          <p className="mt-5 flex items-start gap-2 rounded-[16px] border border-[#f5d0c8] bg-[#fff5f2] px-3.5 py-3 text-[12px] font-bold text-[#a65a4a]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {retryError ||
                message ||
                (recipeMissing
                  ? "That goal isn’t in the learning catalog yet — pick a role with a learning path, or add one in admin."
                  : "Try again from home.")}
            </span>
          </p>
        ) : null}

        {(kind === "loading" || kind === "building") && (
          <p className="mt-auto pt-8 text-[13px] font-bold text-[#7a6fa3]">
            While you wait —{" "}
            <Link href="/home" className={authGhostLinkClassName}>
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
}: {
  href: string;
  icon: typeof Home;
  label: string;
}) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-2 border-[#ebe4f6] bg-white text-[15px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] transition-all active:translate-y-px active:shadow-[0_1px_0_#ebe4f6]"
      >
        <Icon className="size-5 text-arc-purple-500" aria-hidden />
        {label}
      </Link>
    </motion.div>
  );
}

/** Diagonal night trail — breaks center symmetry */
function DiagonalTrail({ lit, broken }: { lit: number; broken?: boolean }) {
  const nodes = [
    { cx: 28, cy: 168 },
    { cx: 92, cy: 128 },
    { cx: 168, cy: 108 },
    { cx: 248, cy: 72 },
    { cx: 318, cy: 48 },
  ];

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-8 h-[210px] w-full opacity-90"
      viewBox="0 0 360 200"
      fill="none"
    >
      <motion.path
        d="M20 176 C 70 150, 110 140, 160 112 S 250 70, 340 40"
        stroke={broken ? "#ff8a7a55" : "#6b4eff66"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={broken ? "8 10" : "0"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {nodes.map((n, i) => {
        const on = i < lit;
        return (
          <motion.circle
            key={i}
            cx={n.cx}
            cy={n.cy}
            r={on ? 7 : 5}
            fill={on ? (i === lit - 1 ? "#ffc928" : "#6b4eff") : "#ffffff22"}
            stroke="#0f1220"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: on && i === lit - 1 ? [1, 1.25, 1] : 1,
              opacity: 1,
            }}
            transition={{
              scale:
                on && i === lit - 1
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : { ...softSpring, delay: 0.2 + i * 0.08 },
              opacity: { ...softSpring, delay: 0.2 + i * 0.08 },
            }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          />
        );
      })}
    </svg>
  );
}

function NodeMarch({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white px-4 py-4 shadow-[0_3px_0_#ebe4f6]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-between px-1">
        <span
          aria-hidden
          className="absolute top-1/2 right-1 left-1 h-[3px] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#6b4eff44,#ffc92844)]"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className={cn(
              "relative z-[1] size-3.5 rounded-full border-2 border-white",
              i === 0
                ? "bg-arc-purple-500"
                : i === 4
                  ? "bg-[#ffc928]"
                  : "bg-[#c9b8ff]",
            )}
            animate={
              active
                ? { y: [0, -6, 0], scale: [1, 1.2, 1] }
                : { opacity: [0.45, 1, 0.45] }
            }
            transition={{
              duration: active ? 0.9 : 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-[11px] font-black tracking-[0.1em] text-[#7a6fa3] uppercase">
        {active ? "Traversing skill nodes" : "Loading trail data"}
      </p>
    </div>
  );
}
