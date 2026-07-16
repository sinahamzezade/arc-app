"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import {
  Clock,
  ListChecks,
  Map,
  MessageCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { assets } from "@/lib/assets";
import { questionnaireApi, type IntakeConfig } from "@/lib/api/questionnaire";
import { mapSchemaSteps } from "@/lib/questionnaire/steps";
import { useHydrateQuestionnaire } from "@/lib/questionnaire/api-sync";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";
import { isStepComplete } from "@/lib/questionnaire/format-answers";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

type IntakeMode = "form" | "chat";

/**
 * Questionnaire intro — mission brief that matches the intake story:
 * answer (form or chat) → edit → roadmap. Mode choice is explicit when chat is on.
 */
export default function QuestionnaireIntroScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fastTrack = searchParams.get("mode") === "fast_track";
  const reduceMotion = useReducedMotion();
  const { data: session } = useSession();
  const { loading, schema, error, retry } = useHydrateQuestionnaire();
  const answers = useQuestionnaireStore((s) => s.answers);
  const hydrated = useQuestionnaireStore((s) => s.hydrated);
  const steps = mapSchemaSteps(schema);
  const totalSteps = schema?.totalSteps ?? steps.length;
  const [intake, setIntake] = useState<IntakeConfig | null>(null);
  const [selectedMode, setSelectedMode] = useState<IntakeMode>("form");
  const [modeBusy, setModeBusy] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && error === "Sign in to continue") {
      router.replace("/login");
    }
  }, [loading, error, router]);

  // Doc 07 fast-track: prior answers pre-filled via hydrate; jump into form.
  useEffect(() => {
    if (!fastTrack || loading || !hydrated) return;
    router.replace("/questionnaire/1?mode=fast_track");
  }, [fastTrack, loading, hydrated, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await questionnaireApi.getIntakeConfig(
          session?.accessToken,
        );
        if (cancelled) return;
        setIntake(cfg);
        const chatOn = Boolean(cfg.chatEnabled);
        setSelectedMode(
          chatOn && cfg.effectiveMode === "chat" ? "chat" : "form",
        );
      } catch {
        if (!cancelled) {
          setIntake({
            chatEnabled: false,
            defaultMode: "form",
            userMode: null,
            effectiveMode: "form",
          });
          setSelectedMode("form");
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

  const formPath = resumeStep
    ? `/questionnaire/${resumeStep}`
    : hasProgress
      ? "/questionnaire/review"
      : "/questionnaire/1";

  const pickMode = async (mode: IntakeMode) => {
    if (modeBusy) return;
    if (mode === "chat" && !intake?.chatEnabled) {
      setModeError("Conversational intake is disabled");
      return;
    }
    if (mode === "form" && !schema) {
      if (error) retry();
      return;
    }
    setModeError(null);
    setModeBusy(true);
    try {
      await questionnaireApi.setIntakeMode(mode, session?.accessToken);
      if (mode === "chat") {
        router.push("/intake/chat");
      } else {
        router.push(formPath);
      }
    } catch (err) {
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
  const activeMode: IntakeMode =
    chatEnabled && selectedMode === "chat" ? "chat" : "form";

  const formReady = Boolean(schema) && !loading;
  const primaryLabel = modeBusy
    ? "Starting…"
    : activeMode === "chat"
      ? "Start chat intake"
      : error && !schema
        ? "Retry loading form"
        : !formReady
          ? "Loading form…"
          : hasProgress
            ? "Continue form"
            : "Let's chart your path";

  const primaryDisabled =
    modeBusy ||
    (activeMode === "form" && !error && !formReady);

  const statusLabel = modeBusy
    ? "Starting"
    : error
      ? "Error"
      : !formReady
        ? "Loading"
        : hasProgress
          ? "Resume"
          : "Ready";

  const expectItems = [
    {
      key: "answer",
      icon: chatEnabled ? MessageCircle : ListChecks,
      tone: "purple" as const,
      title: chatEnabled ? "Form or chat" : "Short form",
      body: chatEnabled
        ? "Same tokens, same roadmap — pick how you answer."
        : "Answer a few fields — we build your path from there.",
    },
    {
      key: "edit",
      icon: Pencil,
      tone: "ink" as const,
      title: "Edit anytime",
      body: "Change answers before we lock the roadmap.",
      highlight: true,
    },
    {
      key: "roadmap",
      icon: Map,
      tone: "gold" as const,
      title: "Get your roadmap",
      body: "We turn your answers into a clear next-step path.",
    },
  ];

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-14 text-white">
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

        <div className="relative mt-5 flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[34px] leading-[0.94] font-bold tracking-[-0.04em] text-balance">
              Let&apos;s shape
              <br />
              your future
            </h1>
            <p className="mt-2.5 max-w-[16.5rem] text-[13px] leading-snug font-semibold text-white/55">
              {chatEnabled
                ? "Form steps or a short chat — both feed the same roadmap engine."
                : "A short form feeds the roadmap engine — working adults, not homework."}
            </p>
          </div>

          <motion.div
            className="relative h-[104px] w-[104px] shrink-0"
            animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Image
              src={assets.arlo.waveHand}
              alt="Arlo waving"
              fill
              priority
              className="object-contain"
              sizes="104px"
            />
          </motion.div>
        </div>

        <motion.div
          className="relative mt-6 flex items-end justify-between gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <Clock
                className="h-4 w-4 text-[#ffc928]"
                strokeWidth={2.5}
                aria-hidden
              />
              <span className="text-[10px] font-black tracking-[0.14em] text-white/40 uppercase">
                Time needed
              </span>
            </div>
            <p className="mt-1 font-display text-[52px] leading-[0.85] font-bold tracking-[-0.06em] tabular-nums text-white">
              5–10
              <span className="ml-1.5 align-baseline font-display text-[20px] tracking-[-0.02em] text-[#ffc928]">
                min
              </span>
            </p>
          </div>

          <div className="mb-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
            {loading || !totalSteps ? (
              <div className="space-y-1.5" aria-hidden>
                <div className="h-2.5 w-14 animate-pulse rounded bg-white/15" />
                <div className="h-3.5 w-10 animate-pulse rounded bg-white/20" />
              </div>
            ) : (
              <>
                <p className="text-[9px] font-black tracking-[0.12em] text-white/40 uppercase">
                  Fields
                </p>
                <p className="font-display text-[22px] leading-none font-bold tabular-nums text-white">
                  {totalSteps}
                </p>
              </>
            )}
          </div>
        </motion.div>
      </section>

      <div className="relative z-10 -mt-7 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto rounded-t-[28px] bg-[#f3effc] px-4 pt-6">
          <p className="mb-3.5 text-[10px] font-black tracking-[0.14em] text-[#9b8ec4] uppercase">
            What to expect
          </p>

          <div className="relative">
            <div
              aria-hidden
              className="absolute top-4 bottom-4 left-[15px] w-px bg-[#ddd4f0]"
            />
            <ol className="space-y-3">
            {expectItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.key}
                  className="relative flex items-start gap-3.5"
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...softSpring, delay: 0.04 + index * 0.06 }}
                >
                  <span
                    className={cn(
                      "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      item.tone === "purple" &&
                        "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]",
                      item.tone === "ink" &&
                        "bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#05060c]",
                      item.tone === "gold" &&
                        "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c9a014]",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  </span>

                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-[18px] px-3.5 py-3",
                      item.highlight
                        ? "bg-[#0f1220] text-white shadow-[0_8px_20px_rgba(15,18,32,0.16)]"
                        : "bg-white/70 ring-1 ring-[#e4dcf5]",
                    )}
                  >
                    <p
                      className={cn(
                        "font-display text-[16px] leading-none font-bold tracking-[-0.02em]",
                        item.highlight ? "text-white" : "text-[#0f1220]",
                      )}
                    >
                      {item.title}
                    </p>
                    <p
                      className={cn(
                        "mt-1.5 text-[12.5px] leading-snug font-semibold",
                        item.highlight ? "text-white/50" : "text-[#7c6fa8]",
                      )}
                    >
                      {item.body}
                    </p>
                  </div>
                </motion.li>
              );
            })}
            </ol>
          </div>

          {chatEnabled ? (
            <div className="mt-6">
              <p className="mb-3 text-[10px] font-black tracking-[0.14em] text-[#9b8ec4] uppercase">
                How you&apos;ll answer
              </p>
              <div
                className="grid grid-cols-2 gap-2.5"
                role="radiogroup"
                aria-label="Intake mode"
              >
                {(
                  [
                    {
                      mode: "form" as const,
                      label: "Form",
                      hint: "Step by step",
                      Icon: ListChecks,
                    },
                    {
                      mode: "chat" as const,
                      label: "Chat",
                      hint: "Talk it through",
                      Icon: MessageCircle,
                    },
                  ] as const
                ).map(({ mode, label, hint, Icon }) => {
                  const selected = activeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={modeBusy}
                      onClick={() => setSelectedMode(mode)}
                      className={cn(
                        "cursor-pointer rounded-[18px] px-3.5 py-3.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3effc] disabled:cursor-not-allowed disabled:opacity-60",
                        selected
                          ? "bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]"
                          : "bg-white/80 text-[#0f1220] ring-1 ring-[#e4dcf5] hover:bg-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mb-2 h-4 w-4",
                          selected ? "text-[#ffc928]" : "text-arc-purple-500",
                        )}
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <p className="font-display text-[15px] leading-none font-bold">
                        {label}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[11px] font-semibold",
                          selected ? "text-white/70" : "text-[#8a7cb8]",
                        )}
                      >
                        {hint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="mt-5 mb-2 max-w-[20rem] text-[12px] leading-relaxed font-semibold text-[#9b8ec4]">
            {loading || !totalSteps ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-16 animate-pulse rounded bg-[#ddd4f0]"
                  aria-hidden
                />
                <span>fields in the schema. Working adults — not a homework trap.</span>
              </span>
            ) : (
              <>
                {totalSteps} fields in the schema. Working adults — not a
                homework trap.
              </>
            )}
          </p>
        </div>

        <div className="shrink-0 border-t border-[#ebe4f6]/80 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-[#ebe4f6]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={hasProgress ? 35 : loading ? 8 : 12}
              aria-label="Intake progress"
            >
              <motion.div
                className="h-full rounded-full bg-[#ffc928]"
                initial={false}
                animate={{ width: hasProgress ? "35%" : loading ? "8%" : "12%" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <span className="text-[11px] font-black tracking-wide text-[#7a6fa3] uppercase">
              {statusLabel}
            </span>
          </div>
          {(error && error !== "Sign in to continue") || modeError ? (
            <p className="mb-2 text-center text-[12px] font-bold text-red-500">
              {modeError || error}
            </p>
          ) : null}
          <motion.div whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
            <Button
              type="button"
              className={cn(authCtaClassName, "cursor-pointer")}
              isDisabled={primaryDisabled}
              onPress={() => void pickMode(activeMode)}
            >
              {primaryLabel}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
