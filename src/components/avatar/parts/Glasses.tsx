import { avatarSvgProps, type AvatarSvgProps } from "./shared";

const OUTLINE = "#1B1730";

/** Round wire frames. */
export function GlassesRound({ accent = "#2D8CFF", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <circle
        cx="80"
        cy="110"
        r="16"
        stroke={accent}
        strokeWidth="4"
        fill="rgba(255,255,255,0.15)"
      />
      <circle
        cx="120"
        cy="110"
        r="16"
        stroke={accent}
        strokeWidth="4"
        fill="rgba(255,255,255,0.15)"
      />
      <path
        d="M96 110h8"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M64 110H56c-2 0-4-2-4-4"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M136 110h8c2 0 4-2 4-4"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M72 104h6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M112 104h6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Dark shades. */
export function GlassesShade({ accent = "#101923", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <rect
        x="62"
        y="100"
        width="34"
        height="22"
        rx="8"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <rect
        x="104"
        y="100"
        width="34"
        height="22"
        rx="8"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <path
        d="M96 110h8"
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M62 108H54"
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M138 108h8"
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M68 106h12"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d="M110 106h12"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}
