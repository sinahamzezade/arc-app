"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { assets } from "@/lib/assets";
import { sanitizeArloReply } from "@/lib/lesson/arlo-reply";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import {
  detectTextDirection,
  textDirectionClass,
} from "@/lib/text-direction";
import { cn } from "@/lib/utils";
import { lessonsApi } from "@/lib/api/lessons";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";

type ChatMsg = { role: "user" | "arlo"; text: string };

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

function openingLine(title: string) {
  return `I'm locked on “${title}”. Ask for a recap, a hint, or a mini quiz.`;
}

function chipClass() {
  return "rounded-2xl border-2 border-[#0f1220]/12 bg-white px-3 py-2 text-left text-[13px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/35 disabled:opacity-60";
}

/**
 * Ask Arlo bottom sheet — slides up from bottom, ~72dvh (not full screen).
 */
export function LessonArloSheet({
  open,
  onClose,
  lessonId,
  lessonTitle: lessonTitleProp,
}: {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  /** When parent already has the title, avoids waiting on play map for chrome. */
  lessonTitle?: string;
}) {
  const titleId = useId();
  const { data: session } = useSession();
  const { lesson, isLoading } = usePlayableLesson(lessonId);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollEnd = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollEnd();
  }, [msgs, sending, open, scrollEnd]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const resizeComposer = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "48px";
    const next = Math.min(Math.max(el.scrollHeight, 48), 120);
    el.style.height = `${next}px`;
  };

  const lessonTitle = lessonTitleProp ?? lesson?.title ?? "this lesson";

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || !lesson) return;

    const base =
      msgs.length > 0
        ? msgs
        : [{ role: "arlo" as const, text: openingLine(lessonTitle) }];

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
          text: `Couldn't reach coach just now — keep going on “${lessonTitle}”.`,
        },
      ]);
      setErrorMsg("Coach briefly offline. Try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const thread =
    msgs.length > 0
      ? msgs
      : lesson || lessonTitleProp
        ? [{ role: "arlo" as const, text: openingLine(lessonTitle) }]
        : [];

  const showSuggestions =
    Boolean(lesson) &&
    msgs.length === 0 &&
    !sending &&
    (lesson?.suggestedArlo.length ?? 0) > 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="arlo-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col justify-end bg-[#0f1220]/45"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={softSpring}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[min(78dvh,680px)] max-h-[78dvh] flex-col overflow-hidden rounded-t-[28px] bg-[#f3effc] font-rounded shadow-[0_-16px_48px_rgba(15,18,32,0.28)]"
          >
            <span
              aria-hidden
              className="absolute top-2 left-1/2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-[#d9d0ef]"
            />

            <div className="relative shrink-0 overflow-hidden bg-[#0f1220] px-4 pt-6 pb-4 text-white">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 right-[-36px] h-40 w-40 rounded-full bg-arc-purple-500/35 blur-3xl"
              />
              <div className="relative flex items-start gap-3">
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[10px] font-black tracking-[0.18em] text-[#ffc928] uppercase">
                    Ask Arlo
                  </p>
                  <h2
                    id={titleId}
                    className="mt-1 font-display text-[20px] leading-tight font-bold tracking-[-0.03em] text-balance"
                  >
                    {isLoading ? "Loading…" : lessonTitle}
                  </h2>
                </div>
                <motion.div
                  className="relative h-12 w-12 shrink-0"
                  animate={{ y: [0, -3, 0] }}
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
                    className="object-contain"
                    sizes="48px"
                  />
                </motion.div>
                <button
                  type="button"
                  aria-label="Close Ask Arlo"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/16"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-4 pb-3">
              {isLoading ? (
                <div className="flex items-end gap-2.5">
                  <span className="h-8 w-8 shrink-0 rounded-2xl bg-[#0f1220]/10" />
                  <div className="h-14 w-[68%] animate-pulse rounded-[20px] rounded-bl-md bg-white shadow-[0_4px_0_#ebe4f6]" />
                </div>
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    {thread.map((msg, i) => {
                      const isUser = msg.role === "user";
                      const textDir = detectTextDirection(msg.text);
                      return (
                        <motion.div
                          key={`${msg.role}-${i}`}
                          initial={{ opacity: 0, y: 14, x: isUser ? 10 : -10 }}
                          animate={{ opacity: 1, y: 0, x: 0 }}
                          transition={{
                            ...softSpring,
                            delay: Math.min(i * 0.03, 0.2),
                          }}
                          className={
                            isUser
                              ? "ml-10 flex justify-end"
                              : "mr-8 flex items-end gap-2.5"
                          }
                        >
                          {!isUser ? (
                            <span className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#05060c]">
                              <Sparkles
                                className="h-3.5 w-3.5"
                                strokeWidth={2.5}
                              />
                            </span>
                          ) : null}
                          <div
                            dir={textDir}
                            className={cn(
                              textDirectionClass(textDir),
                              isUser
                                ? "max-w-[85%] rounded-[20px] rounded-br-md bg-arc-purple-500 px-3.5 py-2.5 text-[14px] leading-snug font-bold text-white shadow-[0_3px_0_#4b2fd6]"
                                : "max-w-[88%] rounded-[20px] rounded-bl-md border border-[#ebe4f6] bg-white px-3.5 py-2.5 text-[14px] leading-snug font-medium text-[#0f1220] shadow-[0_4px_0_#ebe4f6]",
                            )}
                          >
                            <InlineMarkdown
                              text={msg.text}
                              dir={textDir}
                              className="whitespace-pre-wrap"
                            />
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

                  {showSuggestions ? (
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
                        {lesson!.suggestedArlo.map((prompt) => (
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
                </>
              )}
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
                  dir={detectTextDirection(input || "a")}
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
                  disabled={sending || isLoading || !lesson}
                  className={cn(
                    "box-border h-12 max-h-[120px] min-h-12 w-full min-w-0 flex-1 resize-none rounded-2xl border-2 border-[#0f1220]/10 bg-white px-3.5 py-[13px] text-[14px] leading-none font-bold text-[#0f1220] outline-none transition-[border-color] placeholder:text-arc-lavender-500 focus:border-[#0f1220] disabled:opacity-60",
                    textDirectionClass(detectTextDirection(input || "a")),
                  )}
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.92 }}
                  disabled={sending || !input.trim() || !lesson}
                  aria-label="Send"
                  className="box-border flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#0f1220] bg-[#0f1220] text-[#ffc928] transition-opacity disabled:opacity-35"
                >
                  {sending ? (
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
