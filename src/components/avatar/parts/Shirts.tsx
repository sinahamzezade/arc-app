import { avatarSvgProps, type AvatarSvgProps } from "./shared";

const OUTLINE = "#1B1730";

/** Arlo purple hoodie. */
export function ShirtHoodie({ accent = "#6B4EFF", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M58 160c10-8 30-14 42-14s32 6 42 14c8 6 14 22 14 40v36H44v-36c0-18 6-34 14-40Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Hood collar */}
      <path
        d="M78 158c6 10 14 14 22 14s16-4 22-14"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M84 162c4 6 10 10 16 10s12-4 16-10"
        fill="#5B3EE8"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Pocket */}
      <path
        d="M78 200h44v18c0 6-8 10-22 10s-22-4-22-10v-18Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* Strings */}
      <path
        d="M92 176v20"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M108 176v20"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="92" cy="198" r="3" fill="#FFC928" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="108" cy="198" r="3" fill="#FFC928" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  );
}

/** Gold zip jacket. */
export function ShirtGoldZip({ accent = "#F0A81E", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M58 160c10-8 30-14 42-14s32 6 42 14c8 6 14 22 14 40v36H44v-36c0-18 6-34 14-40Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M100 148v88"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[160, 176, 192, 208].map((y) => (
        <rect
          key={y}
          x="96"
          y={y}
          width="8"
          height="8"
          rx="1.5"
          fill="#FFC928"
          stroke={OUTLINE}
          strokeWidth="2"
        />
      ))}
      <path
        d="M70 170h20"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M110 170h20"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/** Clean tee. */
export function ShirtTee({ accent = "#2D8CFF", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M58 162c10-6 28-12 42-12s32 6 42 12c6 4 12 18 12 34v40H46v-40c0-16 6-30 12-34Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M82 152c6 8 12 12 18 12s12-4 18-12"
        fill="#F2C4A0"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Arlo mark */}
      <circle
        cx="100"
        cy="190"
        r="12"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        opacity="0.7"
      />
      <path
        d="M92 194c4-8 12-8 16 0"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
