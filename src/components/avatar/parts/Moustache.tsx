import { avatarSvgProps, type AvatarSvgProps } from "./shared";

const OUTLINE = "#1B1730";

/** Classic handlebar. */
export function MoustacheHandlebar({
  accent = "#2A2438",
  ...props
}: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M78 128c6-8 14-10 22-10s16 2 22 10c-6 2-12 4-22 4s-16-2-22-4Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M72 130c-6 2-10 8-8 12 4-2 8-4 12-6"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M128 130c6 2 10 8 8 12-4-2-8-4-12-6"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Soft stache. */
export function MoustacheSoft({ accent = "#4A3428", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M84 130c8-6 16-8 16-8s8 2 16 8c-6 4-12 6-16 6s-10-2-16-6Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Thick professor. */
export function MoustacheThick({ accent = "#1B1433", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M74 126c10-10 20-12 26-12s16 2 26 12c-8 6-16 10-26 10s-18-4-26-10Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M90 132h20"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}
