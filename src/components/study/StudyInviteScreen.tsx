"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { socialApi, type SocialFriendDto } from "@/lib/api/social";
import {
  studyApi,
  type StudyPathDto,
  type StudyPickableLessonDto,
  type StudyPickableUnitDto,
} from "@/lib/api/study";
import { useRankMe } from "@/hooks/useRanks";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { rankAvatarSrc } from "@/lib/rank/icons";

const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

type InviteStep = 0 | 1 | 2;

const STEPS = [
  { key: "partner", label: "Partner" },
  { key: "lesson", label: "Lesson" },
  { key: "setup", label: "Invite" },
] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Study Together invite — Partner → Unit → note → create co-roadmap path.
 */
export default function StudyInviteScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("friend");
  const { data: rankMe } = useRankMe();
  const { data: session } = useSession();
  const youAvatarUrl =
    rankAvatarSrc(session?.profile?.avatarUrl) ??
    rankMe?.current.iconAssetKey ??
    null;

  const [step, setStep] = useState<InviteStep>(0);
  const [friends, setFriends] = useState<SocialFriendDto[]>([]);
  const [pathInvites, setPathInvites] = useState<StudyPathDto[]>([]);
  const [lessons, setLessons] = useState<StudyPickableLessonDto[]>([]);
  const [units, setUnits] = useState<StudyPickableUnitDto[]>([]);
  const [partnerId, setPartnerId] = useState(preselect ?? "");
  const [lessonId, setLessonId] = useState("");
  const [stack, setStack] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [crew, paths, lessonRes, unitRes] = await Promise.all([
          socialApi.friends(),
          studyApi.paths().catch(() => ({ items: [] as StudyPathDto[] })),
          studyApi
            .lessons()
            .catch(() => ({ items: [] as StudyPickableLessonDto[] })),
          studyApi.units().catch(() => ({ items: [] as StudyPickableUnitDto[] })),
        ]);
        if (cancelled) return;
        setFriends(crew.items);
        setPathInvites(
          paths.items.filter(
            (p) =>
              p.status === "invited" &&
              (p.role === "partner" || p.role === "creator"),
          ),
        );
        setLessons(lessonRes.items);
        setUnits(unitRes.items);
        if (lessonRes.items[0]) {
          setLessonId(lessonRes.items[0].lessonId);
        } else {
          const firstStack =
            unitRes.items[0]?.stack || unitRes.items[0]?.unitId;
          if (firstStack) setStack(firstStack);
        }
        const fromQuery = preselect
          ? crew.items.find((f) => f.userId === preselect)
          : null;
        const first =
          fromQuery ??
          crew.items.find((f) => f.online) ??
          crew.items[0] ??
          null;
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

  const lesson = useMemo(
    () => lessons.find((l) => l.lessonId === lessonId) ?? null,
    [lessons, lessonId],
  );

  const unit = useMemo(
    () =>
      units.find((u) => (u.stack || u.unitId) === stack) ?? null,
    [units, stack],
  );

  const useLessonPicker = lessons.length > 0;

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [friends]);

  const partnerOk = Boolean(partnerId && UUID_RE.test(partnerId));
  const pickOk = useLessonPicker
    ? Boolean(lessonId && lesson)
    : Boolean(stack && unit);

  const incoming = pathInvites.filter((p) => p.role === "partner");
  const outgoing = pathInvites.filter((p) => p.role === "creator");

  const canAdvance =
    step === 0 ? partnerOk : step === 1 ? pickOk : partnerOk && pickOk;

  async function sendInvite() {
    if (!partnerOk || !pickOk || busy || !partner) return;
    if (useLessonPicker && !lesson) return;
    if (!useLessonPicker && !unit) return;
    setBusy(true);
    setError(null);
    try {
      const path = await studyApi.createPath(
        useLessonPicker && lesson
          ? {
              partnerId: partner.userId,
              lessonId: lesson.lessonId,
              message: message.trim() || undefined,
            }
          : {
              partnerId: partner.userId,
              stack: unit!.stack || unit!.unitId,
              message: message.trim() || undefined,
            },
      );
      router.push(`/study/path?id=${path.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : err instanceof Error
            ? err.message
            : "Could not send path invite";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function goNext() {
    if (step === 0 && partnerOk) setStep(1);
    else if (step === 1 && pickOk) setStep(2);
    else if (step === 2) void sendInvite();
  }

  function goBack() {
    if (step === 0) router.back();
    else setStep((s) => (s - 1) as InviteStep);
  }

  const pickTitle = lesson?.title ?? unit?.title;
  const ctaLabel =
    step === 0
      ? partner
        ? `Continue with ${partner.name.split(" ")[0]}`
        : "Pick a partner"
      : step === 1
        ? pickOk
          ? "Continue to invite"
          : "Pick a lesson"
        : busy
          ? "Sending…"
          : partner
            ? `Invite ${partner.name.split(" ")[0]}`
            : "Send invite";

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      <header className="relative shrink-0 overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 h-28 w-28 rounded-full bg-[#ffc928]/14 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <BackButton tone="dark" onClick={goBack} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              New path
            </p>
            <h1 className="mt-0.5 font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              Study Together
            </h1>
          </div>
          <Link
            href="/study"
            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white/80 transition-colors hover:bg-white/16 focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
          >
            Hub
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.75} />
          </Link>
        </div>

        <div className="relative mt-6 flex items-center justify-between gap-2">
          <Buddy
            initial="Y"
            name="You"
            sub="Host"
            color="#6B4EFF"
            avatarUrl={youAvatarUrl}
            align="left"
          />

          <div className="relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffc928] text-[#0f1220] shadow-[0_5px_0_#c79a2e]">
            <BookOpen className="h-5 w-5" strokeWidth={2.5} />
          </div>

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
            avatarUrl={partner?.avatarUrl}
            align="right"
            dimmed={!partner}
          />
        </div>

        <nav
          aria-label="Invite steps"
          className="relative mt-6 flex items-center gap-1.5"
        >
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.key}
                type="button"
                disabled={i > step || (i === 1 && !partnerOk)}
                onClick={() => {
                  if (i <= step) setStep(i as InviteStep);
                }}
                className={cn(
                  "flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none disabled:cursor-default disabled:opacity-40",
                  active
                    ? "bg-[#ffc928] text-[#0f1220]"
                    : done
                      ? "bg-white/14 text-white"
                      : "bg-white/6 text-white/45",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                    active
                      ? "bg-[#0f1220] text-[#ffc928]"
                      : done
                        ? "bg-[#16c784] text-white"
                        : "bg-white/10 text-white/60",
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="truncate text-[11px] font-extrabold">
                  {s.label}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+80px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        {(incoming.length > 0 || outgoing.length > 0) && step === 0 ? (
          <div className="mb-4 space-y-2">
            {incoming.map((p) => (
              <Link
                key={p.id}
                href={`/study/path?id=${p.id}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border-2 border-arc-purple-500/25 bg-white px-3.5 py-3 shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-arc-purple-500/50 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.12em] text-arc-purple-500 uppercase">
                    Path invite
                  </p>
                  <p className="truncate font-display text-[15px] font-bold text-[#0f1220]">
                    {p.partner.name.split(" ")[0]} · {p.title}
                  </p>
                  <p className="text-[11px] font-bold text-arc-lavender-600">
                    {p.category} · tap to open
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-arc-purple-500 px-3 py-2 text-[12px] font-extrabold text-white shadow-[0_3px_0_#4b2fd6]">
                  Open
                </span>
              </Link>
            ))}
            {outgoing.map((p) => (
              <Link
                key={p.id}
                href={`/study/path?id=${p.id}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white/90 px-3.5 py-3 transition-colors hover:border-[#0f1220]/15 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
                    Waiting on
                  </p>
                  <p className="truncate font-display text-[15px] font-bold text-[#0f1220]">
                    {p.partner.name.split(" ")[0]} · {p.title}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-extrabold text-arc-lavender-600">
                  Path →
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={softSpring}
            className="flex min-h-0 flex-1 flex-col"
          >
            {step === 0 ? (
              <PartnerStep
                loading={loading}
                friends={sortedFriends}
                partnerId={partnerId}
                onSelect={setPartnerId}
              />
            ) : null}

            {step === 1 ? (
              useLessonPicker ? (
                <LessonStep
                  lessons={lessons}
                  lessonId={lessonId}
                  onSelect={setLessonId}
                  partnerName={partner?.name.split(" ")[0]}
                />
              ) : (
                <UnitStep
                  units={units}
                  stack={stack}
                  onSelect={setStack}
                  partnerName={partner?.name.split(" ")[0]}
                />
              )
            ) : null}

            {step === 2 ? (
              <SetupStep
                message={message}
                onMessage={setMessage}
                unitTitle={pickTitle}
                partnerName={partner?.name.split(" ")[0]}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <AnimatePresence>
          {error ? (
            <motion.div
              key={error}
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={softSpring}
              className="pointer-events-auto mb-3 overflow-hidden rounded-[20px] border-2 border-[#f5c6cb] bg-white shadow-[0_5px_0_#e8a0a8]"
            >
              <div className="flex items-start gap-2.5 px-3.5 py-3">
                <span
                  aria-hidden
                  className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[#e5484d]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black tracking-[0.12em] text-[#e5484d] uppercase">
                    Invite blocked
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug font-bold text-[#0f1220]">
                    {error}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss error"
                  onClick={() => setError(null)}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#fdecef] text-[#c0392b] focus-visible:ring-2 focus-visible:ring-[#e5484d] focus-visible:outline-none"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="pointer-events-auto flex items-center gap-2">
          {step > 0 ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setStep((s) => (s - 1) as InviteStep)}
              aria-label="Previous step"
              className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-[18px] border-2 border-[#ebe4f6] bg-white text-[#0f1220] shadow-[0_4px_0_#ebe4f6] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </motion.button>
          ) : null}

          <motion.button
            type="button"
            disabled={!canAdvance || busy}
            onClick={goNext}
            whileTap={{ scale: 0.98, y: 2 }}
            className={cn(
              "flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[20px] py-4 font-display text-[15px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:outline-none",
              canAdvance && !busy
                ? "bg-arc-purple-500 shadow-[0_6px_0_#4b2fd6]"
                : "bg-[#c6bce0]",
            )}
          >
            {step < 2 ? (
              <>
                {ctaLabel}
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </>
            ) : (
              <>
                <Users className="h-5 w-5" strokeWidth={2.5} />
                {ctaLabel}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function PartnerStep({
  loading,
  friends,
  partnerId,
  onSelect,
}: {
  loading: boolean;
  friends: SocialFriendDto[];
  partnerId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          Step 1 · Who
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220]">
          Pick your study partner
        </h2>
        <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
          One lesson. Shared progress. Sessions when you both show up.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-[18px] border-2 border-[#ebe4f6] bg-white"
            />
          ))}
        </div>
      ) : friends.length === 0 ? (
        <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-6 text-center">
          <Users
            className="mx-auto h-8 w-8 text-arc-purple-500"
            strokeWidth={2}
          />
          <p className="mt-3 font-display text-[16px] font-bold text-[#0f1220]">
            No crew yet
          </p>
          <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
            Add friends first, then invite them here.
          </p>
          <Link
            href="/friends"
            className="mt-4 inline-flex cursor-pointer rounded-[16px] bg-arc-purple-500 px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_3px_0_#4b2fd6] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
          >
            Open friends →
          </Link>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-2">
          {friends.map((f) => {
            const active = partnerId === f.userId;
            return (
              <li key={f.userId}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`Study with ${f.name}`}
                  onClick={() => onSelect(f.userId)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-[18px] border-2 px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none",
                    active
                      ? "border-[#ffc928] bg-white shadow-[0_5px_0_#c79a2e]"
                      : "border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6] hover:border-[#0f1220]/20",
                  )}
                >
                  <span className="relative shrink-0">
                    <UserAvatar
                      initial={f.initial}
                      color={f.color}
                      avatarUrl={f.avatarUrl}
                      className="h-12 w-12 rounded-[14px] font-display text-[16px]"
                      textClassName="text-[16px]"
                      alt=""
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white",
                        f.online ? "bg-[#16c784]" : "bg-[#c6bce0]",
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-bold text-[#0f1220]">
                      {f.name}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] font-bold",
                        f.online ? "text-[#178a52]" : "text-arc-lavender-600",
                      )}
                    >
                      {f.online ? "Online now" : `Lv ${f.level} · ${f.league}`}
                    </span>
                  </span>
                  {active ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ffc928] text-[#0f1220]">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LessonStep({
  lessons,
  lessonId,
  onSelect,
  partnerName,
}: {
  lessons: StudyPickableLessonDto[];
  lessonId: string;
  onSelect: (id: string) => void;
  partnerName?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          Step 2 · What
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220]">
          Choose a lesson
        </h2>
        <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
          {partnerName
            ? `You and ${partnerName} can study this together — even if you haven’t finished it yet.`
            : "Unfinished reading lessons are fine. Shared progress across every session."}
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-6 text-center">
          <BookOpen
            className="mx-auto h-8 w-8 text-arc-purple-500"
            strokeWidth={2}
          />
          <p className="mt-3 font-display text-[16px] font-bold text-[#0f1220]">
            No lessons yet
          </p>
          <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
            Unlock a reading lesson on your path, then invite a friend.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-2">
          {lessons.map((l) => {
            const active = lessonId === l.lessonId;
            return (
              <li key={l.lessonId}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(l.lessonId)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-[18px] border-2 px-3.5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none",
                    active
                      ? "border-arc-purple-500 bg-arc-purple-500/8 shadow-[0_4px_0_#4b2fd6]/25"
                      : "border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6] hover:border-[#0f1220]/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      active
                        ? "bg-arc-purple-500 text-white"
                        : "bg-[#0f1220] text-[#ffc928]",
                    )}
                  >
                    <BookOpen className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-bold text-[#0f1220]">
                      {l.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-bold text-arc-lavender-600">
                      {l.status === "completed" ? "Done" : "In progress"} ·{" "}
                      {l.estimatedMinutes}m
                      {l.category ? ` · ${l.category}` : null}
                    </span>
                  </span>
                  {active ? (
                    <Check
                      className="h-5 w-5 shrink-0 text-arc-purple-500"
                      strokeWidth={3}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function UnitStep({
  units,
  stack,
  onSelect,
  partnerName,
}: {
  units: StudyPickableUnitDto[];
  stack: string;
  onSelect: (id: string) => void;
  partnerName?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          Step 2 · What
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220]">
          Choose a unit
        </h2>
        <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
          {partnerName
            ? `You and ${partnerName} will share this stack’s reading path.`
            : "One stack. Shared progress across every session."}
        </p>
      </div>

      {units.length === 0 ? (
        <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-6 text-center">
          <BookOpen
            className="mx-auto h-8 w-8 text-arc-purple-500"
            strokeWidth={2}
          />
          <p className="mt-3 font-display text-[16px] font-bold text-[#0f1220]">
            No units yet
          </p>
          <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
            No stacks with reading for your track yet.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-2">
          {units.map((u) => {
            const id = u.stack || u.unitId;
            const active = stack === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-[18px] border-2 px-3.5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none",
                    active
                      ? "border-arc-purple-500 bg-arc-purple-500/8 shadow-[0_4px_0_#4b2fd6]/25"
                      : "border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6] hover:border-[#0f1220]/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      active
                        ? "bg-arc-purple-500 text-white"
                        : "bg-[#0f1220] text-[#ffc928]",
                    )}
                  >
                    <BookOpen className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-bold text-[#0f1220]">
                      {u.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-bold text-arc-lavender-600">
                      {u.readingCount ?? "—"} readings · {u.estimatedMinutes}m
                    </span>
                  </span>
                  {active ? (
                    <Check
                      className="h-5 w-5 shrink-0 text-arc-purple-500"
                      strokeWidth={3}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SetupStep({
  message,
  onMessage,
  unitTitle,
  partnerName,
}: {
  message: string;
  onMessage: (v: string) => void;
  unitTitle?: string;
  partnerName?: string;
}) {
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2">
      <div>
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          Step 3 · Invite
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220]">
          Send the path invite
        </h2>
        {(partnerName || unitTitle) && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-arc-lavender-600">
            <Sparkles
              className="h-3.5 w-3.5 text-[#ffc928]"
              strokeWidth={2.5}
            />
            {partnerName ? `${partnerName}` : "Partner"}
            {unitTitle ? ` · ${unitTitle}` : null}
          </p>
        )}
      </div>

      <div className="rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_4px_0_#ebe4f6]">
        <label
          htmlFor="study-invite-note"
          className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-arc-lavender-600"
        >
          <MessageSquare
            className="h-4 w-4 text-arc-purple-500"
            strokeWidth={2.5}
          />
          Note{" "}
          <span className="font-bold text-arc-lavender-400">(optional)</span>
        </label>
        <textarea
          id="study-invite-note"
          value={message}
          onChange={(e) => onMessage(e.target.value.slice(0, 160))}
          rows={3}
          maxLength={160}
          placeholder="Let's learn this lesson together…"
          className="w-full resize-none rounded-xl bg-[#f6f2ff] px-3 py-2.5 text-[14px] font-semibold text-[#0f1220] outline-none placeholder:text-arc-lavender-400 focus-visible:ring-2 focus-visible:ring-arc-purple-500"
        />
        <p className="mt-1 text-right text-[10px] font-bold text-arc-lavender-400">
          {message.length}/160
        </p>
      </div>

      <p className="text-[12px] font-bold text-arc-lavender-600">
        After they accept, start timed sessions from the path. Progress carries
        across every session.
      </p>
    </div>
  );
}

function Buddy({
  initial,
  name,
  sub,
  color,
  align,
  avatarUrl,
  dimmed,
}: {
  initial: string;
  name: string;
  sub: string;
  color: string;
  align: "left" | "right";
  avatarUrl?: string | null;
  dimmed?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 transition-opacity",
        align === "right" && "text-right",
        dimmed && "opacity-55",
      )}
    >
      <UserAvatar
        initial={initial}
        color={color}
        avatarUrl={avatarUrl}
        className={cn(
          "h-14 w-14 rounded-[18px] font-display text-[20px] shadow-[0_6px_16px_rgba(0,0,0,0.25)]",
          align === "right" && "ml-auto",
        )}
        textClassName="text-[20px]"
        alt=""
      />
      <p className="mt-2 truncate font-display text-[15px] font-bold">{name}</p>
      <p className="truncate text-[11px] font-bold text-white/45">{sub}</p>
    </div>
  );
}
