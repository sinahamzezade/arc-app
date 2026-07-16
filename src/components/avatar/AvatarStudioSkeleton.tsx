"use client";

import { Skeleton } from "@/components/ui";

/** Avatar studio placeholder — night stage + category rail + shop grid. */
export function AvatarStudioSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading avatar studio"
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
              className="h-3 w-16 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-9 w-44 rounded-lg bg-white/20"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-8 w-20 shrink-0 rounded-2xl bg-[#ffc928]/40"
          />
        </div>

        <div className="relative mt-5 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="space-y-3 pb-2">
            <Skeleton
              animationType="shimmer"
              className="h-8 w-32 rounded-lg bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-9 w-40 rounded-full bg-white/10"
            />
            <Skeleton
              animationType="shimmer"
              className="h-6 w-24 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-[168px] w-[168px] rounded-[28px] bg-white/10"
          />
        </div>
      </header>

      <div className="relative z-10 -mt-8 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-10">
        <div className="flex gap-3">
          <div className="flex w-14 shrink-0 flex-col gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className="h-11 w-14 rounded-2xl bg-[#ebe4f6]"
              />
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton
              animationType="shimmer"
              className="h-5 w-28 rounded-lg bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-[72px] w-full rounded-[18px] bg-[#ebe4f6]"
            />
            <div className="grid grid-cols-2 gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  animationType="shimmer"
                  className="h-[168px] w-full rounded-[18px] bg-[#ebe4f6]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading avatar studio…</span>
    </div>
  );
}
