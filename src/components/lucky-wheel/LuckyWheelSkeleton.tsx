"use client";

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

type LuckyWheelSkeletonProps = {
  /** Unauthenticated gate — same chrome + sign-in CTA */
  mode?: "loading" | "signin";
};

/**
 * Night-stage skeleton mirroring Lucky Wheel layout.
 */
export function LuckyWheelSkeleton({
  mode = "loading",
}: LuckyWheelSkeletonProps) {
  const signIn = mode === "signin";

  return (
    <div
      className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#0f1220] font-rounded"
      role="status"
      aria-busy={!signIn}
      aria-label={signIn ? "Sign in to spin" : "Loading lucky wheel"}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-24 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/15 blur-3xl"
      />

      <section className="relative flex flex-1 flex-col px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <header className="relative z-[1] flex items-start gap-3">
          <BackButton fallbackHref="/home" tone="dark" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-24 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-36 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-14 w-16 rounded-2xl bg-[#ffc928]/35"
          />
        </header>

        <div className="relative z-[1] mt-6 space-y-3">
          <Skeleton
            animationType="shimmer"
            className="h-10 w-[70%] rounded-xl bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-4 w-[55%] rounded-full bg-white/10"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Skeleton
              animationType="shimmer"
              className="h-8 w-20 rounded-full bg-[#ffc928]/30"
            />
            <Skeleton
              animationType="shimmer"
              className="h-8 w-16 rounded-full bg-white/10"
            />
            <Skeleton
              animationType="shimmer"
              className="h-8 w-20 rounded-full bg-white/10"
            />
          </div>
        </div>

        <div className="relative z-[1] mx-auto mt-auto flex w-full max-w-[320px] flex-col items-center pt-10 pb-2">
          {/* Pointer stub */}
          <Skeleton
            animationType="shimmer"
            className="mb-2 h-3 w-3 rounded-full bg-[#ffc928]/50"
          />

          {/* Wheel disc */}
          <div
            className={cn(
              "relative flex h-[260px] w-[260px] items-center justify-center rounded-full p-[14px]",
              "bg-gradient-to-b from-[#9b7bff]/80 via-arc-purple-500/70 to-[#4b2fd6]/80",
              "shadow-[0_16px_36px_rgba(15,18,32,0.55)]",
            )}
          >
            <div className="relative h-full w-full overflow-hidden rounded-full bg-[#0f1220]/80 ring-2 ring-white/10">
              <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "conic-gradient(#ffc928 0deg 45deg, #b35cff 45deg 90deg, #2d8cff 90deg 135deg, #3a415c 135deg 180deg, #ff8a3d 180deg 225deg, #ffc928 225deg 270deg, #b35cff 270deg 315deg, #2d8cff 315deg 360deg)",
                }}
              />
              <Skeleton
                animationType="shimmer"
                className="absolute inset-[28%] rounded-full bg-white/20"
              />
            </div>
          </div>

          {signIn ? (
            <div className="mt-7 w-full max-w-[260px] space-y-3 text-center">
              <p className="font-display text-[22px] font-bold tracking-[-0.02em] text-white">
                Sign in to spin
              </p>
              <p className="text-[13px] font-bold text-white/50">
                Daily free spin waits after login.
              </p>
              <Link
                href="/login?callbackUrl=%2Flucky-wheel"
                className="flex w-full cursor-pointer items-center justify-center rounded-[18px] bg-[#ffc928] py-4 font-display text-[16px] font-bold text-[#0f1220] shadow-[0_5px_0_#c79a2e] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220]"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <Skeleton
                animationType="shimmer"
                className="mt-7 h-14 w-full max-w-[220px] rounded-[18px] bg-[#ffc928]/40"
              />
              <span className="sr-only">Loading wheel…</span>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
