import { avatarSvgProps, type AvatarSvgProps } from "./shared";

const OUTLINE = "#1B1730";

/** Hero cape behind body. */
export function CapeHero({ accent = "#FF8A3D", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M70 158c-28 12-40 48-36 86 20-8 40-10 66-6 26-4 46-2 66 6 4-38-8-74-36-86-10 6-30 10-60 0Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M78 170c8 20 12 40 10 62"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d="M122 170c-8 20-12 40-10 62"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/** Shadow cloak. */
export function CapeShadow({ accent = "#35209D", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M66 156c-32 16-46 52-40 92 24-10 48-12 74-8 26-4 50-2 74 8 6-40-8-76-40-92-12 8-34 12-68 0Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M100 168v70"
        stroke="#6B4EFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="100" cy="164" r="5" fill="#FFC928" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  );
}
