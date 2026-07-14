"use client";

import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import {
  ArrowRight,
  Check,
  Coins,
  Gem,
  Lock,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useRankLadder } from "@/hooks/useRanks";
import { formatRequirementLabel } from "@/lib/api/ranks";
import { isRankUploadSrc, rankImageFor } from "@/lib/rank/icons";
import { rankHowToEarn, rankWalletTips } from "@/lib/rank/catalog";
import type { RankTier } from "@/lib/rank/types";
import { cn } from "@/lib/utils";
import { useEconomyStore } from "@/store/useEconomyStore";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Rank stage — night hero family (Home/Wallet/League).
 * Live from GET /ranks/me/ladder.
 */
export default function RankScreen() {
  const { data: ladder, isLoading } = useRankLadder();
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);

  const me = ladder?.me;
  const rankTitle = me?.current.title ?? (isLoading ? "…" : "—");
  const level = me?.current.level ?? 1;
  const nextTitle = me?.next?.title ?? "—";
  const xpInto = me?.next?.xp.intoLevel ?? 0;
  const xpFor = me?.next?.xp.forLevel ?? 1;
  const xpToNext =
    me?.next != null
      ? Math.max(0, me.next.xp.required - me.current.lifetimeXp)
      : 0;
  const levelPct = Math.round((xpInto / Math.max(1, xpFor)) * 100);
  const requirements = me?.next?.requirements ?? [];
  const tiers: RankTier[] =
    ladder?.tiers.map((t) => ({
      id: t.slug,
      name: t.title,
      levelRequired: t.level,
      blurb: t.blurb,
      status: t.status,
    })) ?? [];
  const howToEarn = rankHowToEarn;
  const walletTips = rankWalletTips;
  const rankSrc = rankImageFor(me?.current.iconAssetKey);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 55% 60%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center justify-between">
          <BackButton className="border-white/15 bg-white/10 text-white hover:bg-white/15" />
          <p className="text-[11px] font-black tracking-[0.14em] text-white/45 uppercase">
            Rank ladder
          </p>
          <span className="w-10" />
        </div>

        <div className="relative mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              Current
            </p>
            <motion.p
              className="mt-1 font-display text-[56px] leading-[0.88] font-bold tracking-[-0.05em]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={softSpring}
            >
              Lv {level}
            </motion.p>
            <h2 className="mt-2 font-display text-[22px] leading-tight font-bold">
              {isLoading ? "…" : rankTitle}
            </h2>
            <p className="mt-1.5 text-[12px] font-bold text-white/45">
              Next: {nextTitle} · {xpToNext} XP left
            </p>
          </div>

          <div className="relative flex justify-end">
            <motion.div
              className="relative flex h-[112px] w-[112px] items-center justify-center rounded-[28px] bg-white/10 ring-2 ring-white/15"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={rankSrc}
                alt=""
                width={72}
                height={80}
                unoptimized={isRankUploadSrc(rankSrc)}
                className="h-auto w-[68px] object-contain"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#ffc928] px-2.5 py-0.5 text-[10px] font-black text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
                You
              </span>
            </motion.div>
          </div>
        </div>

        <div className="relative mt-6">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-white/50">Level progress</span>
            <span className="text-[#ffc928]">
              {xpInto}/{xpFor} XP
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[#ffc928]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, levelPct)}%` }}
              transition={{ ...softSpring, delay: 0.15 }}
            />
          </div>
        </div>
      </section>

      {/* LIGHT SHEET — currency stamps on seam */}
      <div className="relative z-10 -mt-8 rounded-t-[28px] bg-[#f3effc] px-4 pt-[52px] pb-[calc(env(safe-area-inset-bottom)+100px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 right-4 left-4 z-20 flex -translate-y-1/2 gap-2">
          <CurrencyChip
            className="min-w-0 flex-1"
            label="XP"
            value={me?.current.lifetimeXp ?? xp}
            tip={walletTips[0].tip}
            tone="xp"
            icon={<Star className="h-4 w-4 fill-white text-white" />}
          />
          <CurrencyChip
            className="min-w-0 flex-1"
            label="Gems"
            value={gems}
            tip={walletTips[1].tip}
            tone="gem"
            icon={<Gem className="h-4 w-4 text-white" strokeWidth={2.5} />}
          />
          <CurrencyChip
            className="min-w-0 flex-1"
            label="Coins"
            value={coins}
            tip={walletTips[2].tip}
            tone="coin"
            icon={
              <Coins className="h-4 w-4 text-[#0f1220]" strokeWidth={2.5} />
            }
          />
        </div>

        <div className="relative space-y-5 pt-2">
          {requirements.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
                <h3 className="font-display text-[18px] font-bold text-[#1b1730]">
                  To unlock {nextTitle}
                </h3>
                <span className="text-[11px] font-extrabold text-[#8a7cb8]">
                  {requirements.filter((r) => r.complete).length}/
                  {requirements.length}
                </span>
              </div>
              <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_10px_24px_rgba(70,40,150,0.06)]">
                {requirements.map((req, i) => (
                  <li
                    key={req.key}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3.5",
                      i < requirements.length - 1 &&
                        "border-b border-[#f0ecf7]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl",
                          req.complete
                            ? "bg-[#eef9f3] text-[#16a56b]"
                            : "bg-[#efe9f8] text-[#8a7cb8]",
                        )}
                      >
                        {req.complete ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : (
                          <Lock className="h-3 w-3" strokeWidth={2.5} />
                        )}
                      </span>
                      <span className="truncate text-[14px] font-semibold text-[#1b1730]">
                        {formatRequirementLabel(req.key)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-display text-[12px] font-bold tabular-nums",
                        req.complete ? "text-[#16a56b]" : "text-arc-purple-500",
                      )}
                    >
                      {req.current}/{req.required}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
              <h3 className="font-display text-[18px] font-bold text-[#1b1730]">
                How XP drops
              </h3>
              <Zap className="h-4 w-4 text-arc-purple-500" strokeWidth={2.5} />
            </div>
            <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_10px_24px_rgba(70,40,150,0.06)]">
              {howToEarn.map((row, i) => (
                <li
                  key={row.label}
                  className={cn(
                    "relative flex items-center justify-between gap-3 px-4 py-3.5",
                    i < howToEarn.length - 1 &&
                      "border-b border-[#f0ecf7]",
                    i === 1 && "bg-[#faf8ff]",
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-arc-purple-500"
                    style={{ opacity: 0.35 + i * 0.15 }}
                  />
                  <span className="pl-2 text-[14px] font-semibold text-[#1b1730]">
                    {row.label}
                  </span>
                  <span className="shrink-0 font-display text-[12px] font-bold text-arc-purple-500">
                    {row.xp}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
              <h3 className="font-display text-[18px] font-bold text-[#1b1730]">
                Rank ladder
              </h3>
              <span className="text-[11px] font-extrabold text-[#8a7cb8]">
                XP + milestones
              </span>
            </div>

            <ol className="relative space-y-0 pl-1">
              <div
                aria-hidden
                className="absolute top-5 bottom-5 left-[21px] w-0.5 bg-[#ebe4f6]"
              />
              {tiers.map((tier, i) => (
                <RankLadderRow
                  key={tier.id}
                  tier={tier}
                  offset={i % 3 === 1 ? "ml-3" : i % 3 === 2 ? "ml-1" : ""}
                />
              ))}
            </ol>
          </section>

          <div className="rounded-[18px] border border-dashed border-[#d5ccec] bg-white/70 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-arc-purple-500"
                strokeWidth={2.5}
              />
              <p className="text-[13px] leading-snug font-semibold text-[#4a3d78]">
                Ranks unlock from XP plus milestone clears — grinding XP alone
                won&apos;t fake Job-Ready Eagle.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.15 }}
          whileTap={{ scale: 0.98, y: 1 }}
        >
          <Link
            href="/path"
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_5px_0_#4b2fd6]"
          >
            Climb on Path
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function CurrencyChip({
  label,
  value,
  icon,
  tip,
  tone,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tip: string;
  tone: "xp" | "gem" | "coin";
  className?: string;
}) {
  const tones = {
    xp: "bg-[#2d8cff] text-white shadow-[0_5px_0_#1a5fad]",
    gem: "bg-[#b35cff] text-white shadow-[0_5px_0_#7a2fc4]",
    coin: "bg-[#ffc928] text-[#0f1220] shadow-[0_5px_0_#c79a2e]",
  };

  return (
    <div
      className={cn("rounded-2xl px-3 py-2.5", tones[tone], className)}
      title={tip}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/15">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-display text-[16px] leading-none font-bold tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[9px] font-black tracking-wide uppercase opacity-70">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function RankLadderRow({ tier, offset }: { tier: RankTier; offset?: string }) {
  const current = tier.status === "current";
  const earned = tier.status === "earned";
  const locked = tier.status === "locked";

  return (
    <li
      className={cn(
        "relative mb-2.5 flex items-center gap-3 last:mb-0",
        offset,
      )}
    >
      <span
        className={cn(
          "relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
          current &&
            "bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6] ring-2 ring-arc-purple-500 ring-offset-2",
          earned && "bg-[#eef9f3] text-[#16a56b]",
          locked && "bg-[#efe9f8] text-[#b3a8d6]",
        )}
      >
        {current ? (
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Star className="h-4 w-4 fill-white" strokeWidth={2} />
          </motion.span>
        ) : earned ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : (
          <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
      </span>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-[18px] border px-3.5 py-3",
          current && "border-transparent bg-[#0f1220] text-white",
          earned && "border-[#ebe4f6] bg-white",
          locked && "border-[#ebe4f6] bg-white/70",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "font-display text-[15px] font-semibold",
              current && "text-white",
              earned && "text-[#1b1730]",
              locked && "text-[#8a7cb8]",
            )}
          >
            {tier.name}
          </p>
          <span
            className={cn(
              "text-[10px] font-extrabold tracking-wide uppercase",
              current && "rounded-full bg-[#ffc928] px-2 py-0.5 text-[#0f1220]",
              earned && "text-[#16a56b]",
              locked && "text-[#c3badb]",
            )}
          >
            {current ? "You" : earned ? "Done" : `Lv ${tier.levelRequired}`}
          </span>
        </div>
        {(current || tier.status === "locked") && tier.blurb && (
          <p
            className={cn(
              "mt-1 text-[12px] font-semibold",
              current ? "text-white/45" : "text-[#8a7cb8]",
            )}
          >
            {tier.blurb}
          </p>
        )}
      </div>
    </li>
  );
}
