import { create } from "zustand";
import type { Profile } from "@/lib/api/types";
import type { WalletBalances } from "@/lib/api/wallet";

type EconomyState = {
  xp: number;
  gems: number;
  coins: number;
  walletVersion: number;
  hydrated: boolean;
  hydrateFromProfile: (
    profile: Pick<Profile, "totalXp" | "gems" | "coins">,
  ) => void;
  hydrateFromWallet: (
    wallet: Pick<WalletBalances, "lifetimeXp" | "gems" | "coins" | "version">,
  ) => void;
  addXp: (n: number) => void;
  addGems: (n: number) => void;
  addCoins: (n: number) => void;
  spendGems: (n: number) => boolean;
  spendCoins: (n: number) => boolean;
  reset: () => void;
};

const INITIAL = {
  xp: 0,
  gems: 0,
  coins: 0,
  walletVersion: 0,
  hydrated: false,
} as const;

export const useEconomyStore = create<EconomyState>((set, get) => ({
  ...INITIAL,
  hydrateFromProfile: (profile) =>
    set({
      xp: profile.totalXp ?? 0,
      gems: profile.gems ?? 0,
      coins: profile.coins ?? 0,
      hydrated: true,
    }),
  hydrateFromWallet: (wallet) =>
    set({
      xp: wallet.lifetimeXp ?? 0,
      gems: wallet.gems ?? 0,
      coins: wallet.coins ?? 0,
      walletVersion: wallet.version ?? 0,
      hydrated: true,
    }),
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
  reset: () => set({ ...INITIAL }),
}));
