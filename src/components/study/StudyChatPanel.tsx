"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Mic,
  MessageSquare,
  Pause,
  Play,
  Plus,
  SendHorizontal,
  Square,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
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
  partnerInitial,
  partnerAvatarUrl,
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
  partnerInitial?: string;
  partnerAvatarUrl?: string | null;
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
  const lastOwnId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.senderId === youUserId) return messages[i]!.id;
    }
    return null;
  }, [messages, youUserId]);
  const avatarInitial =
    partnerInitial?.trim() ||
    partnerName.trim().charAt(0).toUpperCase() ||
    "?";

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
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-[#f0ebf8] bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-[#faf8ff] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
      >
        <span className="relative shrink-0">
          <UserAvatar
            initial={avatarInitial}
            avatarUrl={partnerAvatarUrl}
            className="h-8 w-8 rounded-full text-[12px]"
            textClassName="text-[12px]"
          />
          {unread > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-arc-purple-600 px-0.5 text-[8px] font-extrabold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-extrabold tracking-tight text-[#0f1220]">
            {partnerFirst}
          </span>
          <span className="mt-px block truncate text-[11px] font-semibold text-[#8a82a8]">
            {partnerTyping ? "typing…" : previewLine(lastMessage)}
          </span>
        </span>
        <MessageSquare
          className="h-3.5 w-3.5 shrink-0 text-[#b3a8d6]"
          strokeWidth={2.25}
        />
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
              className="relative flex h-[min(78dvh,720px)] max-h-[78dvh] flex-col overflow-hidden rounded-t-[28px] bg-[#faf8ff] shadow-[0_-16px_48px_rgba(15,18,32,0.28)]"
            >
              <header className="relative z-10 flex shrink-0 items-center gap-2 border-b border-[#f0ebf8] bg-white/95 px-3 pt-4 pb-3 backdrop-blur-md">
                <UserAvatar
                  initial={avatarInitial}
                  avatarUrl={partnerAvatarUrl}
                  className="h-10 w-10 shrink-0 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <p
                    id={titleId}
                    className="truncate text-[15px] font-extrabold tracking-tight text-[#0f1220]"
                  >
                    {partnerFirst}
                  </p>
                  <p
                    className="text-[12px] font-semibold text-[#8a82a8]"
                    aria-live="polite"
                  >
                    {partnerTyping ? "typing…" : "In study room"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => {
                    if (recording) stopRecorder(false);
                    setOpen(false);
                  }}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#0f1220] transition-colors hover:bg-[#f4f0ff] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
                >
                  <X className="h-5 w-5" strokeWidth={2.25} />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-4 py-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <UserAvatar
                      initial={avatarInitial}
                      avatarUrl={partnerAvatarUrl}
                      className="h-14 w-14 rounded-full"
                    />
                    <p className="text-[15px] font-extrabold tracking-tight text-[#0f1220]">
                      Chat with {partnerFirst}
                    </p>
                    <p className="max-w-[16rem] text-[12px] font-semibold text-[#8a82a8]">
                      Text, voice, or a photo — cleared when the room ends.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === youUserId;
                    const isLastOwn = m.id === lastOwnId;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex max-w-[82%] flex-col",
                          isMe ? "ml-auto items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "relative rounded-[22px] px-3.5 py-2 text-[14px] leading-snug",
                            isMe
                              ? "rounded-br-md bg-arc-purple-600 text-white"
                              : "rounded-bl-md bg-[#efeaff] text-[#0f1220]",
                            m.kind === "image" && "p-1.5",
                          )}
                        >
                          {m.kind === "image" ? (
                            <AuthChatImage
                              sessionId={sessionId}
                              messageId={m.id}
                              isMe={isMe}
                            />
                          ) : m.kind === "voice" ? (
                            <AuthChatVoice
                              sessionId={sessionId}
                              messageId={m.id}
                              durationMs={m.durationMs}
                              isMe={isMe}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap font-medium">
                              {m.body}
                            </p>
                          )}

                          {m.kind !== "text" && m.body ? (
                            <p
                              className={cn(
                                "mt-1.5 px-1 text-[12px] font-medium",
                                isMe ? "text-white/90" : "text-[#0f1220]",
                              )}
                            >
                              {m.body}
                            </p>
                          ) : null}
                        </div>

                        {isMe && isLastOwn ? (
                          <p className="mt-0.5 px-1 text-[11px] font-bold text-[#8a82a8]">
                            {m.seen ? "Seen" : "Sent"}
                          </p>
                        ) : null}
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
                    <div className="flex items-center gap-1 rounded-[20px] rounded-bl-md bg-[#efeaff] px-3.5 py-2.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8a82a8] [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8a82a8] [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8a82a8] [animation-delay:240ms]" />
                    </div>
                  </div>
                ) : null}

                <div ref={endRef} />
              </div>

              {recordError ? (
                <p
                  role="alert"
                  className="shrink-0 bg-white px-4 pt-1 text-[11px] font-semibold text-red-700"
                >
                  {recordError}
                </p>
              ) : null}

              <form
                className="relative z-10 shrink-0 border-t border-[#f0ebf8] bg-white px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  capture="environment"
                  className="hidden"
                  onChange={(e) =>
                    void onPickImage(e.target.files?.[0] ?? null)
                  }
                />

                {recording ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Cancel recording"
                      onClick={() => stopRecorder(false)}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8a82a8] transition-colors hover:bg-[#f4f0ff] hover:text-[#0f1220]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#fdecef] px-4 py-3 ring-1 ring-[#e5484d]/30">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#e5484d]" />
                      <span className="font-display text-[14px] font-bold tabular-nums text-[#c0392b]">
                        {formatDuration(recordMs)}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Stop and send voice"
                      onClick={() => stopRecorder(true)}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#e5484d] text-white transition-opacity hover:opacity-90"
                    >
                      <Square className="h-4 w-4 fill-current" strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Attach"
                      disabled={busy}
                      onClick={() => fileRef.current?.click()}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#0f1220] transition-colors hover:bg-[#f4f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:opacity-40"
                    >
                      <Plus className="h-6 w-6" strokeWidth={2.25} />
                    </button>
                    <input
                      ref={inputRef}
                      value={draft}
                      disabled={disabled || sending}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        onTyping();
                      }}
                      placeholder="Message"
                      aria-label="Chat message"
                      enterKeyHint="send"
                      className="min-h-12 min-w-0 flex-1 rounded-full bg-[#f4f0ff] px-4 py-3 text-sm font-medium text-[#0f1220] outline-none placeholder:text-[#8a82a8] focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:opacity-60"
                    />
                    {draft.trim() ? (
                      <button
                        type="submit"
                        disabled={disabled || sending}
                        aria-label="Send"
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#0f1220] text-white transition-colors hover:bg-[#1a1f35] disabled:opacity-40"
                      >
                        <SendHorizontal className="h-4.5 w-4.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={disabled || sending}
                        aria-label="Record voice message"
                        onClick={() => void toggleRecord()}
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-arc-gold text-arc-gold transition-colors hover:bg-[#1a1f35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:opacity-40"
                      >
                        <Mic className="h-5 w-5" strokeWidth={2.25} />
                      </button>
                    )}
                  </div>
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
}: {
  sessionId: string;
  messageId: string;
  isMe: boolean;
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
    <div className="overflow-hidden rounded-xl">
      {url ? (
        <button
          type="button"
          aria-label="Open photo full screen"
          onClick={() => setViewerOpen(true)}
          className="block w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
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
        <div
          className={cn(
            "flex h-36 items-center justify-center text-[11px] font-semibold",
            isMe ? "bg-white/15 text-white/70" : "bg-white/50 text-[#8a82a8]",
          )}
        >
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
        "flex w-full min-w-[10rem] cursor-pointer items-center gap-2.5 rounded-xl px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
        !url && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isMe ? "bg-white/20 text-white" : "bg-white text-arc-purple-600",
        )}
      >
        {playing ? (
          <Pause className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <Play className="h-4 w-4" strokeWidth={2.5} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold">Voice message</span>
        <span
          className={cn(
            "block text-[10px] font-bold tabular-nums",
            isMe ? "text-white/70" : "text-[#8a82a8]",
          )}
        >
          {formatDuration(durationMs ?? 0)}
        </span>
      </span>
    </button>
  );
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
