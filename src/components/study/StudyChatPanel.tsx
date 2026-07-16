"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  Check,
  CheckCheck,
  Mic,
  MessageSquare,
  Pause,
  Play,
  Send,
  Square,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ChatImageLightbox } from "@/components/study/ChatImageLightbox";
import { studyApi, type StudyMessageDto } from "@/lib/api/study";
import {
  STUDY_VOICE_MAX_MS,
  compressStudyImage,
} from "@/lib/study/chat-media";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

export function StudyChatPanel({
  messages,
  partnerTyping,
  partnerName,
  youUserId,
  sessionId,
  onSend,
  onSendMedia,
  onTyping,
  onMarkRead,
  disabled,
  defaultOpen = false,
}: {
  messages: StudyMessageDto[];
  partnerTyping: boolean;
  partnerName: string;
  youUserId: string;
  sessionId: string;
  onSend: (body: string) => Promise<void>;
  onSendMedia: (
    file: Blob,
    meta: {
      kind: "voice" | "image";
      durationMs?: number;
      caption?: string;
      filename?: string;
    },
  ) => Promise<void>;
  onTyping: () => void;
  /** Mark chat read through latest message (when sheet open). */
  onMarkRead?: (messageId?: string) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [seenCount, setSeenCount] = useState(messages.length);
  const [recording, setRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartedAt = useRef(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const titleId = useId();
  const partnerFirst = partnerName.split(" ")[0];

  useEffect(() => {
    if (!open) return;
    setSeenCount(messages.length);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages.length, open]);

  const latestMessageId = messages[messages.length - 1]?.id;
  // Emit read receipt while chat sheet is open.
  useEffect(() => {
    if (!open || !onMarkRead) return;
    onMarkRead(latestMessageId);
  }, [open, latestMessageId, onMarkRead]);

  useEffect(() => {
    if (!open || !partnerTyping) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, partnerTyping]);

  useEffect(() => {
    return () => {
      stopRecorder(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, []);

  const unread = open ? 0 : Math.max(0, messages.length - seenCount);
  const lastMessage = messages[messages.length - 1] ?? null;
  const busy = disabled || sending || recording;

  async function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  async function onPickImage(file: File | null) {
    if (!file || busy) return;
    setSending(true);
    setRecordError(null);
    try {
      const blob = await compressStudyImage(file);
      await onSendMedia(blob, {
        kind: "image",
        filename: "photo.jpg",
      });
    } catch (err) {
      setRecordError(
        err instanceof Error ? err.message : "Could not send photo",
      );
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function stopRecorder(send: boolean) {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());

    if (!recorder) {
      setRecording(false);
      setRecordMs(0);
      return;
    }

    const durationMs = Math.min(
      STUDY_VOICE_MAX_MS,
      Date.now() - recordStartedAt.current,
    );

    recorder.onstop = () => {
      setRecording(false);
      setRecordMs(0);
      const chunks = chunksRef.current;
      chunksRef.current = [];
      if (!send || chunks.length === 0) return;
      if (durationMs < 400) {
        setRecordError("Hold a bit longer");
        return;
      }
      const mime = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: mime });
      setSending(true);
      void onSendMedia(blob, {
        kind: "voice",
        durationMs,
        filename: mime.includes("mp4") ? "voice.m4a" : "voice.webm",
      })
        .catch((err) => {
          setRecordError(
            err instanceof Error ? err.message : "Could not send voice",
          );
        })
        .finally(() => setSending(false));
    };

    if (recorder.state !== "inactive") {
      recorder.stop();
    } else {
      setRecording(false);
      setRecordMs(0);
    }
  }

  async function toggleRecord() {
    if (busy && !recording) return;
    setRecordError(null);

    if (recording) {
      stopRecorder(true);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordError("Mic not supported here");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : undefined;
      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined,
      );
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recordStartedAt.current = Date.now();
      setRecording(true);
      setRecordMs(0);
      recorder.start(250);
      recordTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - recordStartedAt.current;
        setRecordMs(elapsed);
        if (elapsed >= STUDY_VOICE_MAX_MS) {
          stopRecorder(true);
        }
      }, 200);
    } catch {
      setRecordError("Mic permission denied");
      setRecording(false);
    }
  }

  function previewLine(m: StudyMessageDto | null): string {
    if (!m) return "Say hi — keep it short";
    const name = m.senderName.split(" ")[0];
    if (m.kind === "voice") return `${name}: Voice message`;
    if (m.kind === "image") return `${name}: Photo`;
    return `${name}: ${m.body}`;
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
          <span className="mt-0.5 block h-5 truncate text-[13px] leading-5 font-bold text-[#0f1220]">
            {partnerTyping
              ? `${partnerFirst} is typing…`
              : previewLine(lastMessage)}
          </span>
        </span>
        <span
          className={cn(
            "flex h-4 w-6 shrink-0 items-center justify-center gap-0.5",
            !partnerTyping && "invisible",
          )}
          aria-hidden
        >
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-purple-500 [animation-delay:240ms]" />
        </span>
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
            onClick={() => {
              if (recording) stopRecorder(false);
              setOpen(false);
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={softSpring}
              onClick={(e) => e.stopPropagation()}
              className="relative flex h-[min(72dvh,640px)] max-h-[72dvh] flex-col overflow-hidden rounded-t-[28px] bg-[#f3effc] shadow-[0_-16px_48px_rgba(15,18,32,0.28)]"
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
                  <p className="h-4 text-[11px] leading-4 font-bold text-arc-lavender-600">
                    {partnerTyping
                      ? `${partnerFirst} typing…`
                      : `with ${partnerFirst}`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => {
                    if (recording) stopRecorder(false);
                    setOpen(false);
                  }}
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
                      Text, voice, or a quick photo — wiped when the room ends.
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
                            m.kind === "image" && "p-1.5",
                          )}
                        >
                          {m.kind !== "image" ? (
                            <div className="mb-0.5 flex items-baseline justify-between gap-3 px-0.5">
                              {!isMe ? (
                                <p className="text-[9px] font-black tracking-[0.1em] text-arc-lavender-500 uppercase">
                                  {m.senderName.split(" ")[0]}
                                </p>
                              ) : (
                                <span />
                              )}
                              <time
                                dateTime={m.createdAt}
                                className={cn(
                                  "shrink-0 text-[9px] font-extrabold tabular-nums",
                                  isMe
                                    ? "text-white/70"
                                    : "text-arc-lavender-500",
                                )}
                              >
                                {formatMessageTime(m.createdAt)}
                              </time>
                            </div>
                          ) : null}

                          {m.kind === "image" ? (
                            <AuthChatImage
                              sessionId={sessionId}
                              messageId={m.id}
                              isMe={isMe}
                              senderName={m.senderName}
                              createdAt={m.createdAt}
                            />
                          ) : m.kind === "voice" ? (
                            <AuthChatVoice
                              sessionId={sessionId}
                              messageId={m.id}
                              durationMs={m.durationMs}
                              isMe={isMe}
                            />
                          ) : (
                            m.body
                          )}

                          {m.kind !== "text" && m.body ? (
                            <p
                              className={cn(
                                "mt-1.5 px-1 text-[12px] font-bold",
                                isMe ? "text-white/90" : "text-[#0f1220]",
                              )}
                            >
                              {m.body}
                            </p>
                          ) : null}

                          {isMe ? (
                            <p
                              className={cn(
                                "mt-1 flex items-center justify-end gap-1 px-0.5 text-[9px] font-extrabold tracking-wide uppercase",
                                m.seen ? "text-[#ffc928]" : "text-white/55",
                              )}
                              aria-label={m.seen ? "Seen" : "Sent"}
                            >
                              {m.seen ? (
                                <>
                                  <CheckCheck
                                    className="h-3 w-3"
                                    strokeWidth={2.75}
                                  />
                                  Seen
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3" strokeWidth={2.75} />
                                  Sent
                                </>
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}

                {partnerTyping ? (
                  <div
                    className="flex justify-start"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <div className="flex items-center gap-2 rounded-[18px] rounded-bl-md border-2 border-[#ebe4f6] bg-white px-3.5 py-2.5 shadow-[0_3px_0_#ebe4f6]">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-arc-lavender-600 [animation-delay:240ms]" />
                      </div>
                      <span className="text-[12px] font-bold text-arc-lavender-600">
                        {partnerFirst} typing…
                      </span>
                    </div>
                  </div>
                ) : null}

                <div ref={endRef} />
              </div>

              {recordError ? (
                <p
                  role="alert"
                  className="shrink-0 px-4 pt-1 text-[11px] font-bold text-[#c0392b]"
                >
                  {recordError}
                </p>
              ) : null}

              <form
                className="flex shrink-0 items-center gap-2 border-t border-[#ebe4f6] bg-[#f3effc] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) =>
                    void onPickImage(e.target.files?.[0] ?? null)
                  }
                />

                <button
                  type="button"
                  aria-label="Send photo"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#ebe4f6] bg-white text-[#0f1220] transition-opacity disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
                >
                  <Camera className="h-5 w-5" strokeWidth={2.5} />
                </button>

                {recording ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      aria-label="Cancel recording"
                      onClick={() => stopRecorder(false)}
                      className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#ebe4f6] bg-white text-[#0f1220]"
                    >
                      <X className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#e5484d]/40 bg-[#fdecef] px-3 py-3">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#e5484d]" />
                      <span className="font-display text-[14px] font-bold tabular-nums text-[#c0392b]">
                        {formatDuration(recordMs)}
                      </span>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      aria-label="Stop and send voice"
                      onClick={() => stopRecorder(true)}
                      className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#e5484d] bg-[#e5484d] text-white"
                    >
                      <Square className="h-4 w-4 fill-current" strokeWidth={2.5} />
                    </motion.button>
                  </div>
                ) : (
                  <>
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
                    {draft.trim() ? (
                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.92 }}
                        disabled={disabled || sending}
                        aria-label="Send message"
                        className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#0f1220] bg-[#0f1220] text-[#ffc928] transition-opacity disabled:opacity-35"
                      >
                        <Send className="h-5 w-5" strokeWidth={2.5} />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        disabled={disabled || sending}
                        aria-label="Record voice message"
                        onClick={() => void toggleRecord()}
                        className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#0f1220] bg-[#0f1220] text-[#ffc928] transition-opacity disabled:opacity-35"
                      >
                        <Mic className="h-5 w-5" strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </>
                )}
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function AuthChatImage({
  sessionId,
  messageId,
  isMe,
  senderName,
  createdAt,
}: {
  sessionId: string;
  messageId: string;
  isMe: boolean;
  senderName: string;
  createdAt: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;
    void studyApi
      .fetchMediaBlob(sessionId, messageId)
      .then((blob) => {
        if (cancelled) return;
        revoke = URL.createObjectURL(blob);
        setUrl(revoke);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [sessionId, messageId]);

  return (
    <div className="overflow-hidden rounded-[14px]">
      <div className="mb-1 flex items-baseline justify-between gap-3 px-2 pt-1">
        {!isMe ? (
          <p className="text-[9px] font-black tracking-[0.1em] text-arc-lavender-500 uppercase">
            {senderName.split(" ")[0]}
          </p>
        ) : (
          <span />
        )}
        <time
          dateTime={createdAt}
          className={cn(
            "shrink-0 text-[9px] font-extrabold tabular-nums",
            isMe ? "text-white/70" : "text-arc-lavender-500",
          )}
        >
          {formatMessageTime(createdAt)}
        </time>
      </div>
      {url ? (
        <button
          type="button"
          aria-label="Open photo full screen"
          onClick={() => setViewerOpen(true)}
          className="block w-full cursor-zoom-in overflow-hidden rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2"
        >
          {/* Blob URL — next/image not applicable */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Chat photo"
            className="max-h-56 w-full object-cover transition-opacity hover:opacity-95"
          />
        </button>
      ) : (
        <div className="flex h-36 items-center justify-center bg-[#0f1220]/8 text-[11px] font-bold text-arc-lavender-600">
          Loading…
        </div>
      )}

      {url ? (
        <ChatImageLightbox
          src={url}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </div>
  );
}

function AuthChatVoice({
  sessionId,
  messageId,
  durationMs,
  isMe,
}: {
  sessionId: string;
  messageId: string;
  durationMs: number | null;
  isMe: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;
    void studyApi
      .fetchMediaBlob(sessionId, messageId)
      .then((blob) => {
        if (cancelled) return;
        revoke = URL.createObjectURL(blob);
        setUrl(revoke);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      audioRef.current?.pause();
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [sessionId, messageId]);

  async function toggle() {
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={!url}
      className={cn(
        "flex w-full min-w-[10rem] cursor-pointer items-center gap-2.5 rounded-xl px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]",
        !url && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          isMe ? "bg-white/20 text-white" : "bg-[#0f1220] text-[#ffc928]",
        )}
      >
        {playing ? (
          <Pause className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <Play className="h-4 w-4" strokeWidth={2.5} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-extrabold">Voice message</span>
        <span
          className={cn(
            "block text-[10px] font-bold tabular-nums",
            isMe ? "text-white/70" : "text-arc-lavender-600",
          )}
        >
          {formatDuration(durationMs ?? 0)}
        </span>
      </span>
    </button>
  );
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
