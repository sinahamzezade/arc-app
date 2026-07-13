"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Copy, Gift, Search, Swords, UserPlus, Users } from "lucide-react";
import { motion } from "motion/react";
import {
  referralsApi,
  referralStatusLabel,
  type ReferralMeResponse,
} from "@/lib/api/referrals";
import {
  socialApi,
  type FriendRequestDto,
  type SocialFriendDto,
  type SocialSearchHitDto,
} from "@/lib/api/social";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const filters = ["Crew", "Following", "Requests"] as const;

/**
 * Friends = editorial contact sheet.
 * Search (≥2 chars) hits GET /social/search.
 * Battle rail → /battle/create?opponent=<uuid> (friends-only).
 */
export default function FriendsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Crew");
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

  const referralUrl = referral?.defaultUrl ?? "Loading link…";
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
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: created.share.title,
            text: created.share.text,
            url: created.url,
          });
        } else {
          await navigator.clipboard.writeText(created.url);
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
        await navigator.clipboard.writeText(referral.defaultUrl);
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
      // refresh search relationship if open
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

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <header className="relative overflow-hidden bg-[#1b1433] px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-20px] h-32 w-32 rounded-full bg-arc-purple-500/30 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Social
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-none font-bold tracking-[-0.04em]">
              Your crew
            </h1>
          </div>
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold text-white/50">
              {online.length} online now
            </p>
            <div className="mt-3 flex items-center">
              {online.slice(0, 5).map((f, i) => (
                <span
                  key={f.userId}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl font-display text-[16px] font-bold text-white ring-2 ring-[#1b1433]"
                  style={{
                    background: f.color,
                    marginLeft: i === 0 ? 0 : -12,
                    zIndex: online.length - i,
                  }}
                >
                  {f.initial}
                </span>
              ))}
            </div>
          </div>
          <p className="max-w-[7.5rem] text-right text-[12px] leading-snug font-semibold text-white/55">
            Battle · Study · Invite — same crew loop.
          </p>
        </div>
      </header>

      <div className="relative -mt-8 px-4 pb-10">
        <motion.button
          type="button"
          onClick={() => void copy()}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          className="relative flex w-full overflow-hidden rounded-[18px] border-2 border-dashed border-[#c79a2e] bg-[#fff8e8] text-left shadow-[0_14px_28px_rgba(199,154,46,0.2)]"
        >
          <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center bg-[#ffc928] px-2 py-4 text-[#1b1730]">
            <Gift className="h-5 w-5" strokeWidth={2.5} />
            <p className="mt-1 text-[9px] font-black tracking-wide uppercase">
              Refer
            </p>
          </div>
          <div className="min-w-0 flex-1 px-3.5 py-3.5">
            <p className="font-display text-[16px] font-bold text-[#1b1730]">
              Invite & earn
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-[#8a6a1e]">
              {inviterCoins} coins when they qualify · friend gets {friendCoins}c
              +{friendXp} XP
            </p>
            <p className="mt-2 truncate font-mono text-[11px] text-[#c79a2e]">
              {referralUrl}
            </p>
            {referral?.code ? (
              <p className="mt-1 text-[10px] font-extrabold tracking-wide text-[#8a6a1e] uppercase">
                Code {referral.code}
              </p>
            ) : null}
          </div>
          <div className="flex items-center pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b1730] text-white">
              <Copy className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </div>
        </motion.button>
        {copied ? (
          <p className="mt-2 text-center text-[12px] font-bold text-[#178a52]">
            Shared / copied
          </p>
        ) : null}

        {referral ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                ["Clicks", referral.stats.eligibleClicks],
                ["Signups", referral.stats.signups],
                ["Rewarded", referral.stats.rewarded],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-[16px] border border-[#ebe4f6] bg-white px-2.5 py-2.5 text-center"
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
          <div className="mt-3 overflow-hidden rounded-[18px] border border-[#ebe4f6] bg-white">
            <p className="border-b border-[#f0ecf7] px-3.5 py-2.5 text-[11px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
              Invites
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
                  <span className="shrink-0 rounded-full bg-[#f6f2ff] px-2 py-0.5 text-[10px] font-extrabold text-arc-purple-500 uppercase">
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

        <div className="mt-3 flex gap-2">
          <input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
            placeholder="Have a code?"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-[14px] border border-[#ebe4f6] bg-white px-3 py-2.5 font-mono text-[13px] font-semibold text-[#1b1730] outline-none placeholder:text-[#c3badb]"
          />
          <button
            type="button"
            disabled={claimBusy || !claimCode.trim()}
            onClick={() => void claim()}
            className="rounded-[14px] bg-[#1b1730] px-3.5 py-2.5 text-[12px] font-extrabold tracking-wide text-white uppercase disabled:opacity-40"
          >
            Claim
          </button>
        </div>
        {claimMsg ? (
          <p className="mt-2 text-center text-[12px] font-bold text-[#178a52]">
            {claimMsg}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-center text-[12px] font-bold text-[#e5484d]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex items-center gap-2 border-b border-[#d5ccec] px-0.5 pb-2">
          <Search className="h-4 w-4 text-[#b3a8d6]" strokeWidth={2.25} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find someone…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent font-display text-[16px] font-semibold text-[#1b1730] outline-none placeholder:text-[#c3badb]"
          />
          {searching ? (
            <span className="text-[11px] font-bold text-[#b3a8d6]">…</span>
          ) : null}
        </div>

        {searchingUsers ? (
          <section className="mt-5">
            <p className="mb-3 text-[11px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
              Search results
            </p>
            <ul className="space-y-3">
              {searching && searchHits.length === 0 ? (
                <li className="py-8 text-center text-[13px] font-bold text-[#8a7cb8]">
                  Searching…
                </li>
              ) : searchHits.length === 0 ? (
                <li className="rounded-[24px] border border-dashed border-[#d5ccec] bg-white/60 px-5 py-10 text-center">
                  <p className="font-display text-[16px] font-semibold text-[#8a7cb8]">
                    No users match “{query.trim()}”
                  </p>
                </li>
              ) : (
                searchHits.map((f, i) => (
                  <motion.li
                    key={f.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-stretch overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_22px_rgba(70,40,150,0.06)]"
                  >
                    <Link
                      href={`/friends/${f.userId}`}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3.5"
                    >
                      <span
                        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] font-display text-[17px] font-bold text-white"
                        style={{ background: f.color }}
                      >
                        {f.initial}
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
                          className="flex flex-1 items-center justify-center bg-arc-purple-500 text-white"
                        >
                          <Swords className="h-4 w-4" strokeWidth={2.5} />
                        </Link>
                      ) : f.relationship === "outgoing" ? (
                        <span className="flex flex-1 items-center justify-center bg-[#f6f2ff] text-[9px] font-black tracking-wide text-[#8a7cb8] uppercase">
                          Sent
                        </span>
                      ) : f.relationship === "incoming" &&
                        f.pendingRequestId ? (
                        <button
                          type="button"
                          aria-label={`Accept ${f.name}`}
                          onClick={() => void acceptRequest(f.pendingRequestId!)}
                          className="flex flex-1 items-center justify-center bg-[#16a56b] text-[9px] font-black tracking-wide text-white uppercase"
                        >
                          Accept
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label={`Add ${f.name}`}
                            disabled={addingId === f.userId}
                            onClick={() => void addFriend(f.userId)}
                            className="flex flex-1 items-center justify-center bg-[#fff8e8] text-[#c79a2e] disabled:opacity-50"
                          >
                            <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            aria-label={
                              f.isFollowing
                                ? `Unfollow ${f.name}`
                                : `Follow ${f.name}`
                            }
                            disabled={followBusyId === f.userId}
                            onClick={() =>
                              void toggleFollow(f.userId, Boolean(f.isFollowing))
                            }
                            className="flex flex-1 items-center justify-center border-t border-[#f0ecf7] bg-white text-[9px] font-black tracking-wide text-arc-purple-500 uppercase disabled:opacity-50"
                          >
                            {f.isFollowing ? "Unf" : "Fol"}
                          </button>
                        </>
                      )}
                    </div>
                  </motion.li>
                ))
              )}
            </ul>
          </section>
        ) : (
          <>
            <nav className="mt-4 flex gap-5 border-b border-[#ebe4f6]">
              {filters.map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "relative pb-2.5 font-display text-[14px] font-semibold",
                      active ? "text-[#1b1730]" : "text-[#b3a8d6]",
                    )}
                  >
                    {f}
                    {f === "Requests" && requests.length > 0 ? (
                      <span className="ml-1 text-[11px] font-black text-arc-purple-500">
                        {requests.length}
                      </span>
                    ) : null}
                    {active ? (
                      <motion.span
                        layoutId="friends-filter-line"
                        className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#ffc928]"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {filter === "Crew" ? (
              <ul className="mt-5 space-y-3">
                {loading ? (
                  <li className="py-10 text-center text-[13px] font-bold text-[#8a7cb8]">
                    Loading crew…
                  </li>
                ) : filtered.length === 0 ? (
                  <li className="rounded-[24px] border border-dashed border-[#d5ccec] bg-white/60 px-5 py-12 text-center">
                    <p className="font-display text-[18px] font-semibold text-[#8a7cb8]">
                      Crew empty
                    </p>
                    <p className="mt-2 text-[13px] font-semibold text-[#b3a8d6]">
                      Type a name above to find people.
                    </p>
                  </li>
                ) : (
                  filtered.map((f, i) => {
                    const offset = i % 2 === 1;
                    return (
                      <motion.li
                        key={f.userId}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn(
                          "flex items-stretch gap-0 overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_8px_22px_rgba(70,40,150,0.06)]",
                          offset && "ml-3",
                          !offset && "mr-3",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3.5">
                          <span
                            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] font-display text-[17px] font-bold text-white"
                            style={{ background: f.color }}
                          >
                            {f.initial}
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
                              Lv {f.level} · {f.league}
                              {f.online ? " · Live" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex w-12 shrink-0 flex-col border-l border-[#f0ecf7]">
                          <Link
                            href={`/battle/create?opponent=${f.userId}`}
                            aria-label={`Battle ${f.name}`}
                            className="flex flex-1 items-center justify-center bg-arc-purple-500 text-white"
                          >
                            <Swords className="h-4 w-4" strokeWidth={2.5} />
                          </Link>
                          <Link
                            href={`/study/invite?friend=${f.userId}`}
                            aria-label={`Study with ${f.name}`}
                            className="flex flex-1 items-center justify-center bg-[#fff8e8] text-[#c79a2e]"
                          >
                            <Users className="h-4 w-4" strokeWidth={2.25} />
                          </Link>
                        </div>
                      </motion.li>
                    );
                  })
                )}
              </ul>
            ) : filter === "Requests" ? (
              <ul className="mt-5 space-y-3">
                {requests.length === 0 ? (
                  <li className="rounded-[24px] border border-dashed border-[#d5ccec] bg-white/60 px-5 py-12 text-center">
                    <p className="font-display text-[18px] font-semibold text-[#8a7cb8]">
                      No requests
                    </p>
                  </li>
                ) : (
                  requests.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-[22px] border border-[#ebe4f6] bg-white px-3.5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[15px] font-semibold text-[#1b1730]">
                          {r.from?.displayName ||
                            r.from?.username ||
                            "Someone"}
                        </p>
                        <p className="text-[11px] font-bold text-[#8a7cb8]">
                          Wants to join your crew
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void acceptRequest(r.id)}
                        className="rounded-xl bg-arc-purple-500 px-3 py-2 text-[12px] font-extrabold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void declineRequest(r.id)}
                        className="rounded-xl border border-[#ebe4f6] px-3 py-2 text-[12px] font-extrabold text-[#8a7cb8]"
                      >
                        No
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <ul className="mt-5 space-y-3">
                {loading ? (
                  <li className="py-10 text-center text-[13px] font-bold text-[#8a7cb8]">
                    Loading…
                  </li>
                ) : following.length === 0 ? (
                  <li className="rounded-[24px] border border-dashed border-[#d5ccec] bg-white/60 px-5 py-12 text-center">
                    <p className="font-display text-[18px] font-semibold text-[#8a7cb8]">
                      Following empty
                    </p>
                    <p className="mt-2 text-[13px] font-semibold text-[#b3a8d6]">
                      Search someone and tap Fol.
                    </p>
                  </li>
                ) : (
                  following.map((f, i) => (
                    <motion.li
                      key={f.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-[22px] border border-[#ebe4f6] bg-white px-3.5 py-3.5 shadow-[0_8px_22px_rgba(70,40,150,0.06)]"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] font-display text-[15px] font-bold text-white"
                        style={{ background: f.color }}
                      >
                        {f.initial}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[15px] font-semibold text-[#1b1730]">
                          {f.name}
                        </p>
                        <p className="text-[11px] font-bold text-[#8a7cb8]">
                          Lv {f.level} · {f.league}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={followBusyId === f.userId}
                        onClick={() => void toggleFollow(f.userId, true)}
                        className="rounded-xl border border-[#ebe4f6] px-3 py-2 text-[11px] font-extrabold text-[#8a7cb8] disabled:opacity-50"
                      >
                        Unfollow
                      </button>
                    </motion.li>
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
