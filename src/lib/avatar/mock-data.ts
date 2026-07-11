export type AvatarGender = "boy" | "girl";

export type AvatarCategory =
  | "hair"
  | "hats"
  | "glasses"
  | "moustache"
  | "hoodies"
  | "capes"
  | "backgrounds";

export type AvatarItem = {
  id: string;
  name: string;
  category: AvatarCategory;
  cost: number;
  rarity: "common" | "rare" | "legendary";
  /** CSS accent tint for the SVG part */
  accent: string;
  /** Key into avatarPartRegistry — omit for backgrounds */
  partId?: string;
  /** Who this item is shown for. Default = any */
  gender?: AvatarGender | "any";
  /** Unequip / clear slot — no part rendered */
  clear?: boolean;
};

export type AvatarStudioMockData = {
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

const categoryIds: AvatarCategory[] = [
  "hair",
  "hats",
  "glasses",
  "moustache",
  "hoodies",
  "capes",
  "backgrounds",
];

export const avatarStudioMockData: AvatarStudioMockData = {
  coins: 2450,
  categories: [
    { id: "hair", label: "Hair" },
    { id: "hats", label: "Hats" },
    { id: "glasses", label: "Glasses" },
    { id: "moustache", label: "Stache" },
    { id: "hoodies", label: "Shirts" },
    { id: "capes", label: "Capes" },
    { id: "backgrounds", label: "BGs" },
  ],
  items: [
    ...categoryIds.map(noneItem),
    {
      id: "hair-short",
      name: "Crop Cut",
      category: "hair",
      cost: 0,
      rarity: "common",
      accent: "#2A2438",
      partId: "hair-short",
      gender: "boy",
    },
    {
      id: "hair-sweep",
      name: "Side Sweep",
      category: "hair",
      cost: 180,
      rarity: "common",
      accent: "#4A3428",
      partId: "hair-sweep",
      gender: "boy",
    },
    {
      id: "hair-curly",
      name: "Cloud Curls",
      category: "hair",
      cost: 420,
      rarity: "rare",
      accent: "#1B1433",
      partId: "hair-curly",
      gender: "boy",
    },
    {
      id: "hair-bob",
      name: "Soft Bob",
      category: "hair",
      cost: 0,
      rarity: "common",
      accent: "#3D2A1F",
      partId: "hair-bob",
      gender: "girl",
    },
    {
      id: "hair-long",
      name: "Long Flow",
      category: "hair",
      cost: 280,
      rarity: "common",
      accent: "#5C3D2E",
      partId: "hair-long",
      gender: "girl",
    },
    {
      id: "hair-pony",
      name: "High Pony",
      category: "hair",
      cost: 460,
      rarity: "rare",
      accent: "#2A1830",
      partId: "hair-pony",
      gender: "girl",
    },
    {
      id: "hat-beanie",
      name: "Focus Beanie",
      category: "hats",
      cost: 120,
      rarity: "common",
      accent: "#6B4EFF",
      partId: "hat-beanie",
    },
    {
      id: "hat-crown",
      name: "Tiny Crown",
      category: "hats",
      cost: 480,
      rarity: "rare",
      accent: "#FFC928",
      partId: "hat-crown",
    },
    {
      id: "hat-grad",
      name: "Grad Cap",
      category: "hats",
      cost: 900,
      rarity: "legendary",
      accent: "#1B1433",
      partId: "hat-grad",
    },
    {
      id: "glasses-round",
      name: "Round Specs",
      category: "glasses",
      cost: 150,
      rarity: "common",
      accent: "#2D8CFF",
      partId: "glasses-round",
    },
    {
      id: "glasses-shade",
      name: "Night Shades",
      category: "glasses",
      cost: 320,
      rarity: "rare",
      accent: "#101923",
      partId: "glasses-shade",
    },
    {
      id: "stache-soft",
      name: "Soft Stache",
      category: "moustache",
      cost: 90,
      rarity: "common",
      accent: "#4A3428",
      partId: "stache-soft",
      gender: "boy",
    },
    {
      id: "stache-handlebar",
      name: "Handlebar",
      category: "moustache",
      cost: 260,
      rarity: "rare",
      accent: "#2A2438",
      partId: "stache-handlebar",
      gender: "boy",
    },
    {
      id: "stache-thick",
      name: "Professor",
      category: "moustache",
      cost: 540,
      rarity: "legendary",
      accent: "#1B1433",
      partId: "stache-thick",
      gender: "boy",
    },
    {
      id: "hoodie-arc",
      name: "Arc Hoodie",
      category: "hoodies",
      cost: 280,
      rarity: "common",
      accent: "#6B4EFF",
      partId: "hoodie-arc",
    },
    {
      id: "hoodie-gold",
      name: "Gold Zip",
      category: "hoodies",
      cost: 650,
      rarity: "rare",
      accent: "#F0A81E",
      partId: "hoodie-gold",
    },
    {
      id: "shirt-tee",
      name: "Arc Tee",
      category: "hoodies",
      cost: 160,
      rarity: "common",
      accent: "#2D8CFF",
      partId: "shirt-tee",
    },
    {
      id: "cape-hero",
      name: "Hero Cape",
      category: "capes",
      cost: 400,
      rarity: "rare",
      accent: "#FF8A3D",
      partId: "cape-hero",
    },
    {
      id: "cape-shadow",
      name: "Shadow Cloak",
      category: "capes",
      cost: 1100,
      rarity: "legendary",
      accent: "#35209D",
      partId: "cape-shadow",
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
    "bg-lavender",
    "hair-short",
    "hair-bob",
    "hat-beanie",
    "hoodie-arc",
  ],
  starterEquipped: {
    backgrounds: "bg-lavender",
    hair: "hair-short",
    hats: "hat-beanie",
    hoodies: "hoodie-arc",
  },
};

export function getAvatarItem(id: string) {
  return avatarStudioMockData.items.find((i) => i.id === id);
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
  return gender === "girl" ? "hair-bob" : "hair-short";
}

/** Color slots user can tint */
export type AvatarColorSlot =
  | "skin"
  | "hair"
  | "hats"
  | "glasses"
  | "moustache"
  | "hoodies"
  | "capes"
  | "backgrounds";

export const avatarColorPalettes: Record<AvatarColorSlot, string[]> = {
  skin: ["#F8E0C8", "#F2C4A0", "#D4A574", "#B07D54", "#8D5524", "#5C3A21"],
  hair: [
    "#1B1433",
    "#2A2438",
    "#4A3428",
    "#8B5A2B",
    "#C9A227",
    "#E8E4F0",
    "#6B4EFF",
    "#FF8A3D",
  ],
  hats: [
    "#6B4EFF",
    "#FFC928",
    "#1B1433",
    "#FF8A3D",
    "#2D8CFF",
    "#16A56B",
    "#E8E4F0",
  ],
  glasses: ["#2D8CFF", "#101923", "#6B4EFF", "#FFC928", "#FF8A3D", "#E8E4F0"],
  moustache: ["#1B1433", "#2A2438", "#4A3428", "#8B5A2B", "#C9A227", "#E8E4F0"],
  hoodies: [
    "#6B4EFF",
    "#F0A81E",
    "#2D8CFF",
    "#FF8A3D",
    "#16A56B",
    "#1B1433",
    "#E8E4F0",
  ],
  capes: ["#FF8A3D", "#35209D", "#6B4EFF", "#101923", "#FFC928", "#2D8CFF"],
  backgrounds: [
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
  skin: "#F2C4A0",
  hair: "#2A2438",
  hats: "#6B4EFF",
  glasses: "#2D8CFF",
  moustache: "#2A2438",
  hoodies: "#6B4EFF",
  capes: "#FF8A3D",
  backgrounds: "#F6F2FF",
};

export function colorSlotLabel(slot: AvatarColorSlot): string {
  switch (slot) {
    case "skin":
      return "Skin";
    case "hair":
      return "Hair";
    case "hats":
      return "Hat";
    case "glasses":
      return "Glasses";
    case "moustache":
      return "Stache";
    case "hoodies":
      return "Shirt";
    case "capes":
      return "Cape";
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
  const hat = resolve("hats");
  const glasses = resolve("glasses");
  const moustache = resolve("moustache");
  const shirt = resolve("hoodies");
  const cape = resolve("capes");
  const bg = resolve("backgrounds");

  const tint = (slot: AvatarColorSlot, fallback?: string) =>
    colors[slot] ?? fallback ?? defaultAvatarColors[slot];

  return {
    gender,
    skin: tint("skin"),
    hair: (hair?.partId as string | undefined) ?? null,
    hat: hat?.partId as string | undefined,
    glasses: glasses?.partId as string | undefined,
    moustache:
      gender === "boy"
        ? (moustache?.partId as string | undefined)
        : undefined,
    shirt: shirt?.partId as string | undefined,
    cape: cape?.partId as string | undefined,
    background: tint("backgrounds", bg?.accent ?? "#E8E4F0"),
    accents: {
      hair: tint("hair", hair?.accent),
      hat: tint("hats", hat?.accent),
      glasses: tint("glasses", glasses?.accent),
      moustache: tint("moustache", moustache?.accent),
      shirt: tint("hoodies", shirt?.accent),
      cape: tint("capes", cape?.accent),
    },
  };
}
