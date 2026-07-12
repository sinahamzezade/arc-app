"use client";

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
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
      <p className="text-center font-semibold text-arc-lavender-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl bg-arc-purple-500 px-5 py-3 font-display text-[14px] font-bold text-white shadow-[0_3px_0_var(--color-arc-purple-700)]"
        >
          Retry
        </button>
      ) : null}
      <LessonPrimaryButton href={actionHref}>{actionLabel}</LessonPrimaryButton>
    </div>
  );
}
