import type { ReactNode } from "react";

export type CuteHairStyle =
  | "none"
  | "fluffy"
  | "buzz"
  | "swoop"
  | "spiky"
  | "bowl"
  | "mohawk"
  | "afro"
  | "long"
  | "bob"
  | "wavy"
  | "pigtails"
  | "ponytail"
  | "bun"
  | "braids"
  | "spacebuns";

export type CuteMustacheStyle =
  | "none"
  | "tiny"
  | "chevron"
  | "curly"
  | "broom"
  | "handlebar";

export type CuteGlassesStyle =
  | "none"
  | "round"
  | "square"
  | "nerd"
  | "aviator"
  | "cateye"
  | "star"
  | "hearts"
  | "sun";

export type CuteShirtStyle =
  | "plain"
  | "stripes"
  | "collar"
  | "hoodie"
  | "buttons"
  | "heart"
  | "bow"
  | "floral"
  | "dress";

export const CUTE_HAIR_COLORS = [
  "#8a5a3a",
  "#3a3a38",
  "#F0997B",
  "#FAC775",
  "#AFA9EC",
  "#ED93B1",
  "#5DCAA5",
  "#85B7EB",
] as const;

export const CUTE_SHIRT_COLORS = [
  "#F0997B",
  "#5DCAA5",
  "#85B7EB",
  "#ED93B1",
  "#AFA9EC",
  "#FAC775",
  "#D85A30",
  "#5F5E5A",
] as const;

export const HAIR_FOR = {
  boy: [
    "fluffy",
    "buzz",
    "swoop",
    "spiky",
    "bowl",
    "mohawk",
    "afro",
    "none",
  ] as const satisfies readonly CuteHairStyle[],
  girl: [
    "long",
    "bob",
    "wavy",
    "pigtails",
    "ponytail",
    "bun",
    "braids",
    "spacebuns",
    "none",
  ] as const satisfies readonly CuteHairStyle[],
};

export const GLASSES_FOR = {
  boy: [
    "none",
    "round",
    "square",
    "nerd",
    "aviator",
    "sun",
    "star",
  ] as const satisfies readonly CuteGlassesStyle[],
  girl: [
    "none",
    "round",
    "cateye",
    "hearts",
    "star",
    "sun",
  ] as const satisfies readonly CuteGlassesStyle[],
};

export const SHIRT_FOR = {
  boy: [
    "plain",
    "stripes",
    "collar",
    "hoodie",
    "buttons",
  ] as const satisfies readonly CuteShirtStyle[],
  girl: [
    "plain",
    "stripes",
    "heart",
    "bow",
    "floral",
    "dress",
  ] as const satisfies readonly CuteShirtStyle[],
};

export const STACHE_KEYS = [
  "none",
  "tiny",
  "chevron",
  "curly",
  "broom",
  "handlebar",
] as const satisfies readonly CuteMustacheStyle[];

