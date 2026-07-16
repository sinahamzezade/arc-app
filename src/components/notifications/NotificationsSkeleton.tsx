"use client";

import { Skeleton } from "@/components/ui";

/** Inbox placeholder — night hero + filter chips + signal rows. */
export function NotificationsSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading notifications"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-8 h-48 w-48 rounded-full bg-arc-purple-500/50 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-10 w-10 shrink-0 rounded-2xl bg-white/15"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-3 w-14 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-9 w-40 rounded-lg bg-white/20"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-10 w-10 shrink-0 rounded-2xl bg-white/15"
          />
        </div>

        <div className="relative mt-5 flex items-end gap-3">
          <div className="min-w-0 flex-1 space-y-3 pb-1">
            <Skeleton
              animationType="shimmer"
              className="h-7 w-28 rounded-full bg-[#ffc928]/35"
            />
            <Skeleton
              animationType="shimmer"
              className="h-4 w-48 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="-mr-2 h-[120px] w-[108px] shrink-0 rounded-2xl bg-white/10"
          />
        </div>
      </header>

      <div className="relative z-10 -mt-8 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-10">
        <div className="flex gap-1 overflow-hidden rounded-full border-2 border-[#ebe4f6] bg-white p-1 shadow-[0_3px_0_#ebe4f6]">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-10 min-w-0 flex-1 rounded-full bg-[#ebe4f6]"
            />
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <Skeleton
            animationType="shimmer"
            className="h-[88px] w-full rounded-[20px] bg-[#ebe4f6]"
          />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-[76px] w-full rounded-[18px] bg-[#ebe4f6]"
            />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading notifications…</span>
    </div>
  );
}
