"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Check, Clock, Gem, Zap } from "lucide-react";
import { motion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { studyApi, type StudySessionDto } from "@/lib/api/study";
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

/**
 * Focus room — synced timer + dual desks. REST heartbeat stand-in for WS.
 */
export default function StudyRoomScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");

  const [session, setSession] = useState<StudySessionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sessionId || !session || session.status !== "active") return;
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
  }, [sessionId, session?.status, applySession]);

  useEffect(() => {
    if (!sessionId || !session) return;
    if (TERMINAL.has(session.status) || session.status === "active") return;
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [sessionId, session?.status, refresh]);

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

  async function onLeave() {
    if (!sessionId || busy) return;
    setBusy(true);
    try {
      await studyApi.leave(sessionId);
      clearLive();
      router.push("/friends");
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
        <p className="text-[14px] font-bold text-[#8a7cb8]">
          Missing session — start from Study Together.
        </p>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <p className="text-[14px] font-bold text-[#8a7cb8]">
          {error ?? "Loading focus room…"}
        </p>
      </Shell>
    );
  }

  const m =
    remaining != null ? Math.floor(remaining / 60) : session.durationMinutes;
  const s = remaining != null ? remaining % 60 : 0;
  const ended = TERMINAL.has(session.status);
  const isInviteePending =
    session.role === "invitee" && session.status === "invited";
  const needsReady =
    !session.you.ready &&
    ["accepted", "waiting", "active"].includes(session.status);
  const statusLabel = ended
    ? "Session complete"
    : session.status === "active"
      ? "Synced timer"
      : session.status === "invited"
        ? "Waiting for accept"
        : session.status;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-arc-purple-500/30 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Focus room
            </p>
            <h1 className="mt-0.5 truncate font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              {session.subject}
            </h1>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-extrabold text-white/70">
            w/ {session.partner.name.split(" ")[0]}
          </span>
        </div>

        <div className="relative mt-8 text-center">
          <p className="text-[11px] font-extrabold tracking-[0.12em] text-white/45 uppercase">
            {statusLabel}
          </p>
          <p className="mt-2 font-display text-[64px] leading-none font-bold tracking-[-0.05em] tabular-nums">
            {session.status === "active" || ended
              ? `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
              : `${String(session.durationMinutes).padStart(2, "0")}:00`}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/50">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            {session.status === "active"
              ? "Server clock"
              : `Planned · ${session.durationMinutes}m`}
          </p>
        </div>
      </section>

      <div className="relative -mt-6 px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <div className="grid grid-cols-2 gap-2.5">
          <DeskCard
            name="You"
            task={session.you.taskLabel ?? `${session.subject} practice`}
            progress={session.you.progressHint}
            done={session.you.completionConfirmed || session.you.qualified}
            ready={session.you.ready}
            highlight
          />
          <DeskCard
            name={session.partner.name.split(" ")[0]}
            task={session.partner.taskLabel ?? "Lesson review"}
            progress={session.partner.progressHint}
            done={
              session.partner.completionConfirmed || session.partner.qualified
            }
            ready={session.partner.ready}
          />
        </div>

        {session.sharedBonusGranted && session.sharedBonus ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-center gap-3 rounded-[20px] bg-[#1b1433] px-4 py-3.5 text-white"
          >
            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#ffc928]">
              <Zap className="h-4 w-4" strokeWidth={2.5} />+
              {session.sharedBonus.coins}c
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold">
              <Gem className="h-4 w-4 text-arc-purple-500" strokeWidth={2.5} />+
              {session.sharedBonus.gems} gems
            </span>
            <span className="text-[11px] font-bold text-white/50">each</span>
          </motion.div>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-2xl bg-[#fdecef] px-3.5 py-2.5 text-center text-[12px] font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 space-y-2">
          {isInviteePending ? (
            <PrimaryBtn
              busy={busy}
              label="Accept invite"
              onClick={() =>
                void run(() => studyApi.accept(sessionId), "Accept failed")
              }
            />
          ) : null}

          {needsReady ? (
            <PrimaryBtn
              busy={busy}
              label="I'm ready"
              onClick={() =>
                void run(() => studyApi.ready(sessionId), "Ready failed")
              }
            />
          ) : null}

          {session.status === "active" && !session.you.completionConfirmed ? (
            <PrimaryBtn
              busy={busy}
              label="Mark my session done"
              onClick={() =>
                void run(
                  () =>
                    studyApi.complete(sessionId, { meaningfulAction: true }),
                  "Complete failed",
                )
              }
            />
          ) : null}

          {ended ? (
            <PrimaryBtn
              busy={false}
              label="Done — back to friends"
              onClick={() => router.push("/friends")}
            />
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onLeave()}
              className="w-full rounded-[20px] border border-[#ebe4f6] bg-white py-3.5 font-display text-[15px] font-semibold text-[#4a3d78] disabled:opacity-50"
            >
              Leave room
            </button>
          )}

          {session.role === "invitee" && session.status === "invited" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() => studyApi.decline(sessionId), "Decline failed")
              }
              className="w-full rounded-[20px] py-3 text-[13px] font-extrabold text-[#8a7cb8] disabled:opacity-50"
            >
              Decline invite
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
              className="w-full rounded-[20px] py-3 text-[13px] font-extrabold text-[#8a7cb8] disabled:opacity-50"
            >
              Cancel invite
            </button>
          ) : null}
        </div>
      </div>
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
      className="w-full rounded-[20px] bg-arc-purple-500 py-4 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6] disabled:opacity-50"
    >
      {busy ? "…" : label}
    </motion.button>
  );
}

function DeskCard({
  name,
  task,
  progress,
  done,
  ready,
  highlight,
}: {
  name: string;
  task: string;
  progress: number;
  done: boolean;
  ready: boolean;
  highlight?: boolean;
}) {
  const pct = Math.min(100, Math.round((progress / 10) * 100));
  return (
    <div
      className={cn(
        "rounded-[22px] border bg-white p-3.5 shadow-[0_10px_24px_rgba(70,40,150,0.06)]",
        highlight ? "border-arc-purple-500/30" : "border-[#ebe4f6]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[14px] font-semibold text-[#1b1730]">
          {name}
        </p>
        {done ? (
          <Check className="h-4 w-4 text-[#178a52]" strokeWidth={3} />
        ) : ready ? (
          <span className="text-[10px] font-extrabold text-arc-purple-500">
            READY
          </span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] font-bold text-[#8a7cb8]">
        {task}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ebe4f6]">
        <div
          className={cn(
            "h-full rounded-full",
            done ? "bg-[#16c784]" : "bg-arc-purple-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] font-bold text-[#8a7cb8]">
        {progress}/10 focus
      </p>
    </div>
  );
}
