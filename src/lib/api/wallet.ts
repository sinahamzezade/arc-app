import { apiFetch } from "./client";

export type WalletBalances = {
  lifetimeXp: number;
  weeklyLeagueXp: number;
  gems: number;
  coins: number;
  version: number;
};

export type LedgerEntry = {
  id: string;
  currency: string;
  amount: number;
  reasonType: string;
  reasonId: string | null;
  transactionGroupId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type StoreCatalogItem = {
  id: string;
  sku: string;
  title: string;
  description: string;
  currency: "gems" | "coins" | string;
  price: number;
  itemType: string;
  rarity: string;
  purchaseLimit: number | null;
  version: number;
};

export type StreakStateDto = {
  dailyStreak: number;
  weeklyStreak: number;
  longestDailyStreak: number;
  lastQualifiedDay: string | null;
  recoveryWindowEndsAt: string | null;
  consecutiveProtectedDays: number;
  version: number;
  recentDays: Array<{ localDate: string; status: string }>;
};

export type PurchaseResult = {
  alreadyPurchased: boolean;
  transactionGroupId: string;
  wallet: WalletBalances;
  item: {
    sku: string;
    title: string;
    currency: string;
    price: number;
    quantity: number;
  };
};

export type CurrencyPack = {
  sku: string;
  title: string;
  description: string;
  target: "gems" | "coins";
  amount: number;
  xpPrice: number;
  iapProductId: string | null;
  paymentMethods: Array<"xp" | "iap">;
};

export type CurrencyPackPurchaseResult = {
  alreadyPurchased: boolean;
  transactionGroupId: string;
  wallet: WalletBalances;
  pack: {
    sku: string;
    target: "gems" | "coins";
    amount: number;
    xpPrice: number;
    paymentMethod: "xp";
  };
};

export const walletApi = {
  getWallet(accessToken?: string | null) {
    return apiFetch<WalletBalances>("/wallet", { accessToken });
  },

  getLedger(cursor?: string, accessToken?: string | null) {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{ entries: LedgerEntry[]; nextCursor: string | null }>(
      `/wallet/ledger${qs}`,
      { accessToken },
    );
  },

  getCurrencyPacks(
    target?: "gems" | "coins",
    accessToken?: string | null,
  ) {
    const qs = target ? `?target=${target}` : "";
    return apiFetch<CurrencyPack[]>(`/wallet/currency-packs${qs}`, {
      accessToken,
    });
  },

  purchaseCurrencyPack(
    body: { sku: string; paymentMethod: "xp" },
    idempotencyKey: string,
    accessToken?: string | null,
  ) {
    return apiFetch<CurrencyPackPurchaseResult>(
      "/wallet/currency-packs/purchase",
      {
        method: "POST",
        body,
        accessToken,
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
  },

  getStore(params?: { currency?: string; type?: string }, accessToken?: string | null) {
    const qs = new URLSearchParams();
    if (params?.currency) qs.set("currency", params.currency);
    if (params?.type) qs.set("type", params.type);
    const q = qs.toString();
    return apiFetch<StoreCatalogItem[]>(`/store${q ? `?${q}` : ""}`, {
      accessToken,
    });
  },

  purchase(
    body: { sku: string; quantity?: number },
    idempotencyKey: string,
    accessToken?: string | null,
  ) {
    return apiFetch<PurchaseResult>("/store/purchases", {
      method: "POST",
      body,
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  getInventory(accessToken?: string | null) {
    return apiFetch<
      Array<{
        id: string;
        sku: string;
        quantity: number;
        equipped: boolean;
        payload: Record<string, unknown>;
      }>
    >("/inventory", { accessToken });
  },

  getStreak(accessToken?: string | null) {
    return apiFetch<StreakStateDto>("/streaks", { accessToken });
  },

  restoreStreak(
    days: 1 | 2 | 3,
    idempotencyKey: string,
    accessToken?: string | null,
  ) {
    return apiFetch<{
      alreadyRestored: boolean;
      wallet: WalletBalances;
      dailyStreak: number;
    }>("/streaks/restore", {
      method: "POST",
      body: { days },
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },
};
