import { HomeSheetSkeleton } from "@/components/home/HomeSheetSkeleton";
import { Skeleton } from "@/components/ui";

export default function HomeLoading() {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-8 h-44 w-44 rounded-full bg-arc-purple-500/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 -left-12 h-32 w-32 rounded-full bg-[#ffc928]/10 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className="h-8 w-20 rounded-full bg-white/15"
              />
            ))}
            <Skeleton
              animationType="shimmer"
              className="ml-auto h-9 w-9 shrink-0 rounded-full bg-white/15"
            />
          </div>

          <div className="mt-6 flex items-end justify-between gap-3 pb-2">
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton
                animationType="shimmer"
                className="h-3 w-24 rounded-full bg-white/15"
              />
              <Skeleton
                animationType="shimmer"
                className="h-8 w-40 rounded-lg bg-white/20"
              />
              <Skeleton
                animationType="shimmer"
                className="h-8 w-32 rounded-full bg-white/10"
              />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-24 w-24 shrink-0 rounded-full bg-white/10"
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-6 space-y-4 rounded-t-arc-xl bg-[#f2eefb] px-4 pt-4 pb-6">
        <HomeSheetSkeleton />
      </main>
    </div>
  );
}
