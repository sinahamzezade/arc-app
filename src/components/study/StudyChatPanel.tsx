"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { StudyMessageDto } from "@/lib/api/study";
import { cn } from "@/lib/utils";

export function StudyChatPanel({
  messages,
  partnerTyping,
  partnerName,
  onSend,
  onTyping,
  disabled,
  defaultOpen = true,
}: {
  messages: StudyMessageDto[];
  partnerTyping: boolean;
  partnerName: string;
  onSend: (body: string) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [seenCount, setSeenCount] = useState(messages.length);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSeenCount(messages.length);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, open]);

  const unread = open ? 0 : Math.max(0, messages.length - seenCount);
  const lastMessage = messages[messages.length - 1] ?? null;

  async function submit() {
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="shrink-0 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-left transition-colors hover:bg-[#faf8ff]"
      >
        <MessageSquare
          className="h-3.5 w-3.5 shrink-0 text-arc-purple-500"
          strokeWidth={2.5}
        />
        <span className="text-[11px] font-extrabold tracking-widest text-arc-lavender-600 uppercase">
          Chat
        </span>

        {/* Collapsed preview: last message or typing hint */}
        {!open ? (
          <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-arc-lavender-600/80">
            {partnerTyping
              ? `${partnerName.split(" ")[0]} is typing…`
              : lastMessage
                ? `${lastMessage.senderName.split(" ")[0]}: ${lastMessage.body}`
                : ""}
          </span>
        ) : (
          <span className="flex-1" />
        )}

        {unread > 0 ? (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-arc-purple-500 px-1.5 text-[10px] font-extrabold text-white">
            {unread}
          </span>
        ) : null}

        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-arc-lavender-600" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-arc-lavender-600" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-36 space-y-1.5 overflow-y-auto px-3.5 pb-2">
              {messages.length === 0 ? (
                <p className="py-1.5 text-center text-[12px] font-bold text-arc-lavender-600">
                  Say hi to your study partner
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="text-[13px] leading-snug">
                    <span className="font-extrabold text-arc-purple-500">
                      {m.senderName.split(" ")[0]}
                    </span>
                    <span className="text-[#1b1730]"> · {m.body}</span>
                  </div>
                ))
              )}
              {partnerTyping ? (
                <p className="text-[11px] font-bold text-arc-lavender-600">
                  {partnerName.split(" ")[0]} is typing…
                </p>
              ) : null}
              <div ref={endRef} />
            </div>

            <form
              className="flex items-center gap-2 border-t border-[#ebe4f6] px-3 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <input
                value={draft}
                disabled={disabled || sending}
                onChange={(e) => {
                  setDraft(e.target.value);
                  onTyping();
                }}
                placeholder="Message…"
                aria-label="Chat message"
                className="min-w-0 flex-1 rounded-xl border border-[#ebe4f6] bg-[#f8f6fc] px-3 py-1.5 text-[14px] font-bold text-[#1b1730] outline-none placeholder:text-arc-lavender-600/60 focus:border-arc-purple-500/40"
              />
              <button
                type="submit"
                disabled={disabled || sending || !draft.trim()}
                aria-label="Send message"
                className={cn(
                  "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-arc-purple-500 text-white transition-opacity",
                  "disabled:opacity-40",
                )}
              >
                <Send className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
