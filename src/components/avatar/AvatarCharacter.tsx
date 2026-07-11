"use client";

import { cn } from "@/lib/utils";
import {
  avatarPartRegistry,
  BaseBodyBoy,
  BaseBodyGirl,
  type AvatarGender,
  type AvatarPartId,
} from "@/components/avatar/registry";
import { AVATAR_VIEWBOX } from "@/components/avatar/parts/shared";

export type AvatarLook = {
  gender?: AvatarGender;
  skin?: string;
  hair?: AvatarPartId | null;
  hat?: AvatarPartId | null;
  glasses?: AvatarPartId | null;
  moustache?: AvatarPartId | null;
  shirt?: AvatarPartId | null;
  cape?: AvatarPartId | null;
  background?: string;
  accents?: Partial<
    Record<
      "hair" | "hat" | "glasses" | "moustache" | "shirt" | "cape",
      string | undefined
    >
  >;
};

type AvatarCharacterProps = {
  look: AvatarLook;
  className?: string;
  label?: string;
  size?: number;
};

function Layer({
  id,
  accent,
}: {
  id?: AvatarPartId | null;
  accent?: string;
}) {
  if (!id) return null;
  const Part = avatarPartRegistry[id];
  if (!Part) return null;
  return (
    <Part
      accent={accent}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/**
 * Layered SVG paper-doll.
 * Paint order: bg → cape → body → shirt → hair → moustache → glasses → hat
 */
export function AvatarCharacter({
  look,
  className,
  label,
  size = 200,
}: AvatarCharacterProps) {
  const a = look.accents ?? {};
  const gender = look.gender ?? "boy";
  const Body = gender === "girl" ? BaseBodyGirl : BaseBodyBoy;
  const moustache = gender === "boy" ? look.moustache : null;

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative overflow-hidden", className)}
      style={{ width: size, height: size * 1.4 }}
    >
      <svg
        viewBox={AVATAR_VIEWBOX}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <ellipse
          cx="100"
          cy="140"
          rx="88"
          ry="120"
          fill={look.background ?? "#E8E4F0"}
        />
      </svg>

      <Layer id={look.cape} accent={a.cape} />
      <Body
        skin={look.skin}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <Layer id={look.shirt} accent={a.shirt} />
      <Layer id={look.hair} accent={a.hair} />
      <Layer id={moustache} accent={a.moustache} />
      <Layer id={look.glasses} accent={a.glasses} />
      <Layer id={look.hat} accent={a.hat} />
    </div>
  );
}

/** Tiny preview of a single part for shop tiles. */
export function AvatarPartPreview({
  partId,
  accent,
  className,
}: {
  partId: AvatarPartId;
  accent?: string;
  className?: string;
}) {
  const Part = avatarPartRegistry[partId];
  if (!Part) return null;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Part
        accent={accent}
        className="h-full w-full origin-[center_32%] scale-[1.45]"
      />
    </div>
  );
}
