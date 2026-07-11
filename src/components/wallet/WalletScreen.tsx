"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import {
  Coins,
  Gem,
  Shield,
  Snowflake,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const gemItems = [
  {
    id: "freeze-1",
    name: "1-Day Streak Freeze",
    price: 50,
    blurb: "Protect one missed day",
    icon: Snowflake,
  },
  {
    id: "freeze-3",
    name: "3-Day Freeze Pack",
    price: 120,
    blurb: "Three one-day freezes",
    icon: Shield,
  },
  {
    id: "xp-boost",
    name: "30-min XP Booster",
    price: 50,
    blurb: "+20% qualified XP · 1/day",
    icon: Zap,
  },
  {
    id: "rematch",
    name: "Battle Rematch Token",
    price: 20,
    blurb: "Skip rematch cooldown",
    icon: Star,
  },
];

const coinItems = [
  {
    id: "frame-bronze",
    name: "Bronze Profile Frame",
    price: 600,
    blurb: "Cosmetic frame",
  },
  {
    id: "frame-gold",
    name: "Gold Profile Frame",
    price: 1400,
    blurb: "Cosmetic frame",
  },
  {
    id: "theme-battle",
    name: "Battle Arena Theme",
    price: 2000,
    blurb: "Purple + gold arena",
  },
];

const earnings = [
  {
    id: "e1",
    label: "Battle win vs Alex",
    delta: "+100 coins",
    tone: "coin" as const,
  },
  {
    id: "e2",
    label: "Lesson complete",
    delta: "+36 XP · +3 gems",
    tone: "xp" as const,
  },
  {
    id: "e3",
    label: "Study Together bonus",
    delta: "+15 coins · +2 gems",
    tone: "gem" as const,
  },
  {
    id: "e4",
    label: "Referral activation hold",
    delta: "+300 coins (7d)",
    tone: "coin" as const,
  },
];

type WalletTab = "ledger" | "gems" | "coins";

/**
 * Private vault — luxury ledger.
 * Giant coin balance hero, overlapping gem/XP chips, ticket shops.
 * Not 3 equal Bal cards + soft pill tabs.
 */
export default function WalletScreen() {
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const spendGems = useEconomyStore((s) => s.spendGems);
  const spendCoins = useEconomyStore((s) => s.spendCoins);
  const [tab, setTab] = useState<WalletTab>("ledger");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const buyGem = (price: number, name: string) => {
    if (!spendGems(price)) {
      setToast("Not enough gems");
      return;
    }
    setToast(`Bought ${name}`);
  };

  const buyCoin = (price: number, name: string) => {
    if (!spendCoins(price)) {
      setToast("Not enough coins");
      return;
    }
    setToast(`Bought ${name}`);
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f6f2ff] font-rounded">
      {/* VAULT HERO */}
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
          {/* Giant coins — primary */}
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

          {/* Overlapping chips — break equal grid */}
          <div className="relative h-[118px]">
            <motion.div
              className="absolute top-0 right-0 z-[2] w-[92%] -rotate-3 rounded-2xl bg-[#b35cff] px-3 py-2.5 shadow-[0_8px_0_#7a2fc4]"
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
      </section>

      {/* Segment overhang */}
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
                  active
                    ? "bg-[#12141c] text-[#ffc928]"
                    : "text-[#8a7cb8]",
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

        <AnimatePresence mode="wait">
          {tab === "ledger" ? (
            <motion.section
              key="ledger"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
            >
              <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
                <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#1b1730]">
                  Recent earnings
                </h2>
                <span className="text-[11px] font-extrabold text-[#8a7cb8]">
                  This week
                </span>
              </div>

              <ul className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.06)]">
                {earnings.map((e, i) => (
                  <li
                    key={e.id}
                    className={cn(
                      "relative flex items-center justify-between gap-3 px-4 py-3.5",
                      i < earnings.length - 1 && "border-b border-[#f0ecf7]",
                      i === 1 && "bg-[#faf8ff]",
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
                    <span className="pl-2 text-[13px] font-semibold text-[#1b1730]">
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
                ))}
              </ul>

              <p className="mt-4 rounded-[18px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-3 text-[12px] leading-relaxed font-semibold text-[#8a7cb8]">
                Referral rewards never create leaderboard XP. Gems cannot buy
                Battle wins.
              </p>
            </motion.section>
          ) : null}

          {tab === "gems" ? (
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
                const Icon = item.icon;
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...softSpring, delay: i * 0.04 }}
                    className={cn(
                      "relative overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white",
                      i === 1 && "ml-3",
                      i === 3 && "mr-3",
                    )}
                  >
                    {/* Ticket perforations */}
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
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                            {item.blurb}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => buyGem(item.price, item.name)}
                          whileTap={{ scale: 0.96, y: 1 }}
                          transition={snappySpring}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#b35cff] px-3 py-2.5 text-[12px] font-extrabold text-white shadow-[0_3px_0_#7a2fc4]"
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

          {tab === "coins" ? (
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
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-white/40">
                        {item.blurb}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => buyCoin(item.price, item.name)}
                      whileTap={{ scale: 0.96, y: 1 }}
                      transition={snappySpring}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#ffc928] px-3 py-2.5 text-[12px] font-extrabold text-[#12141c] shadow-[0_3px_0_#c79a2e]"
                    >
                      <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {item.price}
                    </motion.button>
                  </div>
                  {/* Stub edge */}
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
