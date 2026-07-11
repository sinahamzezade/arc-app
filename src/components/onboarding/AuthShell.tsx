"use client";

import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

type AuthShellProps = {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  heroMedia?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Shorter night band for dense forms */
  compact?: boolean;
  className?: string;
};

/**
 * Night-hero auth shell — passport/mission desk family.
 * Dark stage header + lavender form dock. Shared by login/register/reset/questionnaire.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  onBack,
  heroMedia,
  children,
  footer,
  compact = false,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded",
        className,
      )}
    >
      <section
        className={cn(
          "relative overflow-hidden bg-[#0f1220] px-4 text-white",
          compact
            ? "pb-14 pt-[calc(env(safe-area-inset-top)+10px)]"
            : "pb-16 pt-[calc(env(safe-area-inset-top)+12px)]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-56 w-56 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-24px] h-36 w-36 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
          }}
        />

        {onBack ? <BackButton onClick={onBack} className="relative mb-3" /> : null}

        <div className="relative flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {eyebrow}
            </p>
            <h1
              className={cn(
                "mt-2 font-display font-bold tracking-[-0.04em] text-white",
                compact
                  ? "text-[28px] leading-[0.95]"
                  : "text-[34px] leading-[0.92]",
              )}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2.5 max-w-[17rem] text-[13px] leading-snug font-bold text-white/50">
                {subtitle}
              </p>
            ) : null}
          </div>

          {heroMedia ? (
            <motion.div
              className={cn(
                "relative shrink-0",
                compact ? "h-[88px] w-[88px]" : "h-[120px] w-[120px]",
              )}
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {heroMedia}
            </motion.div>
          ) : null}
        </div>
      </section>

      <motion.div
        className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <div className="flex flex-1 flex-col">{children}</div>
        {footer ? <div className="mt-6 shrink-0">{footer}</div> : null}
      </motion.div>
    </div>
  );
}

export const authCtaClassName =
  "h-14 w-full rounded-[18px] bg-arc-purple-500 font-display text-[16px] font-bold text-white shadow-[0_4px_0_#4b2fd6] transition-all active:translate-y-px active:shadow-[0_2px_0_#4b2fd6]";

export const authGhostLinkClassName =
  "font-bold text-arc-purple-500 underline-offset-2 hover:underline";
