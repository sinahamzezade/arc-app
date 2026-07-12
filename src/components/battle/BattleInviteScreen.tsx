"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Coins, Gem, Swords, X } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { battlesApi, type BattleDto } from "@/lib/api/battles";
import { meApi } from "@/lib/api/auth";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { useBattleStore } from "@/store/useBattleStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";

function displayName(b: BattleDto) {
  return (
    b.opponent.displayName || b.opponent.username || "Rival"
  );
}

function expiresLabel(iso: string | null) {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const m = Math.ceil(ms / 60_000);
  return m >= 60 ? `${Math.ceil(m / 60)}h` : `${m}m`;
}

export default function BattleInviteScreen({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sent = searchParams.get("sent") === "1";
  const applyBattle = useBattleStore((s) => s.applyBattle);
  const resetPlay = useBattleStore((s) => s.resetPlay);
  const coins = useEconomyStore((s) => s.coins);
  const hydrateFromProfile = useEconomyStore((s) => s.hydrateFromProfile);

  const [battle, setBattle] = useState<BattleDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const dto = await battlesApi.get(inviteId);
        if (!cancelled) {
          setBattle(dto);
          applyBattle(dto);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? messageForCode(err.code, err.message)
              : "Invite not found",
          );
        }
      }
    };
    void load();
    const poll = sent ? setInterval(() => void load(), 3000) : undefined;
    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, [inviteId, applyBattle, sent]);

  useEffect(() => {
    if (!battle) return;
    if (
      battle.status === "ready" ||
      battle.status === "in_progress" ||
      battle.status === "accepted"
    ) {
      router.replace(`/battle/play/${inviteId}`);
    }
  }, [battle, inviteId, router]);

  const stake = battle?.stakePerPlayer ?? 0;
  const name = battle ? displayName(battle) : "…";

  const accept = async () => {
    if (!battle || busy) return;
    if (coins < stake) {
      setError("Not enough coins for this stake.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dto = await battlesApi.accept(inviteId);
      applyBattle(dto);
      try {
        const me = await meApi.get();
        if (me.profile) hydrateFromProfile(me.profile);
      } catch {
        /* ignore */
      }
      router.push(`/battle/play/${inviteId}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Accept failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (sent) {
        await battlesApi.cancel(inviteId);
      } else {
        await battlesApi.decline(inviteId);
      }
      resetPlay();
      router.push("/battle");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Action failed",
      );
      setBusy(false);
    }
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
          onClick={() => void decline()}
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
            {sent ? `Waiting on ${name}` : `${name} challenged you`}
          </h1>

          {battle ? (
            <div className="mt-6 w-full rounded-[24px] border border-white/15 bg-white/10 p-4 text-left">
              <Row
                label="Subject"
                value={`${battle.subject} · ${battle.difficulty}`}
              />
              <Row label="Questions" value={`${battle.questionCount}`} />
              <Row label="Time" value={`${battle.secondsPerQuestion}s each`} />
              <Row
                label="Mode"
                value={battle.mode === "live" ? "Live" : "Async"}
              />
              <Row
                label="Stake"
                value={`${battle.stakePerPlayer} coins each`}
                icon={<Coins className="h-3.5 w-3.5 text-arc-gold-400" />}
              />
            </div>
          ) : (
            <p className="mt-6 text-[13px] font-bold text-white/50">
              Loading invite…
            </p>
          )}

          <div className="mt-3 w-full rounded-2xl bg-[#fff8e8]/15 px-4 py-3 text-left">
            <p className="text-[11px] font-extrabold tracking-wide text-[#ffc928] uppercase">
              Potential rewards
            </p>
            <p className="mt-1 flex items-center gap-3 text-[14px] font-bold text-white">
              <span>+XP on finish</span>
              <span className="inline-flex items-center gap-1">
                <Gem className="h-3.5 w-3.5" /> none wagered
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-arc-gold-400" /> pot{" "}
                {stake * 2}
              </span>
            </p>
          </div>

          {battle?.inviteExpiresAt ? (
            <p className="mt-4 flex items-center gap-1 text-[12px] font-bold text-white/50">
              <Clock className="h-3.5 w-3.5" />
              Expires in {expiresLabel(battle.inviteExpiresAt)}
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 text-[13px] font-bold text-[#ff8a3d]">{error}</p>
          ) : null}
        </motion.div>

        <div className="relative z-[1] mt-6 space-y-2">
          {!sent ? (
            <button
              type="button"
              disabled={busy || !battle}
              onClick={() => void accept()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-[15px] font-semibold text-white",
                "bg-[#16a56b] shadow-[0_4px_0_#0f7a4d]",
              )}
            >
              <Swords className="h-4 w-4" strokeWidth={2.5} />
              {busy ? "Accepting…" : "Accept"}
            </button>
          ) : (
            <p className="text-center text-[12px] font-bold text-white/50">
              Polling for accept…
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void decline()}
            className="w-full rounded-xl border border-white/25 py-3.5 font-display text-[15px] font-semibold text-white"
          >
            {sent ? "Cancel invite" : "Decline"}
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
