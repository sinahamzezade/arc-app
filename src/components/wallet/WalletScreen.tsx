"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BackButton } from "@/components/BackButton";
import {
  Coins,
  Flame,
  Gem,
  Shield,
  Snowflake,
  Star,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ApiError, messageForCode } from "@/lib/api/errors";
import {
  walletApi,
  type LedgerEntry,
  type StoreCatalogItem,
  type StreakStateDto,
} from "@/lib/api/wallet";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const soft = { type: "spring" as const, stiffness: 380, damping: 28 };

type WalletTab = "ledger" | "gems" | "coins";

function iconForSku(sku: string) {
  if (sku.includes("freeze") || sku.includes("shield")) return Snowflake;
  if (sku.includes("boost") || sku.includes("xp")) return Zap;
  if (sku.includes("restore")) return Shield;
  return Star;
}

function formatLedgerDelta(e: LedgerEntry): {
  label: string;
  delta: string;
  tone: "coin" | "gem" | "xp";
} {
  const sign = e.amount >= 0 ? "+" : "";
  const abs = Math.abs(e.amount).toLocaleString();
  if (e.currency === "coins") {
    return {
      label: e.reasonType.replace(/_/g, " "),
      delta: `${sign}${abs}`,
      tone: "coin",
    };
  }
  if (e.currency === "gems") {
    return {
      label: e.reasonType.replace(/_/g, " "),
      delta: `${sign}${abs}`,
      tone: "gem",
    };
  }
  return {
    label: e.reasonType.replace(/_/g, " "),
    delta: `${sign}${abs}`,
    tone: "xp",
  };
}

