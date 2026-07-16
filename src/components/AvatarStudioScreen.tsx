"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { CoinsClayChip } from "@/components/economy";
import { AvatarStudioSkeleton } from "@/components/avatar/AvatarStudioSkeleton";
import {
  AvatarCharacter,
  AvatarPartPreview,
  type AvatarPartId,
} from "@/components/avatar";
import {
  Ban,
  Check,
  Coins,
  Eye,
  Glasses,
  Lock,
  Shirt,
  Smile,
  SunMedium,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  avatarColorPalettes,
  avatarStudioCatalog,
  colorSlotLabel,
  itemFitsGender,
  lookFromEquipped,
  stageAccentFromEquipped,
  type AvatarCategory,
  type AvatarColorSlot,
  type AvatarItem,
} from "@/lib/avatar/catalog";
import { useSession } from "next-auth/react";
import { useAvatarStudioStore } from "@/store/useAvatarStudioStore";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

const categoryIcon: Record<AvatarCategory, typeof UserRound> = {
  hair: UserRound,
  glasses: Glasses,
  moustache: Smile,
  hoodies: Shirt,
  backgrounds: SunMedium,
};

function categoryToColorSlot(category: AvatarCategory): AvatarColorSlot {
  return category;
}

/**
 * Avatar Studio — night dressing room + clay fitting sheet.
 */
