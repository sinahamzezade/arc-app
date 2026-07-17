"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CoinsClayChip } from "@/components/economy";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Coins,
  HelpCircle,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { battlesApi } from "@/lib/api/battles";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { leaguesApi } from "@/lib/api/leagues";
import { socialApi, type SocialFriendDto } from "@/lib/api/social";
import type { BattleCatalogSubject } from "@/lib/battle/catalog";
import type { BattleDifficulty, BattleMode } from "@/lib/battle/types";
import {
  maxStakeForRankLevel,
  stakeOptionsForRank,
} from "@/lib/battle/stake-limits";
import { useRankMe } from "@/hooks/useRanks";
import { rankAvatarSrc } from "@/lib/rank/icons";
import { useSession } from "next-auth/react";
import { useBattleStore } from "@/store/useBattleStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

type CreateStep = 0 | 1 | 2;

const STEPS = [
  { key: "rival", label: "Rival" },
  { key: "arena", label: "Arena" },
  { key: "rules", label: "Rules" },
] as const;

const difficulties: BattleDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "mixed",
];
const questionCounts = [5, 10, 15, 20];
const secondsOptions = [15, 30, 45, 60];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fallbackOpponent: SocialFriendDto = {
  userId: "",
  displayName: "Rival",
  username: null,
  name: "Rival",
  initial: "R",
  color: "#6B4EFF",
  avatarUrl: null,
  level: 1,
  league: "Bronze",
  online: false,
  canBattle: true,
};

/**
 * Fight-card builder — 3-step wizard.
 * Rival → Arena → Rules/stake. Friends-only.
 */
