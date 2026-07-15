"use client";

import Link from "next/link";
import { use } from "react";
import LeaguePeerProfileScreen from "@/components/LeaguePeerProfileScreen";
import { PeerProfileSkeleton } from "@/components/leaderboard/PeerProfileSkeleton";
import { useLeagueUser } from "@/hooks/useCurrentLeague";
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

  if (!isUuid) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="font-display text-[20px] font-bold text-[#0f1220]">
          Learner not found
        </p>
        <Link
          href="/leaderboard"
          className="flex h-11 cursor-pointer items-center justify-center rounded-[16px] bg-[#0f1220] px-5 text-[13px] font-extrabold text-white shadow-[0_3px_0_#2a2f45] focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
        >
          Back to league
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <PeerProfileSkeleton />;
  }

  if (isError || !peer) {
    const msg =
      error instanceof ApiError
        ? messageForCode(error.code, error.message)
        : "This learner is hidden or not in your league.";
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="text-center font-display text-[20px] font-bold text-[#0f1220]">
          Profile unavailable
        </p>
        <p className="text-center text-[13px] font-semibold text-arc-lavender-600">
          {msg}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex h-11 cursor-pointer items-center justify-center rounded-[16px] bg-[#0f1220] px-5 text-[13px] font-extrabold text-white shadow-[0_3px_0_#2a2f45] focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
          >
            Retry
          </button>
          <Link
            href="/leaderboard"
            className="flex h-11 cursor-pointer items-center justify-center rounded-[16px] border-2 border-[#ebe4f6] bg-white px-5 text-[13px] font-extrabold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  return <LeaguePeerProfileScreen peer={peer} />;
}
