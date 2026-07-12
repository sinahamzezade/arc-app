"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import {
  BookOpen,
  Check,
  Clock,
  MessageSquare,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { socialApi, type SocialFriendDto } from "@/lib/api/social";
import {
  studyApi,
  type StudySessionDto,
  type StudyStartModeDto,
} from "@/lib/api/study";
import { cn } from "@/lib/utils";

/** Matches backend StudySubject enum values. */
const SUBJECTS: { value: string; label: string }[] = [
  { value: "SQL", label: "SQL" },
  { value: "Python", label: "Python" },
  { value: "Excel", label: "Excel" },
  { value: "Data Analysis", label: "Data Analysis" },
  { value: "current_track", label: "My track" },
  { value: "Any", label: "Any" },
];

const START_OPTIONS: {
  mode: StudyStartModeDto;
  label: string;
  hint: string;
}[] = [
  { mode: "now", label: "Now", hint: "Invite expires in 10m" },
  { mode: "within_1_hour", label: "Within 1h", hint: "Warm-up window" },
  { mode: "scheduled", label: "Later", hint: "Pick a start ~2h out" },
];

const DURATIONS = [15, 25, 45, 60] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Study Together invite builder — Arc battle-setup language.
 * Partner from crew (friends API). Wired to POST /study-together.
 */
