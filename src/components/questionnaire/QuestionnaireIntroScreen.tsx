"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { Clock, MessageCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { assets } from "@/lib/assets";
import { questionnaireApi, type IntakeConfig } from "@/lib/api/questionnaire";
import { mapSchemaSteps } from "@/lib/questionnaire/steps";
import { useHydrateQuestionnaire } from "@/lib/questionnaire/api-sync";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";
import { isStepComplete } from "@/lib/questionnaire/format-answers";
import { ApiError, messageForCode } from "@/lib/api/errors";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Questionnaire intro — editorial mission brief.
 * Form vs chat CTAs when conversational intake enabled.
 */
export default function QuestionnaireIntroScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const { loading, schema, error } = useHydrateQuestionnaire();
  const answers = useQuestionnaireStore((s) => s.answers);
  const hydrated = useQuestionnaireStore((s) => s.hydrated);
  const steps = mapSchemaSteps(schema);
  const totalSteps = schema?.totalSteps ?? steps.length;
  const [intake, setIntake] = useState<IntakeConfig | null>(null);
  const [modeBusy, setModeBusy] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && error === "Sign in to continue") {
      router.replace("/login");
    }
  }, [loading, error, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await questionnaireApi.getIntakeConfig(
          session?.accessToken,
        );
        if (!cancelled) setIntake(cfg);
      } catch {
        if (!cancelled) {
          setIntake({
            chatEnabled: false,
            defaultMode: "form",
            userMode: null,
            effectiveMode: "form",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const resumeStep =
    hydrated &&
    steps.find((step) => !isStepComplete(step.id, answers, schema))?.stepNumber;

  const hasProgress =
    hydrated && steps.some((step) => isStepComplete(step.id, answers, schema));

  const formCtaLabel = hasProgress ? "Continue form" : "Form intake";
  const formPath = resumeStep
    ? `/questionnaire/${resumeStep}`
    : hasProgress
      ? "/questionnaire/review"
      : "/questionnaire/1";

  const pickMode = async (mode: "form" | "chat") => {
    if (modeBusy) return;
    if (mode === "form" && (loading || !schema)) return;
    setModeError(null);
    setModeBusy(true);
    try {
      // Persist preference (soft); navigation should not wait on schema hydrate.
      await questionnaireApi.setIntakeMode(mode, session?.accessToken);
      if (mode === "chat") {
        router.push("/intake/chat");
      } else {
        router.push(formPath);
      }
    } catch (err) {
      if (mode === "chat") {
        // Prefer entering chat even if preference write fails (e.g. column lag).
        router.push("/intake/chat");
        return;
      }
      if (err instanceof ApiError) {
        setModeError(messageForCode(err.code, err.message));
      } else {
        setModeError("Could not set intake mode");
      }
    } finally {
      setModeBusy(false);
    }
  };

  const chatEnabled = Boolean(intake?.chatEnabled);

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-40px] h-56 w-56 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 left-[-28px] h-36 w-36 rounded-full bg-[#ffc928]/18 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 48% 70%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <p className="text-[10px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
            Mission brief
          </p>
        </div>

        <div className="relative mt-6 flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[36px] leading-[0.92] font-bold tracking-[-0.04em]">
              Let&apos;s shape
              <br />
              your future
            </h1>
            <p className="mt-3 max-w-[16rem] text-[13px] leading-snug font-bold text-white/50">
              Form steps or a short chat — both feed the same roadmap engine.
            </p>
          </div>

          <motion.div
            className="relative h-[108px] w-[108px] shrink-0"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src={assets.arlo.waveHand}
              alt="Arlo waving"
              fill
              priority
              className="object-contain"
              sizes="108px"
            />
          </motion.div>
        </div>

        <motion.div
          className="relative mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
        >
          <div className="flex items-baseline gap-2">
            <Clock
              className="mb-1 h-5 w-5 text-[#ffc928]"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-[10px] font-black tracking-[0.14em] text-white/40 uppercase">
              Time needed
            </span>
          </div>
          <p className="mt-1 font-display text-[64px] leading-[0.85] font-bold tracking-[-0.06em] text-white">
            5–10
            <span className="ml-2 align-baseline font-display text-[22px] tracking-[-0.02em] text-[#ffc928]">
              min
            </span>
          </p>
        </motion.div>
      </section>

      <div className="relative z-10 -mt-8 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto rounded-t-[28px] bg-[#f3effc] px-4 pt-7">
          <p className="mb-4 text-[10px] font-black tracking-[0.14em] text-[#b3a8d6] uppercase">
            What to expect
          </p>

          <div className="relative">
            <div
              aria-hidden
              className="absolute top-3 bottom-3 left-[15px] w-px bg-[#d8d0ea]"
            />

            <ul className="space-y-5">
              <motion.li
                className="relative flex items-start gap-4 pl-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...softSpring, delay: 0.05 }}
              >
                <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]">
                  <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-display text-[20px] leading-none font-bold tracking-[-0.03em] text-[#0f1220]">
                    Form or chat
                  </p>
                  <p className="mt-1.5 text-[13px] font-bold text-[#8a7cb8]">
                    Same tokens, same roadmap — pick how you answer.
                  </p>
                </div>
              </motion.li>

              <motion.li
                className="relative ml-4 flex items-start gap-4"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...softSpring, delay: 0.12 }}
              >
                <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#05060c]">
                  <Pencil className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 rounded-[16px] bg-[#0f1220] px-3.5 py-3 text-white shadow-[0_8px_20px_rgba(15,18,32,0.18)]">
                  <p className="font-display text-[17px] leading-none font-bold tracking-[-0.02em]">
                    Edit anytime
                  </p>
                  <p className="mt-1.5 text-[12px] font-bold text-white/45">
                    Change answers before we lock the roadmap.
                  </p>
                </div>
              </motion.li>
            </ul>
          </div>

          <p className="mt-8 max-w-[18rem] text-[12px] leading-relaxed font-bold text-[#b3a8d6]">
            {totalSteps || "…"} fields in the schema. Working adults —
            not a homework trap.
          </p>
        </div>

        <div className="shrink-0 border-t border-[#ebe4f6]/80 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ebe4f6]">
              <div className="h-full w-[6%] rounded-full bg-[#ffc928]" />
            </div>
            <span className="text-[11px] font-black tracking-wide text-[#7a6fa3] uppercase">
              {modeBusy
                ? "Starting"
                : error
                  ? "Error"
                  : chatEnabled
                    ? "Ready"
                    : loading
                      ? "Loading"
                      : hasProgress
                        ? "Resume"
                        : "Ready"}
            </span>
          </div>
          {(error && error !== "Sign in to continue") || modeError ? (
            <p className="mb-2 text-center text-[12px] font-bold text-red-500">
              {modeError || error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {chatEnabled ? (
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  className={authCtaClassName}
                  isDisabled={modeBusy}
                  onPress={() => void pickMode("chat")}
                >
                  {modeBusy ? "Starting…" : "Chat intake"}
                </Button>
              </motion.div>
            ) : null}
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                className={
                  chatEnabled
                    ? "h-12 w-full rounded-2xl border-2 border-[#0f1220] bg-white text-[15px] font-black text-[#0f1220]"
                    : authCtaClassName
                }
                isDisabled={loading || !schema || modeBusy}
                onPress={() => void pickMode("form")}
              >
                {loading ? "Loading form…" : formCtaLabel}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
