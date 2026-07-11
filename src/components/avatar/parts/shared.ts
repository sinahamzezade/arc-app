import type { SVGProps } from "react";

/** Shared viewBox for every avatar layer — stack without offset math. */
export const AVATAR_VIEWBOX = "0 0 200 280";

export type AvatarSvgProps = SVGProps<SVGSVGElement> & {
  /** Primary fill tint for the part */
  accent?: string;
  /** Skin tone for body layers */
  skin?: string;
};

export function avatarSvgProps({
  accent: _accent,
  skin: _skin,
  className,
  ...rest
}: AvatarSvgProps) {
  return {
    viewBox: AVATAR_VIEWBOX,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    ...rest,
  };
}

/** Darken a hex color for shade accents. */
export function darkenHex(hex: string, amount = 0.18): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const n = parseInt(raw, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
