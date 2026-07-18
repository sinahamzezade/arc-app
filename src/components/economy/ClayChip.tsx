"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Coins, Gem, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { formatBalance } from "@/lib/economy/format-balance";
import { cn } from "@/lib/utils";

export type ClayChipTone = "coin" | "xp" | "gem";

const toneClass: Record<ClayChipTone, string> = {
  coin: "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]",
  xp: "bg-[#2d8cff] text-white shadow-[0_3px_0_#1a5fad]",
  gem: "bg-[#b35cff] text-white shadow-[0_3px_0_#7a2fc4]",
};

const chipBase =
  "inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-2xl border-2 border-[#0f1220]/15 py-1 pr-2.5 pl-1 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220] active:translate-y-px active:shadow-none";

function resolveHref(
  href: string | false | undefined,
  fallback: string,
): string | undefined {
  if (href === false) return undefined;
  return href ?? fallback;
}

type ClayChipProps = {
  label: string;
  value: string;
  tone: ClayChipTone;
  icon: ReactNode;
  href?: string;
  className?: string;
};

/** Arlo clay wallet chip — icon well + bold tabular value. */
export function ClayChip({
  label,
  value,
  tone,
  icon,
  href,
  className,
}: ClayChipProps) {
  const body = (
    <>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-black/15">
        {icon}
      </span>
      <span className="truncate font-display text-[13px] leading-none font-bold tabular-nums">
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn(chipBase, toneClass[tone], className)}
      >
        {body}
      </Link>
    );
  }

  return (
    <span aria-label={label} className={cn(chipBase, toneClass[tone], className)}>
      {body}
    </span>
  );
}

type AmountClayChipProps = {
  amount: number;
  /** Omit for `/wallet`. Pass `false` for a static chip (no link). */
  href?: string | false;
  compact?: boolean;
  suffix?: string;
  className?: string;
};

export function CoinsClayChip({
  amount,
  href = "/wallet",
  compact = false,
  suffix,
  className,
}: AmountClayChipProps) {
  const display = `${compact ? formatBalance(amount) : amount.toLocaleString()}${suffix ?? ""}`;

  return (
    <ClayChip
      href={resolveHref(href, "/wallet")}
      label={`${amount.toLocaleString()} coins`}
      value={display}
      tone="coin"
      icon={<Coins className="h-3.5 w-3.5" strokeWidth={2.5} />}
      className={className}
    />
  );
}

export function XpClayChip({
  amount,
  href = "/rank",
  compact = true,
  className,
}: Omit<AmountClayChipProps, "suffix">) {
  return (
    <ClayChip
      href={resolveHref(href, "/rank")}
      label={`${amount.toLocaleString()} XP`}
      value={compact ? formatBalance(amount) : amount.toLocaleString()}
      tone="xp"
      icon={
        <Zap className="h-3.5 w-3.5" strokeWidth={2.5} fill="currentColor" />
      }
      className={className}
    />
  );
}

export function GemsClayChip({
  amount,
  href = "/wallet",
  compact = true,
  className,
}: Omit<AmountClayChipProps, "suffix">) {
  return (
    <ClayChip
      href={resolveHref(href, "/wallet")}
      label={`${amount.toLocaleString()} gems`}
      value={compact ? formatBalance(amount) : amount.toLocaleString()}
      tone="gem"
      icon={<Gem className="h-3.5 w-3.5" strokeWidth={2.5} />}
      className={className}
    />
  );
}

/** Shimmer placeholders for the three wallet chips. */
export function ClayChipsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-label="Loading balances"
    >
      {["bg-[#ffc928]/40", "bg-[#2d8cff]/40", "bg-[#b35cff]/40"].map(
        (bg, i) => (
          <Skeleton
            key={i}
            animationType="shimmer"
            className={cn("h-8 w-[4.5rem] rounded-2xl", bg)}
          />
        ),
      )}
    </div>
  );
}
