"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import LeaguePeerProfileScreen from "@/components/LeaguePeerProfileScreen";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { socialApi } from "@/lib/api/social";
import { peerFromSocial } from "@/lib/social/peer-from-social";
import type { LeaguePeerProfile } from "@/lib/leaderboard/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Social passport — /friends/[userId]
 * Loads GET /social/users/:id then LeaguePeerProfileScreen (Add friend / Follow).
 */
export default function FriendProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const valid = UUID_RE.test(userId);
  const [peer, setPeer] = useState<LeaguePeerProfile | null>(null);
  const [loading, setLoading] = useState(valid);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) {
      setLoading(false);
      setError("Invalid profile");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const profile = await socialApi.getProfile(userId);
        if (!cancelled) setPeer(peerFromSocial(profile));
      } catch (err) {
        if (!cancelled) {
          setPeer(null);
          setError(
            err instanceof ApiError
              ? messageForCode(err.code, err.message)
              : "Could not load profile",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, valid]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-[#f3effc] font-rounded">
        <p className="font-display text-[18px] font-bold text-[#1b1730]">
          Loading profile…
        </p>
      </div>
    );
  }

  if (error || !peer) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="text-center font-display text-[20px] font-bold text-[#1b1730]">
          Profile unavailable
        </p>
        <p className="text-center text-[13px] font-semibold text-[#8a7cb8]">
          {error ?? "User not found"}
        </p>
        <Link
          href="/friends"
          className="rounded-full bg-[#0f1220] px-5 py-2.5 text-[13px] font-black text-white"
        >
          Back to Friends
        </Link>
      </div>
    );
  }

  return <LeaguePeerProfileScreen peer={peer} />;
}
