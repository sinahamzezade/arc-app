"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { fireLessonConfetti } from "@/components/ui/confetti";
import {
  useChooseNext,
  useReEnrollmentJob,
  useRoadmapCompletionSummary,
} from "@/hooks/useRoadmapCompletion";
import { cn } from "@/lib/utils";

type ChoiceKey = "new_goal" | "same_goal_advanced" | "top_up";

export default function GraduationScreen({
  roadmapId,
}: {
  roadmapId: string;
}) {
  const router = useRouter();
  const confettiFired = useRef(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const { data, isLoading, isError, error, softWait, refetch } =
    useRoadmapCompletionSummary(roadmapId);
  const chooseNext = useChooseNext(roadmapId);
  const reenrollJob = useReEnrollmentJob(pendingJobId);

  useEffect(() => {
    if (!data || confettiFired.current) return;
    confettiFired.current = true;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) fireLessonConfetti();
  }, [data]);

  useEffect(() => {
    if (reenrollJob.data?.status === "ready") {
      router.replace("/path");
    }
  }, [reenrollJob.data?.status, router]);

  async function onChoose(choice: ChoiceKey) {
    try {
      const result = await chooseNext.mutateAsync(choice);
      if (result.redirect) {
        router.push(result.redirect);
        return;
      }
      if (result.jobId) {
        setPendingJobId(result.jobId);
      }
    } catch {
      /* surfaced below */
    }
  }

  if (isLoading) {
    return (
      <Shell>
        <p className="mt-8 text-center text-[14px] font-semibold text-white/60">
          Loading your graduation…
        </p>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <p className="mt-8 text-center text-[14px] font-semibold text-white/70">
          {error instanceof ApiError
            ? messageForCode(error.code, error.message)
            : "Could not load graduation summary."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 text-[14px] font-semibold text-[#ffc928]"
        >
          Try again
        </button>
      </Shell>
    );
  }

  const coach = data.coachAssessment;
  const building =
    Boolean(pendingJobId) &&
    reenrollJob.data?.status !== "failed" &&
    reenrollJob.data?.status !== "ready";

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="flex flex-1 flex-col"
      >
        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
          <div className="min-w-0 pt-2">
            <p className="text-[11px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
              Roadmap complete
            </p>
            <h1 className="mt-2 max-w-[16ch] font-display text-[34px] leading-[0.95] font-bold tracking-[-0.03em] text-white text-balance">
              {data.title}
            </h1>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-white/55">
              <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
              {data.completionWeeks} weeks · {data.totalLessons} lessons ·{" "}
              {data.totalXpEarned} XP
            </p>
          </div>
          <Image
            src={assets.arlo.graduation}
            alt=""
            width={108}
            height={108}
            className="h-[108px] w-[108px] object-contain"
            priority
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <StatChip
            label="Mastered"
            value={data.skillsMastered}
            tone="mastered"
          />
          <StatChip
            label="Partial"
            value={data.skillsPartial}
            tone="partial"
          />
          <StatChip label="Shaky" value={data.skillsShaky} tone="shaky" />
        </div>

        {data.skillSummary.length > 0 ? (
          <ul className="mt-5 max-h-[160px] space-y-2 overflow-y-auto">
            {data.skillSummary.map((s) => (
              <li
                key={s.skillSlug}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <span className="truncate text-[13px] font-semibold text-white/85">
                  {s.skillSlug}
                </span>
                <span
                  className={cn(
                    "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide uppercase",
                    s.status === "mastered" && "bg-[#d8f5c8] text-[#2f6b1a]",
                    s.status === "partial" && "bg-[#fff4cc] text-[#8a6a00]",
                    s.status === "shaky" && "bg-[#ffe0d6] text-[#9a3a1a]",
                  )}
                >
                  {s.status} · {s.stage}/{s.target}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex-1">
          <p className="text-[11px] font-black tracking-[0.14em] text-white/45 uppercase">
            What&apos;s next?
          </p>

          {!coach.ready ? (
            <p className="mt-3 text-[14px] font-semibold text-white/60">
              {softWait
                ? "We're preparing your next options…"
                : "Coach is reviewing your skill signal…"}
            </p>
          ) : (
            <>
              {coach.rationale ? (
                <p className="mt-2 text-[14px] leading-snug font-medium text-white/70">
                  {coach.rationale}
                </p>
              ) : null}
              <div className="mt-4 space-y-2">
                {(coach.options ?? []).map((opt) => {
                  const key = opt.key as ChoiceKey;
                  const recommended = coach.recommendation === key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={chooseNext.isPending || building}
                      onClick={() => void onChoose(key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-opacity disabled:opacity-60",
                        recommended
                          ? "border-[#ffc928] bg-[#ffc928]/15 text-white"
                          : "border-white/15 bg-white/5 text-white/90 hover:bg-white/10",
                      )}
                    >
                      <span className="font-display text-[15px] font-semibold">
                        {opt.label}
                        {recommended ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black tracking-wide text-[#ffc928] uppercase">
                            <Sparkles className="h-3 w-3" />
                            Suggested
                          </span>
                        ) : null}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {chooseNext.isError ? (
            <p className="mt-3 text-[13px] font-semibold text-[#ff8a7a]">
              {chooseNext.error instanceof ApiError
                ? messageForCode(
                    chooseNext.error.code,
                    chooseNext.error.message,
                  )
                : "Could not start next path."}
            </p>
          ) : null}

          {building ? (
            <p className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-[#ffc928]">
              <Star className="h-4 w-4 animate-pulse" />
              Building your next roadmap…
            </p>
          ) : null}

          {reenrollJob.data?.status === "failed" ? (
            <p className="mt-3 text-[13px] font-semibold text-[#ff8a7a]">
              {reenrollJob.data.errorMessage ??
                "Re-enrollment failed. Try another option."}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => router.push("/path")}
          className="mt-4 w-full py-3 text-center font-display text-[14px] font-semibold text-white/45"
        >
          Back to Path
        </button>
      </motion.div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#100d22] font-rounded">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(107,78,255,0.45),transparent_55%),radial-gradient(ellipse_at_90%_15%,rgba(255,201,40,0.22),transparent_45%),radial-gradient(ellipse_at_50%_100%,rgba(255,138,61,0.12),transparent_50%)]"
      />
      <div className="relative z-[1] flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {children}
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "mastered" | "partial" | "shaky";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2.5 text-center",
        tone === "mastered" && "border-[#6bbf4a]/40 bg-[#d8f5c8]/10",
        tone === "partial" && "border-[#ffc928]/40 bg-[#fff4cc]/10",
        tone === "shaky" && "border-[#ff8a3d]/40 bg-[#ffe0d6]/10",
      )}
    >
      <p className="flex items-center justify-center gap-1 font-display text-[22px] font-bold text-white">
        {tone === "mastered" ? <Check className="h-4 w-4 text-[#6bbf4a]" /> : null}
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-black tracking-[0.08em] text-white/50 uppercase">
        {label}
      </p>
    </div>
  );
}
