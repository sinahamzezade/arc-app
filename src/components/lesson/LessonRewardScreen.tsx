"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Gem, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import type { LessonCompleteResponse } from "@/lib/api/types";
import { lessonsApi } from "@/lib/api/lessons";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

export default function LessonRewardScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const quizAnswers = useLessonStore((s) => s.quizAnswers);
  const practiceOptionId = useLessonStore((s) => s.practiceOptionId);
  const markCompleted = useLessonStore((s) => s.markCompleted);
  const [result, setResult] = useState<LessonCompleteResponse | null>(null);
  const claimedRef = useRef(false);

  const completeMutation = useMutation({
    mutationFn: () =>
      lessonsApi.complete(
        lessonId,
        {
          quizAnswers,
          practiceOptionId: practiceOptionId ?? undefined,
        },
        session?.accessToken,
      ),
    onSuccess: (data) => {
      setResult(data);
      markCompleted();
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "current"] });
      void queryClient.invalidateQueries({
        queryKey: ["lessons", "play", lessonId],
      });
    },
  });

  useEffect(() => {
    if (!lesson || claimedRef.current) return;
    if (!session?.accessToken) return;
    claimedRef.current = true;
    completeMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, session?.accessToken]);

  if (isLoading || (lesson && !result && completeMutation.isPending)) {
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

  const reward = result?.reward ?? lesson.reward;
  const badgeSrc =
    reward.badgeId === "first-step" ? assets.badges.firstStep : null;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#1b1433] font-rounded">
      <Image
        src={assets.backgrounds.rewardBurst}
        alt=""
        fill
        className="pointer-events-none object-cover opacity-40"
        priority
      />

      <div className="relative z-[1] flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="flex flex-1 flex-col items-center text-center"
        >
          <Image
            src={assets.arlo.celebrate}
            alt="Arlo celebrating"
            width={160}
            height={160}
            className="h-40 w-40 object-contain"
            priority
          />

          <p className="mt-2 text-[11px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            Lesson complete
          </p>
          <h1 className="mt-2 font-display text-[32px] leading-none font-bold tracking-[-0.03em] text-white">
            {lesson.title}
          </h1>
          <p className="mt-3 max-w-[18rem] text-[14px] font-semibold text-white/70">
            {reward.arloLine}
          </p>

          <div className="mt-8 grid w-full grid-cols-3 gap-2">
            <RewardChip
              icon={<Star className="h-4 w-4" strokeWidth={2.5} />}
              label="XP"
              value={`+${reward.xp}`}
              tone="xp"
            />
            <RewardChip
              icon={<Gem className="h-4 w-4" strokeWidth={2.5} />}
              label="Gems"
              value={`+${reward.gems}`}
              tone="gem"
            />
            <RewardChip
              icon={<Coins className="h-4 w-4" strokeWidth={2.5} />}
              label="Coins"
              value={`+${reward.coins}`}
              tone="coin"
            />
          </div>

          {badgeSrc && reward.badgeLabel ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3"
            >
              <Image
                src={badgeSrc}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
              <div className="text-left">
                <p className="text-[10px] font-bold tracking-[0.08em] text-[#ffc928] uppercase">
                  Badge unlocked
                </p>
                <p className="font-display text-[16px] font-semibold text-white">
                  {reward.badgeLabel}
                </p>
              </div>
            </motion.div>
          ) : null}
        </motion.div>

        <div className="relative z-[1] space-y-2">
          <LessonPrimaryButton href="/path">
            Back to Path
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </LessonPrimaryButton>
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="w-full py-3 text-center font-display text-[14px] font-semibold text-white/55"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "xp" | "gem" | "coin";
}) {
  const tones = {
    xp: "bg-[#fff4cc] text-[#8a6a00]",
    gem: "bg-[#f0e8ff] text-[#5b3ee8]",
    coin: "bg-[#ffe8c8] text-[#9a5a00]",
  };

  return (
    <div className={`rounded-2xl px-2 py-3 ${tones[tone]}`}>
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
        {icon}
      </div>
      <p className="font-display text-[18px] leading-none font-bold">{value}</p>
      <p className="mt-1 text-[10px] font-bold tracking-wide uppercase opacity-70">
        {label}
      </p>
    </div>
  );
}
