"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, MessageCircle, Pencil } from "lucide-react";
import {
  MotionBackButton,
  MotionReveal,
  MotionStagger,
  OnboardingPage,
} from "@/components/motion";
import { Button } from "@/components/ui";
import { assets } from "@/lib/assets";
import { mascotEnter } from "@/lib/motion/onboarding";
import { QUESTIONNAIRE_TOTAL_STEPS } from "@/lib/questionnaire/steps";

export default function QuestionnaireIntroScreen() {
  const router = useRouter();

  return (
    <OnboardingPage className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <MotionBackButton className="pt-4" onClick={() => router.back()} />

      <MotionStagger className="flex flex-1 flex-col">
        <MotionReveal custom={mascotEnter} className="mt-4 flex justify-center">
          <Image
            src={assets.arlo.waveHand}
            alt="Arlo waving"
            width={320}
            height={320}
            className="h-auto w-[320px] object-contain"
            priority
          />
        </MotionReveal>

        <MotionReveal className="mt-12 text-left">
          <h1 className="font-display text-arc-large-title font-bold text-arc-navy-900">
            Let&apos;s shape your future
          </h1>
          <p className="mt-3 text-arc-body leading-relaxed text-arc-navy-500 font-medium">
            Answer a few quick questions and I&apos;ll create a personalized
            plan just for you.
          </p>
        </MotionReveal>

        <MotionReveal className="mt-8 space-y-4">
          <IntroFeature icon={Clock} text="Takes about 5–10 minutes" />
          <IntroFeature icon={MessageCircle} text="Multiple choice & easy" />
          <IntroFeature icon={Pencil} text="You can edit answers anytime" />
        </MotionReveal>

        <div className="flex-1" />

        <MotionReveal className="pb-4">
          <p className="mb-2 text-center text-arc-caption font-semibold text-arc-navy-700">
            Step 1 of {QUESTIONNAIRE_TOTAL_STEPS}
          </p>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-arc-purple-100">
            <div className="h-full w-[10%] rounded-full bg-arc-purple-500" />
          </div>

          <Button
            type="button"
            className="mt-6 h-14 w-full rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
            onPress={() => router.push("/questionnaire/1")}
          >
            Start
          </Button>
        </MotionReveal>
      </MotionStagger>
    </OnboardingPage>
  );
}

function IntroFeature({
  icon: Icon,
  text,
}: {
  icon: typeof Clock;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-arc-sm border border-arc-purple-200 text-arc-purple-500">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="text-arc-body font-semibold text-arc-navy-900">
        {text}
      </span>
    </div>
  );
}
