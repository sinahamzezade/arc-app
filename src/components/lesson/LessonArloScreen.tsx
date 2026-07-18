"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { assets } from "@/lib/assets";
import { sanitizeArloReply } from "@/lib/lesson/arlo-reply";
import { lessonsApi } from "@/lib/api/lessons";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import { isArloVisibleForLessonType } from "@/lib/lesson/arlo-visibility";
import { LessonLoadState } from "./LessonLoadState";

type ChatMsg = { role: "user" | "arlo"; text: string };

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

function openingLine(title: string) {
  return `I'm locked on “${title}”. Ask for a recap, a hint, or a mini quiz.`;
}

function chipClass() {
  return "rounded-2xl border-2 border-[#0f1220]/12 bg-white px-3 py-2 text-left text-[13px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/35 disabled:opacity-60";
}

export default function LessonArloScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { flags, isLoading: flagsLoading } = useSystemFlags();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const arloAllowed =
    !flagsLoading &&
    !isLoading &&
    Boolean(lesson) &&
    isArloVisibleForLessonType(flags, lesson?.lessonType);

  useEffect(() => {
    if (flagsLoading || isLoading) return;
    if (!lesson || !isArloVisibleForLessonType(flags, lesson.lessonType)) {
      router.replace(`/learn/${lessonId}`);
    }
  }, [flags, flagsLoading, isLoading, lesson, lessonId, router]);

  const scrollEnd = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollEnd();
  }, [msgs, sending, scrollEnd]);

  const resizeComposer = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "48px";
    const next = Math.min(Math.max(el.scrollHeight, 48), 120);
    el.style.height = `${next}px`;
  };

  if (flagsLoading || isLoading) {
    return <ArloBootShell message="Loading Arlo…" />;
  }

  if (isError || !lesson) {
    return (
      <LessonLoadState
        message={error?.message ?? "No lesson loaded."}
        onRetry={isError ? () => refetch() : undefined}
      />
    );
  }

  if (!arloAllowed) {
    return <ArloBootShell message="Loading Arlo…" />;
  }

  const thread =
    msgs.length > 0
      ? msgs
      : [{ role: "arlo" as const, text: openingLine(lesson.title) }];

  const showSuggestions = msgs.length === 0 && !sending;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const base =
      msgs.length > 0
        ? msgs
        : [{ role: "arlo" as const, text: openingLine(lesson.title) }];

    setMsgs([...base, { role: "user", text: trimmed }]);
    setInput("");
    setErrorMsg(null);
    if (inputRef.current) {
      inputRef.current.style.height = "48px";
    }
    setSending(true);
    try {
      const res = await lessonsApi.arloChat(
        lessonId,
        trimmed,
        session?.accessToken,
      );
      const reply = sanitizeArloReply(res.reply);
      setMsgs((prev) => [
        ...prev,
        {
          role: "arlo",
          text: reply || `Hmm, lost my train of thought — ask me again.`,
        },
      ]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          role: "arlo",
          text: `Couldn't reach coach just now — keep going on “${lesson.title}”.`,
        },
      ]);
      setErrorMsg("Coach briefly offline. Try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
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
          <BackButton tone="dark" onClick={() => router.back()} />
          <span className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-arc-lavender-500">
            <GraduationCap
              className="h-3.5 w-3.5 text-[#ffc928]"
              strokeWidth={2.5}
            />
            Lesson coach
          </span>
        </div>

        <div className="relative mt-4 flex items-start gap-3">
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-black tracking-[0.18em] text-[#ffc928] uppercase">
              Ask Arlo
            </p>
            <h1 className="mt-1 font-display text-[24px] leading-[0.95] font-bold tracking-[-0.04em] text-balance">
              {lesson.title}
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
              src={sending ? assets.arlo.thinking : assets.arlo.wand}
              alt=""
              fill
              priority
              className="object-contain"
              sizes="64px"
            />
          </motion.div>
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-white/35 uppercase">
              <Sparkles
                className="h-3.5 w-3.5 text-[#ffc928]"
                strokeWidth={2.5}
              />
              Focus
            </span>
            <span className="font-display text-[13px] font-bold tracking-[-0.02em] text-white/55">
              Locked on
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
            <motion.div
              className="h-full rounded-full bg-[#ffc928]"
              initial={{ width: "18%" }}
              animate={{ width: sending ? "72%" : "100%" }}
              transition={softSpring}
            />
          </div>
        </div>
      </header>

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
          <AnimatePresence initial={false}>
            {thread.map((msg, i) => {
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
                    dir="auto"
                    className={
                      isUser
                        ? "max-w-[85%] rounded-[20px] rounded-br-md bg-arc-purple-500 px-3.5 py-2.5 text-[14px] leading-snug font-bold text-white shadow-[0_3px_0_#4b2fd6]"
                        : "max-w-[88%] rounded-[20px] rounded-bl-md border border-[#ebe4f6] bg-white px-3.5 py-2.5 text-[14px] leading-snug font-bold text-[#0f1220] shadow-[0_4px_0_#ebe4f6]"
                    }
                  >
                    {msg.text}
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

          {showSuggestions && lesson.suggestedArlo.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={softSpring}
              className="mr-2 ml-10 space-y-2.5"
            >
              <p className="text-[10px] font-black tracking-[0.14em] text-arc-lavender-600 uppercase">
                Try one
              </p>
              <div className="flex flex-wrap gap-2">
                {lesson.suggestedArlo.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={sending}
                    onClick={() => void send(prompt)}
                    className={chipClass()}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <div className="relative shrink-0 border-t border-[#ebe4f6]/90 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-sm">
          {errorMsg ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-center text-[12px] font-bold text-red-500"
            >
              {errorMsg}
            </motion.p>
          ) : null}

          <form
            className="flex items-center gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              dir="auto"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                resizeComposer();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask about this lesson…"
              disabled={sending}
              className="box-border h-12 max-h-[120px] min-h-12 w-full min-w-0 flex-1 resize-none rounded-2xl border-2 border-[#0f1220]/10 bg-white px-3.5 py-[13px] text-[14px] leading-none font-bold text-[#0f1220] outline-none transition-[border-color] placeholder:text-arc-lavender-500 focus:border-[#0f1220] disabled:opacity-60"
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.92 }}
              disabled={sending || !input.trim()}
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
        </div>
      </div>
    </div>
  );
}

function ArloBootShell({ message }: { message: string }) {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      <header className="relative shrink-0 overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-10 text-white">
        <div className="relative flex items-center gap-3">
          <BackButton tone="dark" />
        </div>
        <p className="relative mt-6 text-[10px] font-black tracking-[0.18em] text-[#ffc928] uppercase">
          Ask Arlo
        </p>
        <p className="relative mt-2 font-display text-[24px] font-bold tracking-[-0.04em]">
          {message}
        </p>
      </header>
      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-arc-xl bg-[#f3effc] px-4 pt-8 shadow-[0_-12px_40px_rgba(15,18,32,0.18)]">
        <div className="flex items-end gap-2.5">
          <span className="h-8 w-8 shrink-0 rounded-2xl bg-[#0f1220]/10" />
          <div className="h-14 w-[68%] animate-pulse rounded-[20px] rounded-bl-md bg-white shadow-[0_4px_0_#ebe4f6]" />
        </div>
      </div>
    </div>
  );
}
