"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { FriendsSkeleton } from "@/components/friends/FriendsSkeleton";
import {
  Check,
  Copy,
  Gift,
  Search,
  Swords,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  referralsApi,
  referralStatusLabel,
  type ReferralMeResponse,
} from "@/lib/api/referrals";
import { toPublicReferralUrl } from "@/lib/referrals/public-url";
import {
  socialApi,
  type FriendRequestDto,
  type SocialFriendDto,
  type SocialSearchHitDto,
} from "@/lib/api/social";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "crew", label: "Crew" },
  { id: "following", label: "Following" },
  { id: "requests", label: "Requests" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function tabFromParam(raw: string | null): TabId {
  if (raw === "requests" || raw === "following" || raw === "crew") return raw;
  return "crew";
}

/**
 * Friends hub — night crew hero + light sheet.
 * Search (≥2 chars) → GET /social/search.
 * Battle → /battle/create?opponent=<uuid>
 */
export default function FriendsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<TabId>(() =>
    tabFromParam(searchParams.get("tab")),
  );
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<SocialFriendDto[]>([]);
  const [following, setFollowing] = useState<SocialFriendDto[]>([]);
  const [requests, setRequests] = useState<FriendRequestDto[]>([]);
  const [referral, setReferral] = useState<ReferralMeResponse | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<SocialSearchHitDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [crew, me, incoming, followingRes] = await Promise.all([
        socialApi.friends(),
        referralsApi.me(),
        socialApi.incomingRequests(),
        socialApi.following(),
      ]);
      setFriends(crew.items);
      setReferral(me);
      setRequests(incoming.items);
      setFollowing(followingRes.items);
      void socialApi.heartbeat().catch(() => undefined);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load crew",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setFilter(tabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  const setTab = (id: TabId) => {
    setFilter(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === "crew") params.delete("tab");
    else params.set("tab", id);
    const q = params.toString();
    router.replace(q ? `/friends?${q}` : "/friends", { scroll: false });
  };

  const searchingUsers = query.trim().length >= 2;

  useEffect(() => {
    if (!searchingUsers) {
      setSearchHits([]);
      setSearching(false);
      return;
    }
    const q = query.trim();
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await socialApi.search(q);
          if (!cancelled) setSearchHits(res.items);
        } catch (err) {
          if (!cancelled) {
            setSearchHits([]);
            setError(
              err instanceof ApiError
                ? messageForCode(err.code, err.message)
                : "Search failed",
            );
          }
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, searchingUsers]);

  const online = friends.filter((f) => f.online);
  const filtered = friends.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );

  const referralUrl = referral?.defaultUrl
    ? toPublicReferralUrl(referral.defaultUrl)
    : "Loading link…";
  const inviterCoins =
    referral?.rewardPreview.perQualifiedFriend.coins ?? 300;
  const friendCoins = referral?.rewardPreview.friendGets.coins ?? 150;
  const friendXp = referral?.rewardPreview.friendGets.lifetimeXp ?? 50;

  const copy = async () => {
    if (!referral?.defaultUrl) return;
    try {
      let linkId: string | null = null;
      try {
        const created = await referralsApi.createLink({
          channel:
            typeof navigator !== "undefined" && "share" in navigator
              ? "native_share"
              : "copy_link",
          campaign: "friends_hub",
        });
        linkId = created.linkId;
        const shareUrl = toPublicReferralUrl(created.url);
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: created.share.title,
            text: created.share.text,
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
        }
        if (linkId) {
          void referralsApi.shareEvent(linkId, {
            clientEventId: crypto.randomUUID(),
            eventType: "share_option_tapped",
            channel:
              typeof navigator !== "undefined" && "share" in navigator
                ? "native_share"
                : "copy_link",
          });
        }
      } catch {
        await navigator.clipboard.writeText(
          toPublicReferralUrl(referral.defaultUrl),
        );
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const claim = async () => {
    const code = claimCode.trim();
    if (!code) return;
    setClaimBusy(true);
    setClaimMsg(null);
    setError(null);
    try {
      await referralsApi.claimCode(code);
      setClaimMsg("Code claimed — finish onboarding to unlock rewards.");
      setClaimCode("");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not claim code",
      );
    } finally {
      setClaimBusy(false);
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      await socialApi.acceptRequest(id);
      await load();
      if (searchingUsers) {
        const res = await socialApi.search(query.trim());
        setSearchHits(res.items);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Accept failed",
      );
    }
  };

  const declineRequest = async (id: string) => {
    try {
      await socialApi.declineRequest(id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Decline failed",
      );
    }
  };

  const addFriend = async (userId: string) => {
    setAddingId(userId);
    setError(null);
    try {
      await socialApi.sendFriendRequest(userId);
      const res = await socialApi.search(query.trim());
      setSearchHits(res.items);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not send request",
      );
    } finally {
      setAddingId(null);
    }
  };

  const toggleFollow = async (userId: string, currentlyFollowing: boolean) => {
    setFollowBusyId(userId);
    setError(null);
    try {
      if (currentlyFollowing) await socialApi.unfollow(userId);
      else await socialApi.follow(userId);
      if (searchingUsers) {
        const res = await socialApi.search(query.trim());
        setSearchHits(res.items);
      }
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Follow failed",
      );
    } finally {
      setFollowBusyId(null);
    }
  };

  if (loading && friends.length === 0 && !error) {
    return <FriendsSkeleton />;
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-8 h-44 w-44 rounded-full bg-arc-purple-500/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 -left-10 h-32 w-32 rounded-full bg-[#ffc928]/12 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 16% 24%, #fff, transparent), radial-gradient(1px 1px at 78% 16%, #fff, transparent), radial-gradient(1.5px 1.5px at 52% 62%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton tone="dark" fallbackHref="/home" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Social
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-none font-bold tracking-[-0.04em]">
              Your crew
            </h1>
          </div>
          <span className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-center">
            <p className="font-display text-[18px] leading-none font-bold tabular-nums">
              {friends.length}
            </p>
            <p className="mt-0.5 text-[9px] font-black tracking-wide text-white/45 uppercase">
              friends
            </p>
          </span>
        </div>

        <div className="relative mt-5 flex items-center gap-3">
          <div className="flex items-center">
            {online.length === 0 ? (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Users className="h-5 w-5 text-white/40" strokeWidth={2.25} />
              </span>
            ) : (
              online.slice(0, 5).map((f, i) => (
                <span
                  key={f.userId}
                  className="relative"
                  style={{
                    marginLeft: i === 0 ? 0 : -10,
                    zIndex: online.length - i,
                  }}
                >
                  <UserAvatar
                    initial={f.initial}
                    color={f.color}
                    avatarUrl={f.avatarUrl}
                    className="h-11 w-11 rounded-2xl font-display text-[15px] ring-2 ring-[#0f1220]"
                    textClassName="text-[15px]"
                    alt=""
                  />
                </span>
              ))
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-white">
              {online.length} online
            </p>
            <p className="text-[11px] font-bold text-white/45">
              Battle · Study · Invite
            </p>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-6 space-y-3 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-10">
        {/* Invite */}
        <motion.button
          type="button"
          onClick={() => void copy()}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98, y: 2 }}
          className="relative flex w-full cursor-pointer overflow-hidden rounded-[20px] border-2 border-[#0f1220] bg-[#ffc928] text-left shadow-[0_5px_0_#c79a2e] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1220]"
        >
          <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-[#0f1220] text-[#ffc928]">
            <Gift className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1 px-3.5 py-3">
            <p className="font-display text-[16px] font-bold text-[#0f1220]">
              Invite & earn
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-[#0f1220]/65">
              You {inviterCoins}c · friend {friendCoins}c +{friendXp} XP
            </p>
            <p className="mt-1 truncate font-mono text-[11px] text-[#0f1220]/45">
              {referralUrl}
            </p>
          </div>
          <div className="flex items-center pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f1220] text-white">
              {copied ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={2.25} />
              )}
            </span>
          </div>
        </motion.button>
        {copied ? (
          <p className="text-center text-[12px] font-bold text-[#178a52]">
            Shared / copied
          </p>
        ) : null}

        {referral ? (
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Clicks", referral.stats.eligibleClicks],
                ["Signups", referral.stats.signups],
                ["Rewarded", referral.stats.rewarded],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-[16px] border-2 border-[#ebe4f6] bg-white px-2.5 py-2.5 text-center shadow-[0_3px_0_#ebe4f6]"
              >
                <p className="font-display text-[18px] font-bold text-[#1b1730] tabular-nums">
                  {value}
                </p>
                <p className="text-[10px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {referral?.recentInvites?.length ? (
          <div className="overflow-hidden rounded-[18px] border-2 border-[#ebe4f6] bg-white shadow-[0_3px_0_#ebe4f6]">
            <p className="border-b border-[#f0ecf7] px-3.5 py-2.5 text-[10px] font-black tracking-[0.12em] text-[#8a7cb8] uppercase">
              Recent invites
            </p>
            <ul>
              {referral.recentInvites.map((inv, i) => (
                <li
                  key={inv.id}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3.5 py-2.5",
                    i < referral.recentInvites.length - 1 &&
                      "border-b border-[#f0ecf7]",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#1b1730]">
                      {inv.displayName}
                    </p>
                    <p className="text-[11px] font-bold text-[#8a7cb8]">
                      {inv.message}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f0ecf7] px-2 py-0.5 text-[10px] font-extrabold text-arc-purple-500 uppercase">
                    {referralStatusLabel(inv.status)}
                  </span>
                </li>
              ))}
            </ul>
            {referral.nextMilestone ? (
              <p className="border-t border-[#f0ecf7] px-3.5 py-2.5 text-[11px] font-bold text-[#8a7cb8]">
                Milestone {referral.nextMilestone.qualifiedCurrent}/
                {referral.nextMilestone.qualifiedRequired} · +
                {referral.nextMilestone.reward.coins} coins
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
            placeholder="Have a code?"
            autoComplete="off"
            aria-label="Referral code"
            className="min-w-0 flex-1 rounded-[14px] border-2 border-[#ebe4f6] bg-white px-3 py-2.5 font-mono text-[13px] font-semibold text-[#1b1730] outline-none placeholder:text-[#c3badb] focus-visible:border-arc-purple-500"
          />
          <button
            type="button"
            disabled={claimBusy || !claimCode.trim()}
            onClick={() => void claim()}
            className="cursor-pointer rounded-[14px] bg-[#0f1220] px-3.5 py-2.5 text-[12px] font-extrabold tracking-wide text-white uppercase transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Claim
          </button>
        </div>
        {claimMsg ? (
          <p className="text-center text-[12px] font-bold text-[#178a52]">
            {claimMsg}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-[#ff5a5a]/25 bg-[#ff5a5a]/10 px-3 py-2 text-center text-[12px] font-bold text-[#d63030]"
          >
            {error}
          </p>
        ) : null}

        {/* Search */}
        <label className="flex items-center gap-2.5 rounded-[16px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_3px_0_#ebe4f6] focus-within:border-arc-purple-500">
          <Search className="h-4 w-4 shrink-0 text-[#8a7cb8]" strokeWidth={2.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find someone…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent font-display text-[15px] font-semibold text-[#1b1730] outline-none placeholder:text-[#c3badb]"
          />
          {searching ? (
            <span className="text-[11px] font-bold text-[#8a7cb8]">…</span>
          ) : query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="cursor-pointer rounded-lg p-0.5 text-[#8a7cb8] hover:text-[#1b1730]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          ) : null}
        </label>

        {searchingUsers ? (
          <section aria-label="Search results">
            <p className="mb-2 px-0.5 text-[10px] font-black tracking-[0.12em] text-[#8a7cb8] uppercase">
              Results
            </p>
            <ul className="space-y-2.5">
              {searching && searchHits.length === 0 ? (
                <li className="py-10 text-center text-[13px] font-bold text-[#8a7cb8]">
                  Searching…
                </li>
              ) : searchHits.length === 0 ? (
                <EmptyCard
                  title={`No match for “${query.trim()}”`}
                  sub="Try another name or username."
                />
              ) : (
                searchHits.map((f) => (
                  <SearchRow
                    key={f.userId}
                    hit={f}
                    addingId={addingId}
                    followBusyId={followBusyId}
                    onAdd={() => void addFriend(f.userId)}
                    onAccept={() =>
                      f.pendingRequestId
                        ? void acceptRequest(f.pendingRequestId)
                        : undefined
                    }
                    onToggleFollow={() =>
                      void toggleFollow(f.userId, Boolean(f.isFollowing))
                    }
                  />
                ))
              )}
            </ul>
          </section>
        ) : (
          <>
            <nav
              aria-label="Friends sections"
              className="flex gap-1 rounded-full border-2 border-[#ebe4f6] bg-white p-1 shadow-[0_3px_0_#ebe4f6]"
            >
              {tabs.map((t) => {
                const active = filter === t.id;
                const count =
                  t.id === "requests"
                    ? requests.length
                    : t.id === "crew"
                      ? friends.length
                      : following.length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full py-2.5 font-display text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
                      active
                        ? "bg-[#0f1220] text-white shadow-[0_2px_0_#2a2f45]"
                        : "text-[#8a7cb8] hover:text-[#1b1730]",
                    )}
                  >
                    {t.label}
                    {count > 0 ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] font-black tabular-nums",
                          active
                            ? "bg-[#ffc928] text-[#0f1220]"
                            : "bg-[#f0ecf7] text-arc-purple-500",
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {filter === "crew" ? (
              <ul className="space-y-2.5" aria-label="Crew">
                {filtered.length === 0 ? (
                  <EmptyCard
                    title="Crew empty"
                    sub="Search above to find people and send a request."
                  />
                ) : (
                  filtered.map((f) => (
                    <CrewRow key={f.userId} friend={f} />
                  ))
                )}
              </ul>
            ) : filter === "requests" ? (
              <ul className="space-y-2.5" aria-label="Friend requests">
                {requests.length === 0 ? (
                  <EmptyCard
                    title="No requests"
                    sub="When someone adds you, they show up here."
                  />
                ) : (
                  requests.map((r) => {
                    const name =
                      r.from?.displayName ||
                      r.from?.username ||
                      "Someone";
                    const initial = name.charAt(0).toUpperCase();
                    return (
                      <li
                        key={r.id}
                        className="flex items-center gap-3 rounded-[20px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_3px_0_#ebe4f6]"
                      >
                        <UserAvatar
                          initial={initial}
                          color="#6B4EFF"
                          avatarUrl={null}
                          className="h-11 w-11 shrink-0 rounded-[14px] font-display text-[15px]"
                          textClassName="text-[15px]"
                          alt=""
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[15px] font-semibold text-[#1b1730]">
                            {name}
                          </p>
                          <p className="text-[11px] font-bold text-[#8a7cb8]">
                            Wants to join your crew
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void acceptRequest(r.id)}
                          className="cursor-pointer rounded-xl bg-arc-purple-500 px-3 py-2 text-[12px] font-extrabold text-white shadow-[0_3px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void declineRequest(r.id)}
                          aria-label={`Decline ${name}`}
                          className="cursor-pointer rounded-xl border-2 border-[#ebe4f6] p-2 text-[#8a7cb8] transition-colors hover:border-[#0f1220]/20 hover:text-[#1b1730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
                        >
                          <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : (
              <ul className="space-y-2.5" aria-label="Following">
                {following.length === 0 ? (
                  <EmptyCard
                    title="Not following anyone"
                    sub="Search someone and tap Follow."
                  />
                ) : (
                  following.map((f) => (
                    <li
                      key={f.userId}
                      className="flex items-center gap-3 rounded-[20px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_3px_0_#ebe4f6]"
                    >
                      <Link
                        href={`/friends/${f.userId}`}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500"
                      >
                        <UserAvatar
                          initial={f.initial}
                          color={f.color}
                          avatarUrl={f.avatarUrl}
                          className="h-11 w-11 rounded-[14px] font-display text-[15px]"
                          textClassName="text-[15px]"
                          alt=""
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[15px] font-semibold text-[#1b1730]">
                            {f.name}
                          </p>
                          <p className="text-[11px] font-bold text-[#8a7cb8]">
                            Lv {f.level} · {f.league}
                          </p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        disabled={followBusyId === f.userId}
                        onClick={() => void toggleFollow(f.userId, true)}
                        className="cursor-pointer rounded-xl border-2 border-[#ebe4f6] px-3 py-2 text-[11px] font-extrabold text-[#8a7cb8] transition-colors hover:border-[#0f1220]/20 hover:text-[#1b1730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Unfollow
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ title, sub }: { title: string; sub: string }) {
  return (
    <li className="rounded-[22px] border-2 border-dashed border-[#d5ccec] bg-white px-5 py-10 text-center">
      <p className="font-display text-[17px] font-semibold text-[#1b1730]">
        {title}
      </p>
      <p className="mt-1.5 text-[13px] font-bold text-[#8a7cb8]">{sub}</p>
    </li>
  );
}

function CrewRow({ friend: f }: { friend: SocialFriendDto }) {
  return (
    <li className="flex items-stretch overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white shadow-[0_3px_0_#ebe4f6]">
      <Link
        href={`/friends/${f.userId}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500"
      >
        <span className="relative h-12 w-12 shrink-0">
          <UserAvatar
            initial={f.initial}
            color={f.color}
            avatarUrl={f.avatarUrl}
            className="h-12 w-12 rounded-[16px] font-display text-[17px]"
            textClassName="text-[17px]"
            alt=""
          />
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white",
              f.online ? "bg-[#16c784]" : "bg-[#c3badb]",
            )}
            title={f.online ? "Online" : "Offline"}
          />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[16px] font-semibold text-[#1b1730]">
            {f.name}
          </p>
          <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
            Lv {f.level} · {f.league}
            {f.online ? " · Live" : ""}
          </p>
        </div>
      </Link>
      <div className="flex w-12 shrink-0 flex-col border-l border-[#f0ecf7]">
        <Link
          href={`/battle/create?opponent=${f.userId}`}
          aria-label={`Battle ${f.name}`}
          className="flex flex-1 cursor-pointer items-center justify-center bg-arc-purple-500 text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffc928]"
        >
          <Swords className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <Link
          href={`/study/invite?friend=${f.userId}`}
          aria-label={`Study with ${f.name}`}
          className="flex flex-1 cursor-pointer items-center justify-center bg-[#ffc928] text-[#0f1220] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f1220]"
        >
          <Users className="h-4 w-4" strokeWidth={2.25} />
        </Link>
      </div>
    </li>
  );
}

function SearchRow({
  hit: f,
  addingId,
  followBusyId,
  onAdd,
  onAccept,
  onToggleFollow,
}: {
  hit: SocialSearchHitDto;
  addingId: string | null;
  followBusyId: string | null;
  onAdd: () => void;
  onAccept: () => void;
  onToggleFollow: () => void;
}) {
  return (
    <li className="flex items-stretch overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white shadow-[0_3px_0_#ebe4f6]">
      <Link
        href={`/friends/${f.userId}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500"
      >
        <span className="relative h-12 w-12 shrink-0">
          <UserAvatar
            initial={f.initial}
            color={f.color}
            avatarUrl={f.avatarUrl}
            className="h-12 w-12 rounded-[16px] font-display text-[17px]"
            textClassName="text-[17px]"
            alt=""
          />
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white",
              f.online ? "bg-[#16c784]" : "bg-[#c3badb]",
            )}
          />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[16px] font-semibold text-[#1b1730]">
            {f.name}
          </p>
          <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
            {f.username ? `@${f.username} · ` : ""}
            Lv {f.level} · {f.league}
          </p>
        </div>
      </Link>
      <div className="flex w-12 shrink-0 flex-col border-l border-[#f0ecf7]">
        {f.relationship === "friend" ? (
          <Link
            href={`/battle/create?opponent=${f.userId}`}
            aria-label={`Battle ${f.name}`}
            className="flex flex-1 cursor-pointer items-center justify-center bg-arc-purple-500 text-white transition-opacity hover:opacity-90"
          >
            <Swords className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        ) : f.relationship === "outgoing" ? (
          <span className="flex flex-1 items-center justify-center bg-[#f0ecf7] text-[9px] font-black tracking-wide text-[#8a7cb8] uppercase">
            Sent
          </span>
        ) : f.relationship === "incoming" && f.pendingRequestId ? (
          <button
            type="button"
            aria-label={`Accept ${f.name}`}
            onClick={onAccept}
            className="flex flex-1 cursor-pointer items-center justify-center bg-[#16a56b] text-[9px] font-black tracking-wide text-white uppercase"
          >
            OK
          </button>
        ) : (
          <>
            <button
              type="button"
              aria-label={`Add ${f.name}`}
              disabled={addingId === f.userId}
              onClick={onAdd}
              className="flex flex-1 cursor-pointer items-center justify-center bg-[#ffc928] text-[#0f1220] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label={
                f.isFollowing ? `Unfollow ${f.name}` : `Follow ${f.name}`
              }
              disabled={followBusyId === f.userId}
              onClick={onToggleFollow}
              className="flex flex-1 cursor-pointer items-center justify-center border-t border-[#f0ecf7] bg-white text-[9px] font-black tracking-wide text-arc-purple-500 uppercase disabled:cursor-not-allowed disabled:opacity-50"
            >
              {f.isFollowing ? "Unf" : "Fol"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
