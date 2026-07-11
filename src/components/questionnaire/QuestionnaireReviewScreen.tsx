"use client";

import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Pencil } from "lucide-react";
import { motion } from "motion/react";
import {
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui";
import { formatAnswerValue } from "@/lib/questionnaire/format-answers";
import { questionnaireSteps, reviewItems } from "@/lib/questionnaire/steps";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";

export default function QuestionnaireReviewScreen() {
  const router = useRouter();
  const { answers } = useQuestionnaireStore();

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-48 w-48 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-20px] h-28 w-28 rounded-full bg-[#ffc928]/18 blur-3xl"
        />

        <BackButton onClick={() => router.push("/questionnaire/10")} />

        <div className="relative mt-4">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
            Final check
          </p>
          <h1 className="mt-1.5 font-display text-[30px] leading-[0.95] font-bold tracking-[-0.03em]">
            Review your
            <br />
            answers
          </h1>
          <p className="mt-2.5 max-w-[20rem] text-[13px] leading-snug font-bold text-white/50">
            Edit anything before we build your roadmap.
          </p>
        </div>
      </section>

      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-[#f3effc]">
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pt-5 pb-4">
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
                  className="flex w-full items-start gap-3 rounded-[16px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3.5 text-left shadow-[0_3px_0_#ebe4f6]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-arc-purple-500/10 text-arc-purple-500">
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-black tracking-[0.1em] text-[#b3a8d6] uppercase">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug font-bold text-[#0f1220]">
                      {formatAnswerValue(item.key, answers) || "—"}
                    </span>
                  </span>
                  <Pencil
                    className="mt-1 h-4 w-4 shrink-0 text-arc-purple-500"
                    strokeWidth={2.5}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="shrink-0 space-y-2 border-t border-[#ebe4f6]/80 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-sm">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              className={authCtaClassName}
              onPress={() => {
                console.log("Generate roadmap", answers);
                router.push("/home");
              }}
            >
              Looks good — build roadmap
            </Button>
          </motion.div>
          <button
            type="button"
            className={`w-full py-2 text-center text-[13px] ${authGhostLinkClassName}`}
            onClick={() => router.push("/questionnaire/1")}
          >
            Edit from start
          </button>
        </div>
      </div>
    </div>
  );
}