export const HAIR_STYLES: Record<CuteHairStyle, (c: string) => ReactNode> = {
  none: () => null,
  fluffy: (c) => (
    <g fill={c}>
      <circle cx="80" cy="92" r="24" />
      <circle cx="105" cy="74" r="26" />
      <circle cx="130" cy="66" r="28" />
      <circle cx="155" cy="74" r="26" />
      <circle cx="180" cy="92" r="24" />
      <circle cx="64" cy="116" r="16" />
      <circle cx="196" cy="116" r="16" />
      <path d="M64 116 Q66 82 130 76 Q194 82 196 116 Q170 94 130 92 Q90 94 64 116Z" />
    </g>
  ),
  buzz: (c) => (
    <path
      d="M80 110 Q78 70 130 66 Q182 70 180 110 Q170 88 130 86 Q90 88 80 110Z"
      fill={c}
    />
  ),
  swoop: (c) => (
    <path
      d="M58 128 Q52 56 130 52 Q208 56 202 128 Q200 100 184 92 Q188 78 176 70 Q170 88 130 84 Q104 82 92 70 Q76 82 78 98 Q62 106 58 128Z"
      fill={c}
    />
  ),
  spiky: (c) => (
    <path
      d="M62 120 Q60 88 76 80 L68 58 L88 72 L90 46 L106 66 L124 38 L138 62 L154 44 L158 68 L178 54 L182 76 Q200 86 198 120 Q190 96 168 90 Q146 82 130 84 Q114 82 92 90 Q70 96 62 120Z"
      fill={c}
    />
  ),
  bowl: (c) => (
    <path
      d="M58 130 Q54 58 130 54 Q206 58 202 130 Q204 138 194 138 Q198 100 130 96 Q62 100 66 138 Q56 138 58 130Z"
      fill={c}
    />
  ),
  mohawk: (c) => (
    <g fill={c}>
      <path d="M116 36 Q130 22 144 36 L150 100 L110 100 Z" />
      <path d="M78 114 Q84 96 100 94 L100 106 Q88 108 82 118 Z" />
      <path d="M182 114 Q176 96 160 94 L160 106 Q172 108 178 118 Z" />
    </g>
  ),
  afro: (c) => (
    <g fill={c}>
      <circle cx="130" cy="70" r="46" />
      <circle cx="78" cy="92" r="30" />
      <circle cx="182" cy="92" r="30" />
      <circle cx="64" cy="122" r="20" />
      <circle cx="196" cy="122" r="20" />
    </g>
  ),
  long: (c) => (
    <path
      d="M56 130 Q52 56 130 52 Q208 56 204 130 L206 214 Q206 226 194 224 L190 140 Q188 104 168 94 Q148 84 130 86 Q112 84 92 94 Q72 104 70 140 L66 224 Q54 226 54 214 Z"
      fill={c}
    />
  ),
  bob: (c) => (
    <path
      d="M58 128 Q54 56 130 52 Q206 56 202 128 L204 176 Q204 188 192 186 L188 138 Q186 104 168 96 Q148 86 130 88 Q112 86 92 96 Q74 104 72 138 L68 186 Q56 188 56 176 Z"
      fill={c}
    />
  ),
  wavy: (c) => (
    <path
      d="M56 130 Q52 56 130 52 Q208 56 204 130 Q210 168 200 202 Q196 190 197 178 Q190 202 180 208 Q184 186 186 140 Q184 104 168 96 Q148 86 130 88 Q112 86 92 96 Q76 104 74 140 Q76 186 80 208 Q70 202 63 178 Q64 190 60 202 Q50 168 56 130Z"
      fill={c}
    />
  ),
  pigtails: (c) => (
    <g fill={c}>
      <path d="M62 122 Q58 60 130 56 Q202 60 198 122 Q194 96 176 90 Q150 82 130 86 Q110 82 84 90 Q66 96 62 122Z" />
      <circle cx="52" cy="98" r="20" />
      <circle cx="44" cy="128" r="16" />
      <circle cx="208" cy="98" r="20" />
      <circle cx="216" cy="128" r="16" />
      <circle cx="60" cy="80" r="7" fill="#F4C0D1" />
      <circle cx="200" cy="80" r="7" fill="#F4C0D1" />
    </g>
  ),
  ponytail: (c) => (
    <g fill={c}>
      <path d="M60 128 Q56 58 130 54 Q204 58 200 128 Q196 100 178 92 Q152 82 130 86 Q108 82 82 92 Q64 100 60 128Z" />
      <path d="M196 96 Q224 108 220 152 Q216 188 200 198 Q210 172 202 142 Q196 116 184 104 Z" />
    </g>
  ),
  bun: (c) => (
    <g fill={c}>
      <circle cx="130" cy="46" r="20" />
      <path d="M60 128 Q56 60 130 56 Q204 60 200 128 Q196 100 178 92 Q152 82 130 86 Q108 82 82 92 Q64 100 60 128Z" />
    </g>
  ),
  braids: (c) => (
    <g fill={c}>
      <path d="M60 128 Q56 58 130 54 Q204 58 200 128 Q196 100 178 92 Q152 82 130 86 Q108 82 82 92 Q64 100 60 128Z" />
      <ellipse cx="66" cy="150" rx="12" ry="14" />
      <ellipse cx="66" cy="172" rx="11" ry="13" />
      <ellipse cx="66" cy="192" rx="9" ry="11" />
      <ellipse cx="194" cy="150" rx="12" ry="14" />
      <ellipse cx="194" cy="172" rx="11" ry="13" />
      <ellipse cx="194" cy="192" rx="9" ry="11" />
    </g>
  ),
  spacebuns: (c) => (
    <g fill={c}>
      <circle cx="88" cy="52" r="18" />
      <circle cx="172" cy="52" r="18" />
      <path d="M60 126 Q56 60 130 56 Q204 60 200 126 Q196 100 178 92 Q152 82 130 86 Q108 82 82 92 Q64 100 60 126Z" />
    </g>
  ),
};

