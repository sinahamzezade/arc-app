"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function LessonShell({
  children,
  lessonId,
  stepLabel,
  progress,
  showArlo = true,
  onBack,
}: {
  children: React.ReactNode;
  lessonId: string;
  stepLabel: string;
  progress: number;
  showArlo?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#f3effc] font-rounded">
      <header className="sticky top-0 z-20 border-b border-[#ebe4f6]/bg-[#f3effc]/90 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <BackButton
            tone="light"
            onClick={() => (onBack ? onBack() : router.back())}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.06em] text-[#8a7cb8] uppercase">
              {stepLabel}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#ebe4f6]">
              <motion.div
                className="h-full rounded-full bg-arc-purple-500"
                initial={false}
                animate={{ width: `${Math.max(progress, 4)}%` }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            </div>
          </div>
          {showArlo ? (
            <Link
              href={`/learn/${lessonId}/arlo`}
              aria-label="Ask Arlo"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
            </Link>
          ) : (
            <span className="h-10 w-10" aria-hidden />
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {children}
      </div>
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
    "flex w-full items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]",
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
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
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
        "w-full rounded-2xl border px-4 py-3.5 text-left font-display text-[15px] font-semibold transition-colors",
        showCorrect && "border-[#62d84e] bg-[#f0fbeb] text-[#1f6b2e]",
        showWrong && "border-[#ff8a3d] bg-[#fff4ec] text-[#9a4a12]",
        !revealed && selected && "border-arc-purple-500 bg-[#f6f2ff] text-[#2b1b57]",
        !revealed && !selected && "border-[#ebe4f6] bg-white text-[#2b1b57]",
        revealed && !selected && !correct && "border-[#ebe4f6] bg-white text-[#8a7cb8]",
      )}
    >
      <span className="text-[14px] leading-snug whitespace-pre-wrap">{label}</span>
    </button>
  );
}
