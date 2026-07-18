"use client";

import Image from "next/image";
import { useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  Lightbulb,
  ListChecks,
  Loader2,
  RefreshCw,
  Shapes,
  Sparkles,
  Target,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import { sanitizeArloReply } from "@/lib/lesson/arlo-reply";
import { assets } from "@/lib/assets";
import { lessonsApi } from "@/lib/api/lessons";
import { useSystemFlags } from "@/hooks/useSystemFlags";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const squishSpring = { type: "spring" as const, stiffness: 500, damping: 22 };

const READING_ARLO_OPTIONS = [
  {
    label: "Summarize it",
    icon: ListChecks,
    prompt: "Summarize this lesson beat in 3 short, memorable bullets.",
  },
  {
    label: "Give me an example",
    icon: BookOpenText,
    prompt: "Give me one concrete, everyday example of this lesson beat.",
  },
  {
    label: "Explain it simply",
    icon: Lightbulb,
    prompt: "Explain this lesson beat in very simple language without jargon.",
  },
  {
    label: "Why does it matter?",
    icon: Target,
    prompt: "Explain why this lesson beat matters and when I would use it.",
  },
  {
    label: "Use an analogy",
    icon: Shapes,
    prompt: "Explain this lesson beat with one clear, memorable analogy.",
  },
] as const;

type ReadingArloAssistProps = {
  lessonId: string;
  focusTitle: string;
};

type AskState =
  | { phase: "idle" }
  | { phase: "sending"; label: string; prompt: string }
  | { phase: "answered"; label: string; prompt: string; reply: string }
  | { phase: "failed"; label: string; prompt: string };

/**
 * Inline Ask Arlo affordance for reading beats.
 * Option chips call `/lessons/:id/arlo/chat` and render the reply in-place.
 */
export function ReadingArloAssist({
  lessonId,
  focusTitle,
}: ReadingArloAssistProps) {
  const { data: session } = useSession();
  const { flags } = useSystemFlags();
  const [isOpen, setIsOpen] = useState(false);
  const [ask, setAsk] = useState<AskState>({ phase: "idle" });

  if (!flags.arlo_ai_enabled) return null;

  const sending = ask.phase === "sending";
  const activeLabel = ask.phase === "idle" ? null : ask.label;

  const askArlo = async (label: string, prompt: string) => {
    if (sending) return;
    setAsk({ phase: "sending", label, prompt });

    try {
      const response = await lessonsApi.arloChat(
        lessonId,
        `${prompt}\n\nFocus only on the current lesson beat: “${focusTitle}”.`,
        session?.accessToken,
      );
      const reply = sanitizeArloReply(response.reply);
      if (!reply) {
        setAsk({ phase: "failed", label, prompt });
        return;
      }
      setAsk({ phase: "answered", label, prompt, reply });
    } catch {
      setAsk({ phase: "failed", label, prompt });
    }
  };

  return (
    <section className="mt-6">
      {/* Trigger — night card with Arlo mascot */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={squishSpring}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative block w-full cursor-pointer overflow-hidden rounded-arc-lg bg-[#0f1220] text-left shadow-[0_6px_0_#2a2f45]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-8 h-28 w-28 rounded-full bg-arc-purple-500/40 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-[#ffc928]/15 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 30%, #fff, transparent), radial-gradient(1px 1px at 72% 22%, #fff, transparent), radial-gradient(1.5px 1px at 46% 76%, #fff, transparent), radial-gradient(1px 1px at 88% 64%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3 py-3 pr-4 pl-3">
          <motion.div
            className="relative h-[54px] w-[54px] shrink-0"
            animate={{ y: [0, -3, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={sending ? assets.arlo.thinking : assets.arlo.wand}
              alt=""
              fill
              className="object-contain drop-shadow-[0_4px_10px_rgba(124,92,255,0.45)]"
              sizes="54px"
            />
          </motion.div>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
              <Sparkles className="h-3 w-3" strokeWidth={3} />
              Stuck on this beat?
            </span>
            <span className="mt-0.5 block font-display text-[17px] leading-tight font-bold tracking-[-0.02em] text-white">
              Ask Arlo
            </span>
          </span>

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={softSpring}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#ffc928]"
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.75} />
          </motion.span>
        </div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={softSpring}
            className="overflow-hidden"
          >
            {/* Option chips — clay buttons, staggered in */}
            <div className="grid grid-cols-2 gap-2 pt-3">
              {READING_ARLO_OPTIONS.map((option, i) => {
                const Icon = option.icon;
                const isActive = activeLabel === option.label;
                const isThinking = sending && isActive;
                return (
                  <motion.button
                    key={option.label}
                    type="button"
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...softSpring, delay: i * 0.045 }}
                    whileTap={{ scale: 0.94 }}
                    disabled={sending}
                    onClick={() => void askArlo(option.label, option.prompt)}
                    className={
                      isActive
                        ? "flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-arc-purple-500 bg-arc-purple-500 px-3 py-2.5 text-left text-[12.5px] leading-tight font-bold text-white shadow-[0_4px_0_var(--color-arc-purple-700)]"
                        : "flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-[#ebe4f6] bg-white px-3 py-2.5 text-left text-[12.5px] leading-tight font-bold text-[#0f1220] shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-arc-purple-500/50 disabled:cursor-default disabled:opacity-55"
                    }
                  >
                    <span
                      className={
                        isActive
                          ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white"
                          : "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f3effc] text-arc-purple-500"
                      }
                    >
                      {isThinking ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          strokeWidth={2.75}
                        />
                      ) : (
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.75} />
                      )}
                    </span>
                    {option.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Response area */}
            <AnimatePresence mode="wait">
              {ask.phase === "sending" ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={softSpring}
                  className="mt-3 flex items-center gap-3 rounded-[20px] border-2 border-dashed border-arc-purple-500/35 bg-white/70 px-4 py-3.5"
                >
                  <div className="relative h-10 w-10 shrink-0">
                    <Image
                      src={assets.arlo.thinking}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#0f1220]">
                      Arlo is thinking…
                    </p>
                    <div className="mt-1.5 flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:240ms]" />
                    </div>
                  </div>
                </motion.div>
              ) : ask.phase === "answered" ? (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={softSpring}
                  className="mt-3 flex items-end gap-2"
                >
                  <motion.div
                    className="relative mb-1 h-11 w-11 shrink-0"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...squishSpring, delay: 0.1 }}
                  >
                    <Image
                      src={assets.arlo.thumbsUp}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="44px"
                    />
                  </motion.div>

                  {/* Speech bubble */}
                  <div className="relative min-w-0 flex-1 rounded-[20px] rounded-bl-md border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_5px_0_#ebe4f6]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-arc-purple-500 uppercase">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.75} />
                        {ask.label}
                      </p>
                      <button
                        type="button"
                        aria-label="Ask again"
                        onClick={() => void askArlo(ask.label, ask.prompt)}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-[#f3effc] text-arc-lavender-600 transition-colors hover:text-arc-purple-500"
                      >
                        <RefreshCw className="h-3 w-3" strokeWidth={2.75} />
                      </button>
                    </div>
                    <InlineMarkdown
                      as="p"
                      text={ask.reply}
                      className="mt-2 whitespace-pre-line text-[14px] leading-relaxed font-bold text-[#0f1220] text-pretty"
                      dir="auto"
                    />
                  </div>
                </motion.div>
              ) : ask.phase === "failed" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={softSpring}
                  className="mt-3 flex items-center gap-3 rounded-[20px] border-2 border-[#ffd4b0] bg-[#fff4ec] px-4 py-3"
                >
                  <div className="relative h-9 w-9 shrink-0">
                    <Image
                      src={assets.arlo.sleepy}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="36px"
                    />
                  </div>
                  <p className="min-w-0 flex-1 text-[13px] leading-snug font-bold text-[#9a4a12]">
                    Arlo dozed off. Give it another go.
                  </p>
                  <button
                    type="button"
                    onClick={() => void askArlo(ask.label, ask.prompt)}
                    className="shrink-0 cursor-pointer rounded-xl border-2 border-[#9a4a12]/20 bg-white px-3 py-1.5 text-[12px] font-bold text-[#9a4a12] shadow-[0_3px_0_#ffd4b0] transition-colors hover:border-[#9a4a12]/45"
                  >
                    Retry
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
