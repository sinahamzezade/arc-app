"use client";

import { cn } from "@/lib/utils";
import {
  CuteAvatar,
  CutePartPreview,
  type CuteAvatarLook,
} from "@/components/avatar/cute/CuteAvatar";
import {
  GLASSES_PART_TO_STYLE,
  HAIR_PART_TO_STYLE,
  MUSTACHE_PART_TO_STYLE,
  SHIRT_PART_TO_STYLE,
  type CuteGlassesStyle,
  type CuteHairStyle,
  type CuteMustacheStyle,
  type CuteShirtStyle,
} from "@/components/avatar/cute/styles";

export type AvatarPartId =
  | `hair-${string}`
  | `glasses-${string}`
  | `stache-${string}`
  | `shirt-${string}`;

export type AvatarLook = {
  gender?: "boy" | "girl";
  hair?: AvatarPartId | null;
  glasses?: AvatarPartId | null;
  moustache?: AvatarPartId | null;
  shirt?: AvatarPartId | null;
  background?: string;
  accents?: Partial<
    Record<"hair" | "glasses" | "moustache" | "shirt", string | undefined>
  >;
};

type AvatarCharacterProps = {
  look: AvatarLook;
  className?: string;
  label?: string;
  size?: number;
  animate?: boolean;
};

function toCuteLook(look: AvatarLook): CuteAvatarLook {
  const a = look.accents ?? {};
  const gender = look.gender ?? "boy";
  const hairStyle: CuteHairStyle =
    (look.hair && HAIR_PART_TO_STYLE[look.hair]) || "none";
  const glassesStyle: CuteGlassesStyle =
    (look.glasses && GLASSES_PART_TO_STYLE[look.glasses]) || "none";
  const mustacheStyle: CuteMustacheStyle =
    gender === "girl"
      ? "none"
      : (look.moustache && MUSTACHE_PART_TO_STYLE[look.moustache]) || "none";
  const shirtStyle: CuteShirtStyle =
    (look.shirt && SHIRT_PART_TO_STYLE[look.shirt]) || "plain";

  return {
    gender,
    hair: hairStyle,
    glasses: glassesStyle,
    mustache: mustacheStyle,
    shirt: shirtStyle,
    hairColor: a.hair ?? "#8a5a3a",
    shirtColor: a.shirt ?? "#AFA9EC",
    background: look.background,
  };
}

/**
 * Cute chibi avatar — gender-aware hair / glasses / stache / shirt layers.
 */
export function AvatarCharacter({
  look,
  className,
  label,
  size = 200,
  animate = true,
}: AvatarCharacterProps) {
  return (
    <CuteAvatar
      look={toCuteLook(look)}
      className={className}
      label={label}
      size={size}
      animate={animate}
    />
  );
}

function partKind(
  partId: string,
): "hair" | "mustache" | "glasses" | "shirt" {
  if (partId.startsWith("hair-")) return "hair";
  if (partId.startsWith("stache-")) return "mustache";
  if (partId.startsWith("glasses-")) return "glasses";
  return "shirt";
}

function partStyleKey(partId: string): string {
  if (partId.startsWith("hair-")) {
    return HAIR_PART_TO_STYLE[partId] ?? "fluffy";
  }
  if (partId.startsWith("stache-")) {
    return MUSTACHE_PART_TO_STYLE[partId] ?? "tiny";
  }
  if (partId.startsWith("glasses-")) {
    return GLASSES_PART_TO_STYLE[partId] ?? "round";
  }
  return SHIRT_PART_TO_STYLE[partId] ?? "plain";
}

/** Tiny preview of a single part for shop tiles. */
export function AvatarPartPreview({
  partId,
  accent,
  className,
}: {
  partId: AvatarPartId | string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <CutePartPreview
        kind={partKind(partId)}
        style={partStyleKey(partId)}
        accent={accent}
        className="h-full w-full"
      />
    </div>
  );
}
