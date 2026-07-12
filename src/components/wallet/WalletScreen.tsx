"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import {
  Coins,
  Flame,
  Gem,
  Shield,
  Snowflake,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ApiError } from "@/lib/api/errors";
import {
  walletApi,
  type LedgerEntry,
  type StoreCatalogItem,
  type StreakStateDto,
} from "@/lib/api/wallet";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

type WalletTab = "ledger" | "gems" | "coins";

function iconForSku(sku: string) {
  if (sku.includes("freeze") || sku.includes("shield")) return Snowflake;
  if (sku.includes("boost") || sku.includes("xp")) return Zap;
  if (sku.includes("restore")) return Shield;
  return Star;
}

function formatLedgerDelta(e: LedgerEntry): { label: string; delta: string; tone: "coin" | "gem" | "xp" } {
  const sign = e.amount >= 0 ? "+" : "";
  const abs = Math.abs(e.amount).toLocaleString();
  if (e.currency === "coins") {
    return {
      label: e.reasonType.replace(/_/g, " "),
      delta: `${sign}${abs} coins`,
      tone: "coin",
    };
  }
  if (e.currency === "gems") {
    return {
      label: e.reasonType.replace(/_/g, " "),
      delta: `${sign}${abs} gems`,
      tone: "gem",
    };
  }
  return {
    label: e.reasonType.replace(/_/g, " "),
    delta: `${sign}${abs} XP`,
    tone: "xp",
  };
}

/**
 * Private vault — luxury ledger.
 * Live wallet / store / streak from gamification APIs.
 */
