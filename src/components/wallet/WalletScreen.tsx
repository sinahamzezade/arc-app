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
import { ApiError, messageForCode } from "@/lib/api/errors";
import {
  walletApi,
  type CurrencyPack,
  type LedgerEntry,
  type StoreCatalogItem,
  type StreakStateDto,
} from "@/lib/api/wallet";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

type WalletTab = "ledger" | "packs" | "gems" | "coins";

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

function newIdempotencyKey(prefix: string, sku: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${sku}`;
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
  const [tab, setTab] = useState<WalletTab>("packs");
  const [toast, setToast] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [catalog, setCatalog] = useState<StoreCatalogItem[]>([]);
  const [packs, setPacks] = useState<CurrencyPack[]>([]);
  const [streak, setStreak] = useState<StreakStateDto | null>(null);
  const [busySku, setBusySku] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [w, l, store, s, currencyPacks] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getLedger(),
        walletApi.getStore(),
        walletApi.getStreak(),
        walletApi.getCurrencyPacks(),
      ]);
      hydrateFromWallet(w);
      setLedger(l.entries);
      setCatalog(store);
      setStreak(s);
      setPacks(currencyPacks);
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
  const gemPacks = useMemo(
    () => packs.filter((p) => p.target === "gems"),
    [packs],
  );
  const coinPacks = useMemo(
    () => packs.filter((p) => p.target === "coins"),
    [packs],
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

  const buyPack = async (pack: CurrencyPack) => {
    if (busySku) return;
    if (!pack.paymentMethods.includes("xp")) {
      setToast("Real-money packs coming soon");
      return;
    }
    if (xp < pack.xpPrice) {
      setToast("Not enough XP for that pack");
      return;
    }
    setBusySku(pack.sku);
    try {
      const res = await walletApi.purchaseCurrencyPack(
        { sku: pack.sku, paymentMethod: "xp" },
        newIdempotencyKey("cp", pack.sku),
      );
      hydrateFromWallet(res.wallet);
      setToast(
        res.alreadyPurchased
          ? "Already processed"
          : `+${pack.amount.toLocaleString()} ${pack.target} · −${pack.xpPrice.toLocaleString()} XP`,
      );
      const l = await walletApi.getLedger();
      setLedger(l.entries);
    } catch (err) {
      setToast(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Exchange failed",
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
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* Night hero — Rank / Profile family */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(255,201,40,0.18),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-8 h-40 w-40 rounded-full bg-[#b35cff]/20 blur-3xl"
        />

        <div className="relative flex items-center justify-between">
          <BackButton className="border-white/15 bg-white/10 text-white hover:bg-white/15" />
          <p className="text-[11px] font-black tracking-[0.14em] text-white/45 uppercase">
            Private vault
          </p>
          <span className="flex h-10 w-10 items-center justify-center">
            <Sparkles className="h-5 w-5 text-[#b35cff]" strokeWidth={2.25} />
          </span>
        </div>

        <div className="relative mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
              Coins
            </p>
            <motion.h1
              className="mt-1 font-display text-[56px] leading-[0.88] font-bold tracking-[-0.05em] tabular-nums"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={softSpring}
            >
              {coins.toLocaleString()}
            </motion.h1>
            <p className="mt-2 max-w-[15rem] text-[12px] font-bold text-white/45">
              Spend XP for packs · shops spend gems &amp; coins
            </p>
          </div>

          <div className="relative flex w-[132px] flex-col gap-2 pb-1">
            <motion.div
              className="relative z-[2] -rotate-1 rounded-2xl bg-[#b35cff] px-3 py-2.5 shadow-[0_5px_0_#7a2fc4]"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.08 }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/15">
                  <Gem className="h-4 w-4 text-white" strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[16px] leading-none font-bold tabular-nums">
                    {gems.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[9px] font-black tracking-wide text-white/70 uppercase">
                    Gems
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="relative z-[1] ml-3 rotate-2 rounded-2xl bg-[#2d8cff] px-3 py-2.5 shadow-[0_5px_0_#1a5fad]"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.14 }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/15">
                  <Zap
                    className="h-4 w-4 text-white"
                    strokeWidth={2.5}
                    fill="currentColor"
                  />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[16px] leading-none font-bold tabular-nums">
                    {xp.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[9px] font-black tracking-wide text-white/70 uppercase">
                    XP
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {streak ? (
          <div className="relative mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-3.5 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff8a3d]/20">
                <Flame className="h-4 w-4 text-[#ff8a3d]" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.12em] text-white/50 uppercase">
                  Daily streak
                </p>
                <p className="font-display text-[18px] font-bold leading-none tabular-nums">
                  {streak.dailyStreak}{" "}
                  <span className="text-[13px] font-semibold text-white/50">
                    day{streak.dailyStreak === 1 ? "" : "s"}
                  </span>
                </p>
              </div>
            </div>
            {streak.recoveryWindowEndsAt ? (
              <button
                type="button"
                onClick={() => void restore(1)}
                className="rounded-xl bg-[#ffc928] px-3 py-2 text-[11px] font-extrabold text-[#0f1220] shadow-[0_3px_0_#c79a2e] active:translate-y-px active:shadow-none"
              >
                Restore 1d · 80
              </button>
            ) : (
              <p className="rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold tracking-wide text-white/55 uppercase">
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
          className="flex gap-1 rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(15,18,32,0.1)]"
        >
          {(
            [
              ["packs", "Buy"],
              ["gems", "Gem shop"],
              ["coins", "Coin shop"],
              ["ledger", "Ledger"],
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
                  "flex-1 rounded-[14px] py-2.5 font-display text-[12px] font-semibold",
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
          {tab === "packs" && !loading ? (
            <motion.section
              key="packs"
              className="space-y-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <p className="px-0.5 text-[12px] font-bold text-[#8a7cb8]">
                Convert lifetime XP · balance {xp.toLocaleString()} XP
              </p>
              <p className="rounded-[18px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-3 text-[12px] leading-relaxed font-semibold text-[#8a7cb8]">
                Real-money packs coming later — same SKUs, IAP settlement.
              </p>

              <div>
                <h2 className="mb-2 px-0.5 font-display text-[16px] font-bold text-[#1b1730]">
                  Gem packs
                </h2>
                <ul className="space-y-3">
                  {gemPacks.map((pack, i) => (
                    <motion.li
                      key={pack.sku}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...softSpring, delay: i * 0.04 }}
                      className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white"
                    >
                      <div className="flex items-center gap-3 p-3.5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#b35cff]/12 text-[#b35cff]">
                          <Gem className="h-6 w-6" strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[14px] font-semibold text-[#1b1730]">
                            {pack.title}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                            +{pack.amount.toLocaleString()} gems
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          disabled={busySku === pack.sku || xp < pack.xpPrice}
                          onClick={() => void buyPack(pack)}
                          whileTap={{ scale: 0.96, y: 1 }}
                          transition={snappySpring}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#6b4eff] px-3 py-2.5 text-[12px] font-extrabold text-white shadow-[0_3px_0_#4a32c4] disabled:opacity-50"
                        >
                          <Star className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {pack.xpPrice.toLocaleString()}
                        </motion.button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="mb-2 px-0.5 font-display text-[16px] font-bold text-[#1b1730]">
                  Coin packs
                </h2>
                <ul className="space-y-3">
                  {coinPacks.map((pack, i) => (
                    <motion.li
                      key={pack.sku}
                      initial={{ opacity: 0, x: i % 2 === 0 ? 12 : -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...softSpring, delay: i * 0.04 }}
                      className="overflow-hidden rounded-[20px] bg-[#12141c] text-white"
                    >
                      <div className="flex items-center gap-3 p-3.5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffc928]/15 text-[#ffc928]">
                          <Coins className="h-6 w-6" strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[14px] font-semibold">
                            {pack.title}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-white/40">
                            +{pack.amount.toLocaleString()} coins
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          disabled={busySku === pack.sku || xp < pack.xpPrice}
                          onClick={() => void buyPack(pack)}
                          whileTap={{ scale: 0.96, y: 1 }}
                          transition={snappySpring}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#ffc928] px-3 py-2.5 text-[12px] font-extrabold text-[#12141c] shadow-[0_3px_0_#c79a2e] disabled:opacity-50"
                        >
                          <Star className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {pack.xpPrice.toLocaleString()}
                        </motion.button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.section>
          ) : null}

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
                Spending XP lowers lifetime progress toward rank gates. Gems
                still cannot buy Battle wins.
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
