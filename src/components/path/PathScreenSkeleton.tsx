"use client";

import { Skeleton } from "@/components/ui";

const STOPS: Array<{ side: "left" | "right"; current?: boolean }> = [
  { side: "left" },
  { side: "right" },
  { side: "left", current: true },
  { side: "right" },
  { side: "left" },
  { side: "right" },
];

/**
 * Path atlas placeholder — night hero + serpentine stop pills.
 */
export function PathScreenSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading path"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-48px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-28 -left-20 h-44 w-44 rounded-full bg-[#ffc928]/14 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-3.5 w-32 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-9 w-20 rounded-full bg-white/15"
          />
        </div>

        <Skeleton
          animationType="shimmer"
          className="mt-3 h-7 w-2/5 rounded-lg bg-white/20"
        />
        <Skeleton
          animationType="shimmer"
          className="mt-2 h-3 w-2/5 rounded-full bg-white/10"
        />

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-28 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-16 rounded-full bg-white/15"
            />
          </div>

          <div className="relative mt-2 h-7">
            <Skeleton
              animationType="shimmer"
              className="absolute top-1/2 right-6 left-3 h-1 -translate-y-1/2 rounded-full bg-white/10"
            />
            <Skeleton
              animationType="shimmer"
              className="absolute top-1/2 left-0 size-3 -translate-y-1/2 rounded-full bg-white/20"
            />
            <Skeleton
              animationType="shimmer"
              className="absolute top-1/2 left-[28%] size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
            />
            <Skeleton
              animationType="shimmer"
              className="absolute top-1/2 right-0 size-4 -translate-y-1/2 rounded-sm bg-white/15"
            />
          </div>

          <Skeleton
            animationType="shimmer"
            className="mt-2 h-3 w-36 rounded-full bg-white/10"
          />
        </div>
      </header>

      <div
        className="relative -mt-6 rounded-t-arc-xl bg-[#f2eefb] px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)] pt-10"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 16% 9%, transparent 52px, rgba(107,78,255,0.055) 53px 55px, transparent 56px)",
            "radial-gradient(circle at 88% 38%, transparent 60px, rgba(107,78,255,0.05) 61px 63px, transparent 64px)",
            "linear-gradient(rgba(107,78,255,0.05) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(107,78,255,0.05) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "auto, auto, 56px 56px, 56px 56px",
        }}
      >
        <div className="relative mx-auto flex max-w-[360px] flex-col gap-7">
          <div className="mx-auto w-[72%]">
            <Skeleton
              animationType="shimmer"
              className="mx-auto h-9 w-full rounded-full bg-[#ebe4f6]"
            />
          </div>

          {STOPS.map((stop, i) => (
            <div
              key={i}
              className={
                stop.side === "left"
                  ? "mr-auto flex w-[58%] items-center gap-3"
                  : "ml-auto flex w-[58%] flex-row-reverse items-center gap-3"
              }
            >
              <Skeleton
                animationType="shimmer"
                className={
                  stop.current
                    ? "size-14 shrink-0 rounded-full bg-[#d9cff5]"
                    : "size-11 shrink-0 rounded-full bg-[#ebe4f6]"
                }
              />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton
                  animationType="shimmer"
                  className={`h-3 rounded-full bg-[#ebe4f6] ${
                    stop.current ? "w-4/5" : "w-3/5"
                  }`}
                />
                {stop.current ? (
                  <Skeleton
                    animationType="shimmer"
                    className="h-10 w-full rounded-2xl bg-[#ebe4f6]"
                  />
                ) : (
                  <Skeleton
                    animationType="shimmer"
                    className="h-2.5 w-2/5 rounded-full bg-[#ebe4f6]"
                  />
                )}
              </div>
            </div>
          ))}

          <div className="mx-auto mt-2 w-[40%]">
            <Skeleton
              animationType="shimmer"
              className="mx-auto size-16 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="mx-auto mt-3 h-3 w-24 rounded-full bg-[#ebe4f6]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
