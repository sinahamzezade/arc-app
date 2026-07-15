"use client";

import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Flame,
  Gem,
  Search,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  socialApi,
  type SocialFriendDto,
  type SocialSearchHitDto,
} from "@/lib/api/social";
import { battlesApi, type BattleDto } from "@/lib/api/battles";
import {
  battleHref,
  battleStatusLabel,
  type BattleHubInitialData,
  useBattleHub,
} from "@/hooks/useBattles";
import { BattleHubSkeleton } from "@/components/battle/BattleHubSkeleton";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

function rivalName(b: BattleDto) {
  return b.opponent.displayName || b.opponent.username || "Rival";
}

function inviteEndedCopy(status: string | null): {
  eyebrow: string;
  title: string;
} | null {
  switch (status) {
    case "declined":
      return {
        eyebrow: "Invite closed",
        title: "Rival declined the challenge",
      };
    case "cancelled":
      return { eyebrow: "Invite closed", title: "Challenge was cancelled" };
    case "expired":
      return { eyebrow: "Timed out", title: "Invite expired — send a new one" };
    case "voided":
      return { eyebrow: "Invite closed", title: "Challenge was voided" };
    default:
      return null;
  }
}

/**
 * Arena hub — night stage, incoming/live matches, rivals, tape.
 */
