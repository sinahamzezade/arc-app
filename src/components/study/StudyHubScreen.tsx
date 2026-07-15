"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { BookOpen, Clock, Plus, Users } from "lucide-react";
import { motion } from "motion/react";
import { studyApi, type StudySessionDto } from "@/lib/api/study";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

function statusLabel(s: StudySessionDto) {
  if (s.status === "active") return "Reading now";
  if (s.status === "waiting") return "Ready up";
  if (s.status === "invited" && s.role === "invitee") return "Invite pending";
  if (s.status === "invited") return "Awaiting accept";
  if (s.status === "accepted") return "Scheduled";
  return s.status;
}

/**
 * Multi-room hub — live sessions + create CTA.
 */
export default function StudyHubScreen() {
  const [rooms, setRooms] = useState<StudySessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items } = await studyApi.rooms();
        if (!cancelled) setRooms(items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? messageForCode(err.code, err.message)
              : "Could not load rooms",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10 text-white">
        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Crew learning
            </p>
            <h1 className="mt-0.5 font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              Study Together
            </h1>
          </div>
          <Link
            href="/study/invite"
            className="inline-flex items-center gap-1 rounded-full bg-arc-purple-500 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-[0_3px_0_#4b2fd6]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.75} />
            New
          </Link>
        </div>
      </section>

      <div className="relative -mt-5 px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {loading ? (
          <p className="rounded-[20px] bg-white px-4 py-6 text-center text-[13px] font-bold text-[#8a7cb8]">
            Loading rooms…
          </p>
        ) : error ? (
          <p className="rounded-[20px] bg-[#fdecef] px-4 py-3 text-center text-[13px] font-bold text-[#c0392b]">
            {error}
          </p>
        ) : rooms.length === 0 ? (
          <div className="rounded-[22px] border border-[#ebe4f6] bg-white p-6 text-center shadow-[0_10px_24px_rgba(70,40,150,0.06)]">
            <Users className="mx-auto h-8 w-8 text-arc-purple-500" strokeWidth={2} />
            <p className="mt-3 font-display text-[17px] font-semibold text-[#1b1730]">
              No live rooms
            </p>
            <p className="mt-1 text-[13px] font-bold text-[#8a7cb8]">
              Invite a friend and read the same lesson together.
            </p>
            <Link
              href="/study/invite"
              className="mt-4 inline-flex rounded-[18px] bg-arc-purple-500 px-5 py-3 font-display text-[14px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
            >
              Start a room
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link href={`/study/room?id=${room.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "rounded-[22px] border bg-white p-4 shadow-[0_10px_24px_rgba(70,40,150,0.06)]",
                      room.status === "active"
                        ? "border-arc-purple-500/30"
                        : "border-[#ebe4f6]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold tracking-[0.1em] text-arc-purple-500 uppercase">
                          {statusLabel(room)}
                        </p>
                        <p className="mt-1 truncate font-display text-[16px] font-semibold text-[#1b1730]">
                          {room.lessonTitle ?? room.subject}
                        </p>
                        <p className="mt-0.5 text-[12px] font-bold text-[#8a7cb8]">
                          with {room.partner.name.split(" ")[0]}
                        </p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#0f1220] font-display text-[13px] font-bold text-[#ffc928]">
                        {room.partner.initial}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-[#8a7cb8]">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        Step {room.contentStep + 1}/{Math.max(room.stepCount, 1)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {room.durationMinutes}m
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
