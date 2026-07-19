"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import { isArloVisibleForLessonType } from "@/lib/lesson/arlo-visibility";
import { cn } from "@/lib/utils";
import { LessonArloSheet } from "./LessonArloSheet";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Shared lesson chrome — night step bar over lavender sheet.
 * Ask Arlo button respects master + per-type flags unless forced off.
 * Opens a bottom sheet (not full-screen navigation).
 */
export function LessonShell({
  children,
  lessonId,
  lessonType,
  stepLabel,
  progress,
  showArlo,
  onBack,
}: {
  children: React.ReactNode;
  lessonId: string;
  /** Used with feature flags when `showArlo` is omitted. */
  lessonType?: string;
  stepLabel: string;
  progress: number;
  /** Force show/hide. Omit to follow Arlo feature flags + lesson type. */
  showArlo?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { flags } = useSystemFlags();
  const [arloOpen, setArloOpen] = useState(false);
  const arloVisible =
    showArlo === false
      ? false
      : showArlo === true
        ? true
        : isArloVisibleForLessonType(flags, lessonType);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#0f1220] font-rounded">
      <header className="relative z-20 overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-40 w-40 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-24px] h-24 w-24 rounded-full bg-[#ffc928]/15 blur-2xl"
        />

        <div className="relative z-[1] flex items-center gap-3">
          <BackButton
            tone="dark"
            onClick={() => (onBack ? onBack() : router.back())}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {stepLabel}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-arc-purple-500"
                initial={false}
                animate={{ width: `${Math.max(progress, 4)}%` }}
                transition={softSpring}
              />
            </div>
          </div>
          {arloVisible ? (
            <button
              type="button"
              aria-label="Ask Arlo"
              onClick={() => setArloOpen(true)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-arc-purple-500 text-white shadow-[0_3px_0_var(--color-arc-purple-700)]"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
            </button>
          ) : null}
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col rounded-t-[24px] bg-[#f3effc] px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-8px_28px_rgba(0,0,0,0.18)]">
        {children}
      </div>

      {arloVisible && arloOpen ? (
        <LessonArloSheet
          open
          onClose={() => setArloOpen(false)}
          lessonId={lessonId}
        />
      ) : null}
    </div>
  );
}

export function LessonPrimaryButton({
  children,
  href,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const classes = cn(
    "flex w-full items-center justify-center gap-2 rounded-[18px] bg-arc-purple-500 py-4 font-display text-[16px] font-bold text-white shadow-[0_5px_0_var(--color-arc-purple-700)]",
    disabled && "pointer-events-none opacity-40",
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}

export function LessonOptionCard({
  label,
  selected,
  correct,
  revealed,
  onSelect,
}: {
  label: string;
  selected: boolean;
  correct?: boolean;
  revealed?: boolean;
  onSelect: () => void;
}) {
  const showCorrect = revealed && correct;
  const showWrong = revealed && selected && !correct;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[18px] border-2 px-4 py-3.5 text-left font-display text-[15px] font-bold transition-colors",
        showCorrect &&
          "border-[#62d84e] bg-[#f0fbeb] text-[#1f6b2e] shadow-[0_4px_0_#b8e6a8]",
        showWrong &&
          "border-[#ff8a3d] bg-[#fff4ec] text-[#9a4a12] shadow-[0_4px_0_#ffd4b0]",
        !revealed &&
          selected &&
          "border-arc-purple-500 bg-white text-[#0f1220] shadow-[0_4px_0_var(--color-arc-purple-700)]",
        !revealed &&
          !selected &&
          "border-[#ebe4f6] bg-white text-[#0f1220] shadow-[0_4px_0_#ebe4f6]",
        revealed &&
          !selected &&
          !correct &&
          "border-[#ebe4f6] bg-white/70 text-arc-lavender-600",
      )}
    >
      <span className="text-[14px] leading-snug whitespace-pre-wrap">
        {label}
      </span>
    </button>
  );
}
