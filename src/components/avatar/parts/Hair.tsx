import { avatarSvgProps, type AvatarSvgProps } from "./shared";

const OUTLINE = "#1B1730";

/** Short cropped hair — default. */
export function HairShort({ accent = "#2A2438", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M54 108c-2-36 18-58 46-62 28-4 50 14 54 48 2 10-2 14-8 12-4-20-16-34-40-36-26-2-42 12-46 34-4 2-6-2-6 4Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M62 78c8-6 16-8 24-6"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/** Soft side-sweep. */
export function HairSweep({ accent = "#4A3428", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M52 112c0-40 22-66 52-68 26-2 48 16 52 50v8c-6-22-20-36-42-38-24-2-40 10-46 32-8 4-16 6-16 16Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M118 52c18 4 32 18 36 40 2 8-4 10-8 6-6-16-16-28-30-34-4-2-2-12 2-12Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M70 70c14-10 34-12 50-4"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}

/** Curly volume top. */
export function HairCurly({ accent = "#1B1433", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <circle cx="72" cy="72" r="16" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="96" cy="58" r="18" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="124" cy="66" r="17" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="140" cy="90" r="14" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="58" cy="94" r="13" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      <path
        d="M56 108c4-28 22-48 46-50 26-2 44 16 48 42"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Chin-length bob. */
export function HairBob({ accent = "#3D2A1F", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M48 100c2-40 24-62 52-64 28-2 50 18 54 56 2 14-2 28-8 36-4-18-14-28-28-30-4 20-12 34-20 42-8-8-16-22-20-42-16 4-26 16-30 34-4-10-4-22 0-32Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M62 78c12-8 28-10 42-6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.22"
      />
    </svg>
  );
}

/** Long flowing hair. */
export function HairLong({ accent = "#5C3D2E", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M50 100c0-38 22-64 50-66 28-2 50 20 54 56 4 20 2 48-4 72-6 4-12-8-14-20-4 24-10 44-18 56-8-14-12-36-14-54-4 22-10 44-20 58-10-16-14-40-16-60-8 14-14 28-18 36-6-22-4-44 0-78Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M68 72c14-10 36-12 52-4"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}

/** High ponytail. */
export function HairPony({ accent = "#2A1830", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M56 108c0-36 20-58 44-60 22-2 42 14 46 46 2 8-2 12-8 10-4-18-14-30-34-32-22-2-36 12-40 30-4 2-8 0-8 6Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Pony bun + tail */}
      <ellipse
        cx="128"
        cy="48"
        rx="18"
        ry="16"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <path
        d="M138 56c16 8 24 28 22 52-8-6-14-18-16-32-4 16-8 30-16 40 0-20 2-40 10-60Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="118" cy="58" r="4" fill="#FFC928" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  );
}
