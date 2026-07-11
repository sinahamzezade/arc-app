import { create } from "zustand";
import {
  avatarStudioMockData,
  type AvatarCategory,
} from "@/lib/avatar/mock-data";

type AvatarStudioState = {
  coins: number;
  owned: string[];
  equipped: Partial<Record<AvatarCategory, string>>;
  category: AvatarCategory;
  setCategory: (category: AvatarCategory) => void;
  buy: (itemId: string, cost: number) => boolean;
  equip: (category: AvatarCategory, itemId: string) => void;
  unequip: (category: AvatarCategory) => void;
};

export const useAvatarStudioStore = create<AvatarStudioState>((set, get) => ({
  coins: avatarStudioMockData.coins,
  owned: [...avatarStudioMockData.starterOwned],
  equipped: { ...avatarStudioMockData.starterEquipped },
  category: "hats",
  setCategory: (category) => set({ category }),
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
    set((s) => ({
      equipped: { ...s.equipped, [category]: itemId },
    })),
  unequip: (category) =>
    set((s) => {
      const next = { ...s.equipped };
      delete next[category];
      return { equipped: next };
    }),
}));