export const MUSTACHE_STYLES: Record<
  CuteMustacheStyle,
  (c: string) => ReactNode
> = {
  none: () => null,
  tiny: (c) => (
    <path
      d="M118 156 Q124 150 130 155 Q136 150 142 156 Q136 160 130 158 Q124 160 118 156Z"
      fill={c}
    />
  ),
  chevron: (c) => (
    <path d="M110 152 L130 160 L150 152 L148 158 L130 165 L112 158Z" fill={c} />
  ),
  curly: (c) => (
    <path
      d="M108 158 Q104 150 112 148 Q118 154 126 153 Q130 150 134 153 Q142 154 148 148 Q156 150 152 158 Q146 164 138 159 Q133 156 130 157 Q127 156 122 159 Q114 164 108 158Z"
      fill={c}
    />
  ),
  broom: (c) => (
    <path
      d="M112 154 Q130 146 148 154 Q150 166 138 167 Q132 167 130 162 Q128 167 122 167 Q110 166 112 154Z"
      fill={c}
    />
  ),
  handlebar: (c) => (
    <path
      d="M104 156 Q100 148 106 146 Q114 152 122 152 Q127 148 130 152 Q133 148 138 152 Q146 152 154 146 Q160 148 156 156 Q150 162 140 158 Q134 155 130 156 Q126 155 120 158 Q110 162 104 156Z"
      fill={c}
    />
  ),
};

