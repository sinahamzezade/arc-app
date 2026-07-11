"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Clock, Users } from "lucide-react";
import { battleFriends } from "@/lib/battle/mock-data";
import { cn } from "@/lib/utils";

const subjects = ["SQL", "Python", "Excel", "Data Analysis", "Any"];
const starts = ["Start now", "Within 1 hour", "Schedule later"];
const durations = [15, 25, 45, 60];

export default function StudyInviteScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendId = searchParams.get("friend") ?? "f1";
  const friend =
    battleFriends.find((f) => f.id === friendId) ?? battleFriends[0];

  const [subject, setSubject] = useState("SQL");
  const [start, setStart] = useState(starts[0]);
  const [duration, setDuration] = useState(25);
  const [message, setMessage] = useState("");

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-[#f3effc] font-rounded">
      <div className="px-[18px] pt-[calc(env(safe-area-inset-top)+14px)] pb-[calc(env(safe-area-inset-bottom)+100px)]">
        <header className="mb-5 flex items-center gap-3">
          <BackButton tone="light" />
          <div>
            <h1 className="font-display text-[22px] leading-none font-bold text-[#1b1730]">
              Study Together
            </h1>
            <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
              With {friend.name}
            </p>
          </div>
        </header>

        <Label>Subject</Label>
        <div className="mb-5 flex flex-wrap gap-2">
          {subjects.map((s) => (
            <Pill
              key={s}
              active={subject === s}
              label={s}
              onClick={() => setSubject(s)}
            />
          ))}
        </div>

        <Label>Start</Label>
        <div className="mb-5 flex flex-wrap gap-2">
          {starts.map((s) => (
            <Pill
              key={s}
              active={start === s}
              label={s}
              onClick={() => setStart(s)}
            />
          ))}
        </div>

        <Label>Duration</Label>
        <div className="mb-5 flex overflow-hidden rounded-2xl border border-[#ebe4f6] bg-white">
          {durations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-extrabold",
                duration === d
                  ? "bg-arc-purple-500 text-white"
                  : "text-[#8a7cb8]",
              )}
            >
              {d}m
            </button>
          ))}
        </div>

        <Label>Optional message</Label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Let’s crush SQL filters…"
          className="mb-2 w-full rounded-2xl border border-[#ebe4f6] bg-white px-3.5 py-3 text-[14px] font-semibold text-[#1b1730] outline-none placeholder:text-[#b3a8d6]"
        />
        <p className="flex items-center gap-1 text-[12px] font-semibold text-[#8a7cb8]">
          <Clock className="h-3.5 w-3.5" />
          Shared focus room · no video required
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-[18px] pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/study/room?friend=${friend.id}&mins=${duration}&subject=${encodeURIComponent(subject)}`,
            )
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
        >
          <Users className="h-4 w-4" strokeWidth={2.5} />
          Start focus room
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
      {children}
    </p>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-[12px] font-extrabold",
        active
          ? "bg-arc-purple-500 text-white"
          : "border border-[#ebe4f6] bg-white text-[#4a3d78]",
      )}
    >
      {label}
    </button>
  );
}
