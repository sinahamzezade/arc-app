import {
  CUTE_HAIR_COLORS,
  CUTE_SHIRT_COLORS,
  HAIR_FOR,
  GLASSES_FOR,
  SHIRT_FOR,
} from "@/components/avatar/cute/styles";
import type { AvatarPartId } from "@/components/avatar/AvatarCharacter";

export type AvatarGender = "boy" | "girl";

export type AvatarCategory =
  | "hair"
  | "glasses"
  | "moustache"
  | "hoodies"
  | "backgrounds";

export type AvatarItem = {
  id: string;
  name: string;
  category: AvatarCategory;
  cost: number;
  rarity: "common" | "rare" | "legendary";
  accent: string;
  partId?: string;
  gender?: AvatarGender | "any";
  clear?: boolean;
};

export type AvatarStudioCatalog = {
  coins: number;
  categories: { id: AvatarCategory; label: string }[];
  items: AvatarItem[];
  starterOwned: string[];
  starterEquipped: Partial<Record<AvatarCategory, string>>;
};

function noneItem(category: AvatarCategory): AvatarItem {
  return {
    id: `none-${category}`,
    name: "None",
    category,
    cost: 0,
    rarity: "common",
    accent: "#C3BADB",
    clear: true,
  };
}

const HAIR_META: Record<
  string,
  { name: string; cost: number; rarity: AvatarItem["rarity"]; accent: string }
> = {
  fluffy: { name: "Fluffy Cloud", cost: 0, rarity: "common", accent: "#8a5a3a" },
  buzz: { name: "Buzz Cut", cost: 120, rarity: "common", accent: "#3a3a38" },
  swoop: { name: "Side Swoop", cost: 180, rarity: "common", accent: "#3a3a38" },
  spiky: { name: "Spiky", cost: 220, rarity: "common", accent: "#FAC775" },
  bowl: { name: "Bowl Cut", cost: 260, rarity: "rare", accent: "#AFA9EC" },
  mohawk: { name: "Mohawk", cost: 420, rarity: "rare", accent: "#ED93B1" },
  afro: { name: "Afro", cost: 380, rarity: "rare", accent: "#8a5a3a" },
  long: { name: "Long Flow", cost: 0, rarity: "common", accent: "#8a5a3a" },
  bob: { name: "Soft Bob", cost: 160, rarity: "common", accent: "#3a3a38" },
  wavy: { name: "Wavy", cost: 280, rarity: "common", accent: "#F0997B" },
  pigtails: { name: "Pigtails", cost: 320, rarity: "rare", accent: "#ED93B1" },
  ponytail: { name: "Ponytail", cost: 300, rarity: "rare", accent: "#8a5a3a" },
  bun: { name: "Top Bun", cost: 260, rarity: "common", accent: "#FAC775" },
  braids: { name: "Braids", cost: 440, rarity: "rare", accent: "#AFA9EC" },
  spacebuns: {
    name: "Space Buns",
    cost: 520,
    rarity: "legendary",
    accent: "#ED93B1",
  },
};

const GLASSES_META: Record<
  string,
  { name: string; cost: number; rarity: AvatarItem["rarity"]; accent: string }
> = {
  round: { name: "Round Specs", cost: 150, rarity: "common", accent: "#3a3a38" },
  square: { name: "Square Frames", cost: 180, rarity: "common", accent: "#3a3a38" },
  nerd: { name: "Nerd Specs", cost: 280, rarity: "rare", accent: "#2C2C2A" },
  aviator: { name: "Aviator", cost: 340, rarity: "rare", accent: "#5F5E5A" },
  cateye: { name: "Cat Eye", cost: 360, rarity: "rare", accent: "#D4537E" },
  hearts: { name: "Heart Eyes", cost: 380, rarity: "rare", accent: "#ED93B1" },
  star: { name: "Star Shades", cost: 520, rarity: "legendary", accent: "#FAC775" },
  sun: { name: "Sunnies", cost: 300, rarity: "rare", accent: "#2C2C2A" },
};

const STACHE_META: Record<
  string,
  { name: string; cost: number; rarity: AvatarItem["rarity"]; accent: string }
> = {
  tiny: { name: "Tiny Stache", cost: 90, rarity: "common", accent: "#8a5a3a" },
  chevron: { name: "Chevron", cost: 160, rarity: "common", accent: "#3a3a38" },
  curly: { name: "Curly Stache", cost: 260, rarity: "rare", accent: "#3a3a38" },
  broom: { name: "Broom Stache", cost: 420, rarity: "rare", accent: "#8a5a3a" },
  handlebar: {
    name: "Handlebar",
    cost: 540,
    rarity: "legendary",
    accent: "#3a3a38",
  },
};

const SHIRT_META: Record<
  string,
  { name: string; cost: number; rarity: AvatarItem["rarity"]; accent: string }
