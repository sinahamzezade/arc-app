"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { StudyMessageDto } from "@/lib/api/study";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

export function StudyChatPanel({
  messages,
  partnerTyping,
  partnerName,
  youUserId,
  onSend,
  onTyping,
  disabled,
  defaultOpen = false,
}: {
  messages: StudyMessageDto[];
  partnerTyping: boolean;
  partnerName: string;
  youUserId: string;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const partnerFirst = partnerName.split(" ")[0];

  useEffect(() => {
    if (!open) return;
    setSeenCount(messages.length);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 text-left shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928]">
          <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-arc-purple-500 px-1 text-[9px] font-extrabold text-white shadow-[0_2px_0_#4b2fd6]">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
            Chat with {partnerFirst}
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-bold text-[#0f1220]">
            {partnerTyping
              ? `${partnerFirst} is typing…`
              : lastMessage
                ? `${lastMessage.senderName.split(" ")[0]}: ${lastMessage.body}`
                : "Say hi — keep it short"}
          </span>
        </span>
        {partnerTyping ? (
          <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:240ms]" />
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="chat-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col justify-end bg-[#0f1220]/45"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={softSpring}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[72dvh] flex-col overflow-hidden rounded-t-[28px] bg-[#f3effc] shadow-[0_-16px_48px_rgba(15,18,32,0.28)]"
            >
              <span
                aria-hidden
                className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#d9d0ef]"
              />

              <div className="flex shrink-0 items-center gap-3 border-b border-[#ebe4f6] px-4 pt-5 pb-3">
                <div className="min-w-0 flex-1">
                  <p
                    id={titleId}
                    className="font-display text-[16px] font-bold text-[#0f1220]"
                  >
                    Chat
                  </p>
                  <p className="text-[11px] font-bold text-arc-lavender-600">
                    {partnerTyping
                      ? `${partnerFirst} typing…`
                      : `with ${partnerFirst}`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#ebe4f6] bg-white text-[#0f1220] transition-colors hover:border-[#0f1220]/25 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928]">
                      <MessageSquare className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                    <p className="font-display text-[15px] font-bold text-[#0f1220]">
                      Quiet room so far
                    </p>
                    <p className="max-w-[16rem] text-[12px] font-bold text-arc-lavender-600">
                      Drop a quick note if you get stuck — reading stays front
                      and center.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === youUserId;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          isMe ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[82%] rounded-[18px] px-3.5 py-2.5 text-[13px] leading-snug font-bold",
                            isMe
                              ? "rounded-br-md bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
                              : "rounded-bl-md border-2 border-[#ebe4f6] bg-white text-[#0f1220] shadow-[0_3px_0_#ebe4f6]",
                          )}
                        >
                          {!isMe ? (
                            <p className="mb-0.5 text-[9px] font-black tracking-[0.1em] text-arc-lavender-500 uppercase">
                              {m.senderName.split(" ")[0]}
                            </p>
                          ) : null}
                          {m.body}
                        </div>
                      </div>
                    );
                  })
                )}
                {partnerTyping ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-[18px] rounded-bl-md border-2 border-[#ebe4f6] bg-white px-3.5 py-2.5 shadow-[0_3px_0_#ebe4f6]">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:240ms]" />
                    </div>
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>

              <form
                className="flex shrink-0 items-center gap-2.5 border-t border-[#ebe4f6] bg-[#f3effc] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <input
                  ref={inputRef}
                  value={draft}
                  disabled={disabled || sending}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    onTyping();
                  }}
                  placeholder="Message…"
                  aria-label="Chat message"
                  enterKeyHint="send"
                  className="min-w-0 flex-1 rounded-2xl border-2 border-[#0f1220]/10 bg-white px-3.5 py-3 text-[14px] font-bold text-[#0f1220] outline-none transition-[border-color] placeholder:text-arc-lavender-500 focus:border-[#0f1220] focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:opacity-60"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.92 }}
                  disabled={disabled || sending || !draft.trim()}
                  aria-label="Send message"
                  className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#0f1220] bg-[#0f1220] text-[#ffc928] transition-opacity disabled:opacity-35"
                >
                  <Send className="h-5 w-5" strokeWidth={2.5} />
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
