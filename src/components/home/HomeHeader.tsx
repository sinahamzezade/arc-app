"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Gem, Star } from "lucide-react";
import { assets } from "@/lib/assets";
import type { HomeMockData } from "@/lib/home/mock-data";
import { cn } from "@/lib/utils";

type HomeHeaderProps = {
  xp: HomeMockData["stats"]["xp"];
  gems: HomeMockData["stats"]["gems"];
  notificationCount: HomeMockData["notificationCount"];
  tone?: "day" | "night";
};

export function HomeHeader({
  xp,
  gems,
  notificationCount,
  tone = "day",
}: HomeHeaderProps) {
  const night = tone === "night";

  return (
    <header className="relative z-20 flex items-center gap-2.5 px-5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <Link href="/home" aria-label="Arc">
        <Image
          src={assets.brand.logoMark}
          alt="Arc"
          width={40}
          height={40}
          className="h-10 w-10 rounded-2xl object-cover shadow-[0_3px_0_rgba(0,0,0,0.35)]"
          priority
        />
      </Link>

      <Link
        href="/wallet"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-2xl py-1.5 pr-3 pl-1.5",
          night
            ? "bg-white/10 ring-1 ring-white/15"
            : "bg-white shadow-[0_3px_0_#e4dbff]",
        )}
        aria-label={`${xp} XP`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-arc-blue-500">
          <Star className="h-3.5 w-3.5 fill-white text-white" />
        </span>
        <span
          className={cn(
            "text-[13px] font-extrabold tabular-nums",
            night ? "text-white" : "text-[#101923]",
          )}
        >
          {xp.toLocaleString()}
        </span>
      </Link>

      <Link
        href="/wallet"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-2xl py-1.5 pr-3 pl-1.5",
          night
            ? "bg-white/10 ring-1 ring-white/15"
            : "bg-white shadow-[0_3px_0_#e4dbff]",
        )}
        aria-label={`${gems} gems`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-arc-gem-100">
          <Gem className="h-3.5 w-3.5 text-[#b35cff]" strokeWidth={2.5} />
        </span>
        <span
          className={cn(
            "text-[13px] font-extrabold tabular-nums",
            night ? "text-white" : "text-[#101923]",
          )}
        >
          {gems.toLocaleString()}
        </span>
      </Link>

      <div className="flex-1" />

      <Link
        href="/notifications"
        aria-label={`Notifications, ${notificationCount} unread`}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-2xl",
          night
            ? "bg-white/10 text-white ring-1 ring-white/15"
            : "bg-white text-[#101923] shadow-[0_3px_0_#e4dbff]",
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={2.25} />
        {notificationCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-arc-orange-400 px-[3px] text-[10px] font-extrabold text-white">
            {notificationCount}
          </span>
        ) : null}
      </Link>
    </header>
  );
}
