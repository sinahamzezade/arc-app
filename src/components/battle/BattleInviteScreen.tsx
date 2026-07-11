"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Coins, Gem, Swords, X } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { battleFriends, incomingInvite } from "@/lib/battle/mock-data";
import { useBattleStore } from "@/store/useBattleStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

export default function BattleInviteScreen({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sent = searchParams.get("sent") === "1";
  const setup = useBattleStore((s) => s.setup);
  const resetPlay = useBattleStore((s) => s.resetPlay);
  const spendCoins = useEconomyStore((s) => s.spendCoins);
  const addCoins = useEconomyStore((s) => s.addCoins);
  const coins = useEconomyStore((s) => s.coins);

  const opponent = sent
    ? battleFriends.find((f) => f.id === setup.opponentId) ?? battleFriends[0]
    : incomingInvite.from;

  const subject = sent ? setup.subject : incomingInvite.subject;
  const questions = sent ? setup.questions : incomingInvite.questions;
  const seconds = sent ? setup.seconds : incomingInvite.seconds;
  const mode = sent ? setup.mode : incomingInvite.mode;
  const stake = sent ? setup.stake : incomingInvite.stake;
  const difficulty = sent ? setup.difficulty : incomingInvite.difficulty;

  const accept = () => {
    if (!sent) {
      if (coins < stake) return;
      spendCoins(stake);
    }
    resetPlay();
    router.push(`/battle/play/${inviteId}`);
  };

  const decline = () => {
    if (sent) {
      // Refund challenger escrow
      addCoins(stake);
    }
    router.push("/battle");
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#1b1433] font-rounded">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(107,78,255,0.45),transparent_55%)]"
      />

      <div className="relative z-[1] flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <button
          type="button"
          aria-label="Close"
          onClick={decline}
          className="mb-4 flex h-10 w-10 items-center justify-center self-end rounded-xl bg-white/10 text-white"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex flex-1 flex-col items-center text-center"
        >
          <Image
            src={assets.arlo.celebrate}
            alt=""
            width={120}
            height={120}
            className="h-[120px] w-[120px] object-contain"
          />
          <p className="mt-2 text-[11px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            {sent ? "Challenge sent" : "Battle invite"}
          </p>
          <h1 className="mt-2 font-display text-[28px] leading-none font-bold text-white">
            {sent ? `Waiting on ${opponent.name}` : `${opponent.name} challenged you`}
          </h1>

          <div className="mt-6 w-full rounded-[24px] border border-white/15 bg-white/10 p-4 text-left">
            <Row label="Subject" value={`${subject} · ${difficulty}`} />
            <Row label="Questions" value={`${questions}`} />
            <Row label="Time" value={`${seconds}s each`} />
            <Row label="Mode" value={mode === "live" ? "Live" : "Async"} />
            <Row
              label="Stake"
              value={`${stake} coins each`}
              icon={<Coins className="h-3.5 w-3.5 text-arc-gold-400" />}
            />
          </div>

          <div className="mt-3 w-full rounded-2xl bg-[#fff8e8]/15 px-4 py-3 text-left">
            <p className="text-[11px] font-extrabold tracking-wide text-[#ffc928] uppercase">
              Potential rewards
            </p>
            <p className="mt-1 flex items-center gap-3 text-[14px] font-bold text-white">
              <span>+25 XP</span>
              <span className="inline-flex items-center gap-1">
                <Gem className="h-3.5 w-3.5" /> +3
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-arc-gold-400" /> pot {stake * 2}
              </span>
            </p>
          </div>

          {!sent ? (
            <p className="mt-4 flex items-center gap-1 text-[12px] font-bold text-white/50">
              <Clock className="h-3.5 w-3.5" />
              Expires in {incomingInvite.expiresIn}
            </p>
          ) : (
            <p className="mt-4 text-[12px] font-bold text-white/50">
              Demo: tap Start to simulate their accept.
            </p>
          )}
        </motion.div>

        <div className="relative z-[1] mt-6 space-y-2">
          <button
            type="button"
            onClick={accept}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-[15px] font-semibold text-white",
              "bg-[#16a56b] shadow-[0_4px_0_#0f7a4d]",
            )}
          >
            <Swords className="h-4 w-4" strokeWidth={2.5} />
            {sent ? "Start battle" : "Accept"}
          </button>
          <button
            type="button"
            onClick={decline}
            className="w-full rounded-xl border border-white/25 py-3.5 font-display text-[15px] font-semibold text-white"
          >
            {sent ? "Cancel & refund" : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 last:border-0">
      <span className="text-[12px] font-bold text-white/55">{label}</span>
      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-white">
        {icon}
        {value}
      </span>
    </div>
  );
}
