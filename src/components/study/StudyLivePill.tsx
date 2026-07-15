"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { studyApi } from "@/lib/api/study";
import {
  isStudyLiveStatus,
  useStudyLiveStore,
} from "@/store/useStudyLiveStore";
import { cn } from "@/lib/utils";

function formatMmSs(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * Floating live-study pill above tab bar.
 * Multi-room: count → hub. Single room → deep link.
 */
export function StudyLivePill() {
  const pathname = usePathname();
  const { status: authStatus } = useSession();
  const rooms = useStudyLiveStore((s) => s.rooms);
  const applySessions = useStudyLiveStore((s) => s.applySessions);
  const clear = useStudyLiveStore((s) => s.clear);
  const [, setTick] = useState(0);
  const authed = authStatus === "authenticated";

  const live = rooms[0] ?? null;
  const multi = rooms.length > 1;

  useEffect(() => {
    if (!authed) {
      clear();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { items } = await studyApi.rooms();
        if (cancelled) return;
        const liveItems = items.filter((s) => isStudyLiveStatus(s.status));
        applySessions(liveItems);
        if (!liveItems.length) clear();
      } catch {
        /* offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed, applySessions, clear]);

  useEffect(() => {
    if (!live?.sessionId || !authed || multi) return;
    const poll = () => {
      void studyApi
        .state(live.sessionId)
        .then((dto) => useStudyLiveStore.getState().applySession(dto))
        .catch(() => undefined);
    };
    poll();
    const ms = live.status === "active" ? 8_000 : 12_000;
    const t = setInterval(poll, ms);
    return () => clearInterval(t);
  }, [live?.sessionId, live?.status, authed, multi]);

  useEffect(() => {
    if (!live || live.remainingSeconds == null || live.status !== "active") {
      return;
    }
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [live?.sessionId, live?.remainingSeconds, live?.status, live?.capturedAtMs]);

  const onStudy =
    pathname.startsWith("/study/room") ||
    pathname.startsWith("/study/invite") ||
    pathname === "/study";
  const show = rooms.length > 0 && !onStudy;

  const displayRemaining =
    live?.status === "active" && live.remainingSeconds != null
      ? Math.max(
          0,
          live.remainingSeconds -
            Math.floor((Date.now() - live.capturedAtMs) / 1000),
        )
      : null;

  const timerLabel = multi
    ? `${rooms.length} rooms`
    : displayRemaining != null
      ? formatMmSs(displayRemaining)
      : live
        ? `${live.durationMinutes}:00`
        : "";

  const statusHint = multi
    ? "Study rooms"
    : live?.status === "active"
      ? "Reading"
      : live?.status === "waiting"
        ? "Ready up"
        : "Starting";

  const href = multi ? "/study" : live ? `/study/room?id=${live.sessionId}` : "/study";

  return (
    <AnimatePresence>
      {show && live ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom)+10px)] z-40 mx-auto w-full max-w-md px-4">
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto"
          >
            <Link
              href={href}
              className={cn(
                "flex items-center gap-3 overflow-hidden rounded-[22px] border border-white/10 bg-[#0f1220] px-3 py-2.5 text-white",
                "shadow-[0_14px_36px_rgba(27,20,51,0.35)] ring-1 ring-[#ffc928]/25",
              )}
            >
              <span
                aria-hidden
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-arc-purple-500 font-display text-[15px] font-bold shadow-[0_4px_0_#4b2fd6]"
              >
                {multi ? rooms.length : live.partnerInitial}
                <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ffc928] text-[#1b1730]">
                  <BookOpen className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-[0.1em] text-[#ffc928] uppercase">
                    {statusHint}
                  </span>
                  <span className="truncate text-[10px] font-bold text-white/40">
                    · {live.lessonTitle ?? live.subject}
                  </span>
                </span>
                <span className="mt-0.5 block truncate font-display text-[15px] leading-tight font-bold">
                  {multi
                    ? `${rooms.length} live sessions`
                    : `With ${live.partnerName.split(" ")[0]}`}
                </span>
              </span>

              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="font-display text-[18px] leading-none font-bold tracking-[-0.03em] tabular-nums text-[#ffc928]">
                  {timerLabel}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-white/45">
                  {multi ? "Hub" : "Room"}
                  <ChevronRight className="h-3 w-3" strokeWidth={2.75} />
                </span>
              </span>
            </Link>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
