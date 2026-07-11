import {
  avatarSvgProps,
  darkenHex,
  type AvatarSvgProps,
} from "./shared";

const DEFAULT_SKIN = "#F2C4A0";
const OUTLINE = "#1B1730";
const EYE = "#1B1730";
const CHEEK = "#F4A08C";

function tones(skin?: string) {
  const base = skin ?? DEFAULT_SKIN;
  return { skin: base, shade: darkenHex(base, 0.16) };
}

/** Boy base — rounder jaw, thicker brows. */
export function BaseBodyBoy({ skin, ...props }: AvatarSvgProps) {
  const { skin: SKIN, shade: SKIN_SHADE } = tones(skin);
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M88 148c0 8 4 14 12 14s12-6 12-14"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M62 162c8-6 28-10 38-10s30 4 38 10c6 4 10 18 10 34v28H52v-28c0-16 4-30 10-34Z"
        fill="#D4CCE8"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse
        cx="100"
        cy="108"
        rx="48"
        ry="52"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <ellipse
        cx="52"
        cy="112"
        rx="8"
        ry="11"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <ellipse cx="52" cy="112" rx="3.5" ry="5" fill={SKIN_SHADE} />
      <ellipse
        cx="148"
        cy="112"
        rx="8"
        ry="11"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <ellipse cx="148" cy="112" rx="3.5" ry="5" fill={SKIN_SHADE} />
      <ellipse cx="100" cy="128" rx="28" ry="16" fill={SKIN_SHADE} opacity="0.35" />
      <ellipse cx="82" cy="108" rx="5.5" ry="6.5" fill={EYE} />
      <ellipse cx="118" cy="108" rx="5.5" ry="6.5" fill={EYE} />
      <circle cx="84" cy="106" r="1.8" fill="#fff" />
      <circle cx="120" cy="106" r="1.8" fill="#fff" />
      <path
        d="M72 96c4-4 12-5 18-2"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M110 94c6-3 14-2 18 2"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M100 112c2 6 4 10 0 14"
        stroke={SKIN_SHADE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M88 136c6 8 18 8 24 0"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="68" cy="122" rx="7" ry="4.5" fill={CHEEK} opacity="0.55" />
      <ellipse cx="132" cy="122" rx="7" ry="4.5" fill={CHEEK} opacity="0.55" />
      <path
        d="M52 170c-10 8-14 22-12 36"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M148 170c10 8 14 22 12 36"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Girl base — softer cheeks, lashes, slightly oval face. */
export function BaseBodyGirl({ skin, ...props }: AvatarSvgProps) {
  const { skin: SKIN, shade: SKIN_SHADE } = tones(skin);
  return (
    <svg {...avatarSvgProps(props)} aria-hidden>
      <path
        d="M90 148c0 7 3 12 10 12s10-5 10-12"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M64 164c8-8 28-12 36-12s28 4 36 12c6 4 10 16 10 32v30H54v-30c0-16 4-28 10-32Z"
        fill="#E8DFF8"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse
        cx="100"
        cy="106"
        rx="46"
        ry="54"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <ellipse
        cx="54"
        cy="110"
        rx="7"
        ry="10"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <ellipse cx="54" cy="110" rx="3" ry="4.5" fill={SKIN_SHADE} />
      <ellipse
        cx="146"
        cy="110"
        rx="7"
        ry="10"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <ellipse cx="146" cy="110" rx="3" ry="4.5" fill={SKIN_SHADE} />
      <ellipse cx="100" cy="126" rx="26" ry="15" fill={SKIN_SHADE} opacity="0.3" />
      <ellipse cx="82" cy="106" rx="5.5" ry="7" fill={EYE} />
      <ellipse cx="118" cy="106" rx="5.5" ry="7" fill={EYE} />
      <circle cx="84" cy="104" r="1.8" fill="#fff" />
      <circle cx="120" cy="104" r="1.8" fill="#fff" />
      <path
        d="M74 98c2-3 5-4 8-3M70 102c2-2 4-3 6-2"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M118 95c3-3 6-4 9-2M124 100c2-2 4-3 6-2"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M72 94c5-3 12-4 18-1"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M110 93c5-3 12-3 18 1"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M100 110c2 5 3 9 0 12"
        stroke={SKIN_SHADE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M90 134c5 7 15 7 20 0"
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="68" cy="120" rx="8" ry="5" fill={CHEEK} opacity="0.65" />
      <ellipse cx="132" cy="120" rx="8" ry="5" fill={CHEEK} opacity="0.65" />
      <path
        d="M54 172c-8 8-12 20-10 34"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M146 172c8 8 12 20 10 34"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** @deprecated use BaseBodyBoy */
export const BaseBody = BaseBodyBoy;
