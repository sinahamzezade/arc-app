import { create } from "zustand";
import {
  avatarStudioMockData,
  defaultAvatarColors,
  defaultHairForGender,
  type AvatarCategory,
  type AvatarColorSlot,
  type AvatarGender,
} from "@/lib/avatar/mock-data";

type AvatarStudioState = {
  coins: number;
  gender: AvatarGender;
  owned: string[];
  equipped: Partial<Record<AvatarCategory, string>>;
  colors: Record<AvatarColorSlot, string>;
  category: AvatarCategory;
  setCategory: (category: AvatarCategory) => void;
  setGender: (gender: AvatarGender) => void;
  setColor: (slot: AvatarColorSlot, hex: string) => void;
  buy: (itemId: string, cost: number) => boolean;
  equip: (category: AvatarCategory, itemId: string) => void;
  unequip: (category: AvatarCategory) => void;
};

export const useAvatarStudioStore = create<AvatarStudioState>((set, get) => ({
  coins: avatarStudioMockData.coins,
  gender: "boy",
  owned: [...avatarStudioMockData.starterOwned],
  equipped: { ...avatarStudioMockData.starterEquipped },
  colors: { ...defaultAvatarColors },
  category: "hair",
  setCategory: (category) => set({ category }),
  setGender: (gender) => {
    const { equipped, category } = get();
    const nextEquipped = { ...equipped };
    const hairId = nextEquipped.hair;
    const hairItem = avatarStudioMockData.items.find((i) => i.id === hairId);
    if (
      hairItem?.gender &&
      hairItem.gender !== "any" &&
      hairItem.gender !== gender
    ) {
      nextEquipped.hair = defaultHairForGender(gender);
    } else if (!hairId) {
      nextEquipped.hair = defaultHairForGender(gender);
    }
    if (gender === "girl") {
      delete nextEquipped.moustache;
    }
    const nextCategory =
      gender === "girl" && category === "moustache" ? "hair" : category;
    set({ gender, equipped: nextEquipped, category: nextCategory });
  },
  setColor: (slot, hex) =>
    set((s) => ({
      colors: { ...s.colors, [slot]: hex },
    })),
  buy: (itemId, cost) => {
    const { coins, owned } = get();
    if (owned.includes(itemId) || coins < cost) return false;
    set({
      coins: coins - cost,
      owned: [...owned, itemId],
    });
    return true;
  },
  equip: (category, itemId) =>
    set((s) => {
      const item = avatarStudioMockData.items.find((i) => i.id === itemId);
      // Sync color tray to item's native accent when equipping a tinted part
      const nextColors = { ...s.colors };
      if (item && !item.clear && item.accent && category !== "backgrounds") {
        nextColors[category as AvatarColorSlot] = item.accent;
      }
      if (item && !item.clear && category === "backgrounds") {
        nextColors.backgrounds = item.accent;
      }
      return {
        equipped: { ...s.equipped, [category]: itemId },
        colors: nextColors,
      };
    }),
  unequip: (category) =>
    set((s) => {
      const next = { ...s.equipped };
      delete next[category];
      return { equipped: next };
    }),
}));