export const GLASSES_STYLES: Record<CuteGlassesStyle, ReactNode> = {
  none: null,
  round: (
    <g fill="none" stroke="#3a3a38" strokeWidth="4">
      <circle cx="102" cy="132" r="22" />
      <circle cx="158" cy="132" r="22" />
      <path d="M124 130 Q130 126 136 130" />
      <path d="M80 128 L60 122" />
      <path d="M180 128 L200 122" />
    </g>
  ),
  square: (
    <g fill="none" stroke="#3a3a38" strokeWidth="4">
      <rect x="80" y="118" width="40" height="30" rx="6" />
      <rect x="140" y="118" width="40" height="30" rx="6" />
      <path d="M120 130 L140 130" />
      <path d="M80 126 L60 120" />
      <path d="M180 126 L200 120" />
    </g>
  ),
  nerd: (
    <g>
      <g fill="none" stroke="#2C2C2A" strokeWidth="5">
        <circle cx="102" cy="132" r="21" />
        <circle cx="158" cy="132" r="21" />
        <path d="M123 130 L137 130" />
        <path d="M81 128 L60 122" />
        <path d="M179 128 L200 122" />
      </g>
      <rect
        x="126"
        y="123"
        width="8"
        height="18"
        fill="#fff"
        stroke="#2C2C2A"
        strokeWidth="2"
      />
    </g>
  ),
  aviator: (
    <g fill="none" stroke="#5F5E5A" strokeWidth="4">
      <path d="M80 122 L124 122 Q124 152 102 152 Q80 152 80 122Z" />
      <path d="M136 122 L180 122 Q180 152 158 152 Q136 152 136 122Z" />
      <path d="M124 126 L136 126" />
      <path d="M80 124 L62 120" />
      <path d="M180 124 L198 120" />
    </g>
  ),
  cateye: (
    <g fill="none" stroke="#D4537E" strokeWidth="4">
      <path d="M78 134 Q82 118 104 120 Q124 122 122 134 Q120 148 102 148 Q82 148 78 134Z" />
      <path d="M138 134 Q136 122 156 120 Q178 118 182 134 Q178 148 158 148 Q140 148 138 134Z" />
      <path d="M122 132 L138 132" />
      <path d="M76 124 L66 116" />
      <path d="M184 124 L194 116" />
    </g>
  ),
  star: (
    <g>
      <path
        d="M102 110 L108 124 L123 126 L112 136 L115 151 L102 143 L89 151 L92 136 L81 126 L96 124 Z"
        fill="#FAC775"
        stroke="#BA7517"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M158 110 L164 124 L179 126 L168 136 L171 151 L158 143 L145 151 L148 136 L137 126 L152 124 Z"
        fill="#FAC775"
        stroke="#BA7517"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M124 128 Q130 124 136 128"
        stroke="#BA7517"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M84 126 L62 122"
        stroke="#BA7517"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M176 126 L198 122"
        stroke="#BA7517"
        strokeWidth="3"
        fill="none"
      />
    </g>
  ),
  hearts: (
    <g>
      <path
        d="M102 118 Q92 108 84 116 Q76 124 84 134 L102 150 L120 134 Q128 124 120 116 Q112 108 102 118Z"
        fill="#ED93B1"
        opacity="0.85"
        stroke="#D4537E"
        strokeWidth="3"
      />
      <path
        d="M158 118 Q148 108 140 116 Q132 124 140 134 L158 150 L176 134 Q184 124 176 116 Q168 108 158 118Z"
        fill="#ED93B1"
        opacity="0.85"
        stroke="#D4537E"
        strokeWidth="3"
      />
      <path
        d="M122 128 Q130 124 138 128"
        stroke="#D4537E"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M82 124 L62 120"
        stroke="#D4537E"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M178 124 L198 120"
        stroke="#D4537E"
        strokeWidth="3"
        fill="none"
      />
    </g>
  ),
  sun: (
    <g>
      <rect x="79" y="117" width="42" height="30" rx="12" fill="#2C2C2A" />
      <rect x="139" y="117" width="42" height="30" rx="12" fill="#2C2C2A" />
      <path d="M121 128 L139 128" stroke="#2C2C2A" strokeWidth="4" />
      <path
        d="M79 125 L60 120"
        stroke="#2C2C2A"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M181 125 L200 120"
        stroke="#2C2C2A"
        strokeWidth="4"
        fill="none"
      />
      <rect x="86" y="122" width="12" height="6" rx="3" fill="#5F5E5A" />
      <rect x="146" y="122" width="12" height="6" rx="3" fill="#5F5E5A" />
    </g>
  ),
};

