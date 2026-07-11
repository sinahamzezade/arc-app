export type AvatarCategory =
  | "hats"
  | "glasses"
  | "hoodies"
  | "capes"
  | "backgrounds";

export type AvatarItem = {
  id: string;
  name: string;
  category: AvatarCategory;
  cost: number;
  rarity: "common" | "rare" | "legendary";
  /** CSS accent for mock preview chip */
  accent: string;
  emoji?: never;
};

export type AvatarStudioMockData = {
  coins: number;
  categories: { id: AvatarCategory; label: string }[];
  items: AvatarItem[];
  starterOwned: string[];
  starterEquipped: Partial<Record<AvatarCategory, string>>;
};

export const avatarStudioMockData: AvatarStudioMockData = {
  coins: 2450,
  categories: [
    { id: "hats", label: "Hats" },
    { id: "glasses", label: "Glasses" },
    { id: "hoodies", label: "Hoodies" },
    { id: "capes", label: "Capes" },
    { id: "backgrounds", label: "BGs" },
  ],
  items: [
    {
      id: "hat-beanie",
      name: "Focus Beanie",
      category: "hats",
      cost: 120,
      rarity: "common",
      accent: "#6B4EFF",
    },
    {
      id: "hat-crown",
      name: "Tiny Crown",
      category: "hats",
      cost: 480,
      rarity: "rare",
      accent: "#FFC928",
    },
    {
      id: "hat-grad",
      name: "Grad Cap",
      category: "hats",
      cost: 900,
      rarity: "legendary",
      accent: "#1B1433",
    },
    {
      id: "glasses-round",
      name: "Round Specs",
      category: "glasses",
      cost: 150,
      rarity: "common",
      accent: "#2D8CFF",
    },
    {
      id: "glasses-shade",
      name: "Night Shades",
      category: "glasses",
      cost: 320,
      rarity: "rare",
      accent: "#101923",
    },
    {
      id: "hoodie-arc",
      name: "Arc Hoodie",
      category: "hoodies",
      cost: 280,
      rarity: "common",
      accent: "#6B4EFF",
    },
    {
      id: "hoodie-gold",
      name: "Gold Zip",
      category: "hoodies",
      cost: 650,
      rarity: "rare",
      accent: "#F0A81E",
    },
    {
      id: "cape-hero",
      name: "Hero Cape",
      category: "capes",
      cost: 400,
      rarity: "rare",
      accent: "#FF8A3D",
    },
    {
      id: "cape-shadow",
      name: "Shadow Cloak",
      category: "capes",
      cost: 1100,
      rarity: "legendary",
      accent: "#35209D",
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
  starterOwned: ["bg-lavender", "hat-beanie"],
  starterEquipped: {
    backgrounds: "bg-lavender",
    hats: "hat-beanie",
  },
};

export function getAvatarItem(id: string) {
  return avatarStudioMockData.items.find((i) => i.id === id);
}
