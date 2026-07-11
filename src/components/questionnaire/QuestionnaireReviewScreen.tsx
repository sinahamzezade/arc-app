"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  MotionBackButton,
  MotionReveal,
  MotionStagger,
  OnboardingPage,
} from "@/components/motion";
import { Button } from "@/components/ui";
import { formatAnswerValue } from "@/lib/questionnaire/format-answers";
import { questionnaireSteps, reviewItems } from "@/lib/questionnaire/steps";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";

export default function QuestionnaireReviewScreen() {
  const router = useRouter();
  const { answers } = useQuestionnaireStore();

  return (
    <OnboardingPage className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <MotionBackButton
        className="pt-4"
        onClick={() => router.push("/questionnaire/10")}
      />

      <MotionStagger className="flex min-h-0 flex-1 flex-col">
        <MotionReveal className="mt-2 text-center">
          <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
            Review Your Answers
          </h1>
          <p className="mt-2 text-arc-body text-arc-navy-500">
            You can edit any answer before we build your personalized roadmap.
          </p>
        </MotionReveal>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
          <ul className="divide-y divide-arc-navy-100">
            {reviewItems.map((item) => {
              const Icon = item.icon;
              const stepNumber =
                questionnaireSteps.find((s) => s.id === item.key)?.stepNumber ??
                1;

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => router.push(`/questionnaire/${stepNumber}`)}
                    className="flex w-full items-start gap-3 py-4 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-arc-sm bg-arc-purple-100 text-arc-purple-600">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-arc-body font-bold text-arc-navy-900">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-arc-caption leading-snug text-arc-navy-500">
                        {formatAnswerValue(item.key, answers) || "—"}
                      </span>
                    </span>
                    <Pencil
                      className="mt-1 h-4 w-4 shrink-0 text-arc-purple-500"
                      strokeWidth={2}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <MotionReveal className="shrink-0 space-y-3 pb-4 pt-4">
          <Button
            type="button"
            className="mt-6 h-14 w-full rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
            onPress={() => {
              console.log("Generate roadmap", answers);
              router.push("/home");
            }}
          >
            Looks Good, Generate Roadmap
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full font-bold text-arc-purple-500"
            onPress={() => router.push("/questionnaire/1")}
          >
            Edit Answers
          </Button>
        </MotionReveal>
      </MotionStagger>
    </OnboardingPage>
  );
}
