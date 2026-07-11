"use client";

import { useMemo } from "react";
import { BackButton } from "@/components/BackButton";
import {
  AvatarCharacter,
  AvatarPartPreview,
  type AvatarPartId,
} from "@/components/avatar";
import {
  Check,
  Coins,
  Eye,
  Glasses,
  Lock,
  Shirt,
  Smile,
  SunMedium,
  UserRound,
  Ban,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  avatarColorPalettes,
  avatarStudioMockData,
  colorSlotLabel,
  itemFitsGender,
  lookFromEquipped,
  stageAccentFromEquipped,
  type AvatarCategory,
  type AvatarColorSlot,
  type AvatarItem,
} from "@/lib/avatar/mock-data";
import { profileMockData } from "@/lib/profile/mock-data";
import { useAvatarStudioStore } from "@/store/useAvatarStudioStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

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
 * Avatar Studio — cute chibi runway.
 * Equipped items paint hair / glasses / stache / shirt on the character.
 */
export default function AvatarStudioScreen() {
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

  const categories = useMemo(
    () =>
      avatarStudioMockData.categories.filter(
        (c) => !(gender === "girl" && c.id === "moustache"),
      ),
    [gender],
  );

  const items = useMemo(
    () =>
      avatarStudioMockData.items.filter(
        (i) => i.category === category && itemFitsGender(i, gender),
      ),
    [category, gender],
  );

  const look = useMemo(
    () => lookFromEquipped(equipped, gender, colors),
    [equipped, gender, colors],
  );

  const stageAccent = stageAccentFromEquipped(equipped, colors);
  const activeCat = avatarStudioMockData.categories.find(
    (c) => c.id === category,
  );
  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const activeColorSlot = categoryToColorSlot(category);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] pt-[calc(env(safe-area-inset-top)+12px)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full blur-[80px]"
          style={{ background: `${stageAccent}66` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-32 -left-20 h-48 w-48 rounded-full bg-[#ffc928]/15 blur-[60px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 20%, #fff, transparent), radial-gradient(1px 1px at 78% 14%, #fff, transparent), radial-gradient(1px 1px at 48% 58%, #fff, transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_top,rgba(0,0,0,0.55),transparent)]"
        />

        <div className="relative flex items-center gap-3 px-4">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Cosmetics
            </p>
            <h1 className="font-display text-[22px] leading-none font-bold tracking-[-0.03em]">
              Avatar Studio
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 py-1.5 pr-3 pl-2 ring-1 ring-white/15">
            <Coins className="h-4 w-4 text-[#ffc928]" strokeWidth={2.5} />
            <span className="text-[13px] font-extrabold tabular-nums">
              {coins.toLocaleString()}
            </span>
          </span>
        </div>

        <div className="relative mt-4 grid grid-cols-[0.95fr_1.15fr] items-end gap-1 px-4 pb-8">
          <div className="min-w-0 pb-8">
            <p className="text-[11px] font-bold text-white/40">Dressing</p>
            <p className="mt-1 font-display text-[28px] leading-[0.95] font-bold tracking-[-0.04em]">
              {profileMockData.userName}
            </p>
            <p className="mt-2 max-w-[11rem] text-[12px] leading-snug font-bold text-white/50">
              Boy & girl sets · hair, glasses, shirt
            </p>

            <div
              role="group"
              aria-label="Character gender"
              className="mt-4 inline-flex rounded-xl bg-white/10 p-1 ring-1 ring-white/15"
            >
              {(["boy", "girl"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={gender === g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-[11px] font-extrabold tracking-wide uppercase transition-colors",
                    gender === g
                      ? "bg-[#ffc928] text-[#0f1220] shadow-[0_2px_0_#c79a2e]"
                      : "text-white/55",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wide ring-1 ring-white/15">
                {equippedCount} equipped
              </span>
              {Object.entries(equipped).map(([cat, id]) => {
                if (!id || cat === "backgrounds") return null;
                if (gender === "girl" && cat === "moustache") return null;
                const item = avatarStudioMockData.items.find(
                  (i) => i.id === id,
                );
                if (!item) return null;
                return (
                  <span
                    key={cat}
                    className="max-w-[7rem] truncate rounded-full px-2.5 py-1 text-[10px] font-extrabold text-[#0f1220]"
                    style={{
                      background: colors[cat as AvatarColorSlot] ?? item.accent,
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
            <AvatarCharacter
              look={look}
              size={168}
              label={`${profileMockData.userName}'s avatar`}
              className="relative z-[1] drop-shadow-[0_20px_36px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>
      </section>

      <div className="relative z-[1] -mt-5 rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <div className="flex gap-3">
          <nav
            aria-label="Cosmetic categories"
            className="flex w-14 shrink-0 flex-col gap-1.5"
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
                    "flex h-11 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors",
                    active
                      ? "bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]"
                      : "border border-[#ebe4f6] bg-white text-[#8a7cb8]",
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
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-black tracking-[0.12em] text-[#8a7cb8] uppercase">
                  Fitting room
                </p>
                <h2 className="font-display text-[20px] leading-none font-bold text-[#1b1730]">
                  {activeCat?.label ?? "Shop"}
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#8a7cb8]">
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={softSpring}
              >
                {items.map((item, i) => {
                  const isClear = Boolean(item.clear);
                  const isEquipped = isClear
                    ? !equipped[item.category]
                    : equipped[item.category] === item.id;
                  const previewAccent =
                    !isClear && item.partId
                      ? (colors[item.category as AvatarColorSlot] ??
                        item.accent)
                      : item.accent;
                  return (
                    <ShopTile
                      key={item.id}
                      item={item}
                      owned={isClear || owned.includes(item.id)}
                      equipped={isEquipped}
                      canAfford={coins >= item.cost}
                      offset={i % 2 === 1}
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

  // Cute avatar has fixed skin — only show tint tray for hair/shirt/etc.
  const visible =
    hideSkin && primarySlot === "backgrounds"
      ? (["backgrounds"] as AvatarColorSlot[])
      : hideSkin
        ? primarySlot === "glasses"
          ? [] // glasses styles are fixed-color artwork
          : [primarySlot]
        : slots;

  if (visible.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 rounded-[18px] border border-[#ebe4f6] bg-white p-3 shadow-[0_6px_16px_rgba(70,40,150,0.05)]">
      {visible.map((slot) => (
        <div key={slot}>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-black tracking-[0.1em] text-[#8a7cb8] uppercase">
              {colorSlotLabel(slot)} color
            </p>
            <span
              className="h-3.5 w-3.5 rounded-full ring-1 ring-[#ebe4f6]"
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
                    "h-7 w-7 rounded-full ring-2 transition-transform",
                    active
                      ? "scale-110 ring-[#1b1730]"
                      : "ring-transparent hover:scale-105",
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
  offset,
  previewAccent,
  onBuy,
  onEquip,
}: {
  item: AvatarItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  offset?: boolean;
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
    <li
      className={cn(
        offset && "translate-y-3",
        isLegendary && "rotate-[1.5deg]",
        isRare && !offset && "-rotate-[1deg]",
      )}
    >
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-[22px] border bg-white p-3 shadow-[0_10px_24px_rgba(70,40,150,0.08)]",
          equipped
            ? "border-arc-purple-400 ring-2 ring-arc-purple-200"
            : "border-[#ebe4f6]",
        )}
        whileTap={{ scale: 0.98 }}
        transition={snappySpring}
      >
        <div
          aria-hidden
          className="absolute top-0 left-0 h-full w-1"
          style={{
            background: isClear
              ? "#c3badb"
              : item.rarity === "legendary"
                ? "#FFC928"
                : item.rarity === "rare"
                  ? "#6B4EFF"
                  : "#d8ccff",
          }}
        />

        <div
          className={cn(
            "relative ml-1 flex h-[72px] items-center justify-center overflow-hidden rounded-2xl",
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
              className="h-12 w-12 rounded-2xl shadow-[0_6px_14px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
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
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_6px_14px_rgba(0,0,0,0.18)]"
              style={{ background: accent }}
            >
              <Icon className="h-5 w-5" strokeWidth={2.4} />
            </span>
          )}
        </div>

        <div className="mt-2.5 ml-1 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="truncate font-display text-[14px] font-semibold text-[#1b1730]">
              {item.name}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px] font-extrabold tracking-wide uppercase",
                isClear && "text-[#8a7cb8]",
                !isClear && item.rarity === "legendary" && "text-[#c79a2e]",
                !isClear && item.rarity === "rare" && "text-arc-purple-500",
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
              "mt-3 ml-1 w-[calc(100%-4px)] rounded-xl py-2.5 font-display text-[13px] font-semibold",
              equipped
                ? "bg-[#f0ecf7] text-[#8a7cb8]"
                : isClear
                  ? "bg-[#1b1730] text-white"
                  : "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]",
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
              "mt-3 ml-1 flex w-[calc(100%-4px)] items-center justify-center gap-1 rounded-xl py-2.5 font-display text-[13px] font-semibold",
              canAfford || item.cost === 0
                ? "bg-[#0f1220] text-white"
                : "bg-[#efe9f8] text-[#b3a8d6]",
            )}
          >
            {item.cost === 0 ? (
              "Claim free"
            ) : (
              <>
                <Coins
                  className="h-3.5 w-3.5 text-[#ffc928]"
                  strokeWidth={2.5}
                />
                {item.cost}
              </>
            )}
          </button>
        )}
      </motion.div>
    </li>
  );
}
