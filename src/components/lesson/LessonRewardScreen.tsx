"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Gem, Zap } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "motion/react";
import { assets } from "@/lib/assets";
import type { LessonCompleteResponse, VariableRollOutcome } from "@/lib/api/types";
import { badgesApi } from "@/lib/api/badges";
import { lessonsApi } from "@/lib/api/lessons";
import { badgeImageFor, isBadgeUploadSrc } from "@/lib/badges/icons";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useEnsureLessonAttempt } from "@/hooks/useEnsureLessonAttempt";
import { useLessonStore } from "@/store/useLessonStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { fireLessonConfetti } from "@/components/ui/confetti";
import { Button } from "@/components/ui";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { cn } from "@/lib/utils";
import { LessonLoadState } from "./LessonLoadState";

const soft = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Lesson clear — clay celebration plate + equal reward stamps.
 * Built fresh (not a polish of the old confetti strip).
 */
export default function LessonRewardScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const quizAnswers = useLessonStore((s) => s.quizAnswers);
  const attemptId = useEnsureLessonAttempt(lessonId);
  const setCompleted = useLessonStore((s) => s.setCompleted);
  const hydrateFromProfile = useEconomyStore((s) => s.hydrateFromProfile);
  const [result, setResult] = useState<LessonCompleteResponse | null>(null);
  const claimedRef = useRef(false);
  const confettiFiredRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  const accessToken = session?.accessToken;
  const badgeCode = result?.reward.badgeId ?? null;
  const { data: badgeDef } = useQuery({
    queryKey: ["badges", "def", badgeCode, accessToken ?? "anon"],
    enabled: Boolean(badgeCode && accessToken),
    queryFn: () => badgesApi.get(badgeCode!, accessToken),
    staleTime: 60_000,
  });

  const completeMutation = useMutation({
    mutationFn: () => {
      const id = useLessonStore.getState().attemptId;
      if (!id) throw new Error("Start the lesson first");
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `lesson-${lessonId}-${Date.now()}`;
      }
      return lessonsApi.complete(
        lessonId,
        {
          quizAnswers,
          attemptId: id,
        },
        session?.accessToken,
        idempotencyKeyRef.current,
      );
    },
    onSuccess: (data) => {
      setResult(data);
      setCompleted(true);
      const bal = data.wallet
        ? {
            totalXp: data.wallet.lifetimeXp,
            gems: data.wallet.gems,
            coins: data.wallet.coins,
          }
        : data.profile;
      if (bal) hydrateFromProfile(bal);
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "current"] });
      void queryClient.invalidateQueries({
        queryKey: ["lessons", "play", lessonId],
      });
      void queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });

  useEffect(() => {
    if (!lesson || claimedRef.current) return;
    if (!session?.accessToken) return;
    if (!attemptId) return;
    claimedRef.current = true;
    completeMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, session?.accessToken, attemptId]);

  useEffect(() => {
    if (!result || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    if (!reduceMotion) fireLessonConfetti();
  }, [result, reduceMotion]);

  if (isLoading || !attemptId) {
    return <LessonLoadState message="Preparing reward…" />;
  }

  if (lesson && !result && completeMutation.isPending) {
    return <LessonLoadState message="Claiming reward…" />;
  }

  if (isError || !lesson) {
    return (
      <LessonLoadState
        message={error?.message ?? "Lesson not found."}
        onRetry={isError ? () => refetch() : undefined}
      />
    );
  }

  if (completeMutation.isError && !result) {
    return (
      <LessonLoadState
        message={
          (completeMutation.error as Error)?.message ??
          "Could not claim reward."
        }
        onRetry={() => {
          claimedRef.current = false;
          completeMutation.mutate();
        }}
      />
    );
  }

  if (!result) {
    return <LessonLoadState message="Claiming reward…" />;
  }

  const reward = result.reward;
  const quiz = result.quizScore;
  const badgeSrc = badgeCode
    ? badgeImageFor(badgeDef?.iconAssetKey ?? badgeCode)
    : null;
  const primaryHref =
    result.roadmapCompleted && result.roadmapId
      ? `/path/graduation?roadmapId=${result.roadmapId}`
      : "/path";
  const primaryLabel =
    result.roadmapCompleted && result.roadmapId
      ? "See graduation"
      : "Back to Path";

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#0f1220] font-rounded">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-arc-purple-500/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-24 -left-12 h-40 w-40 rounded-full bg-[#ffc928]/12 blur-3xl"
      />

      <div className="relative z-[1] flex flex-1 flex-col px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={soft}
          className="flex flex-1 flex-col"
        >
          {/* Celebration plate */}
          <div className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-arc-purple-500 shadow-[0_7px_0_#35209d]">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-6 h-28 w-28 rounded-full bg-[#ffc928]/25 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-[#0f1220]/35 blur-2xl"
            />

            <span className="absolute top-0 left-5 z-[1] rounded-b-xl border-x-[3px] border-b-[3px] border-[#0a0c16] bg-[#ffc928] px-2.5 py-1 font-display text-[10px] font-bold tracking-[0.14em] text-[#0f1220] uppercase shadow-[0_3px_0_#c79a2e]">
              Cleared
            </span>

            <div className="relative flex gap-3 px-3.5 pt-10 pb-3.5">
              <motion.div
                className="relative shrink-0"
                initial={reduceMotion ? false : { rotate: -6, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ ...soft, delay: 0.08 }}
              >
                <div className="rounded-[22px] border-[3px] border-[#0a0c16] bg-[#0f1220] p-1.5 shadow-[0_4px_0_#0a0c16]">
                  <Image
                    src={assets.arlo.celebrate}
                    alt=""
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px] object-contain"
                    priority
                  />
                </div>
              </motion.div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[10px] font-extrabold tracking-[0.18em] text-white/55 uppercase">
                  Lesson complete
                </p>
                <h1 className="mt-1 font-display text-[24px] leading-[0.98] font-bold tracking-[-0.04em] text-white text-balance">
                  {lesson.title}
                </h1>
                {quiz.total > 0 ? (
                  <p className="mt-2 text-[11px] font-bold text-white/55">
                    Quiz {quiz.correct}/{quiz.total}
                    {quiz.perfect ? " · Perfect" : ""}
                  </p>
                ) : null}
              </div>
            </div>

            <p className="relative mx-3.5 mb-3.5 text-[13px] leading-snug font-semibold text-white/70">
              {reward.arloLine}
            </p>

            {/* Equal reward stamps */}
            <div className="relative mx-3.5 mb-3.5 grid grid-cols-3 gap-2">
              <RewardStamp
                label="XP"
                value={reward.xp}
                delay={0.06}
                icon={
                  <Zap
                    className="h-4 w-4 text-[#7eb8ff]"
                    strokeWidth={2.5}
                    fill="currentColor"
                  />
                }
              />
              <RewardStamp
                label="Gems"
                value={reward.gems}
                delay={0.12}
                icon={
                  <Gem className="h-4 w-4 text-[#e4c4ff]" strokeWidth={2.5} />
                }
              />
              <RewardStamp
                label="Coins"
                value={reward.coins}
                delay={0.18}
                icon={
                  <Coins className="h-4 w-4 text-[#ffc928]" strokeWidth={2.5} />
                }
              />
            </div>
          </div>

          {reward.variableRoll ? (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="mt-3 rounded-[14px] border-[3px] border-[#0a0c16] bg-[#ffc928] px-3.5 py-2.5 text-[13px] font-bold text-[#0f1220] shadow-[0_3px_0_#c79a2e]"
            >
              {formatVariableRoll(reward.variableRoll)}
            </motion.p>
          ) : null}

          {badgeSrc && reward.badgeLabel ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, ...soft }}
              className="mt-3 flex items-center gap-3 rounded-[18px] border border-white/12 bg-white/6 px-3 py-3"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-[#0a0c16] bg-[#0f1220] shadow-[0_3px_0_#0a0c16]">
                <Image
                  src={badgeSrc}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized={isBadgeUploadSrc(badgeSrc)}
                  className="h-9 w-9 object-contain"
                />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#ffc928] uppercase">
                  Badge unlocked
                </p>
                <p className="truncate font-display text-[15px] font-bold text-white">
                  {reward.badgeLabel}
                </p>
              </div>
            </motion.div>
          ) : null}

          {result.crossTrackNudge ? (
            <p className="mt-3 text-[12px] font-semibold text-white/45">
              Optional next: {result.crossTrackNudge.title} (
              {result.crossTrackNudge.estimatedMinutes}m)
            </p>
          ) : null}

          <div className="flex-1" aria-hidden />
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 space-y-1"
        >
          <Button
            fullWidth
            variant="primary"
            onPress={() => router.push(primaryHref)}
            className={cn(
              authCtaClassName,
              "inline-flex cursor-pointer items-center justify-center gap-2",
            )}
          >
            {primaryLabel}
            <ArrowRight className="size-5" strokeWidth={2.75} aria-hidden />
          </Button>
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="w-full cursor-pointer py-3 text-center text-[14px] font-semibold text-white/45 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]/60"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function RewardStamp({
  label,
  value,
  icon,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...soft, delay }}
      className="min-w-0 rounded-lg border-[3px] border-[#0a0c16] bg-[#0f1220] px-2 py-2.5 shadow-[0_4px_0_#0a0c16]"
    >
      <div className="flex items-center gap-1.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/8">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[16px] leading-none font-bold tabular-nums text-white">
            +{value}
          </span>
          <span className="mt-0.5 block truncate text-[9px] font-extrabold tracking-[0.12em] text-white/45 uppercase">
            {label}
          </span>
        </span>
      </div>
    </motion.div>
  );
}

function formatVariableRoll(
  roll: VariableRollOutcome | Record<string, unknown>,
): string {
  const row = roll as Record<string, unknown>;
  const kind = String(row.kind ?? "");
  switch (kind) {
    case "bonus_xp":
      return `Bonus roll: +${Number(row.bonusXp ?? 0)} XP (${Number(row.bonusPercent ?? 0)}%)`;
    case "bonus_gems":
      return `Bonus roll: +${Number(row.gems ?? 0)} gems`;
    case "mystery_unlock":
      return "Mystery unlock — check your rewards!";
    case "jackpot":
      return `Jackpot! +${Number(row.bonusXp ?? 0)} bonus XP (×${Number(row.multiplier ?? 2)})`;
    default:
      return "Bonus reward unlocked!";
  }
}