> = {
  plain: { name: "Plain Tee", cost: 0, rarity: "common", accent: "#AFA9EC" },
  stripes: { name: "Stripes", cost: 160, rarity: "common", accent: "#85B7EB" },
  collar: { name: "Collar", cost: 200, rarity: "common", accent: "#5DCAA5" },
  hoodie: { name: "Hoodie", cost: 280, rarity: "rare", accent: "#6B4EFF" },
  buttons: { name: "Buttons", cost: 220, rarity: "common", accent: "#F0997B" },
  heart: { name: "Heart Tee", cost: 180, rarity: "common", accent: "#ED93B1" },
  bow: { name: "Bow Neck", cost: 260, rarity: "rare", accent: "#ED93B1" },
  floral: { name: "Floral", cost: 340, rarity: "rare", accent: "#5DCAA5" },
  dress: { name: "Dress", cost: 480, rarity: "legendary", accent: "#AFA9EC" },
};

function hairItems(): AvatarItem[] {
  const out: AvatarItem[] = [];
  for (const style of HAIR_FOR.boy) {
    if (style === "none") continue;
    const meta = HAIR_META[style];
    out.push({
      id: `hair-${style}`,
      name: meta.name,
      category: "hair",
      cost: meta.cost,
      rarity: meta.rarity,
      accent: meta.accent,
      partId: `hair-${style}`,
      gender: "boy",
    });
  }
  for (const style of HAIR_FOR.girl) {
    if (style === "none") continue;
    const meta = HAIR_META[style];
    out.push({
      id: `hair-${style}`,
      name: meta.name,
      category: "hair",
      cost: meta.cost,
      rarity: meta.rarity,
      accent: meta.accent,
      partId: `hair-${style}`,
      gender: "girl",
    });
  }
  return out;
}

function glassesItems(): AvatarItem[] {
  const seen = new Set<string>();
  const out: AvatarItem[] = [];
  for (const g of ["boy", "girl"] as const) {
    for (const style of GLASSES_FOR[g]) {
      if (style === "none" || seen.has(style)) continue;
      seen.add(style);
      const meta = GLASSES_META[style];
      const inBoy = (GLASSES_FOR.boy as readonly string[]).includes(style);
      const inGirl = (GLASSES_FOR.girl as readonly string[]).includes(style);
      out.push({
        id: `glasses-${style}`,
        name: meta.name,
        category: "glasses",
        cost: meta.cost,
        rarity: meta.rarity,
        accent: meta.accent,
        partId: `glasses-${style}`,
        gender: inBoy && inGirl ? "any" : inBoy ? "boy" : "girl",
      });
    }
  }
  return out;
}

function stacheItems(): AvatarItem[] {
  return Object.entries(STACHE_META).map(([style, meta]) => ({
    id: `stache-${style}`,
    name: meta.name,
    category: "moustache" as const,
    cost: meta.cost,
    rarity: meta.rarity,
    accent: meta.accent,
    partId: `stache-${style}`,
    gender: "boy" as const,
  }));
}

function shirtItems(): AvatarItem[] {
  const out: AvatarItem[] = [];
  for (const style of SHIRT_FOR.boy) {
    const meta = SHIRT_META[style];
    out.push({
      id: `shirt-${style}`,
      name: meta.name,
      category: "hoodies",
      cost: meta.cost,
      rarity: meta.rarity,
      accent: meta.accent,
      partId: `shirt-${style}`,
      gender: "boy",
    });
  }
  for (const style of SHIRT_FOR.girl) {
    if ((SHIRT_FOR.boy as readonly string[]).includes(style)) {
      // shared styles (plain, stripes) already added as boy — mark any
      const existing = out.find((i) => i.id === `shirt-${style}`);
      if (existing) {
        existing.gender = "any";
        continue;
      }
    }
    const meta = SHIRT_META[style];
    out.push({
      id: `shirt-${style}`,
      name: meta.name,
      category: "hoodies",
      cost: meta.cost,
      rarity: meta.rarity,
      accent: meta.accent,
      partId: `shirt-${style}`,
      gender: "girl",
    });
  }
  return out;
}

const categoryIds: AvatarCategory[] = [
  "hair",
  "glasses",
  "moustache",
  "hoodies",
  "backgrounds",
];