export const SHIRT_DECO: Record<CuteShirtStyle, (c: string) => ReactNode> = {
  plain: () => null,
  stripes: (c) => (
    <g stroke={c} strokeWidth="7" opacity="0.35">
      <path d="M85 232 L175 232" />
      <path d="M85 252 L175 252" />
      <path d="M88 272 L172 272" />
    </g>
  ),
  collar: () => (
    <path
      d="M118 212 Q130 224 142 212 L138 226 Q130 232 122 226 Z"
      fill="#fff"
      opacity="0.85"
    />
  ),
  hoodie: (c) => (
    <g>
      <path
        d="M105 214 Q130 236 155 214 Q158 226 148 232 Q130 244 112 232 Q102 226 105 214Z"
        fill={c}
        opacity="0.55"
      />
      <path d="M126 232 L126 262" stroke="#fff" strokeWidth="3" opacity="0.7" />
      <path d="M134 232 L134 262" stroke="#fff" strokeWidth="3" opacity="0.7" />
    </g>
  ),
  buttons: () => (
    <g>
      <path d="M130 216 L130 285" stroke="#00000022" strokeWidth="2" />
      <circle cx="130" cy="234" r="2.6" fill="#fff" />
      <circle cx="130" cy="252" r="2.6" fill="#fff" />
      <circle cx="130" cy="270" r="2.6" fill="#fff" />
    </g>
  ),
  heart: () => (
    <path
      d="M130 244 Q122 234 114 240 Q108 245 114 253 L130 266 L146 253 Q152 245 146 240 Q138 234 130 244Z"
      fill="#fff"
      opacity="0.85"
    />
  ),
  bow: () => (
    <g fill="#ED93B1">
      <path d="M118 216 L106 210 L106 226 Z" />
      <path d="M142 216 L154 210 L154 226 Z" />
      <circle cx="130" cy="217" r="5" />
    </g>
  ),
  floral: () => (
    <g>
      <g transform="translate(106,238)" fill="#fff" opacity="0.9">
        <circle r="4" />
        <circle cx="6" r="4" />
        <circle cx="-6" r="4" />
        <circle cy="6" r="4" />
        <circle cy="-6" r="4" />
        <circle r="2.5" fill="#FAC775" />
      </g>
      <g transform="translate(152,260)" fill="#fff" opacity="0.9">
        <circle r="4" />
        <circle cx="6" r="4" />
        <circle cx="-6" r="4" />
        <circle cy="6" r="4" />
        <circle cy="-6" r="4" />
        <circle r="2.5" fill="#FAC775" />
      </g>
    </g>
  ),
  dress: (c) => (
    <path
      d="M92 288 L98 250 Q130 238 162 250 L168 288 Q168 292 160 292 L100 292 Q92 292 92 288Z"
      fill={c}
    />
  ),
};

/** Map shop partId → cute style key */
export const HAIR_PART_TO_STYLE: Record<string, CuteHairStyle> = {
  "hair-fluffy": "fluffy",
  "hair-buzz": "buzz",
  "hair-swoop": "swoop",
  "hair-spiky": "spiky",
  "hair-bowl": "bowl",
  "hair-mohawk": "mohawk",
  "hair-afro": "afro",
  "hair-long": "long",
  "hair-bob": "bob",
  "hair-wavy": "wavy",
  "hair-pigtails": "pigtails",
  "hair-ponytail": "ponytail",
  "hair-bun": "bun",
  "hair-braids": "braids",
  "hair-spacebuns": "spacebuns",
};

export const MUSTACHE_PART_TO_STYLE: Record<string, CuteMustacheStyle> = {
  "stache-tiny": "tiny",
  "stache-chevron": "chevron",
  "stache-curly": "curly",
  "stache-broom": "broom",
  "stache-handlebar": "handlebar",
};

export const GLASSES_PART_TO_STYLE: Record<string, CuteGlassesStyle> = {
  "glasses-round": "round",
  "glasses-square": "square",
  "glasses-nerd": "nerd",
  "glasses-aviator": "aviator",
  "glasses-cateye": "cateye",
  "glasses-star": "star",
  "glasses-hearts": "hearts",
  "glasses-sun": "sun",
};

export const SHIRT_PART_TO_STYLE: Record<string, CuteShirtStyle> = {
  "shirt-plain": "plain",
  "shirt-stripes": "stripes",
  "shirt-collar": "collar",
  "shirt-hoodie": "hoodie",
  "shirt-buttons": "buttons",
  "shirt-heart": "heart",
  "shirt-bow": "bow",
  "shirt-floral": "floral",
  "shirt-dress": "dress",
};
