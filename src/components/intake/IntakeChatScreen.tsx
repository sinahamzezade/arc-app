"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUp,
  ClipboardList,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { assets } from "@/lib/assets";
import {
  questionnaireApi,
  type IntakeChatSelection,
  type IntakeChatTurn,
  type IntakeSuggestions,
} from "@/lib/api/questionnaire";
import type { QuestionnaireSchema } from "@/lib/api/types";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { isStepComplete } from "@/lib/questionnaire/format-answers";
import { emptyQuestionnaireAnswers } from "@/schemas/questionnaire";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const FALLBACK_TOTAL_FIELDS = 10;

export default function IntakeChatScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [turn, setTurn] = useState<IntakeChatTurn | null>(null);
  const [schema, setSchema] = useState<QuestionnaireSchema | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [pickedTimes, setPickedTimes] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);

  const suggestions = turn?.suggestions ?? null;

  /** Goal step = chips only. Other fields keep free-text composer. */
  const chipPickRequired = Boolean(
    suggestions && !turn?.done && suggestions.fieldId === "goal",
  );

  useEffect(() => {
    setPicked([]);
    setPickedTimes([]);
    setOtherText("");
  }, [suggestions?.fieldId, suggestions?.selection]);

  const scrollEnd = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollEnd();
  }, [turn?.transcript, turn?.suggestions, sending, scrollEnd]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    if (started.current) return;
    started.current = true;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cfg, schemaRes] = await Promise.all([
          questionnaireApi.getIntakeConfig(session.accessToken),
          questionnaireApi.getSchema(session.accessToken),
        ]);
        if (cancelled) return;
        setSchema(schemaRes);
        if (!cfg.chatEnabled) {
          router.replace("/questionnaire");
          return;
        }
        const state = await questionnaireApi.chatState(session.accessToken);
        if (cancelled) return;
        if (state.transcript.length === 0) {
          const startedTurn = await questionnaireApi.chatStart(
            session.accessToken,
          );
          if (!cancelled) setTurn(startedTurn);
        } else {
          setTurn(state);
        }
      } catch (err) {
        if (cancelled) return;
        started.current = false;
        if (err instanceof ApiError) {
          const msg = messageForCode(err.code, err.message);
          if (/disabled|not enabled|conversational intake/i.test(msg)) {
            router.replace("/questionnaire");
            return;
          }
          setError(msg);
        } else {
          setError("Could not start chat intake");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, router]);

  const sendSelection = async (selection: IntakeChatSelection) => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const next = await questionnaireApi.chatMessage(
        "",
        session?.accessToken,
        selection,
      );
      setTurn(next);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(messageForCode(err.code, err.message));
      } else {
        setError("Could not apply selection");
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const send = async () => {
    const message = input.trim();
    if (!message || sending || chipPickRequired) return;
    setSending(true);
    setError(null);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "48px";
    }
    try {
      const next = await questionnaireApi.chatMessage(
        message,
        session?.accessToken,
      );
      setTurn(next);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(messageForCode(err.code, err.message));
      } else {
        setError("Could not send message");
      }
      setInput(message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  /** Echo compound-step routing back so the backend applies the right sub-question. */
  const selectionBase = (s: IntakeSuggestions) => ({
    fieldId: s.fieldId,
    ...(s.subField ? { subField: s.subField } : {}),
    ...(s.skillSlug ? { skillSlug: s.skillSlug } : {}),
  });

  const onSinglePick = (value: string) => {
    if (!suggestions || sending) return;
    if (value === "other" && suggestions.allowOther) {
      setPicked(["other"]);
      return;
    }
    void sendSelection({
      ...selectionBase(suggestions),
      values: [value],
    });
  };

  const toggleMulti = (value: string) => {
    setPicked((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const confirmMulti = () => {
    if (!suggestions || !picked.length || sending) return;
    void sendSelection({
      ...selectionBase(suggestions),
      values: picked,
      ...(picked.includes("other") && otherText.trim()
        ? { otherText: otherText.trim() }
        : {}),
    });
  };

  const confirmSchedule = () => {
    if (!suggestions || sending) return;
    if (!pickedTimes.length) return;
    void sendSelection({
      ...selectionBase(suggestions),
      values: pickedTimes,
      times: pickedTimes,
    });
  };

  const confirmOtherSingle = () => {
    if (!suggestions || !otherText.trim() || sending) return;
    void sendSelection({
      ...selectionBase(suggestions),
      values: ["other"],
      otherText: otherText.trim(),
    });
  };

  /** Chat answers → store → shared Review screen (single submit path). */
  const goReview = () => {
    const chatAnswers = turn?.answers ?? {};
    if (schema) {
      // Atomic write, mirrors api-sync hydrate — keeps store fresh for review.
      useQuestionnaireStore.setState({
        schema,
        answers: {
          ...emptyQuestionnaireAnswers(schema.steps),
          ...chatAnswers,
        },
        hydrated: true,
      });
    } else {
      // No schema loaded — force review screen to re-hydrate from backend.
      useQuestionnaireStore.getState().reset();
    }
    router.push("/questionnaire/review");
  };

  const switchToForm = async () => {
    try {
      await questionnaireApi.setIntakeMode("form", session?.accessToken);
    } catch {
      /* still navigate */
    }
    // Chat wrote answers server-side; drop any stale store snapshot so the
    // form flow re-hydrates instead of showing pre-chat answers.
    useQuestionnaireStore.getState().reset();
    // Skip intro — admin default may still be chat and would bounce back.
    router.push("/questionnaire/1");
  };

  const totalFields = schema?.totalSteps ?? FALLBACK_TOTAL_FIELDS;
  const filled = (() => {
    if (!turn) return 0;
    if (schema) {
      return schema.steps.filter((step) =>
        isStepComplete(step.id, turn.answers ?? {}, schema),
      ).length;
    }
    return Math.max(0, totalFields - turn.missingFields.length);
  })();
  const progressPct = Math.min(
    100,
    Math.round((filled / Math.max(1, totalFields)) * 100),
  );
  const leftCount = turn ? Math.max(0, totalFields - filled) : null;

  const resizeComposer = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "48px";
    const next = Math.min(Math.max(el.scrollHeight, 48), 120);
    el.style.height = `${next}px`;
  };

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      {/* Night stage — compact, overlaps sheet */}
      <header className="relative shrink-0 overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-48px] h-52 w-52 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-36px] h-32 w-32 rounded-full bg-[#ffc928]/16 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 28%, #fff, transparent), radial-gradient(1px 1px at 78% 18%, #fff, transparent), radial-gradient(1.5px 1px at 52% 78%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <button
            type="button"
            onClick={() => void switchToForm()}
            className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-[#b3a8d6] transition-colors hover:text-[#ffc928]"
          >
            <ClipboardList className="h-3.5 w-3.5" strokeWidth={2.5} />
            Switch to form intake
          </button>
        </div>

        <div className="relative mt-4 flex items-start gap-3">
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-black tracking-[0.18em] text-[#ffc928] uppercase">
              Live interview
            </p>
            <h1 className="mt-1 font-display text-[26px] leading-[0.95] font-bold tracking-[-0.04em]">
              Talk it through
            </h1>
          </div>
          <motion.div
            className="relative -mr-1 -mt-1 h-[64px] w-[64px] shrink-0"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src={
                turn?.done
                  ? assets.arlo.thumbsUp
                  : sending
                    ? assets.arlo.thinking
                    : assets.arlo.waveHand
              }
              alt=""
              fill
              priority
              className="object-contain"
              sizes="64px"
            />
          </motion.div>
        </div>

        {/* Asymmetric progress: ticks left, label right */}
        <div className="relative mt-5 flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-white/35 uppercase">
                <MessageCircle
                  className="h-3.5 w-3.5 text-[#ffc928]"
                  strokeWidth={2.5}
                />
                Tokens
              </span>
              <span className="font-display text-[13px] font-bold tracking-[-0.02em] text-white/55">
                {turn?.done
                  ? "Locked in"
                  : leftCount === null
                    ? "…"
                    : `${leftCount} left`}
              </span>
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: totalFields }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < filled
                      ? "bg-[#ffc928]"
                      : turn?.done
                        ? "bg-[#ffc928]/40"
                        : "bg-white/12"
                  }`}
                  initial={false}
                  animate={{
                    scaleY: i < filled ? 1 : 0.7,
                    opacity: i < filled ? 1 : 0.55,
                  }}
                  transition={{ ...softSpring, delay: i * 0.02 }}
                />
              ))}
            </div>
          </div>
          <div className="relative shrink-0 text-right">
            <p className="font-display text-[42px] leading-none font-bold tracking-[-0.06em] text-white">
              {progressPct}
              <span className="ml-0.5 text-[16px] text-[#ffc928]">%</span>
            </p>
          </div>
        </div>
      </header>

      {/* Sheet pulls up over navy */}
      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-arc-xl bg-[#f3effc] shadow-[0_-12px_40px_rgba(15,18,32,0.18)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 0%, #d8ccff55, transparent), radial-gradient(ellipse 50% 40% at 90% 10%, #ffc92822, transparent)",
          }}
        />

        <div className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-6 pb-3">
          {loading && !turn ? (
            <div className="space-y-3 pr-10">
              <SkeletonBubble wide />
              <SkeletonBubble />
              <p className="pl-1 text-[12px] font-bold text-arc-lavender-600">
                Arlo warming up the interview…
              </p>
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {(turn?.transcript ?? []).map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={`${msg.role}-${i}`}
                  initial={{ opacity: 0, y: 14, x: isUser ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ ...softSpring, delay: Math.min(i * 0.03, 0.2) }}
                  className={
                    isUser
                      ? "ml-10 flex justify-end"
                      : "mr-8 flex items-end gap-2.5"
                  }
                >
                  {!isUser ? (
                    <span className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#05060c]">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                  ) : null}
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] rounded-[20px] rounded-br-md bg-arc-purple-500 px-3.5 py-2.5 text-[14px] leading-snug font-bold text-white shadow-[0_3px_0_#4b2fd6]"
                        : "max-w-[88%] rounded-[20px] rounded-bl-md border border-[#ebe4f6] bg-white px-3.5 py-2.5 text-[14px] leading-snug font-bold text-[#0f1220] shadow-[0_4px_0_#ebe4f6]"
                    }
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sending ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mr-8 flex items-end gap-2.5"
            >
              <span className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#05060c]">
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  strokeWidth={2.5}
                />
              </span>
              <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-md border border-[#ebe4f6] bg-white px-4 py-3 shadow-[0_4px_0_#ebe4f6]">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:240ms]" />
              </div>
            </motion.div>
          ) : null}

          {!sending && suggestions && !turn?.done ? (
            <SuggestionChips
              suggestions={suggestions}
              picked={picked}
              pickedTimes={pickedTimes}
              otherText={otherText}
              disabled={sending}
              onSingle={onSinglePick}
              onToggleMulti={toggleMulti}
              onToggleTime={(t) =>
                setPickedTimes((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                )
              }
              onOtherText={setOtherText}
              onConfirmMulti={confirmMulti}
              onConfirmSchedule={confirmSchedule}
              onConfirmOther={confirmOtherSingle}
            />
          ) : null}

          <div ref={bottomRef} />
        </div>

        {/* Composer dock */}
        <div className="relative shrink-0 border-t border-[#ebe4f6]/90 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-sm">
          {error ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-center text-[12px] font-bold text-red-500"
            >
              {error}
            </motion.p>
          ) : null}

          {turn?.done ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={softSpring}
              className="space-y-3"
            >
              <div className="relative overflow-hidden rounded-[20px] bg-[#0f1220] px-4 py-3.5 text-white shadow-[0_8px_24px_rgba(15,18,32,0.2)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#ffc928]/20 blur-2xl"
                />
                <p className="text-[10px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
                  Interview complete
                </p>
                <p className="mt-1 font-display text-[20px] leading-tight font-bold tracking-[-0.03em]">
                  Ready to review your answers
                </p>
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  className={authCtaClassName}
                  onPress={goReview}
                >
                  Review &amp; build roadmap
                </Button>
              </motion.div>
            </motion.div>
          ) : chipPickRequired ? (
            <p className="rounded-2xl border-2 border-dashed border-[#d8d0ea] bg-white/70 px-3.5 py-3 text-center text-[13px] font-bold text-arc-lavender-600">
              {suggestions?.selection === "multi"
                ? "Pick one or more career paths above, then confirm"
                : "Tap a career path above to continue"}
            </p>
          ) : (
            <form
              className="flex items-center gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  resizeComposer();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Your answer…"
                disabled={sending || loading}
                className="box-border h-12 max-h-[120px] min-h-12 w-full min-w-0 flex-1 resize-none rounded-2xl border-2 border-[#0f1220]/10 bg-white px-3.5 py-[13px] text-[14px] leading-none font-bold text-[#0f1220] outline-none transition-[border-color] placeholder:text-arc-lavender-500 focus:border-[#0f1220] disabled:opacity-60"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.92 }}
                disabled={sending || loading || !input.trim()}
                aria-label="Send"
                className="box-border flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#0f1220] bg-[#0f1220] text-[#ffc928] transition-opacity disabled:opacity-35"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                )}
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonBubble({ wide }: { wide?: boolean }) {
  return (
    <div className="flex items-end gap-2.5">
      <span className="h-8 w-8 shrink-0 rounded-2xl bg-[#0f1220]/10" />
      <div
        className={`h-14 animate-pulse rounded-[20px] rounded-bl-md bg-white shadow-[0_4px_0_#ebe4f6] ${
          wide ? "w-[78%]" : "w-[58%]"
        }`}
      />
    </div>
  );
}

function chipClass(active: boolean) {
  return active
    ? "rounded-2xl border-2 border-[#0f1220] bg-[#0f1220] px-3 py-2 text-left text-[13px] font-bold text-[#ffc928] shadow-[0_3px_0_#05060c]"
    : "rounded-2xl border-2 border-[#0f1220]/12 bg-white px-3 py-2 text-left text-[13px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/35";
}

function SuggestionChips({
  suggestions,
  picked,
  pickedTimes,
  otherText,
  disabled,
  onSingle,
  onToggleMulti,
  onToggleTime,
  onOtherText,
  onConfirmMulti,
  onConfirmSchedule,
  onConfirmOther,
}: {
  suggestions: IntakeSuggestions;
  picked: string[];
  pickedTimes: string[];
  otherText: string;
  disabled: boolean;
  onSingle: (value: string) => void;
  onToggleMulti: (value: string) => void;
  onToggleTime: (time: string) => void;
  onOtherText: (text: string) => void;
  onConfirmMulti: () => void;
  onConfirmSchedule: () => void;
  onConfirmOther: () => void;
}) {
  const showOtherInput =
    suggestions.allowOther &&
    (suggestions.selection === "single"
      ? picked.includes("other")
      : picked.includes("other"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
      className="mr-2 ml-10 space-y-2.5"
    >
      <p className="text-[10px] font-black tracking-[0.14em] text-arc-lavender-600 uppercase">
        {suggestions.fieldId === "skills"
          ? "Related to your path"
          : suggestions.selection === "multi"
            ? "Select all that apply"
            : suggestions.selection === "schedule"
              ? "Pick times"
              : "Tap one to answer"}
      </p>

      {suggestions.selection === "schedule" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(suggestions.times ?? []).map((t) => (
              <button
                key={t.value}
                type="button"
                disabled={disabled}
                onClick={() => onToggleTime(t.value)}
                className={chipClass(pickedTimes.includes(t.value))}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={disabled || !pickedTimes.length}
            onClick={onConfirmSchedule}
            className="rounded-2xl bg-arc-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_3px_0_#4b2fd6] disabled:opacity-40"
          >
            Confirm times
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {suggestions.options
              .filter((opt) => suggestions.allowOther || opt.value !== "other")
              .map((opt) => {
              const active = picked.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    suggestions.selection === "single"
                      ? onSingle(opt.value)
                      : onToggleMulti(opt.value)
                  }
                  className={chipClass(
                    suggestions.selection === "multi" ? active : false,
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {showOtherInput ? (
            <div className="flex gap-2">
              <input
                value={otherText}
                onChange={(e) => onOtherText(e.target.value)}
                placeholder="Describe other…"
                disabled={disabled}
                className="min-w-0 flex-1 rounded-2xl border-2 border-[#0f1220]/12 bg-white px-3 py-2 text-[13px] font-bold text-[#0f1220] outline-none focus:border-[#0f1220]"
              />
              {suggestions.selection === "single" ? (
                <button
                  type="button"
                  disabled={disabled || !otherText.trim()}
                  onClick={onConfirmOther}
                  className="shrink-0 rounded-2xl bg-arc-purple-500 px-3 py-2 text-[13px] font-bold text-white disabled:opacity-40"
                >
                  Send
                </button>
              ) : null}
            </div>
          ) : null}

          {suggestions.selection === "multi" ? (
            <button
              type="button"
              disabled={
                disabled ||
                !picked.length ||
                (picked.includes("other") && !otherText.trim())
              }
              onClick={onConfirmMulti}
              className="rounded-2xl bg-arc-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_3px_0_#4b2fd6] disabled:opacity-40"
            >
              Confirm selection
            </button>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
