"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, Compass, Home } from "lucide-react";
import {
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { assets } from "@/lib/assets";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * 404 — night stage + Arlo lost on map + lavender rescue dock.
 * Matches AuthShell / Home mission-desk language.
 */
export default function NotFoundScreen() {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pb-20 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-56 w-56 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 left-[-28px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
          }}
        />

        {/* Giant off-axis code — breaks center symmetry */}
        <motion.p
          aria-hidden
          className="pointer-events-none absolute -left-4 top-10 select-none font-display text-[140px] leading-none font-bold tracking-[-0.08em] text-white/[0.07]"
          initial={{ opacity: 0, rotate: -8, x: -24 }}
          animate={{ opacity: 1, rotate: -12, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          404
        </motion.p>

        <div className="relative flex items-end gap-2">
          <div className="min-w-0 flex-1 pb-2">
            <motion.p
              className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.05 }}
            >
              <Compass className="size-3.5" aria-hidden />
              Off the map
            </motion.p>
            <motion.h1
              className="mt-2 font-display text-[34px] leading-[0.95] font-bold tracking-[-0.04em] text-white"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.1 }}
            >
              This page
              <br />
              went missing
            </motion.h1>
            <motion.p
              className="mt-3 max-w-[15rem] text-[14px] leading-snug font-semibold text-white/65"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.16 }}
            >
              Arlo checked the whole roadmap. No trail here.
            </motion.p>
          </div>

          <motion.div
            className="relative -mr-6 mb-[-8px] h-[148px] w-[148px] shrink-0"
            initial={{ opacity: 0, y: 20, rotate: 4 }}
            animate={{ opacity: 1, y: [0, -6, 0], rotate: 0 }}
            transition={{
              opacity: { ...softSpring, delay: 0.12 },
              rotate: { ...softSpring, delay: 0.12 },
              y: {
                duration: 3.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              },
            }}
          >
            <Image
              src={assets.arlo.thinking}
              alt="Arlo looking puzzled"
              fill
              priority
              className="object-contain object-bottom"
              sizes="148px"
            />
          </motion.div>
        </div>

        {/* Speech bubble — overlaps night / sheet seam */}
        <motion.div
          className="absolute right-5 bottom-6 z-20 max-w-[200px] rounded-[18px] rounded-br-md bg-white px-3.5 py-2.5 text-[#0f1220] shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.28 }}
        >
          <p className="text-[13px] leading-snug font-bold">
            Uh… wrong turn? Let&apos;s get you back on track.
          </p>
          <span
            aria-hidden
            className="absolute -bottom-1.5 right-5 size-3 rotate-45 bg-white"
          />
        </motion.div>
      </section>

      <motion.div
        className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[28px] bg-[#f3effc] px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <p className="text-[11px] font-black tracking-[0.12em] text-[#8a7cb8] uppercase">
          Rescue routes
        </p>
        <h2 className="mt-1 font-display text-[22px] font-bold tracking-[-0.03em] text-[#0f1220]">
          Pick your next move
        </h2>

        <div className="mt-5 flex flex-col gap-3">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/home"
              className={`${authCtaClassName} inline-flex items-center justify-center gap-2`}
            >
              <Home className="size-5" aria-hidden />
              Back to home
            </Link>
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/learn"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-2 border-[#ebe4f6] bg-white text-[15px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] transition-all active:translate-y-px active:shadow-[0_1px_0_#ebe4f6]"
            >
              <BookOpen className="size-5 text-arc-purple-500" aria-hidden />
              Continue learning
            </Link>
          </motion.div>
        </div>

        <p className="mt-auto pt-8 text-center text-[13px] font-bold text-[#7a6fa3]">
          Or start fresh —{" "}
          <Link href="/" className={authGhostLinkClassName}>
            welcome screen
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