export default function StudyInviteScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("friend");

  const [friends, setFriends] = useState<SocialFriendDto[]>([]);
  const [invites, setInvites] = useState<StudySessionDto[]>([]);
  const [partnerId, setPartnerId] = useState(preselect ?? "");
  const [subject, setSubject] = useState("SQL");
  const [startMode, setStartMode] = useState<StudyStartModeDto>("now");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(25);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [crew, open] = await Promise.all([
          socialApi.friends(),
          studyApi.invites().catch(() => ({ items: [] as StudySessionDto[] })),
        ]);
        if (cancelled) return;
        setFriends(crew.items);
        setInvites(open.items);
        const fromQuery = preselect
          ? crew.items.find((f) => f.userId === preselect)
          : null;
        const first = fromQuery ?? crew.items[0] ?? null;
        if (first) setPartnerId(first.userId);
      } catch {
        if (!cancelled) setError("Could not load friends");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preselect]);

  const partner = useMemo(
    () => friends.find((f) => f.userId === partnerId) ?? null,
    [friends, partnerId],
  );

  const partnerOk = Boolean(partnerId && UUID_RE.test(partnerId));

  const incoming = invites.filter((s) => s.role === "invitee");
  const outgoing = invites.filter((s) => s.role === "creator");

  async function sendInvite() {
    if (!partnerOk || busy || !partner) return;
    setBusy(true);
    setError(null);
    try {
      const session = await studyApi.create({
        inviteeId: partner.userId,
        subject,
        durationMinutes: duration,
        startMode,
        message: message.trim() || undefined,
        scheduledStartAt:
          startMode === "scheduled"
            ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            : undefined,
      });
      router.push(`/study/room?id=${session.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not send study invite",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* HERO — shared desk face-off */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 h-32 w-32 rounded-full bg-[#ffc928]/15 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Shared focus
            </p>
            <h1 className="mt-0.5 font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              Study Together
            </h1>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-extrabold text-white/80">
            <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
            Crew
          </span>
        </div>

        <div className="relative mt-7 flex items-center justify-between gap-2">
          <Buddy
            initial="Y"
            name="You"
            sub="Host"
            color="#6B4EFF"
            align="left"
          />

          <motion.div
            className="relative z-[1] flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffc928] text-[#1b1730] shadow-[0_6px_0_#c79a2e]"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <BookOpen className="h-6 w-6" strokeWidth={2.5} />
          </motion.div>

          <Buddy
            initial={partner?.initial ?? "?"}
            name={partner?.name.split(" ")[0] ?? "Partner"}
            sub={
              partner
                ? `Lv ${partner.level} · ${partner.league}`
                : loading
                  ? "Loading…"
                  : "Pick below"
            }
            color={partner?.color ?? "#8a7cb8"}
            align="right"
          />
        </div>

        {/* Partner picker */}
        <div className="relative mt-6">
          <p className="mb-2 text-[10px] font-black tracking-[0.1em] text-white/45 uppercase">
            Study with
          </p>
          {loading ? (
            <p className="text-[12px] font-bold text-white/50">Loading crew…</p>
          ) : friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-3 py-3">
              <p className="text-[12px] font-bold text-white/60">
                No friends yet — add crew on Social first.
              </p>
              <Link
                href="/friends"
                className="mt-2 inline-flex text-[12px] font-black text-[#ffc928]"
              >
                Open friends →
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {friends.map((f) => {
                const active = partnerId === f.userId;
                return (
                  <button
                    key={f.userId}
                    type="button"
                    aria-label={`Study with ${f.name}`}
                    aria-pressed={active}
                    onClick={() => setPartnerId(f.userId)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-2xl border px-2.5 py-2 transition-transform",
                      active
                        ? "scale-[1.02] border-[#ffc928] bg-white/15 ring-2 ring-[#ffc928]/40"
                        : "border-white/10 bg-white/5 opacity-70",
                    )}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl font-display text-[13px] font-bold text-white"
                      style={{ background: f.color }}
                    >
                      {f.initial}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block max-w-[88px] truncate font-display text-[13px] font-bold">
                        {f.name.split(" ")[0]}
                      </span>
                      <span className="block text-[10px] font-bold text-white/45">
                        {f.online ? "Online" : "Offline"}
                      </span>
                    </span>
                    {active ? (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-[#ffc928]"
                        strokeWidth={3}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="relative -mt-6 px-4 pb-[calc(env(safe-area-inset-bottom)+110px)]">
        {/* Open invites */}
        {(incoming.length > 0 || outgoing.length > 0) && (
          <div className="mb-3 space-y-2">
            {incoming.map((s) => (
              <Link
                key={s.id}
                href={`/study/room?id=${s.id}`}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_8px_20px_rgba(70,40,150,0.06)]"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
                    Invite in
                  </p>
                  <p className="truncate font-display text-[15px] font-bold text-[#1b1730]">
                    {s.partner.name} · {s.subject}
                  </p>
                  <p className="text-[11px] font-bold text-[#8a7cb8]">
                    {s.durationMinutes}m · {s.status}
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-arc-purple-500 px-3 py-2 text-[12px] font-extrabold text-white">
                  Open
                </span>
              </Link>
            ))}
            {outgoing.map((s) => (
              <Link
                key={s.id}
                href={`/study/room?id=${s.id}`}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-[#ebe4f6] bg-white/80 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
                    Waiting on
                  </p>
                  <p className="truncate font-display text-[15px] font-bold text-[#1b1730]">
                    {s.partner.name} · {s.subject}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-extrabold text-[#8a7cb8]">
                  Room →
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Subject */}
        <div className="overflow-hidden rounded-[24px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.08)]">
          <div className="px-4 py-3">
            <p className="text-[10px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
              Subject
            </p>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
              {SUBJECTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSubject(s.value)}
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-2 font-display text-[13px] font-semibold",
                    subject === s.value
                      ? "bg-[#1b1433] text-white"
                      : "bg-[#f6f2ff] text-[#8a7cb8]",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start window */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {START_OPTIONS.map((opt) => {
            const active = startMode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setStartMode(opt.mode)}
                className={cn(
                  "rounded-[20px] border px-2.5 py-3 text-left",
                  active
                    ? "border-arc-purple-500 bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]"
                    : "border-[#ebe4f6] bg-white text-[#1b1730]",
                )}
              >
                <p className="font-display text-[14px] font-bold">{opt.label}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px] font-bold leading-snug",
                    active ? "text-white/75" : "text-[#8a7cb8]",
                  )}
                >
                  {opt.hint}
                </p>
              </button>
            );
          })}
        </div>

        {/* Duration */}
        <div className="mt-3 overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-[#f0ecf7] px-3 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[#8a7cb8]">
              <Clock className="h-4 w-4 text-arc-purple-500" strokeWidth={2.5} />
              Duration
            </span>
            <span className="font-display text-[14px] font-bold text-[#1b1730]">
              {duration}m
            </span>
          </div>
          <div className="grid grid-cols-4">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  "py-3 font-display text-[14px] font-bold",
                  duration === d
                    ? "bg-[#ffc928] text-[#1b1730]"
                    : "text-[#8a7cb8]",
                )}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="mt-3 rounded-[20px] border border-[#ebe4f6] bg-white px-3 py-3">
          <label className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[#8a7cb8]">
            <MessageSquare
              className="h-4 w-4 text-arc-purple-500"
              strokeWidth={2.5}
            />
            Note{" "}
            <span className="font-bold text-[#c6bce0]">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 160))}
            rows={2}
            maxLength={160}
            placeholder="Let's grind SQL filters together…"
            className="w-full resize-none rounded-xl bg-[#f6f2ff] px-3 py-2.5 text-[14px] font-semibold text-[#1b1730] outline-none placeholder:text-[#b3a8d6] focus-visible:ring-2 focus-visible:ring-arc-purple-500"
          />
          <p className="mt-1 text-right text-[10px] font-bold text-[#c6bce0]">
            {message.length}/160
          </p>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#8a7cb8]">
          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
          Shared timer · own lessons · no camera required
        </p>

        {error ? (
          <p className="mt-3 rounded-2xl bg-[#fdecef] px-3.5 py-2.5 text-[12px] font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}
      </div>

      {/* Dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <motion.button
          type="button"
          disabled={!partnerOk || busy}
          onClick={() => void sendInvite()}
          whileTap={{ scale: 0.98, y: 2 }}
          className={cn(
            "pointer-events-auto flex w-full items-center justify-center gap-2 rounded-[20px] py-4 font-display text-[16px] font-semibold text-white",
            partnerOk && !busy
              ? "bg-arc-purple-500 shadow-[0_6px_0_#4b2fd6]"
              : "bg-[#c6bce0]",
          )}
        >
          <Users className="h-5 w-5" strokeWidth={2.5} />
          {busy
            ? "Sending…"
            : partner
              ? `Invite ${partner.name.split(" ")[0]} · ${duration}m`
              : "Pick a partner"}
        </motion.button>
      </div>
    </div>
  );
}

function Buddy({
  initial,
  name,
  sub,
  color,
  align,
}: {
  initial: string;
  name: string;
  sub: string;
  color: string;
  align: "left" | "right";
}) {
  return (
    <div className={cn("min-w-0 flex-1", align === "right" && "text-right")}>
      <span
        className={cn(
          "inline-flex h-16 w-16 items-center justify-center rounded-[20px] font-display text-[24px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]",
          align === "right" && "ml-auto",
        )}
        style={{ background: color }}
      >
        {initial}
      </span>
      <p className="mt-2 truncate font-display text-[16px] font-bold">{name}</p>
      <p className="truncate text-[11px] font-bold text-white/45">{sub}</p>
    </div>
  );
}
