"use client";

import { useEffect, useState } from "react";
import { Compass, MapPinned, Route, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

const STAGES = [
  { id: "goal", label: "Goal locked", hint: "Reading your career target" },
  { id: "units", label: "Laying units", hint: "Pulling lessons from the pool" },
  { id: "ink", label: "Inking trail", hint: "Connecting stops on the map" },
] as const;

/** Serpentine survey path in a 360×420 atlas space */
const ROAD_D =
  "M180 36 C 180 72, 96 88, 96 128 S 264 168, 264 208 S 96 248, 96 288 S 264 328, 264 368 S 180 392, 180 408";

const NODES: Array<{
  cx: number;
  cy: number;
  r: number;
  tone: "done" | "current" | "next";
}> = [
  { cx: 180, cy: 36, r: 9, tone: "done" },
  { cx: 96, cy: 128, r: 10, tone: "done" },
  { cx: 264, cy: 208, r: 14, tone: "current" },
  { cx: 96, cy: 288, r: 10, tone: "next" },
  { cx: 264, cy: 368, r: 10, tone: "next" },
  { cx: 180, cy: 408, r: 11, tone: "next" },
];

/**
 * Path loading — atlas waking up.
 * Night hero mirrors RouteHero; sheet draws the serpentine trail live.
 */
export function PathScreenSkeleton() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const active = STAGES[stage];

  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading career road map"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-48px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-28 -left-20 h-44 w-44 rounded-full bg-[#ffc928]/14 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 48% 58%, #fff, transparent), radial-gradient(1px 1px at 28% 78%, #fff, transparent)",
          }}
        />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
          className="relative"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
              <Compass className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Career road map
            </p>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ffc928] px-3 text-[13px] font-extrabold text-[#0f1220] shadow-[0_2px_0_#c9a014]">
              <span
                className="size-2.5 rounded-full bg-[#0f1220]/25"
                aria-hidden
              />
              <span className="tabular-nums tracking-tight opacity-50">···</span>
            </span>
          </div>

          <h1 className="mt-4 font-display text-[32px] leading-[0.92] font-bold tracking-[-0.04em]">
            Your Path
          </h1>
          <p className="mt-1.5 text-[13px] leading-snug font-bold text-white/50">
            Charting your journey
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 text-[10px] font-black tracking-[0.12em] uppercase">
              <p className="text-white/40">
                Survey ·{" "}
                <span className="text-[#ffc928] tabular-nums">live</span>
              </p>
              <p className="text-white/40 tabular-nums">Plotting stops</p>
            </div>

            <div
              className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/15"
              aria-hidden
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#6b4eff_0%,#ffc928_100%)]"
                initial={reduceMotion ? { width: "42%" } : { width: "8%" }}
                animate={
                  reduceMotion
                    ? { width: "42%" }
                    : { width: ["12%", "68%", "38%", "82%", "28%"] }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
                }
              />
              {!reduceMotion ? (
                <motion.span
                  className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#ffc928] shadow-[0_0_12px_#ffc928]"
                  animate={{ left: ["6%", "78%", "32%", "88%", "18%"] }}
                  transition={{
                    duration: 4.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <motion.p
                key={active.id}
                className="min-w-0 truncate text-[12px] font-bold text-white/55"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={softSpring}
              >
                Now · {active.hint}
              </motion.p>
              <span className="shrink-0 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-[#ffc928] ring-1 ring-white/15">
                Mapping
              </span>
            </div>
          </div>
        </motion.div>
      </header>

      <div
        className="relative z-10 -mt-6 rounded-t-arc-xl bg-[#f2eefb] pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)] pt-6"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 18% 12%, transparent 52px, rgba(107,78,255,0.055) 53px 55px, transparent 56px)",
            "radial-gradient(circle at 18% 12%, transparent 86px, rgba(107,78,255,0.045) 87px 89px, transparent 90px)",
            "radial-gradient(circle at 86% 42%, transparent 60px, rgba(107,78,255,0.05) 61px 63px, transparent 64px)",
            "linear-gradient(rgba(107,78,255,0.05) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(107,78,255,0.05) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "auto, auto, auto, 56px 56px, 56px 56px",
        }}
      >
        <div className="mx-auto mb-5 flex max-w-[360px] items-center justify-center gap-2 px-5">
          {STAGES.map((s, i) => {
            const on = i <= stage;
            const current = i === stage;
            return (
              <div key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
                <motion.div
                  className={cn(
                    "flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[10px] font-black tracking-[0.06em] uppercase",
                    on
                      ? "bg-[#0f1220] text-[#ffc928]"
                      : "bg-white/70 text-[#7a6fa3] ring-1 ring-[#ebe4f6]",
                  )}
                  animate={
                    current && !reduceMotion
                      ? { scale: [1, 1.03, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    current
                      ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                      : softSpring
                  }
                >
                  {i === 0 ? (
                    <Sparkles className="size-3 shrink-0" aria-hidden />
                  ) : i === 1 ? (
                    <Route className="size-3 shrink-0" aria-hidden />
                  ) : (
                    <MapPinned className="size-3 shrink-0" aria-hidden />
                  )}
                  <span className="truncate">{s.label}</span>
                </motion.div>
              </div>
            );
          })}
        </div>

        <div className="relative mx-auto h-[420px] w-full max-w-[360px]">
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 360 440"
            fill="none"
          >
            {/* Ghost survey dashes */}
            <path
              d={ROAD_D}
              stroke="#b9abdd"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="1 12"
              opacity="0.55"
            />

            {/* Road casing — draw once, hold */}
            <motion.path
              d={ROAD_D}
              stroke="#ffffff"
              strokeWidth="28"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Asphalt */}
            <motion.path
              d={ROAD_D}
              stroke="#2a2440"
              strokeWidth="20"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.6,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.05,
              }}
            />
            {/* Center line — soft dash crawl while waiting */}
            <motion.path
              d={ROAD_D}
              stroke="#ffc928"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 10"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={
                reduceMotion
                  ? { pathLength: 1 }
                  : { pathLength: 1, strokeDashoffset: [0, -64] }
              }
              transition={{
                pathLength: {
                  duration: 1.6,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.1,
                },
                strokeDashoffset: {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1.7,
                },
              }}
            />

            {NODES.map((n, i) => {
              const fill =
                n.tone === "done"
                  ? "#6b4eff"
                  : n.tone === "current"
                    ? "#ffc928"
                    : "#c9b8ff";
              return (
                <g key={i}>
                  {n.tone === "current" && !reduceMotion ? (
                    <>
                      <motion.circle
                        cx={n.cx}
                        cy={n.cy}
                        r={n.r + 18}
                        fill="none"
                        stroke="#6b4eff"
                        strokeWidth="2"
                        initial={{ opacity: 0.55, scale: 0.7 }}
                        animate={{ opacity: 0, scale: 1.55 }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                      />
                      <motion.circle
                        cx={n.cx}
                        cy={n.cy}
                        r={n.r + 10}
                        fill="none"
                        stroke="#ffc928"
                        strokeWidth="1.5"
                        initial={{ opacity: 0.4, scale: 0.85 }}
                        animate={{ opacity: 0, scale: 1.35 }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: 0.35,
                        }}
                        style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                      />
                    </>
                  ) : null}
                  <motion.circle
                    cx={n.cx}
                    cy={n.cy}
                    r={n.r}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth="3"
                    initial={
                      reduceMotion
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.4 }
                    }
                    animate={
                      n.tone === "current" && !reduceMotion
                        ? { opacity: 1, scale: [1, 1.12, 1] }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={
                      n.tone === "current" && !reduceMotion
                        ? {
                            opacity: { ...softSpring, delay: 0.15 + i * 0.12 },
                            scale: {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                        : { ...softSpring, delay: 0.15 + i * 0.12 }
                    }
                    style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating stop labels — asymmetric, not a card grid */}
          <motion.div
            className="absolute top-[18%] left-4 max-w-[7.5rem]"
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...softSpring, delay: 0.35 }}
          >
            <p className="text-[10px] font-black tracking-[0.12em] text-arc-purple-500/70 uppercase">
              Cleared
            </p>
            <div className="mt-1 h-2.5 w-20 rounded-full bg-[#d9cff5]" />
            <div className="mt-1.5 h-2 w-12 rounded-full bg-[#ebe4f6]" />
          </motion.div>

          <motion.div
            className="absolute top-[44%] right-3 max-w-[8.5rem] text-right"
            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...softSpring, delay: 0.5 }}
          >
            <p className="text-[10px] font-black tracking-[0.12em] text-[#c9a014] uppercase">
              Next pin
            </p>
            <div className="mt-1 ml-auto h-3 w-24 rounded-full bg-[#ffe8a0]" />
            <div className="mt-1.5 ml-auto h-8 w-28 rounded-2xl bg-[#fff6d6] ring-1 ring-[#ffc928]/35" />
          </motion.div>

          <motion.div
            className="absolute top-[66%] left-5 max-w-[7rem]"
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...softSpring, delay: 0.65 }}
          >
            <p className="text-[10px] font-black tracking-[0.12em] text-[#7a6fa3] uppercase">
              Ahead
            </p>
            <div className="mt-1 h-2.5 w-16 rounded-full bg-[#ebe4f6]" />
            <div className="mt-1.5 h-2 w-10 rounded-full bg-[#ebe4f6]" />
          </motion.div>
        </div>

        <p className="mx-auto mt-2 max-w-[280px] px-5 text-center text-[12px] font-bold text-[#7a6fa3]">
          Arlo is wiring your first unit — hang tight while the trail appears.
        </p>
      </div>
    </div>
  );
}
