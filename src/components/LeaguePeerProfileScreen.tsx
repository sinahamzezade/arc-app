"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Flame,
  Swords,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { socialApi, type SocialProfileDto } from "@/lib/api/social";
import type { LeaguePeerProfile } from "@/lib/leaderboard/types";
import { cn } from "@/lib/utils";

const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * League peer passport — night hero + action sheet.
 * Follow/friend/battle/study via SocialPermissionService rules.
 */
export default function LeaguePeerProfileScreen({
  peer,
}: {
  peer: LeaguePeerProfile;
}) {
  const liveId = UUID_RE.test(peer.id) ? peer.id : null;

  const [social, setSocial] = useState<SocialProfileDto | null>(null);
  const [socialLoading, setSocialLoading] = useState(Boolean(liveId));
  const [followBusy, setFollowBusy] = useState(false);
  const [friendBusy, setFriendBusy] = useState(false);
  const [friendSent, setFriendSent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSocial = useCallback(async () => {
    if (!liveId) {
      setSocialLoading(false);
      return;
    }
    setSocialLoading(true);
    try {
      const profile = await socialApi.getProfile(liveId);
      setSocial(profile);
      setActionError(null);
    } catch (err) {
      setSocial(null);
      setActionError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load social profile",
      );
    } finally {
      setSocialLoading(false);
    }
  }, [liveId]);

  useEffect(() => {
    void loadSocial();
  }, [loadSocial]);

  const demoteFloor = peer.cohortSize - peer.demoteBottom + 1;
  const zone =
    peer.rank <= 0
      ? "safe"
      : peer.rank <= peer.promoteTop
        ? "promote"
        : peer.rank >= demoteFloor
          ? "demote"
          : "safe";

  const zoneLabel =
    zone === "promote"
      ? "Promote zone"
      : zone === "demote"
        ? "Demote danger"
        : "Safe midfield";

  const zoneTone =
    zone === "promote"
      ? "bg-[#16a56b]/20 text-[#62d84e]"
      : zone === "demote"
        ? "bg-[#e5484d]/20 text-[#ff8a8a]"
        : "bg-[#ffc928]/20 text-[#ffc928]";

  const isFollowing = Boolean(social?.relationship.isFollowing);
  const canFollow = Boolean(social?.canFollow);
  const canUnfollow = Boolean(social?.canUnfollow ?? isFollowing);
  const canBattle = Boolean(social?.canBattle);
  const canStudy = Boolean(social?.canStudy);
  const isFriend = Boolean(social?.relationship.isFriend);
  const friendPending =
    friendSent || social?.relationship.requestDirection === "outgoing";
  const displayName = social?.name ?? peer.name;
  const username = social?.username;

  const rankPct =
    peer.cohortSize > 0 && peer.rank > 0
      ? Math.max(
          4,
          Math.min(100, ((peer.cohortSize - peer.rank + 1) / peer.cohortSize) * 100),
        )
      : 0;

  async function toggleFollow() {
    if (!liveId || followBusy) return;
    if (!isFollowing && !canFollow) return;
    if (isFollowing && !canUnfollow) return;

    setFollowBusy(true);
    setActionError(null);
    try {
      if (isFollowing) await socialApi.unfollow(liveId);
      else await socialApi.follow(liveId);
      await loadSocial();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Follow failed",
      );
    } finally {
      setFollowBusy(false);
    }
  }

  async function connect() {
    if (!liveId || friendBusy || friendPending || isFriend) return;
    setFriendBusy(true);
    setActionError(null);
    try {
      await socialApi.sendFriendRequest(liveId);
      setFriendSent(true);
      if (!isFollowing && canFollow) {
        try {
          await socialApi.follow(liveId);
        } catch {
          /* friend request landed — follow optional */
        }
      }
      await loadSocial();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Friend request failed",
      );
    } finally {
      setFriendBusy(false);
    }
  }

  if (peer.isYou) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#0f1220] text-[#ffc928] shadow-[0_5px_0_#2a2f45]">
          <Users className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <p className="text-center font-display text-[22px] font-bold text-[#0f1220]">
          That&apos;s you
        </p>
        <p className="max-w-[16rem] text-center text-[13px] font-bold text-arc-lavender-600">
          Open your profile to edit bio, privacy, and season stats.
        </p>
        <Link
          href="/profile"
          className="flex h-12 cursor-pointer items-center justify-center rounded-[18px] bg-arc-purple-500 px-6 font-display text-[15px] font-bold text-white shadow-[0_4px_0_#4b2fd6] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
        >
          Open your profile
        </Link>
        <Link
          href="/leaderboard"
          className="cursor-pointer text-[13px] font-extrabold text-arc-lavender-700 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
        >
          Back to board
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/18 blur-3xl"
        />

        <div className="relative z-[1] flex items-center gap-3">
          <BackButton tone="dark" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              League passport
            </p>
            <p className="truncate text-[13px] font-bold text-white/45">
              {peer.leagueName} · {peer.weekLabel}
            </p>
          </div>
          {peer.rank > 0 ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                zoneTone,
              )}
            >
              {zoneLabel}
            </span>
          ) : null}
        </div>

        {/* Avatar-led identity */}
        <div className="relative z-[1] mt-6 flex flex-col items-center text-center">
          <div className="relative">
            <UserAvatar
              initial={social?.initial ?? peer.initial}
              color={peer.avatarBg}
              textColor={peer.avatarColor}
              avatarUrl={social?.avatarUrl ?? peer.avatarUrl}
              className="h-24 w-24 rounded-[28px] font-display text-[36px] shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-4 ring-[#ffc928]/40"
              textClassName="text-[36px]"
              alt=""
            />
            {peer.rank > 0 ? (
              <span className="absolute -top-2 -right-2 rounded-xl bg-[#ffc928] px-2.5 py-1 font-display text-[14px] font-bold text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
                #{peer.rank}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-[10px] font-black tracking-[0.12em] text-white/40 uppercase">
            {peer.rankTitle}
          </p>
          <h1 className="mt-1 max-w-[18rem] font-display text-[32px] leading-[0.95] font-bold tracking-[-0.04em] text-balance">
            {displayName}
          </h1>
          {username ? (
            <p className="mt-1 text-[13px] font-bold text-white/45">
              @{username}
            </p>
          ) : null}
          <p className="mt-2 text-[13px] leading-snug font-bold text-white/60">
            <span>{peer.fromRole}</span>
            <span className="mx-1.5 text-[#ffc928]">→</span>
            <span className="text-white">{peer.becoming}</span>
          </p>
          {peer.bio ? (
            <p className="mt-3 max-w-[20rem] text-[13px] leading-snug font-bold text-white/50 text-pretty">
              {peer.bio}
            </p>
          ) : null}
        </div>

        <div className="relative z-[1] mt-5 flex flex-wrap justify-center gap-2">
          <Chip>
            <Zap className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
            {peer.xp} XP
          </Chip>
          {peer.streakWeeks != null ? (
            <Chip className="bg-[#ff8a3d]/20 text-[#ff8a3d] ring-[#ff8a3d]/25">
              <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
              {peer.streakWeeks}w streak
            </Chip>
          ) : null}
          {social ? (
            <Chip>
              <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
              {social.counters.followers} followers
            </Chip>
          ) : (
            <Chip>{peer.joinedLabel}</Chip>
          )}
          {isFriend ? (
            <Chip className="bg-[#16a56b]/25 text-[#62d84e] ring-[#16a56b]/35">
              Friend
            </Chip>
          ) : isFollowing ? (
            <Chip className="bg-arc-purple-500/30 text-[#c4b5fd] ring-arc-purple-500/40">
              Following
            </Chip>
          ) : null}
        </div>

        {/* Cohort position meter */}
        {peer.rank > 0 && peer.cohortSize > 0 ? (
          <div className="relative z-[1] mx-auto mt-5 w-full max-w-[20rem]">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold text-white/40 uppercase">
              <span>Top</span>
              <span>
                #{peer.rank} of {peer.cohortSize}
              </span>
              <span>Bot</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300",
                  zone === "promote"
                    ? "bg-[#16c784]"
                    : zone === "demote"
                      ? "bg-[#e5484d]"
                      : "bg-[#ffc928]",
                )}
                style={{ width: `${rankPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-white/45">
              <span className="inline-flex items-center gap-0.5 text-[#62d84e]">
                <ArrowUp className="h-3 w-3" strokeWidth={3} />
                Top {peer.promoteTop}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[#ff8a8a]">
                Bot {peer.demoteBottom}
                <ArrowDown className="h-3 w-3" strokeWidth={3} />
              </span>
            </div>
          </div>
        ) : null}
      </header>

      <div className="relative z-10 -mt-8 space-y-3 rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        {/* Week stats */}
        <div className="relative overflow-hidden rounded-[22px] bg-[#0f1220] p-4 text-white shadow-[0_6px_0_#2a2f45]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 right-0 h-28 w-28 rounded-full bg-[#ffc928]/15 blur-3xl"
          />
          <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#ffc928] uppercase">
            This week
          </p>
          <div className="relative z-[1] mt-3 grid grid-cols-3 gap-2">
            <StatCell
              label="Lessons"
              value={String(peer.lessonsThisWeek)}
              icon={Zap}
            />
            <StatCell
              label="Battles"
              value={String(peer.battlesWon)}
              icon={Swords}
            />
            <StatCell
              label="Badges"
              value={`${peer.badgesEarned}/${peer.badgesTotal}`}
              icon={Award}
            />
          </div>
        </div>

        {/* Action stack */}
        {!liveId ? (
          <div className="flex h-[52px] items-center justify-center rounded-[18px] border-2 border-dashed border-[#ebe4f6] bg-white text-[12px] font-extrabold text-arc-lavender-600">
            Demo peer
          </div>
        ) : (
          <div className="space-y-2">
            {canBattle ? (
              <Link
                href={`/battle/create?opponent=${liveId}`}
                className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-arc-purple-500 font-display text-[15px] font-bold text-white shadow-[0_4px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Swords className="h-4 w-4" strokeWidth={2.5} />
                Challenge to battle
              </Link>
            ) : !isFriend ? (
              <motion.button
                type="button"
                aria-label={
                  friendPending
                    ? `Friend request sent to ${displayName}`
                    : `Connect with ${displayName}`
                }
                disabled={friendBusy || socialLoading || friendPending}
                onClick={() => void connect()}
                whileTap={
                  !friendBusy && !friendPending
                    ? { scale: 0.97, y: 2 }
                    : undefined
                }
                transition={snappySpring}
                className={cn(
                  "flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] font-display text-[15px] font-bold text-white focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50",
                  friendPending
                    ? "bg-[#16a56b] shadow-[0_4px_0_#0e7a4c]"
                    : "bg-arc-purple-500 shadow-[0_4px_0_#4b2fd6]",
                )}
              >
                <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                {friendBusy || socialLoading
                  ? "…"
                  : friendPending
                    ? "Request sent"
                    : "Add friend"}
              </motion.button>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              {canStudy ? (
                <Link
                  href={`/study/invite?friend=${liveId}`}
                  className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-[16px] border-2 border-[#ebe4f6] bg-white text-[13px] font-extrabold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] transition-colors hover:border-[#0f1220]/20 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
                >
                  <BookOpen className="h-4 w-4 text-arc-purple-500" strokeWidth={2.5} />
                  Study
                </Link>
              ) : (
                <span className="flex h-12 items-center justify-center rounded-[16px] border-2 border-dashed border-[#ebe4f6] text-[12px] font-extrabold text-arc-lavender-500">
                  Study locked
                </span>
              )}

              <motion.button
                type="button"
                aria-label={
                  isFollowing
                    ? `Unfollow ${displayName}`
                    : `Follow ${displayName}`
                }
                disabled={
                  followBusy ||
                  socialLoading ||
                  (!isFollowing && !canFollow) ||
                  (isFollowing && !canUnfollow)
                }
                onClick={() => void toggleFollow()}
                whileTap={
                  !followBusy && (isFollowing ? canUnfollow : canFollow)
                    ? { scale: 0.97, y: 2 }
                    : undefined
                }
                transition={snappySpring}
                className={cn(
                  "flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-[16px] text-[13px] font-extrabold focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none disabled:opacity-50",
                  isFollowing
                    ? "border-2 border-[#ebe4f6] bg-white text-[#0f1220] shadow-[0_3px_0_#ebe4f6]"
                    : canFollow
                      ? "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]"
                      : "border-2 border-dashed border-[#ebe4f6] bg-white text-arc-lavender-500",
                )}
              >
                {isFollowing ? (
                  <UserMinus className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                )}
                {followBusy || socialLoading
                  ? "…"
                  : isFollowing
                    ? "Unfollow"
                    : canFollow
                      ? "Follow"
                      : "Follow off"}
              </motion.button>
            </div>
          </div>
        )}

        {actionError ? (
          <p
            role="alert"
            className="rounded-[16px] border border-[#f5c6cb] bg-[#fdecef] px-3.5 py-2.5 text-center text-[12px] font-bold text-[#c0392b]"
          >
            {actionError}
          </p>
        ) : null}

        {/* Recent */}
        <div className="rounded-[20px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_4px_0_#ebe4f6]">
          <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
            Recent
          </p>
          {peer.recent.length === 0 ? (
            <p className="mt-3 text-center text-[13px] font-bold text-arc-lavender-600">
              No recent activity yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-0">
              {peer.recent.map((item, i) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-start justify-between gap-3 py-2.5",
                    i > 0 && "border-t border-[#f0ecf7]",
                  )}
                >
                  <p className="text-[13px] font-extrabold text-[#0f1220]">
                    {item.label}
                  </p>
                  <span className="shrink-0 text-[11px] font-bold text-arc-lavender-600">
                    {item.when}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/leaderboard"
          className="flex h-12 cursor-pointer items-center justify-center rounded-[16px] text-[13px] font-extrabold text-arc-lavender-700 transition-colors hover:text-[#0f1220] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
        >
          Back to standings
        </Link>
      </div>
    </div>
  );
}

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold ring-1 ring-white/15",
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatCell({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Zap;
}) {
  return (
    <div className="rounded-2xl bg-white/10 px-2.5 py-2.5 ring-1 ring-white/10">
      <Icon className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
      <p className="mt-1.5 font-display text-[18px] leading-none font-bold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-extrabold tracking-wide text-white/45 uppercase">
        {label}
      </p>
    </div>
  );
}