function newIdempotencyKey(prefix: string, sku: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${sku}`;
}

/**
 * Wallet — balances, shops, ledger. Minimal night masthead + light sheet.
 */
export default function WalletScreen() {
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const hydrateFromWallet = useEconomyStore((s) => s.hydrateFromWallet);
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<WalletTab>("ledger");
  const [toast, setToast] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [catalog, setCatalog] = useState<StoreCatalogItem[]>([]);
  const [streak, setStreak] = useState<StreakStateDto | null>(null);
  const [busySku, setBusySku] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [w, l, store, s] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getLedger(),
        walletApi.getStore(),
        walletApi.getStreak(),
      ]);
      hydrateFromWallet(w);
      setLedger(l.entries);
      setCatalog(store);
      setStreak(s);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load wallet";
      setToast(msg);
    } finally {
      setLoading(false);
    }
  }, [hydrateFromWallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const gemItems = useMemo(
    () => catalog.filter((i) => i.currency === "gems"),
    [catalog],
  );
  const coinItems = useMemo(
    () => catalog.filter((i) => i.currency === "coins"),
    [catalog],
  );

  const buy = async (item: StoreCatalogItem) => {
    if (busySku) return;
    setBusySku(item.sku);
    try {
      const res = await walletApi.purchase(
        { sku: item.sku },
        newIdempotencyKey("p", item.sku),
      );
      hydrateFromWallet(res.wallet);
      setToast(
        res.alreadyPurchased
          ? `Already owned ${item.title}`
          : `Bought ${item.title}`,
      );
      const [l, s] = await Promise.all([
        walletApi.getLedger(),
        walletApi.getStreak(),
      ]);
      setLedger(l.entries);
      setStreak(s);
    } catch (err) {
      setToast(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Purchase failed",
      );
    } finally {
      setBusySku(null);
    }
  };

  const restore = async (days: 1 | 2 | 3) => {
    try {
      const res = await walletApi.restoreStreak(
        days,
        newIdempotencyKey("r", String(days)),
      );
      hydrateFromWallet(res.wallet);
      setStreak((prev) =>
        prev ? { ...prev, dailyStreak: res.dailyStreak } : prev,
      );
      setToast(`Restored ${days} day${days > 1 ? "s" : ""}`);
      void refresh();
    } catch (err) {
      setToast(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Restore failed",
      );
    }
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-0 h-36 w-36 rounded-full bg-arc-purple-500/20 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <BackButton className="border-white/15 bg-white/10 text-white hover:bg-white/15" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.12em] text-white/45 uppercase">
              Economy
            </p>
            <h1 className="font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              Wallet
            </h1>
          </div>
        </div>

        <motion.ul
          className="relative mt-5 grid grid-cols-3 gap-2"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={soft}
          aria-label="Balances"
        >
          <BalanceCell
            label="Coins"
            value={coins}
            icon={<Coins className="h-3.5 w-3.5" strokeWidth={2.5} />}
            accent="text-[#ffc928]"
            well="bg-[#ffc928]/15"
          />
          <BalanceCell
            label="XP"
            value={xp}
            icon={
              <Zap
                className="h-3.5 w-3.5"
                strokeWidth={2.5}
                fill="currentColor"
              />
            }
            accent="text-[#7eb8ff]"
            well="bg-[#2d8cff]/20"
          />
          <BalanceCell
            label="Gems"
            value={gems}
            icon={<Gem className="h-3.5 w-3.5" strokeWidth={2.5} />}
            accent="text-[#d4a8ff]"
            well="bg-[#b35cff]/20"
          />
        </motion.ul>

        {streak ? (
          <div className="relative mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/6 px-3 py-2.5 ring-1 ring-white/8">
            <div className="flex min-w-0 items-center gap-2">
              <Flame
                className="h-4 w-4 shrink-0 text-[#ff8a3d]"
                strokeWidth={2.5}
              />
              <p className="truncate text-[13px] font-bold tabular-nums">
                {streak.dailyStreak} day streak
                <span className="ml-1.5 font-semibold text-white/40">
                  · W{streak.weeklyStreak}
                </span>
              </p>
            </div>
            {streak.recoveryWindowEndsAt ? (
              <button
                type="button"
                onClick={() => void restore(1)}
                className="cursor-pointer shrink-0 rounded-lg bg-[#ffc928] px-2.5 py-1.5 text-[11px] font-extrabold text-[#0f1220] transition-opacity duration-200 hover:opacity-90"
              >
                Restore · 80
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <main className="relative z-10 -mt-4 rounded-t-[24px] bg-[#f2eefb] px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <nav
          role="tablist"
          aria-label="Wallet sections"
          className="flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-[#ebe4f6]"
        >
          {(
            [
              ["ledger", "Activity"],
              ["gems", "Gems"],
              ["coins", "Coins"],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={cn(
                  "flex-1 cursor-pointer rounded-xl py-2.5 font-display text-[12px] font-semibold transition-colors duration-200",
                  active
                    ? "bg-[#12141c] text-[#ffc928]"
                    : "text-[#8a7cb8] hover:text-[#1b1730]",
                )}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <AnimatePresence>
          {toast ? (
            <motion.p
              key={toast}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-xl bg-[#12141c] px-3 py-2 text-center text-[12px] font-bold text-[#ffc928]"
            >
              {toast}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {loading ? (
          <p className="py-10 text-center text-[13px] font-bold text-[#8a7cb8]">
            Loading…
          </p>
        ) : null}

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {tab === "ledger" && !loading ? (
              <motion.section
                key="ledger"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={soft}
              >
                {ledger.length === 0 ? (
                  <EmptyState text="No activity yet — finish a lesson to earn." />
                ) : (
                  <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#ebe4f6]">
                    {ledger.slice(0, 20).map((raw, i) => {
                      const e = formatLedgerDelta(raw);
                      return (
                        <li
                          key={raw.id}
                          className={cn(
                            "flex items-center justify-between gap-3 px-4 py-3.5",
                            i < Math.min(ledger.length, 20) - 1 &&
                              "border-b border-[#f0ecf7]",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold capitalize text-[#1b1730]">
                              {e.label}
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold tracking-wide text-[#8a7cb8] uppercase">
                              {e.tone === "coin"
                                ? "Coins"
                                : e.tone === "gem"
                                  ? "Gems"
                                  : "XP"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 font-display text-[13px] font-bold tabular-nums",
                              e.tone === "coin" && "text-[#9a6a00]",
                              e.tone === "gem" && "text-[#b35cff]",
                              e.tone === "xp" && "text-[#2d8cff]",
                            )}
                          >
                            {e.delta}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-3 px-0.5 text-[11px] leading-relaxed font-semibold text-[#8a7cb8]">
                  Gems buy utility. Coins buy cosmetics. Neither buys Battle wins.
                </p>
              </motion.section>
            ) : null}

            {tab === "gems" && !loading ? (
              <motion.ul
                key="gems"
                className="space-y-2"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={soft}
              >
                {gemItems.length === 0 ? (
                  <EmptyState text="Gem shop empty for now." />
                ) : (
                  gemItems.map((item) => {
                    const Icon = iconForSku(item.sku);
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-[#ebe4f6]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f2ff] text-[#b35cff]">
                          <Icon className="h-5 w-5" strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[14px] font-semibold text-[#1b1730]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                            {item.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busySku === item.sku}
                          onClick={() => void buy(item)}
                          className="inline-flex cursor-pointer shrink-0 items-center gap-1 rounded-xl bg-[#b35cff] px-3 py-2 text-[12px] font-extrabold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                        >
                          <Gem className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {item.price}
                        </button>
                      </li>
                    );
                  })
                )}
              </motion.ul>
            ) : null}

            {tab === "coins" && !loading ? (
              <motion.ul
                key="coins"
                className="space-y-2"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={soft}
              >
                {coinItems.length === 0 ? (
                  <EmptyState text="Coin shop empty for now." />
                ) : (
                  coinItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-[#ebe4f6]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff8e0] text-[#c79a2e]">
                        <Coins className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[14px] font-semibold text-[#1b1730]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                          {item.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busySku === item.sku}
                        onClick={() => void buy(item)}
                        className="inline-flex cursor-pointer shrink-0 items-center gap-1 rounded-xl bg-[#ffc928] px-3 py-2 text-[12px] font-extrabold text-[#12141c] transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                      >
                        <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {item.price}
                      </button>
                    </li>
                  ))
                )}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function BalanceCell({
  label,
  value,
  icon,
  accent,
  well,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
  well: string;
}) {
  return (
    <li className="rounded-2xl bg-white/8 px-2.5 py-3 ring-1 ring-white/10">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg",
            well,
            accent,
          )}
        >
          {icon}
        </span>
        <p className="text-[10px] font-bold tracking-wide text-white/45 uppercase">
          {label}
        </p>
      </div>
      <p className="mt-2 font-display text-[20px] leading-none font-bold tabular-nums tracking-[-0.03em]">
        {value.toLocaleString()}
      </p>
    </li>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#d5ccec] bg-white/70 px-4 py-8 text-center text-[13px] font-semibold text-[#8a7cb8]">
      {text}
    </p>
  );
}
