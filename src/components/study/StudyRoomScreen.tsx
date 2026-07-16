"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { StudyChatPanel } from "@/components/study/StudyChatPanel";
import { StudyReadingPanel } from "@/components/study/StudyReadingPanel";
import {
  BookOpen,
  Check,
  Gem,
  LogOut,
  MoreHorizontal,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import {
  studyApi,
  type StudyChatReadReceiptDto,
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
const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

/**
 * Read-together room — lesson-first layout.
 * Immersive reading, dual-ack sync strip, sheet chat, clear lobby states.
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
  const [menuOpen, setMenuOpen] = useState(false);
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
      // API already returns oldest → newest (service reverses DESC page).
      setMessages(sortMessagesAsc(items.map(normalizeMessage)));
    } catch {
      /* optional — 401 when session expired */
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

  const applyChatRead = useCallback(
    (receipt: StudyChatReadReceiptDto) => {
      if (!session || receipt.userId === session.you.userId) return;
      const readAtMs = new Date(receipt.readAt).getTime();
      if (Number.isNaN(readAtMs)) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === session.you.userId &&
          new Date(m.createdAt).getTime() <= readAtMs
            ? { ...m, seen: true }
            : m,
        ),
      );
    },
    [session],
  );

  const { connected, emitHeartbeat, emitAckRead, emitChatSend, emitChatRead, emitTyping } =
    useStudySocket({
      sessionId,
      enabled: Boolean(sessionId && session && !TERMINAL.has(session.status)),
      onState,
      onStateDirty: () => {
        void refresh();
        void loadContent();
      },
      onStep: () => {
        void loadContent();
        void refresh();
      },
      onMessage: (msg) => {
        setMessages((prev) => mergeMessage(prev, normalizeMessage(msg)));
      },
      onChatRead: applyChatRead,
      onPartnerTyping: () => {
        setPartnerTyping(true);
        setTimeout(() => setPartnerTyping(false), 2500);
      },
      onPartnerPresence: (p) => setPartnerOnline(p.online),
    });

  const markChatRead = useCallback(
    (messageId?: string) => {
      if (!sessionId) return;
      if (connected) {
        void emitChatRead(messageId);
        return;
      }
      void studyApi
        .markMessagesRead(sessionId, messageId)
        .then(applyChatRead)
        .catch(() => undefined);
    },
    [sessionId, connected, emitChatRead, applyChatRead],
  );

  useEffect(() => {
    void refresh();
    void loadMessages();
  }, [refresh, loadMessages]);

  useEffect(() => {
    if (session && TERMINAL.has(session.status)) {
      setMessages([]);
    }
  }, [session?.status]);

  // Chat poll fallback when WS not joined — keeps both sides in sync.
  useEffect(() => {
    if (!sessionId || !session || TERMINAL.has(session.status)) return;
    if (connected) return;
    const t = setInterval(() => void loadMessages(), 2000);
    return () => clearInterval(t);
  }, [sessionId, session?.status, connected, loadMessages]);

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
        setMessages((prev) => mergeMessage(prev, normalizeMessage(msg)));
        return;
      }
    }
    const msg = await studyApi.sendMessage(sessionId, body);
    setMessages((prev) => mergeMessage(prev, normalizeMessage(msg)));
  }

  async function onSendMedia(
    file: Blob,
    meta: {
      kind: "voice" | "image";
      durationMs?: number;
      caption?: string;
      filename?: string;
    },
  ) {
    if (!sessionId) return;
    const msg = await studyApi.sendMedia(sessionId, file, meta);
    setMessages((prev) => mergeMessage(prev, normalizeMessage(msg)));
  }

  async function onLeave() {
    if (!sessionId || busy) return;
    setBusy(true);
    setMenuOpen(false);
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
  const bothAcked = youAcked && partnerAcked;
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
  const timerUrgent =
    remaining != null && remaining > 0 && remaining <= 60 && session.status === "active";

  const canCancelInvite =
    session.role === "creator" &&
    ["invited", "accepted", "waiting"].includes(session.status);
  const canEndEarly =
    session.status === "active" &&
    !session.you.completionConfirmed &&
    !readingComplete;

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      {/* Night header — overflow visible so options menu can escape */}
      <header className="relative z-50 shrink-0 bg-[#0f1220] px-3 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-16 right-[-40px] h-40 w-40 rounded-full bg-arc-purple-500/30 blur-3xl" />
          <div className="absolute bottom-0 left-[-24px] h-24 w-24 rounded-full bg-[#ffc928]/12 blur-2xl" />
        </div>

        <div className="relative flex items-center gap-2.5">
          <BackButton tone="dark" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {ended
                ? "Session done"
                : showReading
                  ? `Beat ${session.contentStep + 1} · ${stepCount}`
                  : isInviteePending
                    ? "Invite"
                    : "Study room"}
            </p>
            <h1 className="mt-0.5 truncate font-display text-[16px] leading-tight font-bold tracking-[-0.02em]">
              {session.lessonTitle ?? session.subject}
            </h1>
          </div>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 font-display text-[13px] font-bold tracking-[-0.02em] tabular-nums",
              timerUrgent
                ? "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]"
                : "bg-white/10 text-[#ffc928]",
            )}
          >
            <Timer className="h-3.5 w-3.5" strokeWidth={2.5} />
            {timerLabel}
          </span>

          <div className="relative z-50 shrink-0">
            <button
              type="button"
              aria-label="Room options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/16 focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={softSpring}
                  className="absolute top-[calc(100%+8px)] right-0 z-50 w-44 overflow-hidden rounded-[16px] border border-white/10 bg-[#1a1e30] shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
                >
                  {canEndEarly ? (
                    <MenuItem
                      label="End my session"
                      onClick={() => {
                        setMenuOpen(false);
                        void run(
                          () =>
                            studyApi.complete(sessionId, {
                              meaningfulAction: true,
                            }),
                          "Complete failed",
                        );
                      }}
                      disabled={busy}
                    />
                  ) : null}
                  {canCancelInvite ? (
                    <MenuItem
                      label="Cancel invite"
                      onClick={() => {
                        setMenuOpen(false);
                        void run(
                          () => studyApi.cancel(sessionId),
                          "Cancel failed",
                        );
                      }}
                      disabled={busy}
                    />
                  ) : null}
                  {!ended ? (
                    <MenuItem
                      label="Leave room"
                      danger
                      icon={<LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      onClick={() => void onLeave()}
                      disabled={busy}
                    />
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Dual presence */}
        <div className="relative mt-3 flex items-center gap-2">
          <PresenceChip
            label="You"
            initial={session.you.initial}
            avatarUrl={session.you.avatarUrl}
            online
            ready={session.you.ready || showReading}
            accent="#6B4EFF"
          />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2.75} />
          </span>
          <PresenceChip
            label={partnerFirst}
            initial={session.partner.initial}
            avatarUrl={session.partner.avatarUrl}
            online={partnerOnline && !partnerDisconnected}
            ready={session.partner.ready || partnerAcked}
            accent="#8a7cb8"
          />
        </div>

        {showReading ? (
          <div className="relative mt-3 flex gap-1.5" aria-label="Reading progress">
            {Array.from({ length: stepCount }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
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

      {/* Backdrop under menu (header z-50), above main */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="relative z-0 flex min-h-0 flex-1 flex-col px-4 pt-4">
        {showReading && content ? (
          <StudyReadingPanel
            content={content}
            lessonTitle={session.lessonTitle ?? session.subject}
          />
        ) : (
          <LobbyState
            ended={ended}
            isInviteePending={isInviteePending}
            partnerFirst={partnerFirst}
            partnerInitial={session.partner.initial}
            youInitial={session.you.initial}
            status={session.status}
            lessonTitle={session.lessonTitle ?? session.subject}
            durationMinutes={session.durationMinutes}
            sharedBonus={session.sharedBonus}
            sharedBonusGranted={session.sharedBonusGranted}
            inviteMessage={session.message}
          />
        )}

        {error ? (
          <p
            role="alert"
            className="mt-3 shrink-0 rounded-[16px] border border-[#f5c6cb] bg-[#fdecef] px-3.5 py-2.5 text-center text-[12px] font-bold text-[#c0392b]"
          >
            {error}
          </p>
        ) : null}
      </main>

      <footer className="shrink-0 space-y-2.5 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {soloWarn && showReading && !partnerAcked ? (
          <div className="rounded-[16px] border-2 border-[#ffc928]/40 bg-[#fff8e6] px-3.5 py-2.5 text-center">
            <p className="text-[12px] font-bold text-[#8a6d00]">
              {partnerFirst} dropped — you can keep going alone.
            </p>
          </div>
        ) : null}

        {showReading && !readingComplete ? (
          <SyncStrip
            youAcked={youAcked}
            partnerAcked={partnerAcked}
            partnerFirst={partnerFirst}
            youInitial={session.you.initial}
            partnerInitial={session.partner.initial}
          />
        ) : null}

        {showReading && !readingComplete ? (
          <PrimaryBtn
            busy={busy}
            disabled={busy || (youAcked && !soloWarn)}
            label={
              youAcked && soloWarn
                ? "Continue alone"
                : youAcked
                  ? `Waiting for ${partnerFirst}…`
                  : bothAcked
                    ? "Next beat"
                    : "I finished this beat"
            }
            onClick={() =>
              void onAckRead(Boolean(soloWarn && session.role === "creator"))
            }
          />
        ) : null}

        {isInviteePending ? (
          <div className="space-y-2">
            <PrimaryBtn
              busy={busy}
              label={`Accept · study with ${partnerFirst}`}
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
              className="w-full cursor-pointer rounded-[18px] py-2.5 text-[13px] font-extrabold text-arc-lavender-600 transition-colors hover:text-[#4a3d78] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none disabled:opacity-50"
            >
              Decline invite
            </button>
          </div>
        ) : null}

        {needsReady && !isInviteePending ? (
          <PrimaryBtn
            busy={busy}
            label="I'm ready — start reading"
            onClick={() =>
              void run(() => studyApi.ready(sessionId), "Ready failed")
            }
          />
        ) : null}

        {readingComplete && !ended && !session.you.completionConfirmed ? (
          <PrimaryBtn
            busy={busy}
            label="Finish session · claim bonus"
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
            label="Back to Study hub"
            onClick={() => router.push("/study")}
          />
        ) : null}

        {!ended ? (
          <StudyChatPanel
            messages={messages}
            partnerTyping={partnerTyping}
            partnerName={session.partner.name}
            youUserId={session.you.userId}
            sessionId={sessionId}
            onSend={onSendChat}
            onSendMedia={onSendMedia}
            onTyping={emitTyping}
            onMarkRead={markChatRead}
            disabled={busy}
            defaultOpen={false}
          />
        ) : null}
      </footer>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-[#f3effc] px-4 font-rounded">
      {children}
    </div>
  );
}

function PresenceChip({
  label,
  initial,
  avatarUrl,
  online,
  ready,
  accent,
}: {
  label: string;
  initial: string;
  avatarUrl?: string | null;
  online: boolean;
  ready: boolean;
  accent: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-white/8 px-2 py-1.5">
      <span className="relative shrink-0">
        <UserAvatar
          initial={initial}
          color={accent}
          avatarUrl={avatarUrl}
          className="h-8 w-8 rounded-[12px] font-display text-[12px]"
          textClassName="text-[12px]"
          alt=""
        />
        <span
          aria-hidden
          className={cn(
            "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0f1220]",
            online ? "bg-[#16c784]" : "bg-white/30",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-extrabold text-white">
          {label}
        </span>
        <span className="block text-[10px] font-bold text-white/45">
          {ready ? "In sync" : online ? "Here" : "Away"}
        </span>
      </span>
    </div>
  );
}

function SyncStrip({
  youAcked,
  partnerAcked,
  partnerFirst,
  youInitial,
  partnerInitial,
}: {
  youAcked: boolean;
  partnerAcked: boolean;
  partnerFirst: string;
  youInitial: string;
  partnerInitial: string;
}) {
  const both = youAcked && partnerAcked;
  return (
    <div
      className={cn(
        "rounded-[18px] border-2 px-3 py-2.5",
        both
          ? "border-[#16c784]/35 bg-[#e8faf0]"
          : "border-[#ebe4f6] bg-white",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          {both
            ? "Both ready"
            : youAcked
              ? `Waiting on ${partnerFirst}`
              : partnerAcked
                ? `${partnerFirst} ready — your turn`
                : "Read, then tap done"}
        </p>
        <div className="flex items-center gap-1.5">
          <AckBadge label="You" initial={youInitial} acked={youAcked} />
          <AckBadge
            label={partnerFirst}
            initial={partnerInitial}
            acked={partnerAcked}
          />
        </div>
      </div>
    </div>
  );
}

function AckBadge({
  label,
  initial,
  acked,
}: {
  label: string;
  initial: string;
  acked: boolean;
}) {
  return (
    <span
      title={acked ? `${label} finished` : `${label} still reading`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold",
        acked
          ? "border-[#16c784]/35 bg-[#e8faf0] text-[#178a52]"
          : "border-[#ebe4f6] bg-[#f8f6fc] text-arc-lavender-600",
      )}
    >
      {acked ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : (
        <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#0f1220]/8 text-[8px] font-black text-white">
          {initial}
        </span>
      )}
      {label}
    </span>
  );
}

function LobbyState({
  ended,
  isInviteePending,
  partnerFirst,
  partnerInitial,
  youInitial,
  status,
  lessonTitle,
  durationMinutes,
  sharedBonus,
  sharedBonusGranted,
  inviteMessage,
}: {
  ended: boolean;
  isInviteePending: boolean;
  partnerFirst: string;
  partnerInitial: string;
  youInitial: string;
  status: string;
  lessonTitle: string;
  durationMinutes: number;
  sharedBonus: { coins: number; gems: number } | null;
  sharedBonusGranted: boolean;
  inviteMessage: string | null;
}) {
  const title = ended
    ? "Session complete"
    : isInviteePending
      ? `${partnerFirst} invited you`
      : status === "invited"
        ? `Waiting for ${partnerFirst}…`
        : "Ready to read together?";

  const sub = ended
    ? "Nice work — head back when you're done celebrating."
    : isInviteePending
      ? "Same lesson. Shared timer. No video call."
      : status === "invited"
        ? "They'll see your invite and jump in."
        : "Tap ready when you're set — reading unlocks for both.";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto overscroll-contain text-center">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-arc-purple-500 font-display text-[20px] font-bold text-white shadow-[0_5px_0_#4b2fd6]">
          {youInitial}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffc928] text-[#0f1220] shadow-[0_4px_0_#c79a2e]">
          <Users className="h-4 w-4" strokeWidth={2.75} />
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#0f1220] font-display text-[20px] font-bold text-[#ffc928] shadow-[0_5px_0_#2a2f45]">
          {partnerInitial}
        </span>
      </div>

      <div className="max-w-[20rem]">
        <p className="font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220] text-balance">
          {title}
        </p>
        <p className="mt-2 text-[13px] font-bold text-arc-lavender-600 text-pretty">
          {sub}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#0f1220] shadow-[0_3px_0_#ebe4f6]">
          <BookOpen className="h-3.5 w-3.5 text-arc-purple-500" strokeWidth={2.5} />
          {lessonTitle} · {durationMinutes}m
        </p>
      </div>

      {inviteMessage ? (
        <p className="max-w-[18rem] rounded-[16px] border-2 border-[#ebe4f6] bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6]">
          “{inviteMessage}”
        </p>
      ) : null}

      {sharedBonusGranted && sharedBonus ? (
        <div className="flex items-center gap-3 rounded-[18px] bg-[#0f1220] px-4 py-3 text-white shadow-[0_5px_0_#2a2f45]">
          <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#ffc928]">
            <Zap className="h-4 w-4" strokeWidth={2.5} />+{sharedBonus.coins}c
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-extrabold">
            <Gem className="h-4 w-4 text-arc-purple-400" strokeWidth={2.5} />+
            {sharedBonus.gems} gems
          </span>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  disabled,
  danger,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 px-3.5 py-3 text-left text-[13px] font-bold transition-colors hover:bg-white/8 disabled:opacity-50",
        danger ? "text-[#ff8a8a]" : "text-white",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PrimaryBtn({
  label,
  busy,
  onClick,
  disabled,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled ?? busy}
      onClick={onClick}
      whileTap={{ scale: 0.98, y: 2 }}
      className="w-full cursor-pointer rounded-[20px] bg-arc-purple-500 py-4 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6] transition-opacity focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
    >
      {busy ? "Working…" : label}
    </motion.button>
  );
}

function normalizeMessage(m: StudyMessageDto): StudyMessageDto {
  const kind =
    m.kind === "voice" || m.kind === "image" || m.kind === "text"
      ? m.kind
      : "text";
  return {
    ...m,
    kind,
    body: m.body ?? "",
    mediaUrl: m.mediaUrl ?? null,
    mediaMime: m.mediaMime ?? null,
    durationMs: m.durationMs ?? null,
    seen: !!m.seen,
  };
}

function sortMessagesAsc(items: StudyMessageDto[]): StudyMessageDto[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function mergeMessage(
  prev: StudyMessageDto[],
  msg: StudyMessageDto,
): StudyMessageDto[] {
  const existing = prev.find((m) => m.id === msg.id);
  if (existing) {
    if (existing.seen || !msg.seen) return prev;
    return prev.map((m) => (m.id === msg.id ? { ...m, seen: true } : m));
  }
  return sortMessagesAsc([...prev, msg]);
}
