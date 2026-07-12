"use client";

import { use } from "react";
import Link from "next/link";
import LeaguePeerProfileScreen from "@/components/LeaguePeerProfileScreen";
import { useLeagueUser } from "@/hooks/useCurrentLeague";
import { getLeaguePeerProfile } from "@/lib/leaderboard/mock-data";
import { ApiError, messageForCode } from "@/lib/api/errors";

export default function LeaguePeerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );

  const { data: peer, isLoading, isError, error, refetch } = useLeagueUser(
    isUuid ? id : "",
  );

  // Mock standings ids (priya, marcus, …) still work offline.
  const mockPeer = !isUuid ? getLeaguePeerProfile(id) : null;
  const resolved = peer ?? mockPeer;

  if (isUuid && isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-[#f3effc] font-rounded">
        <p className="font-display text-[18px] font-bold text-[#1b1730]">
          Loading profile…
        </p>
      </div>
    );
  }

  if (isUuid && (isError || !resolved)) {
    const msg =
      error instanceof ApiError
        ? messageForCode(error.code, error.message)
        : "This learner is hidden or not in your league.";
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="text-center font-display text-[20px] font-bold text-[#1b1730]">
          Profile unavailable
        </p>
        <p className="text-center text-[13px] font-semibold text-[#8a7cb8]">
          {msg}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-full bg-[#0f1220] px-5 py-2.5 text-[13px] font-black text-white"
          >
            Retry
          </button>
          <Link
            href="/leaderboard"
            className="rounded-full border border-[#ebe4f6] bg-white px-5 py-2.5 text-[13px] font-black text-[#1b1730]"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="font-display text-[20px] font-bold text-[#1b1730]">
          Learner not found
        </p>
        <Link
          href="/leaderboard"
          className="rounded-full bg-[#0f1220] px-5 py-2.5 text-[13px] font-black text-white"
        >
          Back to league
        </Link>
      </div>
    );
  }

  return <LeaguePeerProfileScreen peer={resolved} />;
}
