"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import {
  BookOpen,
  Check,
  Clock,
  Play,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import {
  studyApi,
  type StudyPathDto,
  type StudyStartModeDto,
} from "@/lib/api/study";
import { cn } from "@/lib/utils";

const DURATIONS = [15, 25, 45, 60] as const;

/**
 * Unit co-roadmap detail — progress, accept/decline, start/continue episode.
 */
export default function StudyPathScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathId = searchParams.get("id");

  const [path, setPath] = useState<StudyPathDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(25);
  const [startMode] = useState<StudyStartModeDto>("now");

  const load = useCallback(async () => {
    if (!pathId) return;
    try {
      const dto = await studyApi.path(pathId);
      setPath(dto);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load path",
      );
    }
  }, [pathId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<StudyPathDto>, fallback: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const dto = await action();
      setPath(dto);
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

  async function startEpisode() {
    if (!pathId || busy || !path) return;
    setBusy(true);
    setError(null);
    try {
      if (path.activeSessionId) {
        router.push(`/study/room?id=${path.activeSessionId}`);
        return;
      }
      const session = await studyApi.createEpisode(pathId, {
        durationMinutes: duration,
        startMode,
      });
      router.push(`/study/room?id=${session.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not start session",
      );
      setBusy(false);
    }
  }

  if (!pathId) {
    return (
      <Shell>
        <p className="text-[14px] font-bold text-arc-lavender-600">
          Missing path id
        </p>
        <Link href="/study" className="mt-3 text-[13px] font-extrabold text-arc-purple-500">
          Back to hub
        </Link>
      </Shell>
    );
  }

  if (!path) {
    return (
      <Shell>
        <p className="text-[14px] font-bold text-arc-lavender-600">
          {error ?? "Loading path…"}
        </p>
      </Shell>
    );
  }

  const partnerFirst = path.partner.name.split(" ")[0];
  const canStart =
    path.status === "active" && path.progressPercent < 100;
  const pendingInvite =
    path.status === "invited" && path.role === "partner";
  const awaitingPartner =
    path.status === "invited" && path.role === "creator";

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <header className="shrink-0 bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-8 text-white">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              {path.category}
            </p>
            <h1 className="mt-0.5 truncate font-display text-[20px] leading-none font-bold tracking-[-0.03em]">
              {path.title}
            </h1>
          </div>
          <button
            type="button"
            aria-label="Refresh"
            onClick={() => void load()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <UserAvatar
            initial={path.partner.initial}
            avatarUrl={path.partner.avatarUrl}
            className="h-11 w-11 rounded-[14px] font-display text-[15px]"
            textClassName="text-[15px]"
            alt=""
          />
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold">w/ {partnerFirst}</p>
            <p className="text-[11px] font-bold text-white/45 capitalize">
              {path.status.replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-white/50">Progress</span>
            <span className="tabular-nums text-[#ffc928]">
              {path.progressPercent}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#16c784]"
              style={{ width: `${path.progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-bold text-white/40">
            Step {Math.min(path.contentStep + 1, path.stepCount)} of{" "}
            {Math.max(path.stepCount, 1)}
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {error ? (
          <p className="mb-3 rounded-2xl bg-[#fdecef] px-3.5 py-2.5 text-center text-[12px] font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}

        {path.inviteMessage ? (
          <p className="mb-3 rounded-[18px] border border-[#ebe4f6] bg-white px-4 py-3 text-[13px] font-bold text-[#4a3d78]">
            “{path.inviteMessage}”
          </p>
        ) : null}

        {pendingInvite ? (
          <div className="space-y-2">
            <PrimaryBtn
              label="Accept path"
              busy={busy}
              onClick={() =>
                void run(
                  () => studyApi.acceptPath(pathId),
                  "Accept failed",
                )
              }
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => studyApi.declinePath(pathId),
                  "Decline failed",
                )
              }
              className="w-full py-2 text-[13px] font-extrabold text-arc-lavender-600"
            >
              Decline
            </button>
          </div>
        ) : null}

        {awaitingPartner ? (
          <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-6 text-center">
            <p className="font-display text-[16px] font-bold text-[#1b1730]">
              Waiting for {partnerFirst}
            </p>
            <p className="mt-1 text-[12px] font-bold text-arc-lavender-600">
              They need to accept before you can start a session.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => studyApi.cancelPath(pathId),
                  "Cancel failed",
                )
              }
              className="mt-3 text-[12px] font-extrabold text-arc-lavender-600"
            >
              Cancel invite
            </button>
          </div>
        ) : null}

        {canStart ? (
          <div className="rounded-[22px] border border-[#ebe4f6] bg-white p-4 shadow-[0_10px_24px_rgba(70,40,150,0.06)]">
            <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-widest text-arc-lavender-600 uppercase">
              <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
              Session length
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-[13px] font-extrabold",
                    duration === d
                      ? "bg-arc-purple-500 text-white"
                      : "bg-[#f3effc] text-[#4a3d78]",
                  )}
                >
                  {d}m
                </button>
              ))}
            </div>
            <motion.button
              type="button"
              disabled={busy}
              onClick={() => void startEpisode()}
              whileTap={{ scale: 0.98, y: 2 }}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6] disabled:opacity-50"
            >
              {path.activeSessionId ? (
                <>
                  <Play className="h-4 w-4" strokeWidth={2.5} />
                  Rejoin live session
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" strokeWidth={2.5} />
                  Start session
                </>
              )}
            </motion.button>
          </div>
        ) : null}

        {path.status === "completed" ? (
          <div className="rounded-[20px] bg-[#e8faf0] px-4 py-5 text-center">
            <Check className="mx-auto h-6 w-6 text-[#178a52]" strokeWidth={3} />
            <p className="mt-2 font-display text-[16px] font-bold text-[#178a52]">
              Path complete
            </p>
            <Link
              href="/study"
              className="mt-3 inline-block text-[13px] font-extrabold text-arc-purple-500"
            >
              Back to hub
            </Link>
          </div>
        ) : null}

        {path.episodes.length > 0 ? (
          <div className="mt-5">
            <p className="text-[11px] font-extrabold tracking-widest text-arc-lavender-600 uppercase">
              Recent sessions
            </p>
            <ul className="mt-2 space-y-2">
              {path.episodes.map((ep) => (
                <li key={ep.id}>
                  <Link
                    href={`/study/room?id=${ep.id}`}
                    className="flex items-center justify-between rounded-[16px] border border-[#ebe4f6] bg-white px-3.5 py-3"
                  >
                    <span className="text-[13px] font-bold text-[#1b1730] capitalize">
                      {ep.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-[11px] font-extrabold text-arc-lavender-600">
                      {ep.durationMinutes}m · step {ep.contentStep + 1}/
                      {ep.stepCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </main>
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
      className="w-full cursor-pointer rounded-[18px] bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6] disabled:opacity-50"
    >
      {busy ? "…" : label}
    </motion.button>
  );
}
