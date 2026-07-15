"use client";

import Image from "next/image";
import { ArrowRight, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { assets } from "@/lib/assets";
import { LessonPrimaryButton } from "./LessonShell";

/**
 * Lesson loading / error screen. Mirrors LessonShell chrome (night step bar
 * over lavender sheet) and shows a skeleton of the upcoming lesson layout so
 * the transition into real content is seamless.
 */
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
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* Header skeleton — same night bar as LessonShell */}
      <header className="relative z-20 overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-40 w-40 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div className="relative z-[1] flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {isError ? "Connection hiccup" : "Getting ready"}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              {isError ? (
                <div className="h-full w-1/4 rounded-full bg-arc-orange-400" />
              ) : (
                <motion.div
                  className="h-full w-1/3 rounded-full bg-arc-purple-500"
                  initial={{ x: "-100%" }}
                  animate={reduceMotion ? { x: "0%" } : { x: ["-100%", "300%"] }}
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  }
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-1 flex flex-1 flex-col rounded-t-[24px] bg-[#f3effc] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-8px_28px_rgba(0,0,0,0.18)]">
        {isError ? (
          <ErrorBody message={message} />
        ) : (
          <SkeletonBody message={message} />
        )}

        <div className="mt-auto shrink-0 space-y-2 pt-6">
          {onRetry ? (
            <LessonPrimaryButton onClick={onRetry}>
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
              Try again
            </LessonPrimaryButton>
          ) : null}
          <LessonPrimaryButton
            href={actionHref}
            className={
              onRetry
                ? "bg-white text-[#0f1220] shadow-[0_5px_0_#ebe4f6] ring-2 ring-[#ebe4f6]"
                : undefined
            }
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </LessonPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/** Skeleton mirroring the reading-lesson layout: number badge, title, paragraphs, cards. */
function SkeletonBody({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="flex-1"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        <div className="grid grid-cols-[auto_1fr] items-start gap-3">
          <div className="mt-1 h-11 w-11 shrink-0 rounded-2xl bg-[#0f1220]/10" />
          <div className="min-w-0 pt-0.5">
            <div className="h-2.5 w-24 rounded-full bg-arc-purple-500/15" />
            <div className="mt-3 h-6 w-4/5 rounded-lg bg-[#0f1220]/10" />
            <div className="mt-2 h-6 w-3/5 rounded-lg bg-[#0f1220]/10" />
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <div className="h-3.5 w-full rounded-full bg-[#0f1220]/8" />
          <div className="h-3.5 w-11/12 rounded-full bg-[#0f1220]/8" />
          <div className="h-3.5 w-4/5 rounded-full bg-[#0f1220]/8" />
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-16 rounded-[18px] border-2 border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6]" />
          <div className="h-16 rounded-[18px] border-2 border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6]" />
        </div>
      </div>

      <div
        role="status"
        className="mt-8 flex items-center justify-center gap-2.5"
      >
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-arc-purple-500/25 border-t-arc-purple-500 motion-reduce:animate-none"
        />
        <p className="text-[13px] font-bold text-arc-lavender-600">{message}</p>
      </div>
    </motion.div>
  );
}

function ErrorBody({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="flex flex-1 flex-col items-center justify-center text-center"
    >
      <Image
        src={assets.arlo.thinking}
        alt=""
        width={112}
        height={112}
        className="h-28 w-28 object-contain"
        priority
      />
      <h1 className="mt-4 font-display text-[26px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220] text-balance">
        That didn&apos;t load
      </h1>
      <p className="mt-2 max-w-[19rem] text-[14px] leading-snug font-semibold text-arc-lavender-600 text-pretty">
        {message}
      </p>
    </motion.div>
  );
}
