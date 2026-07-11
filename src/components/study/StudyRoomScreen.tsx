"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Check } from "lucide-react";
import { battleFriends } from "@/lib/battle/mock-data";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

export default function StudyRoomScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendId = searchParams.get("friend") ?? "f1";
  const mins = Number(searchParams.get("mins") ?? 25);
  const subject = searchParams.get("subject") ?? "SQL";
  const friend =
    battleFriends.find((f) => f.id === friendId) ?? battleFriends[0];

  const totalSec = mins * 60;
  const [left, setLeft] = useState(Math.min(totalSec, 90)); // demo: short timer
  const [youDone, setYouDone] = useState(false);
  const [themDone, setThemDone] = useState(false);
  const addCoins = useEconomyStore((s) => s.addCoins);
  const addGems = useEconomyStore((s) => s.addGems);
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => {
    if (left === 30) setThemDone(true);
  }, [left]);

  useEffect(() => {
    if (youDone && themDone && !rewarded) {
      setRewarded(true);
      addCoins(15);
      addGems(2);
    }
  }, [youDone, themDone, rewarded, addCoins, addGems]);

  const m = Math.floor(left / 60);
  const s = left % 60;
  const ended = left <= 0;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-[#f3effc] font-rounded">
      <div className="px-[18px] pt-[calc(env(safe-area-inset-top)+14px)] pb-8">
        <header className="mb-6 flex items-center gap-3">
          <BackButton tone="light" onClick={() => router.push("/friends")} />
          <div>
            <h1 className="font-display text-[22px] leading-none font-bold text-[#1b1730]">
              Focus Room
            </h1>
            <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
              {subject} · with {friend.name}
            </p>
          </div>
        </header>

        <div className="rounded-[28px] border border-[#ebe4f6] bg-white px-6 py-10 text-center shadow-[0_12px_32px_rgba(70,40,150,0.08)]">
          <p className="text-[11px] font-extrabold tracking-wide text-[#8a7cb8] uppercase">
            {ended ? "Session complete" : "Synced timer"}
          </p>
          <p className="mt-3 font-display text-[56px] leading-none font-bold tracking-[-0.04em] text-[#1b1730]">
            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </p>
          <p className="mt-3 text-[13px] font-semibold text-[#8a7cb8]">
            Demo timer (real session = {mins}m)
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <PersonCard
            name="You"
            task={`${subject} practice`}
            progress={youDone ? 10 : 4}
            total={10}
            done={youDone}
          />
          <PersonCard
            name={friend.name.split(" ")[0]}
            task="Lesson review"
            progress={themDone ? 10 : 6}
            total={10}
            done={themDone}
          />
        </div>

        {rewarded ? (
          <p className="mt-4 rounded-2xl bg-[#eef9f3] px-4 py-3 text-center text-[13px] font-bold text-[#178a52]">
            Both finished · +15 coins · +2 gems each
          </p>
        ) : null}

        <div className="mt-6 space-y-2">
          {!youDone ? (
            <button
              type="button"
              onClick={() => setYouDone(true)}
              className="w-full rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
            >
              Mark my session done
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/battle")}
              className="w-full rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
            >
              Done — back to Battle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  name,
  task,
  progress,
  total,
  done,
}: {
  name: string;
  task: string;
  progress: number;
  total: number;
  done: boolean;
}) {
  const pct = Math.round((progress / total) * 100);
  return (
    <div className="rounded-2xl border border-[#ebe4f6] bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[14px] font-semibold text-[#1b1730]">
          {name}
        </p>
        {done ? (
          <Check className="h-4 w-4 text-[#178a52]" strokeWidth={3} />
        ) : null}
      </div>
      <p className="mt-1 text-[11px] font-bold text-[#8a7cb8]">{task}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ebe4f6]">
        <div
          className={cn(
            "h-full rounded-full",
            done ? "bg-[#16c784]" : "bg-arc-purple-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] font-bold text-[#8a7cb8]">
        {progress}/{total} tasks
      </p>
    </div>
  );
}
