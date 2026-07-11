import { create } from "zustand";

type EconomyState = {
  xp: number;
  gems: number;
  coins: number;
  addXp: (n: number) => void;
  addGems: (n: number) => void;
  addCoins: (n: number) => void;
  spendGems: (n: number) => boolean;
  spendCoins: (n: number) => boolean;
};

export const useEconomyStore = create<EconomyState>((set, get) => ({
  xp: 1250,
  gems: 350,
  coins: 2450,
  addXp: (n) => set((s) => ({ xp: s.xp + n })),
  addGems: (n) => set((s) => ({ gems: s.gems + n })),
  addCoins: (n) => set((s) => ({ coins: s.coins + n })),
  spendGems: (n) => {
    const { gems } = get();
    if (gems < n) return false;
    set({ gems: gems - n });
    return true;
  },
  spendCoins: (n) => {
    const { coins } = get();
    if (coins < n) return false;
    set({ coins: coins - n });
    return true;
  },
}));
