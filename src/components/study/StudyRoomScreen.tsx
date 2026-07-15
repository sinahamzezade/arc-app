"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { StudyChatPanel } from "@/components/study/StudyChatPanel";
import { StudyReadingPanel } from "@/components/study/StudyReadingPanel";
import { Check, Gem, LogOut, Zap } from "lucide-react";
import { motion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import {
  studyApi,
  type StudyContentDto,
  type StudyMessageDto,
  type StudySessionDto,
} from "@/lib/api/study";
import { useStudySocket } from "@/hooks/useStudySocket";
import { useStudyLiveStore } from "@/store/useStudyLiveStore";
import { cn } from "@/lib/utils";

const TERMINAL = new Set([
  "completed",
  "partially_completed",
  "abandoned",
  "declined",
  "expired",
  "cancelled",
  "voided",
]);

const DISCONNECT_GRACE_MS = 60_000;

/**
 * Read-together room — lesson-first layout.
 * Slim header (timer + partner), thin step progress, reading fills the
 * viewport, sticky ack footer, collapsed chat dock.
 */
export default function StudyRoomScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");

  const [session, setSession] = useState<StudySessionDto | null>(null);
  const [content, setContent] = useState<StudyContentDto | null>(null);
  const [messages, setMessages] = useState<StudyMessageDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(true);
  const [soloWarn, setSoloWarn] = useState(false);
  const applySession = useStudyLiveStore((s) => s.applySession);
  const clearLive = useStudyLiveStore((s) => s.clear);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const dto = await studyApi.state(sessionId);
      setSession(dto);
      applySession(dto);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Failed to load room",
      );
    }
  }, [sessionId, applySession]);

  const loadContent = useCallback(async () => {
    if (!sessionId) return;
    try {
      const dto = await studyApi.content(sessionId);
      setContent(dto);
    } catch {
      /* pre-active */
    }
  }, [sessionId]);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { items } = await studyApi.messages(sessionId);
      setMessages(items);
    } catch {
      /* optional */
    }
  }, [sessionId]);

  const onState = useCallback(
    (dto: StudySessionDto) => {
      setSession(dto);
      applySession(dto);
      void loadContent();
    },
    [applySession, loadContent],
  );

  const { connected, emitHeartbeat, emitAckRead, emitChatSend, emitTyping } =
    useStudySocket({
      sessionId,
      enabled: Boolean(sessionId && session && !TERMINAL.has(session.status)),
      onState,
      onStep: () => {
        void loadContent();
        void refresh();
      },
      onMessage: (msg) => {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      },
      onPartnerTyping: () => {
        setPartnerTyping(true);
        setTimeout(() => setPartnerTyping(false), 2500);
      },
      onPartnerPresence: (p) => setPartnerOnline(p.online),
    });

  useEffect(() => {
    void refresh();
    void loadMessages();
  }, [refresh, loadMessages]);

  useEffect(() => {
    if (!session?.lessonId) return;
    void loadContent();
  }, [session?.lessonId, session?.contentStep, session?.roomVersion, loadContent]);

  useEffect(() => {
    if (!sessionId || !session || session.status !== "active") return;
    if (connected) {
      const send = () => emitHeartbeat({ appVisible: true, focusActive: true });
      send();
      const t = setInterval(send, 15_000);
      return () => clearInterval(t);
    }
    const send = () => {
      void studyApi
        .heartbeat(sessionId, { appVisible: true, focusActive: true })
        .then((dto) => {
          setSession(dto);
          applySession(dto);
        })
        .catch(() => undefined);
    };
    send();
    const t = setInterval(send, 15_000);
    return () => clearInterval(t);
  }, [sessionId, session?.status, connected, emitHeartbeat, applySession]);

  useEffect(() => {
    if (!sessionId || !session || connected) return;
    if (TERMINAL.has(session.status) || session.status === "active") return;
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [sessionId, session?.status, connected, refresh]);

  useEffect(() => {
    if (!session || session.remainingSeconds == null) return;
    if (session.remainingSeconds <= 0) return;
    const t = setTimeout(() => setTick((n) => n + 1), 1000);
    return () => clearTimeout(t);
  }, [session?.remainingSeconds, tick, session]);

  const remaining =
    session?.remainingSeconds != null
      ? Math.max(0, session.remainingSeconds - tick)
      : null;

  useEffect(() => {
    setTick(0);
  }, [session?.remainingSeconds, session?.roomVersion]);

  const partnerDisconnected = useMemo(() => {
    if (!session) return false;
    if (session.partner.leftAt) return true;
    if (!session.partner.lastHeartbeatAt) return false;
    return (
      Date.now() - new Date(session.partner.lastHeartbeatAt).getTime() >
      DISCONNECT_GRACE_MS
    );
  }, [session]);

  useEffect(() => {
    setSoloWarn(partnerDisconnected && session?.role === "creator");
  }, [partnerDisconnected, session?.role]);

  async function run(action: () => Promise<StudySessionDto>, fallback: string) {
    if (!sessionId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const dto = await action();
      setSession(dto);
      applySession(dto);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : fallback,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onAckRead(soloAdvance = false) {
    if (!sessionId || busy || !session) return;
    setBusy(true);
    setError(null);
    try {
      let result;
      if (connected) {
        const wsResult = await emitAckRead(soloAdvance);
        if (wsResult && typeof wsResult === "object" && "state" in wsResult) {
          result = wsResult as { state: StudySessionDto };
        } else {
          result = await studyApi.ackRead(sessionId, { soloAdvance });
        }
      } else {
        result = await studyApi.ackRead(sessionId, { soloAdvance });
      }
      setSession(result.state);
      applySession(result.state);
      await loadContent();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not mark read",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSendChat(body: string) {
    if (!sessionId) return;
    if (connected) {
      const msg = await emitChatSend(body);
      if (msg) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
        return;
      }
    }
    const msg = await studyApi.sendMessage(sessionId, body);
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    );
  }

  async function onLeave() {
    if (!sessionId || busy) return;
    setBusy(true);
    try {
      await studyApi.leave(sessionId);
      clearLive();
      router.push("/study");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Leave failed",
      );
      setBusy(false);
    }
  }

  if (!sessionId) {
    return (
      <Shell>
        <p className="text-[14px] font-bold text-arc-lavender-600">
          Missing session — start from Study Together.
        </p>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <p className="text-[14px] font-bold text-arc-lavender-600">
          {error ?? "Loading room…"}
        </p>
      </Shell>
    );
  }

  const mm =
    remaining != null ? Math.floor(remaining / 60) : session.durationMinutes;
  const ss = remaining != null ? remaining % 60 : 0;
  const timerLabel =
    session.status === "active" || TERMINAL.has(session.status)
      ? `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
      : `${session.durationMinutes}m`;

  const ended = TERMINAL.has(session.status);
  const isInviteePending =
    session.role === "invitee" && session.status === "invited";
  const needsReady =
    !session.you.ready &&
    ["accepted", "waiting", "active"].includes(session.status);
  const youAcked = session.you.ackedStep >= session.contentStep;
  const partnerAcked = session.partner.ackedStep >= session.contentStep;
  const stepCount = Math.max(session.stepCount, 1);
  const showReading =
    Boolean(content) &&
    !ended &&
    !isInviteePending &&
    !needsReady &&
    ["waiting", "active", "accepted"].includes(session.status);
  const readingComplete =
    session.you.meaningfulActionCompleted &&
    session.partner.meaningfulActionCompleted;
  const partnerFirst = session.partner.name.split(" ")[0];

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      {/* Slim header — one row, everything glanceable */}
      <header className="shrink-0 bg-[#0f1220] px-3 pt-[calc(env(safe-area-inset-top)+8px)] pb-2.5 text-white">
        <div className="flex items-center gap-2.5">
          <BackButton />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[15px] leading-tight font-bold tracking-[-0.02em]">
              {session.lessonTitle ?? session.subject}
            </h1>
            <p className="mt-0.5 text-[10px] font-extrabold tracking-[0.08em] text-white/45 uppercase">
              {ended
                ? "Complete"
                : showReading
                  ? `Step ${session.contentStep + 1}/${stepCount}`
                  : session.status === "invited"
                    ? "Waiting for accept"
                    : "Read together"}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 font-display text-[13px] font-bold tracking-[-0.02em] tabular-nums text-[#ffc928]">
            {timerLabel}
          </span>

          <span className="relative shrink-0" title={partnerFirst}>
            <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-arc-purple-500 font-display text-[13px] font-bold">
              {session.partner.initial}
            </span>
            <span
              aria-hidden
              className={cn(
                "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0f1220]",
                partnerOnline ? "bg-[#16c784]" : "bg-white/30",
              )}
            />
          </span>
        </div>

        {/* Segmented step progress */}
        {showReading ? (
          <div className="mt-2 flex gap-1">
            {Array.from({ length: stepCount }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i < session.contentStep
                    ? "bg-[#16c784]"
                    : i === session.contentStep
                      ? "bg-[#ffc928]"
                      : "bg-white/15",
                )}
              />
            ))}
          </div>
        ) : null}
      </header>

      {/* Lesson content — owns the viewport */}
      <main className="flex min-h-0 flex-1 flex-col px-3 pt-3">
        {showReading && content ? (
          <div className="flex min-h-0 flex-1 flex-col rounded-arc-lg border border-[#ebe4f6] bg-white p-4 shadow-[0_10px_24px_rgba(70,40,150,0.06)]">
            <StudyReadingPanel
              content={content}
              lessonTitle={session.lessonTitle ?? session.subject}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#0f1220] font-display text-[20px] font-bold text-[#ffc928]">
              {session.partner.initial}
            </span>
            <div>
              <p className="font-display text-[18px] font-semibold text-[#1b1730]">
                {ended
                  ? "Session complete"
                  : isInviteePending
                    ? `${partnerFirst} invited you`
                    : session.status === "invited"
                      ? `Waiting for ${partnerFirst}…`
                      : "Ready to read together?"}
              </p>
              <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
                {session.lessonTitle ?? session.subject} ·{" "}
                {session.durationMinutes}m
              </p>
            </div>

            {session.sharedBonusGranted && session.sharedBonus ? (
              <div className="flex items-center gap-3 rounded-arc-md bg-[#1b1433] px-4 py-3 text-white">
                <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#ffc928]">
                  <Zap className="h-4 w-4" strokeWidth={2.5} />+
                  {session.sharedBonus.coins}c
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-extrabold">
                  <Gem
                    className="h-4 w-4 text-arc-purple-500"
                    strokeWidth={2.5}
                  />
                  +{session.sharedBonus.gems} gems
                </span>
              </div>
            ) : null}
          </div>
        )}

        {error ? (
          <p className="mt-2 shrink-0 rounded-2xl bg-[#fdecef] px-3.5 py-2 text-center text-[12px] font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}
      </main>

      {/* Sticky action footer */}
      <footer className="shrink-0 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {soloWarn && showReading && !partnerAcked ? (
          <p className="mb-2 rounded-xl bg-[#fff8e6] px-3 py-1.5 text-center text-[11px] font-bold text-[#8a6d00]">
            {partnerFirst} disconnected — you can continue alone.
          </p>
        ) : null}

        {showReading && !readingComplete ? (
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              disabled={busy || (youAcked && !soloWarn)}
              onClick={() =>
                void onAckRead(Boolean(soloWarn && session.role === "creator"))
              }
              whileTap={{ scale: 0.98, y: 2 }}
              className="min-w-0 flex-1 cursor-pointer rounded-arc-md bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-arc-button transition-opacity disabled:opacity-50"
            >
              {youAcked && soloWarn
                ? "Continue alone"
                : youAcked
                  ? `Waiting for ${partnerFirst}…`
                  : "I read"}
            </motion.button>

            <AckDot label="You" acked={youAcked} />
            <AckDot label={partnerFirst} acked={partnerAcked} />
          </div>
        ) : null}

        {isInviteePending ? (
          <div className="space-y-2">
            <PrimaryBtn
              busy={busy}
              label="Accept invite"
              onClick={() =>
                void run(() => studyApi.accept(sessionId), "Accept failed")
              }
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() => studyApi.decline(sessionId), "Decline failed")
              }
              className="w-full cursor-pointer rounded-arc-md py-2 text-[13px] font-extrabold text-arc-lavender-600 transition-colors hover:text-[#4a3d78] disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : null}

        {needsReady && !isInviteePending ? (
          <PrimaryBtn
            busy={busy}
            label="I'm ready"
            onClick={() =>
              void run(() => studyApi.ready(sessionId), "Ready failed")
            }
          />
        ) : null}

        {readingComplete && !ended && !session.you.completionConfirmed ? (
          <PrimaryBtn
            busy={busy}
            label="Finish session"
            onClick={() =>
              void run(
                () => studyApi.complete(sessionId, { meaningfulAction: true }),
                "Complete failed",
              )
            }
          />
        ) : null}

        {ended ? (
          <PrimaryBtn
            busy={false}
            label="Back to hub"
            onClick={() => router.push("/study")}
          />
        ) : null}

        {/* Quiet secondary row */}
        {!ended && !isInviteePending ? (
          <div className="mt-1.5 flex items-center justify-center gap-4">
            {session.status === "active" &&
            !session.you.completionConfirmed &&
            !readingComplete ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      studyApi.complete(sessionId, { meaningfulAction: true }),
                    "Complete failed",
                  )
                }
                className="cursor-pointer py-1 text-[11px] font-extrabold text-arc-lavender-600 transition-colors hover:text-[#4a3d78] disabled:opacity-50"
              >
                End my session
              </button>
            ) : null}

            {session.role === "creator" &&
            ["invited", "accepted", "waiting"].includes(session.status) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() => studyApi.cancel(sessionId), "Cancel failed")
                }
                className="cursor-pointer py-1 text-[11px] font-extrabold text-arc-lavender-600 transition-colors hover:text-[#4a3d78] disabled:opacity-50"
              >
                Cancel invite
              </button>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void onLeave()}
              className="inline-flex cursor-pointer items-center gap-1 py-1 text-[11px] font-extrabold text-arc-lavender-600 transition-colors hover:text-[#c0392b] disabled:opacity-50"
            >
              <LogOut className="h-3 w-3" strokeWidth={2.75} />
              Leave
            </button>
          </div>
        ) : null}

        {/* Chat dock — collapsed by default */}
        {!ended ? (
          <div className="mt-2 overflow-hidden rounded-arc-md border border-[#ebe4f6] bg-white">
            <StudyChatPanel
              messages={messages}
              partnerTyping={partnerTyping}
              partnerName={session.partner.name}
              onSend={onSendChat}
              onTyping={emitTyping}
              disabled={busy}
              defaultOpen={false}
            />
          </div>
        ) : null}
      </footer>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-[#f3effc] px-4 pt-[calc(env(safe-area-inset-top)+14px)] font-rounded">
      {children}
    </div>
  );
}

function AckDot({ label, acked }: { label: string; acked: boolean }) {
  return (
    <span
      className={cn(
        "flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[16px] border text-center",
        acked
          ? "border-[#16c784]/30 bg-[#e8faf0]"
          : "border-[#ebe4f6] bg-white",
      )}
      title={acked ? `${label} read` : `${label} reading`}
    >
      {acked ? (
        <Check className="h-4 w-4 text-[#178a52]" strokeWidth={3} />
      ) : (
        <span className="flex h-4 items-center gap-0.5">
          <span className="h-1 w-1 animate-pulse rounded-full bg-arc-lavender-600" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-arc-lavender-600 [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-arc-lavender-600 [animation-delay:300ms]" />
        </span>
      )}
      <span className="max-w-[44px] truncate text-[8px] font-extrabold tracking-wide text-arc-lavender-600 uppercase">
        {label}
      </span>
    </span>
  );
}

function PrimaryBtn({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={busy}
      onClick={onClick}
      whileTap={{ scale: 0.98, y: 2 }}
      className="w-full cursor-pointer rounded-arc-md bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-arc-button transition-opacity disabled:opacity-50"
    >
      {busy ? "…" : label}
    </motion.button>
  );
}