export default function WalletScreen() {
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const hydrateFromWallet = useEconomyStore((s) => s.hydrateFromWallet);
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
        err instanceof ApiError ? err.message : "Could not load wallet";
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
      const key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `p-${Date.now()}-${item.sku}`;
      const res = await walletApi.purchase({ sku: item.sku }, key);
      hydrateFromWallet(res.wallet);
      setToast(res.alreadyPurchased ? `Already owned ${item.title}` : `Bought ${item.title}`);
      const [l, s] = await Promise.all([
        walletApi.getLedger(),
        walletApi.getStreak(),
      ]);
      setLedger(l.entries);
      setStreak(s);
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : "Purchase failed");
    } finally {
      setBusySku(null);
    }
  };

  const restore = async (days: 1 | 2 | 3) => {
    try {
      const key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `r-${Date.now()}-${days}`;
      const res = await walletApi.restoreStreak(days, key);
      hydrateFromWallet(res.wallet);
      setStreak((prev) =>
        prev
          ? { ...prev, dailyStreak: res.dailyStreak }
          : prev,
      );
      setToast(`Restored ${days} day${days > 1 ? "s" : ""}`);
      void refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : "Restore failed");
    }
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f6f2ff] font-rounded">
      <section className="relative overflow-hidden bg-[#12141c] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-60px] h-72 w-72 rounded-full bg-[#ffc928]/18 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-40px] h-48 w-48 rounded-full bg-[#b35cff]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.16em] text-[#ffc928] uppercase">
              Private vault
            </p>
            <h1 className="mt-0.5 font-display text-[26px] leading-none font-bold tracking-[-0.03em]">
              Wallet
            </h1>
          </div>
          <Sparkles className="h-5 w-5 text-[#b35cff]" strokeWidth={2} />
        </div>

        <div className="relative mt-8 grid grid-cols-[1.35fr_0.9fr] items-end gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.1em] text-[#ffc928] uppercase">
              <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
              Coins
            </p>
            <motion.p
              className="mt-1 font-display text-[56px] leading-[0.88] font-bold tracking-[-0.05em]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={softSpring}
            >
              {coins.toLocaleString()}
            </motion.p>
            <p className="mt-2 max-w-[14rem] text-[12px] font-bold text-white/40">
              XP proves · Gems protect · Coins express
            </p>
          </div>

          <div className="relative h-[118px]">
            <motion.div
              className="absolute top-0 right-0 z-[2] w-[92%] rounded-2xl bg-[#b35cff] px-3 py-2.5 shadow-[0_8px_0_#7a2fc4]"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.08 }}
            >
              <div className="flex items-center gap-1.5 text-white/80">
                <Gem className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="text-[10px] font-black tracking-wide uppercase">
                  Gems
                </span>
              </div>
              <p className="mt-1 font-display text-[22px] leading-none font-bold text-white">
                {gems.toLocaleString()}
              </p>
            </motion.div>
            <motion.div
              className="absolute right-2 bottom-0 z-[1] w-[85%] rotate-2 rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.14 }}
            >
              <div className="flex items-center gap-1.5 text-[#8eb6ff]">
                <Star className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="text-[10px] font-black tracking-wide uppercase">
                  XP
                </span>
              </div>
              <p className="mt-1 font-display text-[20px] leading-none font-bold text-white">
                {xp.toLocaleString()}
              </p>
            </motion.div>
          </div>
        </div>

        {streak ? (
          <div className="relative mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#ff8a3d]" strokeWidth={2.5} />
              <div>
                <p className="text-[11px] font-extrabold tracking-wide text-white/50 uppercase">
                  Daily streak
                </p>
                <p className="font-display text-[18px] font-bold leading-none">
                  {streak.dailyStreak} days
                </p>
              </div>
            </div>
            {streak.recoveryWindowEndsAt ? (
              <button
                type="button"
                onClick={() => void restore(1)}
                className="rounded-xl bg-[#ffc928] px-2.5 py-1.5 text-[11px] font-extrabold text-[#12141c]"
              >
                Restore 1d · 80
              </button>
            ) : (
              <p className="text-[11px] font-bold text-white/40">
                Week {streak.weeklyStreak}
              </p>
            )}
          </div>
        ) : null}
      </section>

      <div className="relative z-[1] -mt-5 px-4">
        <nav
          role="tablist"
          aria-label="Wallet sections"
          className="flex gap-1 rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(70,40,150,0.1)]"
        >
          {(
            [
              ["ledger", "Ledger"],
              ["gems", "Gem shop"],
              ["coins", "Coin shop"],
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
                  "flex-1 rounded-[14px] py-2.5 font-display text-[13px] font-semibold",
                  active ? "bg-[#12141c] text-[#ffc928]" : "text-[#8a7cb8]",
                )}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <AnimatePresence>
          {toast ? (
            <motion.p
              key={toast}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 rounded-xl bg-[#12141c] px-3 py-2 text-center text-[12px] font-bold text-[#ffc928]"
            >
              {toast}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {loading ? (
          <p className="py-8 text-center text-[13px] font-bold text-[#8a7cb8]">
            Loading vault…
          </p>
        ) : null}

        <AnimatePresence mode="wait">
          {tab === "ledger" && !loading ? (
            <motion.section
              key="ledger"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
                <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#1b1730]">
                  Recent activity
                </h2>
              </div>

              {ledger.length === 0 ? (
                <p className="rounded-[18px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-6 text-center text-[13px] font-semibold text-[#8a7cb8]">
                  No ledger entries yet — finish a lesson to earn.
                </p>
              ) : (
                <ul className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.06)]">
                  {ledger.slice(0, 20).map((raw, i) => {
                    const e = formatLedgerDelta(raw);
                    return (
                      <li
                        key={raw.id}
                        className={cn(
                          "relative flex items-center justify-between gap-3 px-4 py-3.5",
                          i < Math.min(ledger.length, 20) - 1 &&
                            "border-b border-[#f0ecf7]",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute top-0 bottom-0 left-0 w-1",
                            e.tone === "coin" && "bg-[#ffc928]",
                            e.tone === "gem" && "bg-[#b35cff]",
                            e.tone === "xp" && "bg-[#6b4eff]",
                          )}
                        />
                        <span className="pl-2 text-[13px] font-semibold capitalize text-[#1b1730]">
                          {e.label}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-display text-[12px] font-bold",
                            e.tone === "coin" && "text-[#9a6a00]",
                            e.tone === "gem" && "text-[#b35cff]",
                            e.tone === "xp" && "text-[#6b4eff]",
                          )}
                        >
                          {e.delta}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="mt-4 rounded-[18px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-3 text-[12px] leading-relaxed font-semibold text-[#8a7cb8]">
                Referral rewards never create leaderboard XP. Gems cannot buy
                Battle wins.
              </p>
            </motion.section>
          ) : null}

          {tab === "gems" && !loading ? (
            <motion.ul
              key="gems"
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <p className="px-0.5 text-[12px] font-bold text-[#8a7cb8]">
                Utility only · balance {gems.toLocaleString()} gems
              </p>
              {gemItems.map((item, i) => {
                const Icon = iconForSku(item.sku);
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...softSpring, delay: i * 0.04 }}
                    className={cn(
                      "relative overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white",
                      i === 1 && "ml-3",
                    )}
                  >
                    <div
                      aria-hidden
                      className="absolute top-0 bottom-0 left-[72px] w-px border-l border-dashed border-[#ebe4f6]"
                    />
                    <div className="flex items-stretch">
                      <div className="flex w-[72px] shrink-0 flex-col items-center justify-center bg-[#f6f2ff] text-[#b35cff]">
                        <Icon className="h-6 w-6" strokeWidth={2.25} />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-2 px-3.5 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[14px] font-semibold text-[#1b1730]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                            {item.description}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          disabled={busySku === item.sku}
                          onClick={() => void buy(item)}
                          whileTap={{ scale: 0.96, y: 1 }}
                          transition={snappySpring}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#b35cff] px-3 py-2.5 text-[12px] font-extrabold text-white shadow-[0_3px_0_#7a2fc4] disabled:opacity-60"
                        >
                          <Gem className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {item.price}
                        </motion.button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          ) : null}

          {tab === "coins" && !loading ? (
            <motion.ul
              key="coins"
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <p className="px-0.5 text-[12px] font-bold text-[#8a7cb8]">
                Cosmetics · balance {coins.toLocaleString()} coins
              </p>
              {coinItems.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...softSpring, delay: i * 0.05 }}
                  className={cn(
                    "overflow-hidden rounded-[20px] bg-[#12141c] text-white",
                    i === 1 && "ml-4",
                  )}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffc928]/15 text-[#ffc928]">
                      <Coins className="h-6 w-6" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[14px] font-semibold">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-white/40">
                        {item.description}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      disabled={busySku === item.sku}
                      onClick={() => void buy(item)}
                      whileTap={{ scale: 0.96, y: 1 }}
                      transition={snappySpring}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#ffc928] px-3 py-2.5 text-[12px] font-extrabold text-[#12141c] shadow-[0_3px_0_#c79a2e] disabled:opacity-60"
                    >
                      <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {item.price}
                    </motion.button>
                  </div>
                  <div
                    aria-hidden
                    className="h-2 bg-[repeating-linear-gradient(90deg,#ffc928_0_8px,transparent_8px_14px)] opacity-40"
                  />
                </motion.li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
