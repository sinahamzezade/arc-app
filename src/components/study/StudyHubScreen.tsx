"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { studyApi, type StudySessionDto } from "@/lib/api/study";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { StudyHubSkeleton } from "@/components/study/StudyHubSkeleton";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

const AVATAR_COLORS = [
  "#6B4EFF",
  "#2D8CFF",
  "#FF8A3D",
  "#16A56B",
  "#B35CFF",
  "#E5484D",
];

function partnerColor(initial: string): string {
  const code = initial.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length]!;
}

function statusMeta(s: StudySessionDto): {
  label: string;
  tone: "live" | "ready" | "invite" | "soon" | "muted";
} {
  if (s.status === "active") return { label: "Reading now", tone: "live" };
  if (s.status === "waiting") return { label: "Ready up", tone: "ready" };
  if (s.status === "invited" && s.role === "invitee")
    return { label: "Invite for you", tone: "invite" };
  if (s.status === "invited") return { label: "Awaiting accept", tone: "soon" };
  if (s.status === "accepted") return { label: "Scheduled", tone: "soon" };
  return { label: s.status.replaceAll("_", " "), tone: "muted" };
}

function toneClass(tone: ReturnType<typeof statusMeta>["tone"]) {
  switch (tone) {
    case "live":
      return "bg-arc-purple-500/15 text-arc-purple-500";
    case "ready":
      return "bg-[#62d84e]/15 text-[#2d9e45]";
    case "invite":
      return "bg-[#ffc928]/25 text-[#8a6a10]";
    case "soon":
      return "bg-[#2d8cff]/15 text-[#1a5fad]";
    default:
      return "bg-[#f0ecf7] text-[#8a7cb8]";
  }
}

/**
 * Study Together hub — night stage, live rooms, incoming invites, create CTA.
 */
