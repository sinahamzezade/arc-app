"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Gem, Star } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { meApi } from "@/lib/api/auth";
import { battlesApi, type BattleDto } from "@/lib/api/battles";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { useEconomyStore } from "@/store/useEconomyStore";

export default function BattleResultScreen({ battleId }: { battleId: string }) {
  const router = useRouter();
  const hydrateFromProfile = useEconomyStore((s) => s.hydrateFromProfile);
  const [battle, setBattle] = useState<BattleDto | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [coinsDelta, setCoinsDelta] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [avgAnswerMs, setAvgAnswerMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rematchBusy, setRematchBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dto = await battlesApi.get(battleId);
        if (!cancelled) setBattle(dto);
        try {
          const hist = await battlesApi.history();
          const mine = hist.items.find((h) => h.id === battleId);
          if (mine && !cancelled) {
            setXpAwarded(mine.xpAwarded);
            setCoinsDelta(mine.coinsDelta);
            setAccuracy(mine.accuracy);
            setAvgAnswerMs(mine.avgAnswerMs);
          }
        } catch {
          /* ignore */
        }
        try {
          const me = await meApi.get();
          if (me.profile && !cancelled) hydrateFromProfile(me.profile);
        } catch {
          /* ignore */
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? messageForCode(err.code, err.message)
              : "Result unavailable",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [battleId, hydrateFromProfile]);

  const yourScore = battle?.yourScore ?? 0;
  const theirScore = battle?.theirScore ?? 0;
  const win = Boolean(
    battle?.winnerId && battle.winnerId !== battle.opponent.userId,
  );
  const draw =
    (battle?.status === "completed" || battle?.status === "refunded") &&
    (battle.resultReason === "draw" || !battle.winnerId);
  const forfeited = battle?.status === "forfeited";
  const voided =
    battle?.status === "voided" || battle?.status === "refunded";
  const headline = win
    ? "Victory"
    : draw
      ? "Draw"
      : forfeited
        ? "Forfeit"
        : voided
          ? "Refunded"
          : "Defeat";
  const pot = battle?.pot ?? 0;
  const stake = battle?.stakePerPlayer ?? 0;
  const coinDisplay =
    coinsDelta !== 0
      ? `${coinsDelta > 0 ? "+" : ""}${coinsDelta}`
      : win
        ? `+${pot}`
        : draw
          ? `+${stake}`
          : "0";
  const opponentName =
    battle?.opponent.displayName ||
    battle?.opponent.username ||
    "Rival";

  const rematch = async () => {
    if (rematchBusy) return;
    setRematchBusy(true);
    try {
      const next = await battlesApi.rematch(battleId);
      router.push(`/battle/invite/${next.id}?sent=1`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Rematch failed",
      );
      setRematchBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#1b1433] font-rounded">
      <Image
        src={assets.backgrounds.rewardBurst}
        alt=""
        fill
        className="pointer-events-none object-cover opacity-35"
      />

      <div className="relative z-[1] flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex flex-1 flex-col items-center text-center"
        >
          <Image
            src={win ? assets.arlo.celebrate : assets.arlo.thinking}
            alt=""
            width={140}
            height={140}
            className="h-[140px] w-[140px] object-contain"
          />
          <p className="mt-2 text-[11px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            {headline}
          </p>
          <h1 className="mt-2 font-display text-[32px] leading-none font-bold text-white">
            {yourScore} – {theirScore}
          </h1>
          <p className="mt-2 text-[14px] font-semibold text-white/65">
            vs {opponentName}
            {battle ? ` · ${battle.subject}` : ""}
          </p>
          {accuracy != null || avgAnswerMs != null ? (
            <p className="mt-2 text-[12px] font-bold text-white/45">
              {accuracy != null ? `${Math.round(accuracy * 100)}% accuracy` : ""}
              {accuracy != null && avgAnswerMs != null ? " · " : ""}
              {avgAnswerMs != null
                ? `${(avgAnswerMs / 1000).toFixed(1)}s avg`
                : ""}
            </p>
          ) : null}

          <div className="mt-8 grid w-full grid-cols-3 gap-2">
            <Chip
              icon={<Star className="h-4 w-4" />}
              value={xpAwarded > 0 ? `+${xpAwarded}` : "+XP"}
              label="XP"
              tone="xp"
            />
            <Chip
              icon={<Gem className="h-4 w-4" />}
              value="0"
              label="Gems"
              tone="gem"
            />
            <Chip
              icon={<Coins className="h-4 w-4" />}
              value={coinDisplay}
              label="Coins"
              tone="coin"
            />
          </div>

          {error ? (
            <p className="mt-4 text-[13px] font-bold text-[#ff8a3d]">{error}</p>
          ) : null}
        </motion.div>

        <div className="space-y-2">
          <Link
            href="/battle"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
          >
            Back to Battle
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <button
            type="button"
            disabled={rematchBusy}
            onClick={() => void rematch()}
            className="w-full py-3 font-display text-[14px] font-semibold text-white/55"
          >
            {rematchBusy ? "Starting rematch…" : "Rematch"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: "xp" | "gem" | "coin";
}) {
  const tones = {
    xp: "bg-[#fff4cc] text-[#8a6a00]",
    gem: "bg-[#f0e8ff] text-[#5b3ee8]",
    coin: "bg-[#ffe8c8] text-[#9a5a00]",
  };
  return (
    <div className={`rounded-2xl px-2 py-3 ${tones[tone]}`}>
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
        {icon}
      </div>
      <p className="font-display text-[16px] leading-none font-bold">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase opacity-70">{label}</p>
    </div>
  );
}