export const avatarStudioCatalog: AvatarStudioCatalog = {
  coins: 2450,
  categories: [
    { id: "hair", label: "Hair" },
    { id: "glasses", label: "Glasses" },
    { id: "moustache", label: "Stache" },
    { id: "hoodies", label: "Shirt" },
    { id: "backgrounds", label: "BGs" },
  ],
  items: [
    ...categoryIds.map(noneItem),
    ...hairItems(),
    ...glassesItems(),
    ...stacheItems(),
    ...shirtItems(),
    {
      id: "bg-cream",
      name: "Cream Paper",
      category: "backgrounds",
      cost: 0,
      rarity: "common",
      accent: "#F5F4EF",
    },
    {
      id: "bg-lavender",
      name: "Lavender Mist",
      category: "backgrounds",
      cost: 0,
      rarity: "common",
      accent: "#F6F2FF",
    },
    {
      id: "bg-sunset",
      name: "Sunset Desk",
      category: "backgrounds",
      cost: 220,
      rarity: "common",
      accent: "#FFB088",
    },
    {
      id: "bg-boss",
      name: "Boss Arena",
      category: "backgrounds",
      cost: 750,
      rarity: "legendary",
      accent: "#4B2FD6",
    },
  ],
  starterOwned: [
    ...categoryIds.map((c) => `none-${c}`),
    "bg-cream",
    "bg-lavender",
    "hair-fluffy",
    "hair-long",
    "shirt-plain",
  ],
  starterEquipped: {
    backgrounds: "bg-cream",
    hair: "hair-fluffy",
    hoodies: "shirt-plain",
  },
};

export function getAvatarItem(id: string) {
  return avatarStudioCatalog.items.find((i) => i.id === id);
}

export function itemFitsGender(
  item: AvatarItem,
  gender: AvatarGender,
): boolean {
  if (item.clear) return true;
  if (!item.gender || item.gender === "any") return true;
  return item.gender === gender;
}

export function defaultHairForGender(gender: AvatarGender): string {
  return gender === "girl" ? "hair-long" : "hair-fluffy";
}

export function defaultShirtForGender(gender: AvatarGender): string {
  return "shirt-plain";
}

/** Color slots user can tint */
export type AvatarColorSlot =
  | "skin"
  | "hair"
  | "glasses"
  | "moustache"
  | "hoodies"
  | "backgrounds";

export const avatarColorPalettes: Record<AvatarColorSlot, string[]> = {
  skin: ["#FBD8B8", "#F5C89E", "#D4A574", "#B07D54", "#8D5524", "#5C3A21"],
  hair: [...CUTE_HAIR_COLORS],
  glasses: ["#3a3a38", "#ED93B1", "#FAC775", "#85B7EB", "#AFA9EC", "#5DCAA5"],
  moustache: [...CUTE_HAIR_COLORS],
  hoodies: [...CUTE_SHIRT_COLORS],
  backgrounds: [
    "#F5F4EF",
    "#F6F2FF",
    "#FFB088",
    "#4B2FD6",
    "#E8F1FF",
    "#FFF1BF",
    "#0F1220",
    "#D4FFE5",
  ],
};

export const defaultAvatarColors: Record<AvatarColorSlot, string> = {
  skin: "#FBD8B8",
  hair: "#8a5a3a",
  glasses: "#3a3a38",
  moustache: "#8a5a3a",
  hoodies: "#AFA9EC",
  backgrounds: "#F5F4EF",
};

export function colorSlotLabel(slot: AvatarColorSlot): string {
  switch (slot) {
    case "skin":
      return "Skin";
    case "hair":
      return "Hair";
    case "glasses":
      return "Glasses";
    case "moustache":
      return "Stache";
    case "hoodies":
      return "Shirt";
    case "backgrounds":
      return "Backdrop";
  }
}

/** Map equipped item ids → AvatarCharacter look */
export function lookFromEquipped(
  equipped: Partial<Record<AvatarCategory, string>>,
  gender: AvatarGender = "boy",
  colors: Partial<Record<AvatarColorSlot, string>> = {},
) {
  const resolve = (cat: AvatarCategory) => {
    const id = equipped[cat];
    if (!id) return null;
    const item = getAvatarItem(id);
    if (!item || item.clear) return null;
    return item;
  };

  const hair = resolve("hair");
  const glasses = resolve("glasses");
  const moustache = resolve("moustache");
  const shirt = resolve("hoodies");

  const tint = (slot: AvatarColorSlot, fallback?: string) =>
    colors[slot] ?? fallback ?? defaultAvatarColors[slot];

  // Avatar stays transparent; stage glow comes from stageAccentFromEquipped
  return {
    gender,
    hair: (hair?.partId as AvatarPartId | undefined) ?? null,
    glasses: glasses?.partId as AvatarPartId | undefined,
    moustache:
      gender === "boy"
        ? (moustache?.partId as AvatarPartId | undefined)
        : undefined,
    shirt: shirt?.partId as AvatarPartId | undefined,
    background: undefined as string | undefined,
    accents: {
      hair: tint("hair", hair?.accent),
      glasses: tint("glasses", glasses?.accent),
      moustache: tint("moustache", moustache?.accent),
      shirt: tint("hoodies", shirt?.accent),
    },
  };
}

export function stageAccentFromEquipped(
  equipped: Partial<Record<AvatarCategory, string>>,
  colors: Partial<Record<AvatarColorSlot, string>> = {},
) {
  const bgId = equipped.backgrounds;
  const bg = bgId ? getAvatarItem(bgId) : null;
  return (
    colors.backgrounds ??
    (bg && !bg.clear ? bg.accent : undefined) ??
    defaultAvatarColors.backgrounds
  );
}
