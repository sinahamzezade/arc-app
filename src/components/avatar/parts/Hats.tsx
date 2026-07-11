import { avatarSvgProps, type AvatarSvgProps } from "./shared";

const OUTLINE = "#1B1730";

/** Soft knit beanie. */
export function HatBeanie({ accent = "#6B4EFF", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M58 92c4-34 24-52 42-52s38 18 42 52c-8 4-26 8-42 8s-34-4-42-8Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M54 90c4 8 22 14 46 14s42-6 46-14"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <ellipse
        cx="100"
        cy="48"
        rx="9"
        ry="8"
        fill="#FFC928"
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <path
        d="M70 78h60"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/** Tiny crown. */
export function HatCrown({ accent = "#FFC928", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M62 78l10-22 14 14 14-26 14 26 14-14 10 22H62Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <rect
        x="62"
        y="76"
        width="76"
        height="12"
        rx="3"
        fill="#E6A800"
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <circle cx="86" cy="82" r="3" fill="#fff" opacity="0.7" />
      <circle cx="100" cy="82" r="3" fill="#6B4EFF" />
      <circle cx="114" cy="82" r="3" fill="#fff" opacity="0.7" />
    </svg>
  );
}

/** Graduation cap. */
export function HatGrad({ accent = "#1B1433", ...props }: AvatarSvgProps) {
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M48 78l52-22 52 22-52 18L48 78Z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M68 84v18c0 6 14 12 32 12s32-6 32-12V84"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M152 78v28"
        stroke="#FFC928"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="152" cy="108" r="5" fill="#FFC928" stroke={OUTLINE} strokeWidth="2.5" />
    </svg>
  );
}
