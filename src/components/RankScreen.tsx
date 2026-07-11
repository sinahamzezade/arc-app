"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Coins,
  Gem,
  Lock,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { rankMockData, type RankMockData, type RankTier } from "@/lib/rank/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const pageStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

export default function RankScreen({
  data = rankMockData,
}: {
  data?: RankMockData;
}) {
  const router = useRouter();
  const { stats } = data;
  const levelPct = Math.round((stats.xpIntoLevel / stats.xpForLevel) * 100);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <motion.div
        className="relative pb-[calc(env(safe-area-inset-bottom)+100px)]"
        variants={pageStagger}
        initial="hidden"
        animate="visible"
      >
        <div className="relative overflow-hidden bg-[linear-gradient(145deg,#1b1433_0%,#35209d_52%,#4b2fd6_100%)] px-[18px] pt-[calc(env(safe-area-inset-top)+14px)] pb-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-8 h-44 w-44 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-4 left-8 h-28 w-40 rounded-full bg-arc-gold-400/25 blur-2xl"
          />

          <motion.header
            className="relative mb-6 flex items-center gap-3"
            variants={fadeUp}
          >
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold tracking-[0.08em] text-white/55 uppercase">
                Career ranks
              </p>
              <h1 className="font-display text-[24px] leading-none font-bold tracking-[-0.03em] text-white">
                Your Rank
              </h1>
            </div>
            <Trophy className="h-6 w-6 text-arc-gold-400" strokeWidth={2} />
          </motion.header>

          <motion.div
            className="relative flex items-start gap-3.5"
            variants={fadeUp}
          >
            <div className="relative shrink-0">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-white/15 ring-2 ring-white/25">
                <Image
                  src={assets.home.ninja}
                  alt=""
                  width={54}
                  height={60}
                  className="h-auto w-[52px]"
                />
              </div>
              <span className="absolute -right-1.5 -bottom-1.5 rounded-full bg-arc-gold-400 px-2 py-0.5 text-[11px] font-black text-[#1b1730] shadow-[0_4px_10px_-2px_rgba(255,201,40,0.7)]">
                Lv {stats.level}
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[11px] font-extrabold tracking-[0.06em] text-white/60 uppercase">
                Current
              </p>
              <h2 className="mt-0.5 font-display text-[28px] leading-none font-bold tracking-[-0.03em] text-white">
                {stats.rank}
              </h2>
              <p className="mt-2 text-[13px] font-semibold text-white/65">
                Next: {data.nextRank} · {data.xpToNextRank} XP in this level
              </p>

              <div className="mt-3.5">
                <div className="mb-1 flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-white/70">Level progress</span>
                  <span className="text-arc-gold-300">
                    {stats.xpIntoLevel}/{stats.xpForLevel} XP
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ffd34d,#ffc928)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelPct}%` }}
                    transition={{ ...softSpring, delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* overlapping wallet strip */}
        <motion.div
          className="relative z-[1] -mt-10 grid grid-cols-3 gap-2 px-[18px]"
          variants={fadeUp}
        >
          <WalletCard
            label="XP"
            value={stats.xp}
            icon={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2d8cff] shadow-[0_6px_12px_-4px_rgba(45,140,255,0.55)]">
                <Star className="h-4 w-4 fill-white text-white" />
              </span>
            }
            tip={data.walletTips[0].tip}
          />
          <WalletCard
            label="Gems"
            value={stats.gems}
            icon={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-arc-gem-500 shadow-[0_6px_12px_-4px_rgba(169,76,255,0.5)]">
                <Gem className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
            }
            tip={data.walletTips[1].tip}
            className="translate-y-1"
          />
          <WalletCard
            label="Coins"
            value={stats.coins}
            icon={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(150deg,#ffd34d,#f0a81e)] shadow-[0_6px_12px_-4px_rgba(240,168,30,0.5)]">
                <Coins className="h-4 w-4 text-[#7a4a00]" strokeWidth={2.5} />
              </span>
            }
            tip={data.walletTips[2].tip}
          />
        </motion.div>

        <div className="mt-6 space-y-6 px-[18px]">
          <motion.section variants={fadeUp}>
            <h3 className="mb-3 font-display text-[18px] font-semibold text-[#1b1730]">
              How XP drops
            </h3>
            <ul className="space-y-2">
              {data.howToEarn.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#ebe4f6] bg-white px-3.5 py-3"
                >
                  <span className="text-[14px] font-semibold text-[#2b1b57]">
                    {row.label}
                  </span>
                  <span className="shrink-0 text-[12px] font-extrabold text-arc-purple-500">
                    {row.xp}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section variants={fadeUp}>
            <div className="mb-3 flex items-end justify-between gap-2">
              <h3 className="font-display text-[18px] font-semibold text-[#1b1730]">
                Rank ladder
              </h3>
              <span className="text-[11px] font-bold text-[#8a7cb8]">
                XP + milestones
              </span>
            </div>
            <ol className="relative space-y-0">
              {data.tiers.map((tier, i) => (
                <RankLadderRow
                  key={tier.id}
                  tier={tier}
                  isLast={i === data.tiers.length - 1}
                />
              ))}
            </ol>
          </motion.section>

          <motion.div
            className="rounded-2xl border border-arc-purple-200 bg-[#f6f2ff] px-4 py-3.5"
            variants={fadeUp}
          >
            <div className="flex items-start gap-2.5">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-arc-purple-500"
                strokeWidth={2.5}
              />
              <p className="text-[13px] leading-snug font-semibold text-[#4a3d78]">
                Ranks unlock from XP plus milestone clears — grinding XP alone
                won’t fake Job-Ready Eagle.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-[18px] pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.2 }}
          whileTap={{ scale: 0.98, y: 1 }}
        >
          <Link
            href="/path"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
          >
            Climb on Path
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function WalletCard({
  label,
  value,
  icon,
  tip,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tip: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#ebe4f6] bg-white px-2.5 py-3 shadow-[0_10px_24px_-8px_rgba(70,40,150,0.16)]",
        className,
      )}
      title={tip}
    >
      <div className="flex flex-col items-start gap-2">
        {icon}
        <div>
          <p className="font-display text-[18px] leading-none font-bold tracking-[-0.02em] text-[#1b1730]">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] font-extrabold tracking-[0.05em] text-[#8a7cb8] uppercase">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function RankLadderRow({
  tier,
  isLast,
}: {
  tier: RankTier;
  isLast: boolean;
}) {
  const current = tier.status === "current";
  const earned = tier.status === "earned";
  const locked = tier.status === "locked";

  return (
    <li className="relative flex gap-3">
      {!isLast ? (
        <span
          aria-hidden
          className={cn(
            "absolute top-10 bottom-0 left-[17px] w-px",
            earned || current ? "bg-arc-purple-200" : "bg-[#ebe4f6]",
          )}
        />
      ) : null}

      <div className="relative z-[1] flex w-9 shrink-0 justify-center pt-1">
        {current ? (
          <motion.span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Star className="h-4 w-4 fill-white" strokeWidth={2} />
          </motion.span>
        ) : earned ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef9f3] text-[#178a52]">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efe9f8] text-[#b3a8d6]">
            <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-3")}>
        <div
          className={cn(
            "rounded-2xl border px-3.5 py-3",
            current &&
              "border-arc-purple-200 bg-white shadow-[0_10px_24px_rgba(107,78,255,0.1)]",
            earned && "border-[#ebe4f6] bg-white/80",
            locked && "border-[#ebe4f6] bg-white/60",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "font-display text-[15px] font-semibold",
                current && "text-[#1b1730]",
                earned && "text-[#4a3d78]",
                locked && "text-[#8a7cb8]",
              )}
            >
              {tier.name}
            </p>
            <span
              className={cn(
                "text-[10px] font-extrabold tracking-wide uppercase",
                current && "text-arc-purple-500",
                earned && "text-[#178a52]",
                locked && "text-[#c3badb]",
              )}
            >
              {current ? "You" : earned ? "Done" : `Lv ${tier.levelRequired}`}
            </span>
          </div>
          {(current || tier.name === "Full Ninja") && (
            <p className="mt-1 text-[12px] font-semibold text-[#8a7cb8]">
              {tier.blurb}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
