"use client";

import Image from "next/image";
import { isRankUploadSrc, rankAvatarSrc } from "@/lib/rank/icons";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  initial: string;
  /** Chip background when no rank image. */
  color?: string;
  /** Chip letter color when no rank image. */
  textColor?: string;
  avatarUrl?: string | null;
  className?: string;
  textClassName?: string;
  alt?: string;
};

/**
 * Rank-image avatar when admin uploaded; else letter chip.
 */
export function UserAvatar({
  initial,
  color = "#6B4EFF",
  textColor = "#ffffff",
  avatarUrl,
  className,
  textClassName,
  alt = "",
}: UserAvatarProps) {
  const src = rankAvatarSrc(avatarUrl);

  if (src) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden bg-[#2a2550]",
          className,
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized={isRankUploadSrc(src)}
          className="object-cover object-top"
          sizes="96px"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-bold",
        className,
      )}
      style={{ background: color, color: textColor }}
    >
      <span className={textClassName}>{initial}</span>
    </span>
  );
}