export default function AvatarStudioScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { flags, isLoading: flagsLoading } = useSystemFlags();
  const { data: session } = useSession();
  const displayName =
    session?.profile?.displayName || session?.user?.name || "You";
  const coins = useAvatarStudioStore((s) => s.coins);
  const gender = useAvatarStudioStore((s) => s.gender);
  const owned = useAvatarStudioStore((s) => s.owned);
  const equipped = useAvatarStudioStore((s) => s.equipped);
  const category = useAvatarStudioStore((s) => s.category);
  const setCategory = useAvatarStudioStore((s) => s.setCategory);
  const setGender = useAvatarStudioStore((s) => s.setGender);
  const buy = useAvatarStudioStore((s) => s.buy);
  const equip = useAvatarStudioStore((s) => s.equip);
  const unequip = useAvatarStudioStore((s) => s.unequip);
  const colors = useAvatarStudioStore((s) => s.colors);
  const setColor = useAvatarStudioStore((s) => s.setColor);

  useEffect(() => {
    if (flagsLoading) return;
    if (!flags.avatar_studio_enabled) {
      router.replace("/profile");
    }
  }, [flags.avatar_studio_enabled, flagsLoading, router]);

  const categories = useMemo(
    () =>
      avatarStudioCatalog.categories.filter(
        (c) => !(gender === "girl" && c.id === "moustache"),
      ),
    [gender],
  );

  const items = useMemo(
    () =>
      avatarStudioCatalog.items.filter(
        (i) => i.category === category && itemFitsGender(i, gender),
      ),
    [category, gender],
  );

  const look = useMemo(
    () => lookFromEquipped(equipped, gender, colors),
    [equipped, gender, colors],
  );

  const stageAccent = stageAccentFromEquipped(equipped, colors);
  const activeCat = avatarStudioCatalog.categories.find(
    (c) => c.id === category,
  );
  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const activeColorSlot = categoryToColorSlot(category);

  if (flagsLoading) {
    return <AvatarStudioSkeleton />;
  }

  if (!flags.avatar_studio_enabled) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-[#f2eefb] px-4 font-rounded">
        <p className="text-sm font-semibold text-[#8a7cb8]">
          Avatar Studio unavailable
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] pt-[calc(env(safe-area-inset-top)+12px)] pb-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-8 h-48 w-48 rounded-full blur-3xl"
          style={{ background: `${stageAccent}55` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 -left-12 h-36 w-36 rounded-full bg-[#ffc928]/12 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 78% 12%, #fff, transparent), radial-gradient(1.5px 1.5px at 58% 48%, #fff, transparent), radial-gradient(1px 1px at 32% 70%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3 px-4">
          <BackButton tone="dark" fallbackHref="/profile" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
              Cosmetics
            </p>
            <h1 className="mt-1.5 font-display text-[36px] leading-[0.88] font-bold tracking-[-0.045em]">
              Avatar Studio
            </h1>
          </div>
          <CoinsClayChip amount={coins} href={false} />
        </div>

        <div className="relative mt-5 grid grid-cols-[1fr_auto] items-end gap-2 px-4">
          <div className="min-w-0 pb-2">
            <p className="text-[10px] font-extrabold tracking-[0.12em] text-white/40 uppercase">
              Dressing room
            </p>
            <p className="mt-1 truncate font-display text-[28px] leading-[0.92] font-bold tracking-[-0.04em]">
              {displayName}
            </p>
            <p className="mt-2 max-w-[12rem] text-[12px] leading-snug font-bold text-white/50">
              Hair · glasses · shirt · backgrounds
            </p>

            <div
              role="group"
              aria-label="Character gender"
              className="mt-4 inline-flex gap-1 rounded-full border border-white/15 bg-white/10 p-1"
            >
              {(["boy", "girl"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={gender === g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "cursor-pointer rounded-full px-3.5 py-1.5 text-[11px] font-extrabold tracking-wide uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]",
                    gender === g
                      ? "bg-[#ffc928] text-[#0f1220]"
                      : "text-white/55 hover:text-white/80",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#ffc928]/35 bg-[#ffc928]/15 px-2.5 py-1 text-[10px] font-extrabold text-[#ffc928]">
                {equippedCount} equipped
              </span>
              {Object.entries(equipped).map(([cat, id]) => {
                if (!id || cat === "backgrounds") return null;
                if (gender === "girl" && cat === "moustache") return null;
                const item = avatarStudioCatalog.items.find((i) => i.id === id);
                if (!item) return null;
                return (
                  <span
                    key={cat}
                    className="max-w-[7rem] truncate rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-extrabold text-[#0f1220]"
                    style={{
                      background:
                        colors[cat as AvatarColorSlot] ?? item.accent,
                    }}
                  >
                    {item.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="relative -mr-1 justify-self-end">
            <div
              aria-hidden
              className="absolute bottom-4 left-1/2 h-10 w-32 -translate-x-1/2 rounded-full blur-2xl"
              style={{ background: `${stageAccent}99` }}
            />
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <AvatarCharacter
                look={look}
                size={168}
                label={`${displayName}'s avatar`}
                className="relative z-[1] drop-shadow-[0_20px_36px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-8 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <div className="flex gap-3">
          <nav
            aria-label="Cosmetic categories"
            className="flex w-[3.75rem] shrink-0 flex-col gap-1.5"
          >
            {categories.map((cat) => {
              const active = category === cat.id;
              const Icon = categoryIcon[cat.id];
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-label={cat.label}
                  aria-pressed={active}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex h-12 w-[3.75rem] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
                    active
                      ? "border-[#0f1220] bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#2a2f45]"
                      : "border-[#ebe4f6] bg-white text-[#8a7cb8] shadow-[0_3px_0_#ebe4f6] hover:border-[#0f1220]/15",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span className="text-[7px] font-extrabold tracking-wide uppercase">
                    {cat.label.slice(0, 4)}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
              <div>
                <p className="text-[10px] font-black tracking-[0.12em] text-[#8a7cb8] uppercase">
                  Fitting room
                </p>
                <h2 className="font-display text-[20px] leading-none font-semibold text-[#0f1220]">
                  {activeCat?.label ?? "Shop"}
                </h2>
              </div>
              <span className="text-[11px] font-extrabold text-[#8a7cb8]">
                {items.length} looks
              </span>
            </div>

            <ColorTray
              primarySlot={activeColorSlot}
              colors={colors}
              onPick={setColor}
              hideSkin
            />

            <AnimatePresence mode="wait">
              <motion.ul
                key={category}
                className="grid grid-cols-2 gap-2.5"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={softSpring}
              >
                {items.map((item) => {
                  const isClear = Boolean(item.clear);
                  const isEquipped = isClear
                    ? !equipped[item.category]
                    : equipped[item.category] === item.id;
                  const previewAccent =
                    !isClear && item.partId
                      ? (colors[item.category as AvatarColorSlot] ?? item.accent)
                      : item.accent;
                  return (
                    <ShopTile
                      key={item.id}
                      item={item}
                      owned={isClear || owned.includes(item.id)}
                      equipped={isEquipped}
                      canAfford={coins >= item.cost}
                      previewAccent={previewAccent}
                      onBuy={() => {
                        const ok = buy(item.id, item.cost);
                        if (ok) equip(item.category, item.id);
                      }}
                      onEquip={() => {
                        if (isClear) unequip(item.category);
                        else equip(item.category, item.id);
                      }}
                    />
                  );
                })}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorTray({
  primarySlot,
  colors,
  onPick,
  hideSkin,
}: {
  primarySlot: AvatarColorSlot;
  colors: Record<AvatarColorSlot, string>;
  onPick: (slot: AvatarColorSlot, hex: string) => void;
  hideSkin?: boolean;
}) {
  const slots: AvatarColorSlot[] =
    hideSkin || primarySlot === "skin" ? [primarySlot] : ["skin", primarySlot];

  const visible =
    hideSkin && primarySlot === "backgrounds"
      ? (["backgrounds"] as AvatarColorSlot[])
      : hideSkin
        ? primarySlot === "glasses"
          ? []
          : [primarySlot]
        : slots;

  if (visible.length === 0) return null;

  return (
    <div className="mb-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3 shadow-[0_3px_0_#ebe4f6]">
      {visible.map((slot) => (
        <div key={slot}>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
              {colorSlotLabel(slot)} color
            </p>
            <span
              className="h-3.5 w-3.5 rounded-full ring-2 ring-[#ebe4f6]"
              style={{ background: colors[slot] }}
              aria-hidden
            />
          </div>
          <div
            role="listbox"
            aria-label={`${colorSlotLabel(slot)} colors`}
            className="flex flex-wrap gap-1.5"
          >
            {avatarColorPalettes[slot].map((hex) => {
              const active = colors[slot].toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-label={`${colorSlotLabel(slot)} ${hex}`}
                  onClick={() => onPick(slot, hex)}
                  className={cn(
                    "h-7 w-7 cursor-pointer rounded-full ring-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
                    active
                      ? "ring-[#0f1220]"
                      : "ring-transparent hover:ring-[#d5ccec]",
                  )}
                  style={{ background: hex }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopTile({
  item,
  owned,
  equipped,
  canAfford,
  previewAccent,
  onBuy,
  onEquip,
}: {
  item: AvatarItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  previewAccent?: string;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const Icon = categoryIcon[item.category];
  const isClear = Boolean(item.clear);
  const isLegendary = item.rarity === "legendary";
  const isRare = item.rarity === "rare";
  const accent = previewAccent ?? item.accent;

  return (
    <li>
      <div
        className={cn(
          "relative overflow-hidden rounded-[18px] border-2 bg-white p-3",
          equipped
            ? "border-arc-purple-500 shadow-[0_4px_0_#4b2fd6]/30"
            : "border-[#ebe4f6] shadow-[0_4px_0_#ebe4f6]",
        )}
      >
        <span
          aria-hidden
          className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full"
          style={{
            background: isClear
              ? "#c3badb"
              : isLegendary
                ? "#ffc928"
                : isRare
                  ? "#6b4eff"
                  : "#d8ccff",
          }}
        />

        <div
          className={cn(
            "relative ml-1 flex h-[72px] items-center justify-center overflow-hidden rounded-2xl border border-[#ebe4f6]/80",
            isClear && "bg-[#f0ecf7]",
          )}
          style={isClear ? undefined : { background: `${accent}28` }}
        >
          {isClear ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8a7cb8] ring-1 ring-[#ebe4f6]">
              <Ban className="h-5 w-5" strokeWidth={2.4} />
            </span>
          ) : item.category === "backgrounds" ? (
            <span
              className="h-12 w-12 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.12)] ring-1 ring-black/5"
              style={{ background: accent }}
            />
          ) : item.partId ? (
            <AvatarPartPreview
              partId={item.partId as AvatarPartId}
              accent={accent}
              className="h-[88px] w-[72px]"
            />
          ) : (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]"
              style={{ background: accent }}
            >
              <Icon className="h-5 w-5" strokeWidth={2.4} />
            </span>
          )}
        </div>

        <div className="mt-2.5 ml-1 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="truncate font-display text-[14px] font-bold text-[#0f1220]">
              {item.name}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px] font-extrabold tracking-wide uppercase",
                isClear && "text-[#8a7cb8]",
                !isClear && isLegendary && "text-[#c79a2e]",
                !isClear && isRare && "text-arc-purple-500",
                !isClear && item.rarity === "common" && "text-[#8a7cb8]",
              )}
            >
              {isClear ? "remove" : item.rarity}
            </p>
          </div>
          {equipped ? (
            <Eye
              className="h-4 w-4 shrink-0 text-arc-purple-500"
              strokeWidth={2.5}
            />
          ) : owned && !isClear ? (
            <Check
              className="h-4 w-4 shrink-0 text-[#178a52]"
              strokeWidth={3}
            />
          ) : !canAfford && !isClear ? (
            <Lock
              className="h-4 w-4 shrink-0 text-[#c3badb]"
              strokeWidth={2.5}
            />
          ) : null}
        </div>

        {isClear || owned ? (
          <button
            type="button"
            onClick={onEquip}
            disabled={equipped}
            className={cn(
              "mt-3 ml-1 w-[calc(100%-4px)] cursor-pointer rounded-2xl py-2.5 font-display text-[13px] font-bold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:cursor-not-allowed",
              equipped
                ? "bg-[#f0ecf7] text-[#8a7cb8]"
                : isClear
                  ? "border-2 border-[#0f1220] bg-[#0f1220] text-white shadow-[0_3px_0_#2a2f45]"
                  : "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6] hover:opacity-95",
            )}
          >
            {equipped
              ? isClear
                ? "Cleared"
                : "Equipped"
              : isClear
                ? "Remove"
                : "Equip"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            disabled={!canAfford && item.cost > 0}
            className={cn(
              "mt-3 ml-1 flex w-[calc(100%-4px)] cursor-pointer items-center justify-center gap-1 rounded-2xl border-2 py-2.5 font-display text-[13px] font-bold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] disabled:cursor-not-allowed",
              canAfford || item.cost === 0
                ? "border-[#0f1220] bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e] hover:opacity-95"
                : "border-[#ebe4f6] bg-[#efe9f8] text-[#b3a8d6]",
            )}
          >
            {item.cost === 0 ? (
              "Claim free"
            ) : (
              <>
                <Coins className="h-3.5 w-3.5" strokeWidth={2.5} />
                {item.cost}
              </>
            )}
          </button>
        )}
      </div>
    </li>
  );
}
