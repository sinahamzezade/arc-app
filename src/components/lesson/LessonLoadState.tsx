"use client";

import Image from "next/image";
import { ArrowRight, Gift, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { LessonPrimaryButton } from "./LessonShell";

export function LessonLoadState({
  message,
  actionHref = "/path",
  actionLabel = "Back to Path",
  onRetry,
}: {
  message: string;
  actionHref?: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  const isError = Boolean(onRetry);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-arc-navy-950 font-rounded">
      {/* Atmosphere — diagonal gold / warm mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_8%,rgba(255,201,40,0.28),transparent_50%),radial-gradient(ellipse_at_95%_20%,rgba(255,138,61,0.18),transparent_42%),radial-gradient(ellipse_at_40%_100%,rgba(107,78,255,0.22),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Orbit rings — offset top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-10 h-56 w-56"
      >
        <motion.div
          className="absolute inset-4 rounded-full border border-[#ffc928]/20"
          animate={isError ? undefined : { rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-12 rounded-full border border-dashed border-white/15"
          animate={isError ? undefined : { rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-18 rounded-full bg-[#ffc928]/10 blur-xl"
          animate={
            isError
              ? undefined
              : { scale: [1, 1.15, 1], opacity: [0.35, 0.7, 0.35] }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-1 flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="grid flex-1 grid-cols-[1fr_auto] items-start gap-3"
        >
          <div className="min-w-0 pt-3">
            <p className="text-[11px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
              {isError ? "Reward stalled" : "Opening vault"}
            </p>
            <h1 className="mt-2 max-w-[12ch] font-display text-[32px] leading-[0.95] font-bold tracking-[-0.03em] text-white text-balance">
              {isError ? "Almost there" : "Loot inbound"}
            </h1>
            <p className="mt-4 max-w-[18rem] text-[14px] leading-snug font-semibold text-white/60">
              {message}
            </p>

            {!isError ? (
              <div className="mt-8 max-w-44">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-[0.12em] text-white/35 uppercase">
                    Claiming
                  </span>
                  <Gift
                    className="h-3.5 w-3.5 text-[#ffc928]"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-[#ffc928] to-arc-orange-400"
                    initial={{ width: "12%" }}
                    animate={{ width: ["18%", "78%", "42%", "88%"] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.75, rotate: -10 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: isError ? -4 : 8,
              y: isError ? 0 : [0, -6, 0],
            }}
            transition={
              isError
                ? { type: "spring", stiffness: 260, damping: 16 }
                : {
                    opacity: { duration: 0.35 },
                    scale: { type: "spring", stiffness: 260, damping: 16 },
                    rotate: { type: "spring", stiffness: 260, damping: 16 },
                    y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                  }
            }
            className="-mr-1 mt-1"
          >
            <Image
              src={isError ? assets.arlo.thinking : assets.chests.legendary}
              alt=""
              width={120}
              height={120}
              className="h-30 w-30 object-contain drop-shadow-[0_16px_32px_rgba(255,201,40,0.28)]"
              priority
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="relative z-1 space-y-2"
        >
          {onRetry ? (
            <LessonPrimaryButton onClick={onRetry}>
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
              Retry claim
            </LessonPrimaryButton>
          ) : null}
          <LessonPrimaryButton
            href={actionHref}
            className={
              onRetry
                ? "bg-white/10 shadow-[0_5px_0_rgba(0,0,0,0.35)] ring-1 ring-white/15"
                : undefined
            }
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </LessonPrimaryButton>
        </motion.div>
      </div>
    </div>
  );
}
