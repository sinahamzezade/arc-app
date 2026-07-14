"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/BackButton";
import {
  Check,
  Pencil,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { meApi } from "@/lib/api/auth";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { assets } from "@/lib/assets";
import { useArcDay } from "@/hooks/useArcDay";
import { useRankMe } from "@/hooks/useRanks";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import { emptyProfileData, type ProfileData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Identity stage — tap profile avatar lands here.
 * Night hero with giant username + Arlo stage + name edit + Studio CTA.
 */
export default function IdentityScreen({
  data: dataProp,
}: {
  data?: ProfileData;
}) {
  const data = dataProp ?? emptyProfileData();
  const { data: session, update } = useSession();
  const { flags } = useSystemFlags();
  const { data: rankMe } = useRankMe();
  const profile = session?.profile;
  const level = rankMe?.current.level ?? data.level;
  const day = useArcDay(data.day);

  const initialName =
    profile?.username || profile?.displayName || data.userName || "";

  const [userName, setUserName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next =
      profile?.username || profile?.displayName || data.userName || "";
    setUserName(next);
    setDraft(next);
  }, [profile?.username, profile?.displayName, data.userName]);

  const fromRole = data.fromRole;
  const becoming = data.becoming;

  const saveName = async () => {
    const next = draft.trim() || userName || "learner";
    setSaving(true);
    setSaveError(null);
    try {
      const res = await meApi.updateProfile({
        username: next,
        displayName: next,
      });
      await update({ profile: res.profile });
      setUserName(res.profile.username || res.profile.displayName || next);
      setDraft(res.profile.username || res.profile.displayName || next);
      setEditing(false);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1400);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(messageForCode(err.code, err.message));
      } else {
        setSaveError("Could not save username");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-24 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Identity
            </p>
            <p className="truncate text-[13px] font-bold text-white/45">
              How you show up in Arc
            </p>
          </div>
        </div>

        <div className="relative mt-8 flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.12em] text-white/35 uppercase">
              Username
            </p>
            <h1 className="mt-1.5 font-display text-[42px] leading-[0.9] font-bold tracking-[-0.045em] break-words">
              {userName}
            </h1>
            <p className="mt-3 max-w-[14rem] text-[13px] leading-snug font-bold text-white/50">
              {fromRole || becoming ? (
                <>
                  {fromRole ? <span>{fromRole}</span> : null}
                  {fromRole && becoming ? (
                    <span className="mx-1.5 text-[#ffc928]">→</span>
                  ) : null}
                  {becoming ? (
                    <span className="text-white">{becoming}</span>
                  ) : null}
                </>
              ) : (
                <span>How you show up in Arc</span>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-wide ring-1 ring-white/15">
                LVL {level}
              </span>
              <span className="rounded-full bg-[#ffc928]/20 px-3 py-1 text-[11px] font-black tracking-wide text-[#ffc928]">
                DAY {day}
              </span>
            </div>
          </div>

          <motion.div
            className="relative shrink-0"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="relative h-[132px] w-[132px] overflow-hidden rounded-full bg-arc-purple-500 shadow-[0_12px_32px_rgba(107,78,255,0.45)] ring-4 ring-[#ffc928]/35">
              <Image
                src={assets.arlo.thumbsUp}
                alt={`${userName}'s avatar`}
                fill
                priority
                className="object-cover object-top"
                sizes="132px"
              />
            </div>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#ffc928] px-2.5 py-0.5 font-display text-[11px] font-bold text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
              {level}
            </span>
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 -mt-10 flex flex-1 flex-col rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {/* Username editor */}
        <div className="rounded-[20px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_4px_0_#ebe4f6]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black tracking-[0.12em] text-[#b3a8d6] uppercase">
              Display name
            </p>
            {savedFlash ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#16a56b]">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Saved
              </span>
            ) : null}
          </div>

          {editing ? (
            <div className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={24}
                autoFocus
                aria-label="Edit username"
                className="h-12 min-w-0 flex-1 rounded-[14px] border-2 border-arc-purple-500 bg-[#f3effc] px-3.5 font-display text-[18px] font-bold text-[#0f1220] outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !saving) void saveName();
                  if (e.key === "Escape") {
                    setDraft(userName);
                    setEditing(false);
                    setSaveError(null);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void saveName()}
                disabled={saving}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6] disabled:opacity-60"
                aria-label="Save username"
              >
                <Check className="h-5 w-5" strokeWidth={2.75} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(userName);
                setEditing(true);
                setSaveError(null);
              }}
              className="mt-2 flex w-full items-center gap-3 rounded-[14px] bg-[#f3effc] px-3.5 py-3 text-left active:bg-[#ebe4f6]"
            >
              <span className="min-w-0 flex-1 font-display text-[22px] leading-none font-bold tracking-[-0.03em] text-[#0f1220]">
                {userName}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-arc-purple-500 shadow-[0_2px_0_#c3badb]">
                <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </button>
          )}
          {saveError ? (
            <p className="mt-2 text-[12px] font-bold text-arc-error">
              {saveError}
            </p>
          ) : null}
          <p className="mt-2 text-[12px] font-bold text-[#8a7cb8]">
            Visible on league, battles & invites.
          </p>
        </div>

        {/* Studio CTA */}
        {flags.avatar_studio_enabled ? (
          <motion.div
            className="mt-4"
            whileTap={{ scale: 0.98 }}
            transition={softSpring}
          >
            <Link
              href="/avatar-studio"
              className="relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-[#0f1220] p-4 text-white shadow-[0_10px_28px_rgba(15,18,32,0.28)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-arc-purple-500/50 blur-2xl"
              />
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-arc-purple-500 shadow-[0_3px_0_#4b2fd6]">
                <WandSparkles className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block font-display text-[16px] font-bold">
                  Open Avatar Studio
                </span>
                <span className="mt-0.5 block text-[12px] font-bold text-white/45">
                  Hair, glasses, tees — dress your chibi
                </span>
              </span>
              <Sparkles
                className="relative h-5 w-5 shrink-0 text-[#ffc928]"
                strokeWidth={2.5}
              />
            </Link>
          </motion.div>
        ) : null}

        {/* Preview plate */}
        <div className="mt-5 rounded-[20px] border-2 border-dashed border-[#d8d0ea] bg-white/60 px-4 py-5">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#b3a8d6] uppercase">
            League preview
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-arc-purple-500 ring-2 ring-[#ffc928]/50">
              <Image
                src={assets.arlo.thumbsUp}
                alt=""
                fill
                className="object-cover object-top"
                sizes="48px"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-[18px] font-bold text-[#0f1220]">
                {userName}
              </p>
              <p className="text-[12px] font-bold text-[#8a7cb8]">
                Lv {level}
                {becoming ? ` · ${becoming}` : ""}
              </p>
            </div>
            <span
              className={cn(
                "ml-auto rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase",
                "bg-[#ffc928]/25 text-[#9a7a12]",
              )}
            >
              You
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
