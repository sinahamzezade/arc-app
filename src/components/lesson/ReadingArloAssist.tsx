"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import { lessonsApi } from "@/lib/api/lessons";
import { useSystemFlags } from "@/hooks/useSystemFlags";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

const READING_ARLO_OPTIONS = [
  {
    label: "Summarize it",
    prompt: "Summarize this reading beat in 3 short, memorable bullets.",
  },
  {
    label: "Give me an example",
    prompt: "Give me one concrete, everyday example of this reading beat.",
  },
  {
    label: "Explain it simply",
    prompt: "Explain this reading beat in very simple language without jargon.",
  },
  {
    label: "Why does it matter?",
    prompt: "Explain why this reading beat matters and when I would use it.",
  },
  {
    label: "Use an analogy",
    prompt: "Explain this reading beat with one clear, memorable analogy.",
  },
] as const;

type ReadingArloAssistProps = {
  lessonId: string;
  focusTitle: string;
};

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
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingLabel, setSendingLabel] = useState<string | null>(null);

  if (!flags.arlo_ai_enabled) return null;

  const askArlo = async (label: string, prompt: string) => {
    if (sendingLabel) return;

    setSendingLabel(label);
    setAnswer(null);
    setError(null);

    try {
      const response = await lessonsApi.arloChat(
        lessonId,
        `${prompt}\n\nFocus only on the current reading beat: “${focusTitle}”.`,
        session?.accessToken,
      );
      setAnswer(response.reply);
    } catch {
      setError("Arlo couldn't answer just now. Try again.");
    } finally {
      setSendingLabel(null);
    }
  };

  return (
    <section className="mt-5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98, y: 1 }}
        transition={softSpring}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#0f1220] bg-[#0f1220] px-3.5 py-3 text-left text-white shadow-[0_4px_0_#2a2f45]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ffc928] text-[#0f1220]">
          <MessageCircle className="h-4.5 w-4.5" strokeWidth={2.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
            Need help?
          </span>
          <span className="mt-0.5 block font-display text-[15px] font-bold">
            Ask Arlo
          </span>
        </span>
        <Sparkles className="h-5 w-5 text-[#ffc928]" strokeWidth={2.5} />
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={softSpring}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <p className="mb-2 text-[10px] font-black tracking-[0.12em] text-arc-lavender-600 uppercase">
                What should Arlo do?
              </p>
              <div className="flex flex-wrap gap-2">
                {READING_ARLO_OPTIONS.map((option) => {
                  const isSending = sendingLabel === option.label;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      disabled={Boolean(sendingLabel)}
                      onClick={() => void askArlo(option.label, option.prompt)}
                      className="flex items-center gap-1.5 rounded-xl border-2 border-[#ebe4f6] bg-white px-3 py-2 text-[12px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/30 disabled:opacity-55"
                    >
                      {isSending ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin text-arc-purple-500"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <Sparkles
                          className="h-3.5 w-3.5 text-arc-purple-500"
                          strokeWidth={2.5}
                        />
                      )}
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {sendingLabel ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-3 flex items-center gap-2 rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3.5 text-[13px] font-bold text-arc-lavender-600 shadow-[0_4px_0_#ebe4f6]"
                  >
                    <Loader2
                      className="h-4 w-4 animate-spin text-arc-purple-500"
                      strokeWidth={2.5}
                    />
                    Arlo is thinking…
                  </motion.div>
                ) : answer ? (
                  <motion.aside
                    key="answer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]"
                  >
                    <div className="flex items-center gap-2 text-arc-purple-500">
                      <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                      <p className="text-[10px] font-black tracking-[0.12em] uppercase">
                        Arlo says
                      </p>
                    </div>
                    <InlineMarkdown
                      as="p"
                      text={answer}
                      className="mt-2 whitespace-pre-line text-[14px] leading-relaxed font-bold text-[#0f1220] text-pretty"
                    />
                  </motion.aside>
                ) : error ? (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600"
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