export default function BattleCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setup = useBattleStore((s) => s.setup);
  const setSetup = useBattleStore((s) => s.setSetup);
  const resetPlay = useBattleStore((s) => s.resetPlay);
  const coins = useEconomyStore((s) => s.coins);
  const { data: rankMe } = useRankMe();
  const { data: session } = useSession();
  const youAvatarUrl =
    rankAvatarSrc(session?.profile?.avatarUrl) ??
    rankMe?.current.iconAssetKey ??
    null;

  const [step, setStep] = useState<CreateStep>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<SocialFriendDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankLevel, setRankLevel] = useState(1);
  const [customStake, setCustomStake] = useState("");
  const [catalog, setCatalog] = useState<BattleCatalogSubject[]>([]);

  const preselect = searchParams.get("opponent");

  useEffect(() => {
    if (preselect) setSetup({ opponentId: preselect });
  }, [preselect, setSetup]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [crew, me, catalogRes] = await Promise.all([
          socialApi.friends(),
          leaguesApi.getMe().catch(() => null),
          battlesApi.catalog().catch(() => null),
        ]);
        if (cancelled) return;
        setFriends(crew.items);
        if (me?.rankLevel) setRankLevel(me.rankLevel);
        if (catalogRes?.subjects?.length) {
          setCatalog(catalogRes.subjects);
          const current =
            catalogRes.subjects.find(
              (s) =>
                s.slug === setup.subject ||
                s.name === setup.subject ||
                s.topics.some(
                  (t) => t.slug === setup.topic || t.name === setup.topic,
                ),
            ) ?? catalogRes.subjects[0]!;
          const topic =
            current.topics.find(
              (t) => t.slug === setup.topic || t.name === setup.topic,
            ) ?? current.topics[0];
          if (
            setup.subject !== current.slug ||
            (topic && setup.topic !== topic.slug)
          ) {
            setSetup({
              subject: current.slug,
              topic: topic?.slug ?? "",
            });
          }
        }
        if (!preselect && crew.items[0] && !setup.opponentId) {
          const first =
            crew.items.find((f) => f.online && f.canBattle) ??
            crew.items.find((f) => f.canBattle) ??
            crew.items[0];
          if (first) setSetup({ opponentId: first.userId });
        }
      } catch {
        /* empty crew */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxStake = maxStakeForRankLevel(rankLevel);
  const stakes = stakeOptionsForRank(rankLevel);

  const sortedFriends = useMemo(
    () =>
      [...friends].sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        if (a.canBattle !== b.canBattle) return a.canBattle ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [friends],
  );

  const opponent =
    friends.find((f) => f.userId === setup.opponentId) ??
    (setup.opponentId
      ? {
          ...fallbackOpponent,
          userId: setup.opponentId,
          name: "Rival",
          initial: "R",
        }
      : (friends[0] ?? fallbackOpponent));

  const subjects: BattleCatalogSubject[] = catalog;
  const activeSubject =
    subjects.find(
      (s) => s.slug === setup.subject || s.name === setup.subject,
    ) ?? subjects[0];
  const topics = activeSubject?.topics ?? [];
  const activeTopic =
    topics.find((t) => t.slug === setup.topic || t.name === setup.topic) ??
    topics[0];
  const effectiveStake = Math.min(setup.stake, maxStake);
  const hasArena = Boolean(activeSubject && topics.length > 0);
  const canStake = hasArena && coins >= effectiveStake && effectiveStake > 0;
  const pot = effectiveStake * 2;
  const opponentOk = UUID_RE.test(setup.opponentId);
  const arenaOk = hasArena;

  useEffect(() => {
    if (setup.stake > maxStake) setSetup({ stake: maxStake });
  }, [maxStake, setup.stake, setSetup]);

  const canAdvance =
    step === 0 ? opponentOk : step === 1 ? arenaOk : canStake && opponentOk;

  const challenge = async () => {
    if (!canStake || busy) return;
    if (!hasArena) {
      setError("Pick a subject with enough quiz-unit questions.");
      return;
    }
    if (!opponentOk) {
      setError("Pick a crew member to challenge.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const battle = await battlesApi.create({
        opponentId: setup.opponentId,
        subject: activeSubject?.slug ?? setup.subject,
        topic: (activeTopic?.slug ?? setup.topic) || undefined,
        difficulty: setup.difficulty,
        questions: setup.questions,
        secondsPerQuestion: setup.seconds,
        mode: setup.mode,
        stake: effectiveStake,
        idempotencyKey:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `create-${Date.now()}`,
      });
      resetPlay();
      router.push(`/battle/invite/${battle.id}?sent=1`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "BATTLE_ALREADY_PENDING") {
        router.replace("/battle?blocked=1");
        return;
      }
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not create battle",
      );
    } finally {
      setBusy(false);
    }
  };

  function goNext() {
    setError(null);
    if (step === 0 && opponentOk) setStep(1);
    else if (step === 1 && arenaOk) setStep(2);
    else if (step === 2) void challenge();
  }

  function goBack() {
    if (step === 0) router.back();
    else setStep((s) => (s - 1) as CreateStep);
  }

  const ctaLabel =
    step === 0
      ? opponentOk
        ? `Continue with ${opponent.name.split(" ")[0]}`
        : "Pick a rival"
      : step === 1
        ? arenaOk
          ? "Continue to rules"
          : "Pick arena"
        : busy
          ? "Sending…"
          : `Challenge ${opponent.name.split(" ")[0]} · ${effectiveStake}c`;

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      <header className="relative shrink-0 overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-8 text-white">
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
              New challenge
            </p>
            <h1 className="mt-0.5 font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              Write the fight
            </h1>
          </div>
          <CoinsClayChip amount={coins} suffix="c" />
        </div>

        <div className="relative mt-6 flex items-center justify-between gap-2">
          <Fighter
            initial="Y"
            name="You"
            sub="Challenger"
            color="#6B4EFF"
            avatarUrl={youAvatarUrl}
            align="left"
          />
          <div className="relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffc928] text-[#0f1220] shadow-[0_5px_0_#c79a2e]">
            <Swords className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <Fighter
            initial={opponent.initial}
            name={opponent.name.split(" ")[0]}
            sub={
              opponent.userId
                ? `Lv ${opponent.level} · ${opponent.league}`
                : loading
                  ? "Loading…"
                  : "Pick below"
            }
            color={opponent.color}
            avatarUrl={opponent.avatarUrl}
            align="right"
            dimmed={!opponentOk}
          />
        </div>

        <nav
          aria-label="Challenge steps"
          className="relative mt-6 flex items-center gap-1.5"
        >
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.key}
                type="button"
                disabled={
                  i > step ||
                  (i === 1 && !opponentOk) ||
                  (i === 2 && (!opponentOk || !arenaOk))
                }
                onClick={() => {
                  if (i <= step) setStep(i as CreateStep);
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

      <div className="relative z-10 -mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+108px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={softSpring}
            className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          >
            {step === 0 ? (
              <RivalStep
                loading={loading}
                friends={sortedFriends}
                opponentId={setup.opponentId}
                onSelect={(id) => setSetup({ opponentId: id })}
              />
            ) : null}

            {step === 1 ? (
              <ArenaStep
                subjects={subjects}
                activeSubject={activeSubject}
                topics={topics}
                activeTopic={activeTopic}
                onSubject={(s) =>
                  setSetup({
                    subject: s.slug,
                    topic: s.topics[0]?.slug ?? "",
                  })
                }
                onTopic={(slug) => setSetup({ topic: slug })}
                rivalName={opponent.name.split(" ")[0]}
              />
            ) : null}

            {step === 2 ? (
              <RulesStep
                setup={setup}
                setSetup={setSetup}
                stakes={stakes}
                maxStake={maxStake}
                rankLevel={rankLevel}
                effectiveStake={effectiveStake}
                pot={pot}
                customStake={customStake}
                setCustomStake={setCustomStake}
                canStake={canStake}
                coins={coins}
                subjectName={activeSubject?.name}
                topicName={activeTopic?.name}
                rivalName={opponent.name.split(" ")[0]}
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={softSpring}
              className="pointer-events-auto mb-3 rounded-[18px] border-2 border-[#f5c6cb] bg-white px-3.5 py-3 text-[13px] font-bold text-[#c0392b] shadow-[0_4px_0_#e8a0a8]"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="pointer-events-auto flex items-center gap-2">
          {step > 0 ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setStep((s) => (s - 1) as CreateStep)}
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
                <Swords className="h-5 w-5" strokeWidth={2.5} />
                {ctaLabel}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function RivalStep({
  loading,
  friends,
  opponentId,
  onSelect,
}: {
  loading: boolean;
  friends: SocialFriendDto[];
  opponentId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          Step 1 · Who
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220]">
          Pick your rival
        </h2>
        <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
          Friends only — stake coins, winner takes pot.
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
            Add friends first, then challenge them here.
          </p>
          <Link
            href="/friends"
            className="mt-4 inline-flex cursor-pointer items-center gap-1 rounded-[16px] bg-arc-purple-500 px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_3px_0_#4b2fd6] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
          >
            Open friends
            <ChevronRight className="h-4 w-4" strokeWidth={2.75} />
          </Link>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pb-2">
          {friends.map((f) => {
            const active = opponentId === f.userId;
            const disabled = !f.canBattle;
            return (
              <li key={f.userId}>
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  aria-label={`Challenge ${f.name}`}
                  onClick={() => onSelect(f.userId)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-[18px] border-2 px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45",
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
                        disabled
                          ? "text-arc-lavender-500"
                          : f.online
                            ? "text-[#178a52]"
                            : "text-arc-lavender-600",
                      )}
                    >
                      {disabled
                        ? "Can't battle right now"
                        : f.online
                          ? `Online · Lv ${f.level} · ${f.league}`
                          : `Lv ${f.level} · ${f.league}`}
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

function ArenaStep({
  subjects,
  activeSubject,
  topics,
  activeTopic,
  onSubject,
  onTopic,
  rivalName,
}: {
  subjects: BattleCatalogSubject[];
  activeSubject?: BattleCatalogSubject;
  topics: BattleCatalogSubject["topics"];
  activeTopic?: BattleCatalogSubject["topics"][number];
  onSubject: (s: BattleCatalogSubject) => void;
  onTopic: (slug: string) => void;
  rivalName?: string;
}) {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pb-2">
      <div>
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          Step 2 · What
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220]">
          Choose the arena
        </h2>
        <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
          {rivalName
            ? `You and ${rivalName} face the same quiz pool.`
            : "Same subject · same questions."}
        </p>
      </div>

      <div className="rounded-[20px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
            Subject
          </p>
          {activeSubject?.publishedCount != null ? (
            <p className="font-display text-[11px] font-bold text-arc-lavender-600 tabular-nums">
              {activeSubject.publishedCount} in pool
            </p>
          ) : null}
        </div>

        {subjects.length === 0 ? (
          <p className="mt-3 text-[12px] font-bold text-arc-lavender-600">
            No battle-ready subjects yet. Need enough quiz-unit questions in the
            content pool.
          </p>
        ) : (
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {subjects.map((s) => {
              const active = activeSubject?.slug === s.slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => onSubject(s)}
                  className={cn(
                    "relative min-h-[56px] cursor-pointer overflow-hidden rounded-[16px] px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none",
                    active
                      ? "bg-[#0f1220] text-white shadow-[0_4px_0_#2a2f45]"
                      : "bg-[#f6f2ff] text-[#5c4f8a] hover:bg-[#ebe4f6]",
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute top-0 bottom-0 left-0 w-1 bg-[#ffc928]"
                    />
                  ) : null}
                  <span className="block font-display text-[13px] leading-tight font-semibold text-balance">
                    {s.name}
                  </span>
                  {typeof s.publishedCount === "number" ? (
                    <span
                      className={cn(
                        "mt-1 block text-[10px] font-extrabold tracking-wide uppercase tabular-nums",
                        active ? "text-[#ffc928]/90" : "text-arc-lavender-600",
                      )}
                    >
                      {s.publishedCount} Qs
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-[20px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
            Topic
          </p>
          {activeTopic && typeof activeTopic.publishedCount === "number" ? (
            <p className="font-display text-[11px] font-bold text-arc-lavender-600 tabular-nums">
              {activeTopic.publishedCount} ready
            </p>
          ) : null}
        </div>

        {topics.length === 0 ? (
          <p className="mt-3 text-[12px] font-bold text-arc-lavender-600">
            No topics with enough published versions for this subject.
          </p>
        ) : (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {topics.map((t) => {
              const active = (activeTopic?.slug ?? "") === t.slug;
              return (
                <button
                  key={t.slug || "all"}
                  type="button"
                  onClick={() => onTopic(t.slug)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none",
                    active
                      ? "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
                      : "bg-[#f0ecf7] text-arc-lavender-600 hover:bg-[#ebe4f6]",
                  )}
                >
                  {t.name}
                  {typeof t.publishedCount === "number" ? (
                    <span
                      className={cn(
                        "rounded-md px-1 py-0.5 text-[9px] font-black tabular-nums",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-arc-lavender-600",
                      )}
                    >
                      {t.publishedCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RulesStep({
  setup,
  setSetup,
  stakes,
  maxStake,
  rankLevel,
  effectiveStake,
  pot,
  customStake,
  setCustomStake,
  canStake,
  coins,
  subjectName,
  topicName,
  rivalName,
}: {
  setup: {
    difficulty: BattleDifficulty;
    questions: number;
    seconds: number;
    mode: BattleMode;
    stake: number;
  };
  setSetup: (patch: Partial<typeof setup>) => void;
  stakes: number[];
  maxStake: number;
  rankLevel: number;
  effectiveStake: number;
  pot: number;
  customStake: string;
  setCustomStake: (v: string) => void;
  canStake: boolean;
  coins: number;
  subjectName?: string;
  topicName?: string;
  rivalName?: string;
}) {
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pb-2">
      <div>
        <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
          Step 3 · How
        </p>
        <h2 className="mt-1 font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#0f1220]">
          Set the rules
        </h2>
        {(rivalName || subjectName) && (
          <p className="mt-1 text-[12px] font-bold text-arc-lavender-600">
            {rivalName}
            {subjectName ? ` · ${subjectName}` : null}
            {topicName ? ` · ${topicName}` : null}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["live", "async"] as BattleMode[]).map((m) => {
          const active = setup.mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setSetup({ mode: m })}
              className={cn(
                "cursor-pointer rounded-[18px] border-2 px-3 py-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none",
                active
                  ? "border-arc-purple-500 bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]"
                  : "border-[#ebe4f6] bg-white text-[#0f1220] shadow-[0_3px_0_#ebe4f6]",
              )}
            >
              <p className="font-display text-[15px] font-bold">
                {m === "live" ? "Live" : "Async"}
              </p>
              <p
                className={cn(
                  "mt-1 text-[11px] font-bold",
                  active ? "text-white/75" : "text-arc-lavender-600",
                )}
              >
                {m === "live" ? "Same Q, same time" : "24h to finish"}
              </p>
            </button>
          );
        })}
      </div>

      <DialRow
        icon={<Zap className="h-4 w-4" strokeWidth={2.5} />}
        label="Difficulty"
        value={setup.difficulty}
      >
        {difficulties.map((d) => (
          <DialBtn
            key={d}
            active={setup.difficulty === d}
            onClick={() => setSetup({ difficulty: d })}
            label={d}
          />
        ))}
      </DialRow>

      <DialRow
        icon={<HelpCircle className="h-4 w-4" strokeWidth={2.5} />}
        label="Questions"
        value={`${setup.questions}`}
      >
        {questionCounts.map((n) => (
          <DialBtn
            key={n}
            active={setup.questions === n}
            onClick={() => setSetup({ questions: n })}
            label={`${n}`}
          />
        ))}
      </DialRow>

      <DialRow
        icon={<Clock className="h-4 w-4" strokeWidth={2.5} />}
        label="Seconds / Q"
        value={`${setup.seconds}s`}
      >
        {secondsOptions.map((n) => (
          <DialBtn
            key={n}
            active={setup.seconds === n}
            onClick={() => setSetup({ seconds: n })}
            label={`${n}`}
          />
        ))}
      </DialRow>

      <div className="overflow-hidden rounded-[20px] bg-[#0f1220] p-4 text-white shadow-[0_5px_0_#2a2f45]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              Coin pot
            </p>
            <p className="mt-1 font-display text-[40px] leading-none font-bold tracking-[-0.04em] tabular-nums">
              {pot}
            </p>
            <p className="mt-1.5 text-[12px] font-bold text-white/50">
              Each puts in {effectiveStake} · max {maxStake} (Lv {rankLevel})
            </p>
          </div>
          <Coins className="h-11 w-11 text-[#ffc928]" strokeWidth={1.75} />
        </div>

        <div
          className={cn(
            "mt-4 grid gap-1.5",
            stakes.length >= 5 ? "grid-cols-5" : "grid-cols-4",
          )}
        >
          {stakes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setCustomStake("");
                setSetup({ stake: s });
              }}
              className={cn(
                "cursor-pointer rounded-xl py-2.5 font-display text-[14px] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none",
                effectiveStake === s && !customStake
                  ? "bg-[#ffc928] text-[#0f1220]"
                  : "bg-white/10 text-white/70 hover:bg-white/16",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mt-3 block">
          <span className="text-[10px] font-black tracking-wide text-white/40 uppercase">
            Custom stake
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={maxStake}
            step={10}
            value={customStake}
            placeholder={`10–${maxStake}`}
            onChange={(e) => {
              const raw = e.target.value;
              setCustomStake(raw);
              const n = Number(raw);
              if (Number.isFinite(n) && n > 0) {
                setSetup({
                  stake: Math.min(maxStake, Math.max(10, Math.round(n))),
                });
              }
            }}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 font-display text-[15px] font-bold text-white outline-none placeholder:text-white/30 focus:border-[#ffc928] focus-visible:ring-2 focus-visible:ring-[#ffc928]"
          />
        </label>

        {!canStake ? (
          <p className="mt-3 text-[12px] font-bold text-[#ff8a3d]">
            Need {effectiveStake}c — you have {coins.toLocaleString()}c.
          </p>
        ) : (
          <p className="mt-3 text-[12px] font-bold text-white/45">
            Wallet keeps {Math.max(0, coins - effectiveStake).toLocaleString()}c
            after stake.
          </p>
        )}
      </div>
    </div>
  );
}

function Fighter({
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

function DialRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3 py-3 shadow-[0_3px_0_#ebe4f6]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-arc-lavender-600">
          <span className="text-arc-purple-500">{icon}</span>
          {label}
        </span>
        <span className="font-display text-[13px] font-bold text-[#0f1220] capitalize">
          {value}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function DialBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[3.25rem] flex-1 cursor-pointer rounded-xl py-2 text-[12px] font-extrabold capitalize transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none",
        active
          ? "bg-[#0f1220] text-white"
          : "bg-[#f6f2ff] text-arc-lavender-600 hover:bg-[#ebe4f6]",
      )}
    >
      {label}
    </button>
  );
}