export default function StudyHubScreen() {
  const reduceMotion = useReducedMotion();
  const [rooms, setRooms] = useState<StudySessionDto[]>([]);
  const [invites, setInvites] = useState<StudySessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [roomRes, inviteRes] = await Promise.all([
        studyApi.rooms(),
        studyApi.invites().catch(() => ({ items: [] as StudySessionDto[] })),
      ]);
      setRooms(roomRes.items);
      setInvites(inviteRes.items);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load rooms",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const incoming = useMemo(
    () =>
      invites.filter(
        (s) => s.status === "invited" && s.role === "invitee",
      ),
    [invites],
  );

  const live = useMemo(
    () => rooms.filter((s) => s.status === "active" || s.status === "waiting"),
    [rooms],
  );

  const other = useMemo(
    () =>
      rooms.filter((s) => s.status !== "active" && s.status !== "waiting"),
    [rooms],
  );

  const acceptInvite = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await studyApi.accept(id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Accept failed",
      );
    } finally {
      setBusyId(null);
    }
  };

  const declineInvite = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await studyApi.decline(id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Decline failed",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <StudyHubSkeleton />;

  const empty =
    live.length === 0 && other.length === 0 && incoming.length === 0;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-8 h-44 w-44 rounded-full bg-arc-purple-500/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 -left-10 h-32 w-32 rounded-full bg-[#ffc928]/12 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 78% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 48% 58%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Crew learning
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-[0.92] font-bold tracking-[-0.04em]">
              Study Together
            </h1>
            <p className="mt-2 text-[13px] font-bold text-white/50">
              Same lesson. Same room. Keep pace.
            </p>
          </div>
          <button
            type="button"
            aria-label="Refresh rooms"
            onClick={() => void load()}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <Link
          href="/study/invite"
          className="relative mt-5 flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-[18px] border-2 border-[#0f1220] bg-[#ffc928] px-4 py-3.5 text-[#0f1220] shadow-[0_5px_0_#c79a2e] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928]">
            <Plus className="h-5 w-5" strokeWidth={2.75} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block font-display text-[16px] font-bold tracking-[-0.02em]">
              Start a room
            </span>
            <span className="block text-[11px] font-bold text-[#0f1220]/60">
              Pick a friend · pick a lesson
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        </Link>
      </header>

      <div className="relative z-10 -mt-6 space-y-4 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+88px)]">
        {error ? (
          <div
            role="alert"
            className="rounded-[18px] border-2 border-[#ff5a5a]/25 bg-[#ff5a5a]/10 px-4 py-3 text-center"
          >
            <p className="text-[13px] font-bold text-[#d63030]">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 cursor-pointer text-[12px] font-extrabold text-[#0f1220] underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {empty && !error ? (
          <div className="rounded-[24px] border-2 border-dashed border-[#d5ccec] bg-white px-5 py-10 text-center shadow-[0_4px_0_#ebe4f6]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ecf7] text-arc-purple-500">
              <Users className="h-7 w-7" strokeWidth={2.25} />
            </span>
            <p className="mt-4 font-display text-[20px] font-bold text-[#1b1730]">
              No rooms yet
            </p>
            <p className="mt-1.5 text-[13px] font-bold text-[#8a7cb8]">
              Invite a friend and read the same lesson together.
            </p>
            <Link
              href="/study/invite"
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-[18px] bg-arc-purple-500 px-5 py-3.5 font-display text-[14px] font-semibold text-white shadow-[0_5px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
            >
              Create invite
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        ) : null}

        {incoming.length > 0 ? (
          <section aria-label="Incoming invites">
            <SectionLabel>For you</SectionLabel>
            <ul className="mt-2 space-y-2.5">
              {incoming.map((room) => (
                <InviteCard
                  key={room.id}
                  room={room}
                  busy={busyId === room.id}
                  onAccept={() => void acceptInvite(room.id)}
                  onDecline={() => void declineInvite(room.id)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {live.length > 0 ? (
          <section aria-label="Live rooms">
            <SectionLabel>Live now</SectionLabel>
            <ul className="mt-2 space-y-2.5">
              {live.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={i}
                  reduceMotion={!!reduceMotion}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {other.length > 0 ? (
          <section aria-label="Other rooms">
            <SectionLabel>Upcoming</SectionLabel>
            <ul className="mt-2 space-y-2.5">
              {other.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={i}
                  reduceMotion={!!reduceMotion}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-0.5 text-[10px] font-black tracking-[0.14em] text-[#8a7cb8] uppercase">
      {children}
    </p>
  );
}

function RoomCard({
  room,
  index,
  reduceMotion,
}: {
  room: StudySessionDto;
  index: number;
  reduceMotion: boolean;
}) {
  const meta = statusMeta(room);
  const progress =
    room.stepCount > 0
      ? Math.round(((room.contentStep + 1) / room.stepCount) * 100)
      : 0;

  return (
    <li>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: index * 0.04 }}
      >
        <Link
          href={`/study/room?id=${room.id}`}
          className={cn(
            "flex cursor-pointer items-stretch overflow-hidden rounded-[22px] border-2 bg-white shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
            meta.tone === "live"
              ? "border-arc-purple-500/40"
              : "border-[#ebe4f6]",
          )}
        >
          <div className="min-w-0 flex-1 p-4">
            <div className="flex items-start gap-3">
              <UserAvatar
                initial={room.partner.initial}
                color={partnerColor(room.partner.initial)}
                avatarUrl={null}
                className="h-12 w-12 shrink-0 rounded-[16px] font-display text-[16px]"
                textClassName="text-[16px]"
                alt=""
              />
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide uppercase",
                    toneClass(meta.tone),
                  )}
                >
                  {meta.tone === "live" ? (
                    <span className="mr-1 inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-arc-purple-500" />
                      {meta.label}
                    </span>
                  ) : (
                    meta.label
                  )}
                </span>
                <p className="mt-1.5 truncate font-display text-[16px] font-semibold text-[#1b1730]">
                  {room.lessonTitle ?? room.subject}
                </p>
                <p className="mt-0.5 text-[12px] font-bold text-[#8a7cb8]">
                  with {room.partner.name.split(" ")[0]}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-[#8a7cb8]">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
                Step {room.contentStep + 1}/{Math.max(room.stepCount, 1)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                {room.durationMinutes}m
              </span>
            </div>

            {meta.tone === "live" || meta.tone === "ready" ? (
              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#ebe4f6]"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Lesson progress"
              >
                <div
                  className="h-full rounded-full bg-arc-purple-500"
                  style={{ width: `${Math.max(progress, 4)}%` }}
                />
              </div>
            ) : null}
          </div>
          <span className="flex w-10 shrink-0 items-center justify-center border-l border-[#f0ecf7] bg-[#faf8ff] text-arc-purple-500">
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </Link>
      </motion.div>
    </li>
  );
}

function InviteCard({
  room,
  busy,
  onAccept,
  onDecline,
}: {
  room: StudySessionDto;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-[22px] border-2 border-[#ffc928]/50 bg-white shadow-[0_4px_0_#c79a2e]/35">
      <div className="flex items-start gap-3 p-4">
        <UserAvatar
          initial={room.partner.initial}
          color={partnerColor(room.partner.initial)}
          avatarUrl={null}
          className="h-12 w-12 shrink-0 rounded-[16px] font-display text-[16px]"
          textClassName="text-[16px]"
          alt=""
        />
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-[#ffc928]/25 px-2 py-0.5 text-[9px] font-black tracking-wide text-[#8a6a10] uppercase">
            Invite for you
          </span>
          <p className="mt-1.5 truncate font-display text-[16px] font-semibold text-[#1b1730]">
            {room.lessonTitle ?? room.subject}
          </p>
          <p className="mt-0.5 text-[12px] font-bold text-[#8a7cb8]">
            {room.partner.name.split(" ")[0]} · {room.durationMinutes}m
          </p>
          {room.message ? (
            <p className="mt-2 line-clamp-2 rounded-xl bg-[#fff8e8] px-2.5 py-1.5 text-[12px] font-bold text-[#8a6a10]">
              “{room.message}”
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex border-t border-[#f0ecf7]">
        <button
          type="button"
          disabled={busy}
          onClick={onDecline}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-3 text-[12px] font-extrabold text-[#8a7cb8] transition-colors hover:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
          Decline
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-l border-[#f0ecf7] bg-arc-purple-500 py-3 text-[12px] font-extrabold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffc928] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Accept
        </button>
      </div>
      <Link
        href={`/study/room?id=${room.id}`}
        className="flex cursor-pointer items-center justify-center gap-1 border-t border-[#f0ecf7] py-2.5 text-[11px] font-extrabold text-arc-purple-500 transition-colors hover:bg-[#faf8ff]"
      >
        Open room
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </Link>
    </li>
  );
}
