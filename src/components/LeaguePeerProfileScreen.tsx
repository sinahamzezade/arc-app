"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Award,
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
import {
  socialApi,
  type SocialProfileDto,
} from "@/lib/api/social";
import type { LeaguePeerProfile } from "@/lib/leaderboard/types";
import { cn } from "@/lib/utils";

const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * League peer passport — night-hero family.
 * Follow/unfollow via SocialPermissionService rules (allowFollows, block, self).
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
    peer.rank <= peer.promoteTop
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

  /** Friend request + follow in one tap when both available. */
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
        <p className="text-center font-display text-[22px] font-bold text-[#0f1220]">
          That&apos;s you
        </p>
        <Link
          href="/profile"
          className="rounded-[18px] bg-arc-purple-500 px-6 py-3.5 font-display text-[16px] font-bold text-white shadow-[0_4px_0_var(--color-arc-purple-700)]"
        >
          Open your profile
        </Link>
        <Link
          href="/leaderboard"
          className="text-[13px] font-extrabold text-arc-lavender-700"
        >
          Back to board
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
          }}
        />

        <div className="relative z-[1] flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              League passport
            </p>
            <p className="truncate text-[13px] font-bold text-white/45">
              {peer.leagueName} · {peer.weekLabel}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-extrabold",
              zoneTone,
            )}
          >
            {zoneLabel}
          </span>
        </div>

        <div className="relative z-[1] mt-7 flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.12em] text-white/40 uppercase">
              {peer.rankTitle}
            </p>
            <h1 className="mt-1 font-display text-[42px] leading-[0.88] font-bold tracking-[-0.04em] text-balance">
              {displayName}
            </h1>
            <p className="mt-2.5 text-[13px] leading-snug font-bold text-white/60">
              <span>{peer.fromRole}</span>
              <span className="mx-1.5 text-[#ffc928]">→</span>
              <span className="text-white">{peer.becoming}</span>
            </p>
            <p className="mt-3 max-w-[16rem] text-[13px] leading-snug font-bold text-white/50 text-pretty">
              {peer.bio}
            </p>
          </div>

          <div className="relative shrink-0">
            <UserAvatar
              initial={social?.initial ?? peer.initial}
              color={peer.avatarBg}
              textColor={peer.avatarColor}
              avatarUrl={social?.avatarUrl ?? peer.avatarUrl}
              className="h-[88px] w-[88px] rounded-[28px] font-display text-[36px] shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-4 ring-[#ffc928]/35"
              textClassName="text-[36px]"
              alt=""
            />
            <span className="absolute -top-2 -right-2 rounded-xl bg-[#ffc928] px-2 py-1 font-display text-[13px] font-bold text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
              #{peer.rank}
            </span>
          </div>
        </div>

        <div className="relative z-[1] mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold ring-1 ring-white/15">
            <Zap className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
            {peer.xp} XP
          </span>
          {peer.streakWeeks != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ff8a3d]/20 px-3 py-1.5 text-[11px] font-extrabold text-[#ff8a3d]">
              <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
              {peer.streakWeeks}w streak
            </span>
          ) : null}
          {social ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold text-white/70 ring-1 ring-white/15">
              <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
              {social.counters.followers} followers
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold text-white/70 ring-1 ring-white/15">
              {peer.joinedLabel}
            </span>
          )}
          {isFollowing ? (
            <span className="rounded-full bg-arc-purple-500/30 px-3 py-1.5 text-[11px] font-extrabold text-[#c4b5fd] ring-1 ring-arc-purple-500/40">
              Following
            </span>
          ) : null}
          {social?.relationship.isFriend ? (
            <span className="rounded-full bg-[#16a56b]/25 px-3 py-1.5 text-[11px] font-extrabold text-[#62d84e] ring-1 ring-[#16a56b]/35">
              Friend
            </span>
          ) : null}
        </div>
      </section>

      <div className="relative z-10 -mt-12 space-y-3 rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+28px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <div className="relative overflow-hidden rounded-[22px] bg-[#0f1220] p-4 text-white shadow-[0_14px_32px_rgba(15,18,32,0.28)]">
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
          <div className="relative z-[1] mt-3 flex items-center justify-between gap-2 text-[11px] font-bold text-white/50">
            <span className="inline-flex items-center gap-1 text-[#62d84e]">
              <ArrowUp className="h-3 w-3" strokeWidth={3} />
              Top {peer.promoteTop} promote
            </span>
            <span className="inline-flex items-center gap-1 text-[#ff8a8a]">
              Bot {peer.demoteBottom} demote
              <ArrowDown className="h-3 w-3" strokeWidth={3} />
            </span>
          </div>
        </div>

        {/* One social CTA: battle if friends, else connect (friend + follow), else follow/unfollow */}
        {!liveId ? (
          <div className="flex h-[52px] items-center justify-center rounded-[18px] border-2 border-dashed border-[#ebe4f6] bg-white text-[12px] font-extrabold text-arc-lavender-600">
            Demo peer
          </div>
        ) : canBattle ? (
          <Link
            href={`/battle/create?opponent=${liveId}`}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[18px] bg-arc-purple-500 font-display text-[15px] font-bold text-white shadow-[0_4px_0_var(--color-arc-purple-700)]"
          >
            <Swords className="h-4 w-4" strokeWidth={2.5} />
            Battle
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
              !friendBusy && !friendPending ? { scale: 0.97, y: 2 } : undefined
            }
            transition={snappySpring}
            className={cn(
              "flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] font-display text-[15px] font-bold text-white disabled:opacity-50",
              friendPending
                ? "bg-[#16a56b] shadow-[0_4px_0_#0e7a4c]"
                : "bg-arc-purple-500 shadow-[0_4px_0_var(--color-arc-purple-700)]",
            )}
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.5} />
            {friendBusy || socialLoading
              ? "…"
              : friendPending
                ? "Request sent"
                : "Add friend"}
          </motion.button>
        ) : (
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
              "flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] font-display text-[15px] font-bold disabled:opacity-50",
              isFollowing
                ? "border-2 border-[#ebe4f6] bg-white text-[#1b1730] shadow-[0_4px_0_#ebe4f6]"
                : "bg-[#ffc928] text-[#0f1220] shadow-[0_4px_0_#c79a2e]",
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
        )}

        {canStudy && liveId ? (
          <Link
            href={`/study/invite?friend=${liveId}`}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] border-2 border-[#ebe4f6] bg-white text-[13px] font-extrabold text-[#1b1730] shadow-[0_3px_0_#ebe4f6]"
          >
            Study Together
          </Link>
        ) : null}

        {actionError ? (
          <p className="rounded-2xl bg-[#fdecef] px-3.5 py-2.5 text-center text-[12px] font-bold text-[#c0392b]">
            {actionError}
          </p>
        ) : null}

        <div className="rounded-[20px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_4px_0_#ebe4f6]">
          <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
            Recent
          </p>
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
        </div>

        <Link
          href="/leaderboard"
          className="flex h-12 items-center justify-center rounded-[16px] text-[13px] font-extrabold text-arc-lavender-700"
        >
          Back to standings
        </Link>
      </div>
    </div>
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
