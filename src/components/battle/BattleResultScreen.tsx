"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Gem, Star } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { battleFriends } from "@/lib/battle/mock-data";
import { useBattleStore } from "@/store/useBattleStore";
import { useEconomyStore } from "@/store/useEconomyStore";

export default function BattleResultScreen({ battleId }: { battleId: string }) {
  const router = useRouter();
  const setup = useBattleStore((s) => s.setup);
  const yourScore = useBattleStore((s) => s.yourScore);
  const theirScore = useBattleStore((s) => s.theirScore);
  const addXp = useEconomyStore((s) => s.addXp);
  const addGems = useEconomyStore((s) => s.addGems);
  const addCoins = useEconomyStore((s) => s.addCoins);
  const paid = useRef(false);

  const opponent =
    battleFriends.find((f) => f.id === setup.opponentId) ?? battleFriends[0];

  const win = yourScore > theirScore;
  const draw = yourScore === theirScore;
  const pot = setup.stake * 2;

  useEffect(() => {
    if (paid.current) return;
    paid.current = true;
    // Both stakes already escrowed → award pot / refund
    if (win) {
      addCoins(pot);
      addXp(25);
      addGems(3);
    } else if (draw) {
      addCoins(setup.stake);
      addXp(5);
    } else {
      addXp(5);
    }
  }, [win, draw, pot, setup.stake, addCoins, addXp, addGems]);

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
            {win ? "Victory" : draw ? "Draw" : "Defeat"}
          </p>
          <h1 className="mt-2 font-display text-[32px] leading-none font-bold text-white">
            {yourScore} – {theirScore}
          </h1>
          <p className="mt-2 text-[14px] font-semibold text-white/65">
            vs {opponent.name} · {setup.subject}
          </p>

          <div className="mt-8 grid w-full grid-cols-3 gap-2">
            <Chip
              icon={<Star className="h-4 w-4" />}
              value={win ? "+25" : "+5"}
              label="XP"
              tone="xp"
            />
            <Chip
              icon={<Gem className="h-4 w-4" />}
              value={win ? "+3" : "0"}
              label="Gems"
              tone="gem"
            />
            <Chip
              icon={<Coins className="h-4 w-4" />}
              value={win ? `+${pot}` : draw ? `+${setup.stake}` : "0"}
              label="Coins"
              tone="coin"
            />
          </div>
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
            onClick={() => router.push("/battle/create")}
            className="w-full py-3 font-display text-[14px] font-semibold text-white/55"
          >
            Rematch setup
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
