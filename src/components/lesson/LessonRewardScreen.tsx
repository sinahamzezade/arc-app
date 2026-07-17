"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Gem, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
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
import { LessonPrimaryButton } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

export default function LessonRewardScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  // Confetti once after successful claim.
  useEffect(() => {
    if (!result || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) fireLessonConfetti();
  }, [result]);

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

  // Only show server-granted amounts — never stale play preview.
  if (!result) {
    return <LessonLoadState message="Claiming reward…" />;
  }

  const reward = result.reward;
  const quiz = result.quizScore;
  const badgeSrc = badgeCode
    ? badgeImageFor(badgeDef?.iconAssetKey ?? badgeCode)
    : null;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#100d22] font-rounded">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(107,78,255,0.45),transparent_55%),radial-gradient(ellipse_at_90%_15%,rgba(255,201,40,0.22),transparent_45%),radial-gradient(ellipse_at_50%_100%,rgba(255,138,61,0.12),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-[1] flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="flex flex-1 flex-col"
        >
          {/* Asymmetric header — label left, Arlo peek right */}
          <div className="grid grid-cols-[1fr_auto] items-start gap-2">
            <div className="min-w-0 pt-2">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
                Lesson complete
              </p>
              <h1 className="mt-2 max-w-[14ch] font-display text-[34px] leading-[0.95] font-bold tracking-[-0.03em] text-white text-balance">
                {lesson.title}
              </h1>
              {quiz.total > 0 ? (
                <p className="mt-3 text-[12px] font-bold text-white/45">
                  Quiz {quiz.correct}/{quiz.total}
                  {quiz.perfect ? " · Perfect" : ""}
                </p>
              ) : null}
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 6 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 16,
                delay: 0.12,
              }}
              className="-mr-2 -mt-1"
            >
              <Image
                src={assets.arlo.celebrate}
                alt=""
                width={112}
                height={112}
                className="h-28 w-28 object-contain drop-shadow-[0_12px_24px_rgba(107,78,255,0.45)]"
                priority
              />
            </motion.div>
          </div>

          <p className="mt-4 max-w-[22rem] text-[14px] leading-snug font-semibold text-white/70">
            {reward.arloLine}
          </p>

          {/* Staggered reward strip — offset middle card */}
          <div className="mt-8 grid grid-cols-3 items-end gap-2.5">
            <RewardChip
              icon={<Star className="h-4 w-4" strokeWidth={2.5} />}
              label="XP"
              value={reward.xp}
              tone="xp"
              delay={0.05}
            />
            <RewardChip
              icon={<Gem className="h-4 w-4" strokeWidth={2.5} />}
              label="Gems"
              value={reward.gems}
              tone="gem"
              delay={0.14}
              lift
            />
            <RewardChip
              icon={<Coins className="h-4 w-4" strokeWidth={2.5} />}
              label="Coins"
              value={reward.coins}
              tone="coin"
              delay={0.23}
            />
          </div>

          {reward.variableRoll ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-[14px] border border-[#ffc928]/30 bg-[#ffc928]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#ffc928]"
            >
              {formatVariableRoll(reward.variableRoll)}
            </motion.p>
          ) : null}

          {result.crossTrackNudge ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="mt-3 text-[12px] font-semibold text-white/50"
            >
              Optional next: {result.crossTrackNudge.title} (
              {result.crossTrackNudge.estimatedMinutes}m)
            </motion.p>
          ) : null}

          {badgeSrc && reward.badgeLabel ? (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
              className="mt-6 flex items-center gap-3 self-start rounded-2xl border border-[#ffc928]/25 bg-[#ffc928]/10 px-3.5 py-3 pr-5"
            >
              <Image
                src={badgeSrc}
                alt=""
                width={44}
                height={44}
                unoptimized={isBadgeUploadSrc(badgeSrc)}
                className="h-11 w-11 object-contain"
              />
              <div className="text-left">
                <p className="text-[10px] font-bold tracking-[0.1em] text-[#ffc928] uppercase">
                  Badge unlocked
                </p>
                <p className="font-display text-[16px] font-semibold text-white">
                  {reward.badgeLabel}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="mt-8 flex-1" aria-hidden />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="relative z-[1] space-y-1"
        >
          {result.roadmapCompleted && result.roadmapId ? (
            <LessonPrimaryButton
              href={`/path/graduation?roadmapId=${result.roadmapId}`}
            >
              See graduation
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          ) : (
            <LessonPrimaryButton href="/path">
              Back to Path
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          )}
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="w-full py-3 text-center font-display text-[14px] font-semibold text-white/50"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function RewardChip({
  icon,
  label,
  value,
  tone,
  delay = 0,
  lift = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "xp" | "gem" | "coin";
  delay?: number;
  lift?: boolean;
}) {
  const tones = {
    xp: {
      bg: "bg-[#fff4cc]",
      text: "text-[#8a6a00]",
      ring: "ring-[#ffc928]/40",
    },
    gem: {
      bg: "bg-[#efe8ff]",
      text: "text-[#4b2fd6]",
      ring: "ring-arc-purple-400/50",
    },
    coin: {
      bg: "bg-[#ffe8c8]",
      text: "text-[#9a5a00]",
      ring: "ring-[#ff8a3d]/35",
    },
  };
  const t = tones[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 340,
        damping: 20,
        delay,
      }}
      className={`rounded-[20px] px-2 py-4 text-center ring-2 ${t.bg} ${t.text} ${t.ring} ${
        lift ? "-translate-y-2 shadow-[0_12px_28px_rgba(107,78,255,0.25)]" : ""
      }`}
    >
      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80">
        {icon}
      </div>
      <p className="font-display text-[22px] leading-none font-bold tabular-nums">
        +{value}
      </p>
      <p className="mt-1.5 text-[10px] font-bold tracking-[0.12em] uppercase opacity-70">
        {label}
      </p>
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
