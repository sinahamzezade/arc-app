"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users } from "lucide-react";
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { socialApi, type SocialFriendDto } from "@/lib/api/social";
import { cn } from "@/lib/utils";

type Tab = "followers" | "following";

/**
 * Own followers / following lists — Social counters + follow APIs.
 */
export default function FollowersScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "following" ? "following" : "followers";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<SocialFriendDto[]>([]);
  const [following, setFollowing] = useState<SocialFriendDto[]>([]);
  const [followersCursor, setFollowersCursor] = useState<string | null>(null);
  const [followingCursor, setFollowingCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = session?.user?.id;
      const [fol, fing, profile] = await Promise.all([
        socialApi.followers(),
        socialApi.following(),
        userId ? socialApi.getProfile(userId).catch(() => null) : null,
      ]);
      setFollowers(fol.items);
      setFollowersCursor(fol.nextCursor);
      setFollowing(fing.items);
      setFollowingCursor(fing.nextCursor);
      setCounts({
        followers: profile?.counters.followers ?? fol.items.length,
        following: profile?.counters.following ?? fing.items.length,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load followers",
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session === undefined) return;
    void load();
  }, [load, session]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const followingIds = new Set(following.map((f) => f.userId));

  async function followBack(userId: string) {
    setBusyId(userId);
    setError(null);
    try {
      await socialApi.follow(userId);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Follow failed",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function unfollow(userId: string) {
    setBusyId(userId);
    setError(null);
    try {
      await socialApi.unfollow(userId);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Unfollow failed",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function loadMore() {
    if (tab === "followers" && followersCursor) {
      const res = await socialApi.followers(followersCursor);
      setFollowers((prev) => [...prev, ...res.items]);
      setFollowersCursor(res.nextCursor);
    }
    if (tab === "following" && followingCursor) {
      const res = await socialApi.following(followingCursor);
      setFollowing((prev) => [...prev, ...res.items]);
      setFollowingCursor(res.nextCursor);
    }
  }

  const items = tab === "followers" ? followers : following;
  const nextCursor = tab === "followers" ? followersCursor : followingCursor;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-[#f3effc] font-rounded">
      <div className="px-[18px] pt-[calc(env(safe-area-inset-top)+14px)] pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <header className="mb-5 flex items-center gap-3">
          <BackButton tone="light" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[22px] leading-none font-bold text-[#1b1730]">
              Followers
            </h1>
            <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
              {counts.followers} followers · {counts.following} following
            </p>
          </div>
        </header>

        <nav className="flex gap-5 border-b border-[#ebe4f6]">
          {(
            [
              ["followers", `Followers (${counts.followers})`],
              ["following", `Following (${counts.following})`],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "relative pb-2.5 font-display text-[14px] font-semibold",
                  active ? "text-[#1b1730]" : "text-[#b3a8d6]",
                )}
              >
                {label}
                {active ? (
                  <motion.span
                    layoutId="followers-tab-line"
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

        {error ? (
          <p className="mt-4 rounded-2xl bg-[#fdecef] px-3.5 py-2.5 text-[12px] font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {loading ? (
            <li className="py-10 text-center text-[13px] font-bold text-[#8a7cb8]">
              Loading…
            </li>
          ) : items.length === 0 ? (
            <li className="rounded-[24px] border border-dashed border-[#d5ccec] bg-white/60 px-5 py-12 text-center">
              <Users
                className="mx-auto h-8 w-8 text-[#b3a8d6]"
                strokeWidth={2}
              />
              <p className="mt-3 font-display text-[18px] font-semibold text-[#8a7cb8]">
                {tab === "followers"
                  ? "No followers yet"
                  : "Not following anyone"}
              </p>
              <p className="mt-2 text-[13px] font-semibold text-[#b3a8d6]">
                {tab === "followers"
                  ? "Share your Arlo — peers can follow from the league board."
                  : "Find people in Friends and tap Fol."}
              </p>
              <Link
                href="/friends"
                className="mt-4 inline-flex rounded-xl bg-arc-purple-500 px-4 py-2.5 text-[13px] font-extrabold text-white"
              >
                Open Friends
              </Link>
            </li>
          ) : (
            items.map((f, i) => {
              const alreadyFollowing = followingIds.has(f.userId);
              return (
                <motion.li
                  key={f.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-[22px] border border-[#ebe4f6] bg-white px-3.5 py-3.5 shadow-[0_8px_22px_rgba(70,40,150,0.06)]"
                >
                  <Link
                    href={`/leaderboard/${f.userId}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <UserAvatar
                      initial={f.initial}
                      color={f.color}
                      avatarUrl={f.avatarUrl}
                      className="h-11 w-11 rounded-[14px] font-display text-[15px]"
                      textClassName="text-[15px]"
                      alt=""
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display text-[15px] font-semibold text-[#1b1730]">
                        {f.name}
                      </p>
                      <p className="text-[11px] font-bold text-[#8a7cb8]">
                        Lv {f.level} · {f.league}
                        {f.online ? " · online" : ""}
                      </p>
                    </div>
                  </Link>

                  {tab === "following" || alreadyFollowing ? (
                    <button
                      type="button"
                      disabled={busyId === f.userId}
                      onClick={() => void unfollow(f.userId)}
                      className="rounded-xl border border-[#ebe4f6] px-3 py-2 text-[11px] font-extrabold text-[#8a7cb8] disabled:opacity-50"
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === f.userId}
                      onClick={() => void followBack(f.userId)}
                      className="rounded-xl bg-arc-purple-500 px-3 py-2 text-[11px] font-extrabold text-white disabled:opacity-50"
                    >
                      Follow
                    </button>
                  )}
                </motion.li>
              );
            })
          )}
        </ul>

        {nextCursor ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="mt-4 w-full rounded-xl border border-[#ebe4f6] bg-white py-3 text-[13px] font-extrabold text-[#4a3d78]"
          >
            Load more
          </button>
        ) : null}
      </div>
    </div>
  );
}