export default function BattleHubScreen({
  initialData,
}: {
  initialData?: BattleHubInitialData;
}) {
  const { status: sessionStatus } = useSession();
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const wasBlocked = searchParams.get("blocked") === "1";
  const inviteStatus = searchParams.get("invite");
  const inviteEnded = inviteEndedCopy(inviteStatus);
  const [dismissedInvite, setDismissedInvite] = useState<string | null>(null);
  const showInviteEnded =
    Boolean(inviteEnded) && dismissedInvite !== inviteStatus;
  const {
    stats,
    history,
    invites,
    live,
    incoming,
    outgoing,
    blocking,
    loadMore,
    invalidate,
  } = useBattleHub(initialData);
  const [friends, setFriends] = useState<SocialFriendDto[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SocialSearchHitDto[]>([]);
  const [searching, setSearching] = useState(false);

  const online = useMemo(
    () =>
      [...friends]
        .filter((f) => f.online)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [friends],
  );
  const searchingUsers = userQuery.trim().length >= 2;

  const hubLoading = stats.isLoading || history.isLoading || invites.isLoading;
  const hubReady = Boolean(stats.data || history.data || invites.data);

  const dismissInviteEnded = () => {
    setDismissedInvite(inviteStatus);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("invite");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const cancelBlocking = async () => {
    if (!blocking || cancelling) return;
    setCancelling(true);
    try {
      if (blocking.role === "challenger") {
        await battlesApi.cancel(blocking.id);
      } else {
        await battlesApi.decline(blocking.id);
      }
      invalidate();
    } catch {
      /* ignore — hub will re-poll */
    } finally {
      setCancelling(false);
    }
  };

  const statsData = stats.data ?? {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    winStreak: 0,
    favoriteSubject: "—",
  };
  const historyItems = history.data?.items ?? [];
  const historyCursor = history.data?.nextCursor ?? null;

  /** Spotlight: active match or your outgoing invite (not incoming — those have own section). */
  const spotlight =
    blocking &&
    (blocking.status !== "invited" || blocking.role === "challenger")
      ? blocking
      : null;
  const liveRest = spotlight
    ? live.filter((b) => b.id !== spotlight.id)
    : live;
  const outgoingRest = spotlight
    ? outgoing.filter((b) => b.id !== spotlight.id)
    : outgoing;
  const hasOpen =
    liveRest.length + outgoingRest.length + incoming.length > 0 ||
    Boolean(spotlight);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        void socialApi.heartbeat().catch(() => undefined);
        const crew = await socialApi.friends();
        if (!cancelled) setFriends(crew.items);
      } catch {
        /* empty */
      }
    };
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!searchingUsers) return;
    const q = userQuery.trim();
    let cancelled = false;
    const t = setTimeout(() => {
      setSearching(true);
      void (async () => {
        try {
          const res = await socialApi.search(q);
          if (!cancelled) setSearchHits(res.items);
        } catch {
          if (!cancelled) setSearchHits([]);
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [userQuery, searchingUsers]);

  if (
    (sessionStatus === "loading" && !initialData) ||
    (sessionStatus === "authenticated" && hubLoading && !hubReady)
  ) {
    return <BattleHubSkeleton />;
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* Night arena hero */}
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-48px] h-56 w-56 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-28px] h-36 w-36 rounded-full bg-[#ffc928]/14 blur-3xl"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Arena
            </p>
            <h1 className="mt-1 font-display text-[26px] leading-[0.95] font-bold tracking-[-0.04em]">
              Battle
            </h1>
          </div>

          <Link
            href="/wallet"
            aria-label={`${coins.toLocaleString()} coins — open wallet`}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#ffc928]/35 bg-[#ffc928]/12 py-1.5 pr-2.5 pl-1.5 transition-colors hover:bg-[#ffc928]/18 focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffc928] text-[#0f1220] shadow-[0_2px_0_#c79a2e]">
              <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-[15px] leading-none font-bold tracking-[-0.02em] text-white tabular-nums">
              {coins.toLocaleString()}
            </span>
          </Link>
        </div>

        {/* Stats board */}
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <StatTile
            label="Streak"
            value={String(statsData.winStreak)}
            icon={
              <Flame
                className="h-3.5 w-3.5 text-[#ff8a3d]"
                fill="currentColor"
                strokeWidth={1.5}
              />
            }
            accent
          />
          <StatTile
            label="Win rate"
            value={`${statsData.winRate}%`}
            icon={<Trophy className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />}
          />
          <StatTile
            label="Record"
            value={`${statsData.wins}–${statsData.losses}`}
            sub={`${statsData.draws}D · ${statsData.played} played`}
          />
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3 text-[11px] font-extrabold text-white/65">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
              {xp.toLocaleString()} XP
            </span>
            <span className="inline-flex items-center gap-1">
              <Gem className="h-3.5 w-3.5 text-arc-purple-300" strokeWidth={2.5} />
              {gems} gems
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-[#ffc928] px-2.5 py-1 text-[10px] font-black tracking-[0.06em] text-[#0f1220] uppercase">
            {statsData.favoriteSubject}
          </span>
        </div>
      </header>

      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+88px)] shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <AnimatePresence>
          {showInviteEnded && inviteEnded ? (
            <motion.div
              key="invite-ended"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={snappySpring}
              className="mb-4"
            >
              <div className="relative flex items-stretch overflow-hidden rounded-[20px] border-2 border-[#ffc928]/40 bg-[#0f1220] shadow-[0_6px_0_#2a2f45]">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-[#ffc928]"
                />
                <span className="m-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
                  <Swords className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1 py-3.5 pr-2">
                  <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
                    {inviteEnded.eyebrow}
                  </p>
                  <p className="mt-0.5 font-display text-[15px] leading-snug font-bold tracking-[-0.02em] text-[#fff8e8]">
                    {inviteEnded.title}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={dismissInviteEnded}
                  className="m-2.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center self-center rounded-xl bg-white/10 text-white/55 transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
                >
                  <X className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {wasBlocked && !blocking ? (
          <div className="mb-3 flex items-start gap-3 rounded-[18px] border-2 border-dashed border-[#ffc928]/70 bg-[#fff9e6] px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
              <Flame className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <p className="min-w-0 flex-1 pt-1 text-[13px] leading-snug font-bold text-[#5c4810]">
              Open match still live — finish it before sending a new challenge.
            </p>
          </div>
        ) : null}

        {/* Incoming challenges — was missing from hub */}
        {incoming.length > 0 ? (
          <section className="mb-4 space-y-2">
            <h2 className="px-0.5 text-[10px] font-black tracking-[0.12em] text-arc-purple-500 uppercase">
              Challenging you
            </h2>
            {incoming.map((b) => (
              <Link
                key={b.id}
                href={battleHref(b)}
                className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-arc-purple-500/30 bg-white p-3.5 shadow-[0_5px_0_#4b2fd6]/20 transition-colors hover:border-arc-purple-500/55 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]">
                  <Swords className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
                    Accept or decline
                  </span>
                  <span className="mt-0.5 block truncate font-display text-[16px] font-bold text-[#0f1220]">
                    {rivalName(b).split(" ")[0]} challenged you
                  </span>
                  <span className="mt-0.5 block text-[12px] font-bold text-arc-lavender-600">
                    {b.subject}
                    {b.topic ? ` · ${b.topic}` : ""} · {b.stakePerPlayer}c stake
                  </span>
                </span>
                <span className="shrink-0 rounded-xl bg-arc-purple-500 px-3 py-2 text-[12px] font-extrabold text-white shadow-[0_3px_0_#4b2fd6]">
                  Open
                </span>
              </Link>
            ))}
          </section>
        ) : null}

        {/* Spotlight active / outgoing */}
        {spotlight ? (
          <div className="mb-4">
            {wasBlocked ? (
              <p className="mb-1.5 text-[11px] font-black tracking-[0.1em] text-[#c79a2e] uppercase">
                Finish this first
              </p>
            ) : null}
            <Link
              href={battleHref(spotlight)}
              className="flex cursor-pointer items-center gap-3 overflow-hidden rounded-[20px] bg-[#ffc928] p-3.5 text-[#0f1220] shadow-[0_6px_0_#c79a2e] transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#0f1220] focus-visible:outline-none"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928]">
                <Swords className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-black tracking-[0.1em] uppercase">
                  {battleStatusLabel(spotlight.status)} · active
                </span>
                <span className="mt-0.5 block truncate font-display text-[16px] font-bold">
                  vs {rivalName(spotlight).split(" ")[0]}
                </span>
                <span className="mt-0.5 block text-[12px] font-bold text-[#5c4810]">
                  {spotlight.subject}
                  {spotlight.topic ? ` · ${spotlight.topic}` : ""} ·{" "}
                  {spotlight.yourScore}–{spotlight.theirScore}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            </Link>
            {spotlight.status === "invited" &&
            spotlight.role === "challenger" ? (
              <button
                type="button"
                onClick={() => void cancelBlocking()}
                disabled={cancelling}
                className="mt-2 w-full cursor-pointer rounded-[14px] py-2.5 text-[12px] font-extrabold text-arc-lavender-600 transition-colors hover:text-[#0f1220] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none disabled:opacity-50"
              >
                {cancelling ? "Leaving…" : "Cancel invite"}
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Primary CTA */}
        <Link
          href={blocking ? battleHref(blocking) : "/battle/create"}
          className={cn(
            "flex cursor-pointer items-center gap-3.5 overflow-hidden rounded-[22px] p-4 text-white transition-opacity focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:outline-none",
            blocking
              ? "bg-arc-purple-500/55 shadow-[0_6px_0_#4b2fd6]/40"
              : "bg-arc-purple-500 shadow-[0_6px_0_#4b2fd6]",
          )}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Swords className="h-7 w-7" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[18px] leading-tight font-bold tracking-[-0.02em]">
              {blocking ? "Resume open match" : "Challenge a friend"}
            </span>
            <span className="mt-1 block text-[13px] font-bold text-white/75">
              {blocking
                ? "Finish before sending a new invite"
                : "Stake coins · timed quiz · winner takes pot"}
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 opacity-80" strokeWidth={2.5} />
        </Link>

        {/* Open matches */}
        {hasOpen ? (
          <section className="mt-6 space-y-2.5">
            <h2 className="px-0.5 font-display text-[18px] font-semibold text-[#0f1220]">
              Open matches
            </h2>

            {liveRest.map((b) => (
              <Link
                key={b.id}
                href={battleHref(b)}
                className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3 shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928]">
                  <Swords className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-[#ff5a5a]/15 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#d63030] uppercase">
                      {battleStatusLabel(b.status)}
                    </span>
                    <span className="text-[11px] font-bold text-arc-lavender-600">
                      R{b.currentRound}/{b.questionCount}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate font-display text-[15px] font-bold text-[#0f1220]">
                    vs {rivalName(b)}
                  </span>
                  <span className="text-[12px] font-bold text-arc-lavender-600">
                    {b.subject} · {b.yourScore}–{b.theirScore} · {b.pot}c pot
                  </span>
                </span>
                <span className="rounded-full bg-arc-purple-500 px-3 py-1.5 text-[11px] font-extrabold text-white">
                  Resume
                </span>
              </Link>
            ))}

            {outgoingRest.map((invite) => (
              <Link
                key={invite.id}
                href={battleHref(invite)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.1em] text-arc-lavender-500 uppercase">
                    Waiting on reply
                  </p>
                  <p className="truncate font-display text-[14px] font-bold text-[#0f1220]">
                    {rivalName(invite)} · {invite.subject}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-extrabold text-arc-lavender-600">
                  {invite.stakePerPlayer}c
                </span>
              </Link>
            ))}
          </section>
        ) : null}

        {/* Rivals */}
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
            <div>
              <h2 className="font-display text-[18px] font-semibold text-[#0f1220]">
                Rivals
              </h2>
              <p className="mt-0.5 text-[12px] font-bold text-arc-lavender-600">
                {online.length > 0
                  ? `${online.length} online now`
                  : "Search or invite crew"}
              </p>
            </div>
            <Link
              href="/friends"
              className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-extrabold text-arc-purple-500 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
            >
              <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
              Friends
            </Link>
          </div>

          <label className="mb-3 flex items-center gap-2 rounded-[16px] border-2 border-[#ebe4f6] bg-white px-3.5 py-2.5 shadow-[0_3px_0_#ebe4f6] focus-within:border-[#0f1220]/25">
            <Search
              className="h-4 w-4 shrink-0 text-arc-lavender-400"
              strokeWidth={2.25}
            />
            <span className="sr-only">Search users</span>
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-display text-[14px] font-semibold text-[#0f1220] outline-none placeholder:text-arc-lavender-400"
            />
            {searching ? (
              <span className="text-[11px] font-bold text-arc-lavender-400">
                …
              </span>
            ) : userQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setUserQuery("")}
                className="cursor-pointer rounded-full p-0.5 text-arc-lavender-400 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            ) : null}
          </label>

          {searchingUsers ? (
            <ul className="space-y-2">
              {searching && searchHits.length === 0 ? (
                <li className="rounded-[18px] border-2 border-dashed border-[#d5ccec] bg-white/80 px-4 py-6 text-center text-[12px] font-bold text-arc-lavender-600">
                  Searching…
                </li>
              ) : searchHits.length === 0 ? (
                <li className="rounded-[18px] border-2 border-dashed border-[#d5ccec] bg-white/80 px-4 py-6 text-center text-[12px] font-bold text-arc-lavender-600">
                  No users match “{userQuery.trim()}”
                </li>
              ) : (
                searchHits.map((hit) => (
                  <li key={hit.userId}>
                    <Link
                      href={`/friends/${hit.userId}`}
                      className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_3px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
                    >
                      <span className="relative h-11 w-11 shrink-0">
                        <UserAvatar
                          initial={hit.initial}
                          color={hit.color}
                          avatarUrl={hit.avatarUrl}
                          className="h-11 w-11 rounded-2xl font-display text-[16px]"
                          textClassName="text-[16px]"
                          alt=""
                        />
                        <span
                          className={cn(
                            "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                            hit.online ? "bg-[#16c784]" : "bg-[#c3badb]",
                          )}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[14px] font-bold text-[#0f1220]">
                          {hit.name}
                        </p>
                        <p className="text-[11px] font-bold text-arc-lavender-600">
                          {hit.username ? `@${hit.username} · ` : ""}
                          Lv {hit.level} · {hit.league}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-extrabold text-arc-purple-500">
                        {hit.relationship === "friend"
                          ? "Friend"
                          : hit.relationship === "outgoing"
                            ? "Pending"
                            : "View"}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          ) : online.length === 0 ? (
            <Link
              href="/friends"
              className="flex cursor-pointer flex-col items-center rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-6 text-center transition-colors hover:border-arc-purple-500/40 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
            >
              <Users
                className="h-8 w-8 text-arc-purple-500"
                strokeWidth={2}
              />
              <p className="mt-3 font-display text-[15px] font-bold text-[#0f1220]">
                No rivals online
              </p>
              <p className="mt-1 text-[12px] font-bold text-arc-lavender-600">
                Add friends, then challenge them here.
              </p>
            </Link>
          ) : (
            <ul className="space-y-2">
              {online.map((f) => (
                <li key={f.userId}>
                  <Link
                    href={
                      blocking
                        ? battleHref(blocking)
                        : `/battle/create?opponent=${f.userId}`
                    }
                    className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white px-3 py-3 shadow-[0_4px_0_#ebe4f6] transition-colors hover:border-[#ffc928]/60 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
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
                      <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-[#16c784] ring-2 ring-white" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[15px] font-bold text-[#0f1220]">
                        {f.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-bold text-[#178a52]">
                        Online · Lv {f.level} · {f.league}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-xl px-3 py-2 text-[12px] font-extrabold",
                        blocking
                          ? "bg-[#f6f2ff] text-arc-lavender-600"
                          : "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]",
                      )}
                    >
                      {blocking ? "Busy" : "Fight"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* History */}
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
            <h2 className="font-display text-[18px] font-semibold text-[#0f1220]">
              Previous results
            </h2>
            <p className="text-[11px] font-extrabold text-arc-lavender-600">
              {statsData.played} played
            </p>
          </div>

          {historyItems.length === 0 ? (
            <div className="rounded-[18px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-6 text-center">
              <Trophy
                className="mx-auto h-8 w-8 text-arc-purple-500"
                strokeWidth={2}
              />
              <p className="mt-3 font-display text-[15px] font-bold text-[#0f1220]">
                No battles yet
              </p>
              <p className="mt-1 text-[12px] font-bold text-arc-lavender-600">
                Challenge a friend — results land here.
              </p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6]">
              {historyItems.map((h, i) => {
                const win = h.result === "win";
                const draw = h.result === "draw";
                return (
                  <li
                    key={`${h.id}-${h.createdAt}`}
                    className={cn(
                      i < historyItems.length - 1 &&
                        "border-b border-[#f0ecf7]",
                    )}
                  >
                    <Link
                      href={`/battle/result/${h.id}`}
                      className="flex cursor-pointer items-center gap-3 px-3.5 py-3.5 transition-colors hover:bg-[#faf8ff] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500 focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black uppercase",
                          win && "bg-[#eef9f3] text-[#178a52]",
                          draw && "bg-[#f0ecf7] text-arc-lavender-600",
                          !win && !draw && "bg-[#fff5f5] text-[#e5484d]",
                        )}
                      >
                        {win ? "W" : draw ? "D" : "L"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[14px] font-bold text-[#0f1220]">
                          vs {h.opponentName.split(" ")[0]}
                        </span>
                        <span className="text-[11px] font-bold text-arc-lavender-600">
                          {h.subject}
                          {h.topic ? ` · ${h.topic}` : ""} · {h.yourScore}–
                          {h.theirScore}
                        </span>
                      </span>
                      <span className="text-right">
                        <span
                          className={cn(
                            "block font-display text-[14px] font-bold",
                            h.coinsDelta >= 0
                              ? "text-[#178a52]"
                              : "text-[#e5484d]",
                          )}
                        >
                          {h.coinsDelta > 0 ? "+" : ""}
                          {h.coinsDelta}c
                        </span>
                        <span className="text-[10px] font-bold text-arc-lavender-400">
                          +{h.xpAwarded} XP
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {historyCursor ? (
            <button
              type="button"
              onClick={() => loadMore.mutate()}
              disabled={loadMore.isPending}
              className="mt-2.5 w-full cursor-pointer rounded-[14px] border-2 border-dashed border-[#d5ccec] bg-white py-3 text-[12px] font-extrabold text-[#4a3d78] transition-colors hover:border-arc-purple-500/40 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none disabled:opacity-50"
            >
              {loadMore.isPending ? "Loading…" : "Load more results"}
            </button>
          ) : null}
        </section>

        <Link
          href="/leaderboard"
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-[#0f1220] py-3.5 font-display text-[13px] font-semibold text-white shadow-[0_3px_0_#2a2f45] transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
        >
          <Trophy className="h-4 w-4 text-[#ffc928]" strokeWidth={2.5} />
          League board
        </Link>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] px-2.5 py-2.5",
        accent
          ? "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]"
          : "bg-white/8 text-white",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1 text-[9px] font-black tracking-[0.1em] uppercase",
          accent ? "text-[#5c4810]" : "text-white/45",
        )}
      >
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-[20px] leading-none font-bold tracking-[-0.03em] tabular-nums">
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            "mt-1 truncate text-[9px] font-bold",
            accent ? "text-[#5c4810]/80" : "text-white/40",
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}
