"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  Coins,
  Eye,
  Glasses,
  Lock,
  Shirt,
  Sparkles,
  SunMedium,
  WandSparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import {
  avatarStudioMockData,
  type AvatarCategory,
  type AvatarItem,
} from "@/lib/avatar/mock-data";
import { useAvatarStudioStore } from "@/store/useAvatarStudioStore";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const pageStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

const categoryIcon: Record<AvatarCategory, typeof WandSparkles> = {
  hats: WandSparkles,
  glasses: Glasses,
  hoodies: Shirt,
  capes: Sparkles,
  backgrounds: SunMedium,
};

/**
 * DESIGN: Playful/toy-like Arlo dressing room.
 * Hero stage overlaps shop; category pills; staggered item tiles.
 */
export default function AvatarStudioScreen() {
  const router = useRouter();
  const coins = useAvatarStudioStore((s) => s.coins);
  const owned = useAvatarStudioStore((s) => s.owned);
  const equipped = useAvatarStudioStore((s) => s.equipped);
  const category = useAvatarStudioStore((s) => s.category);
  const setCategory = useAvatarStudioStore((s) => s.setCategory);
  const buy = useAvatarStudioStore((s) => s.buy);
  const equip = useAvatarStudioStore((s) => s.equip);

  const items = useMemo(
    () => avatarStudioMockData.items.filter((i) => i.category === category),
    [category],
  );

  const bgItem = avatarStudioMockData.items.find(
    (i) => i.id === equipped.backgrounds,
  );
  const stageBg = bgItem?.accent ?? "#F6F2FF";

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <motion.div
        className="relative pb-[calc(env(safe-area-inset-bottom)+24px)]"
        variants={pageStagger}
        initial="hidden"
        animate="visible"
      >
        <motion.header
          className="flex items-center gap-3 px-[18px] pt-[calc(env(safe-area-inset-top)+14px)]"
          variants={fadeUp}
        >
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ebe4f6] bg-white text-[#1b1730] shadow-[0_4px_12px_rgba(70,40,150,0.06)]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-arc-lavender-600 uppercase">
              Cosmetics
            </p>
            <h1 className="font-display text-[24px] leading-none font-bold tracking-[-0.03em] text-[#1b1730]">
              Avatar Studio
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ebe4f6] bg-white px-3 py-1.5 text-[13px] font-extrabold text-[#1b1730] shadow-[0_4px_12px_rgba(70,40,150,0.06)]">
            <Coins className="h-4 w-4 text-arc-gold-500" strokeWidth={2.5} />
            {coins.toLocaleString()}
          </span>
        </motion.header>

        {/* Stage */}
        <motion.section
          className="relative mx-[18px] mt-5 overflow-hidden rounded-[28px] border border-[#ebe4f6] shadow-[0_16px_36px_rgba(70,40,150,0.12)]"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.55), transparent 55%), ${stageBg}`,
          }}
          variants={fadeUp}
        >
          <div className="relative flex flex-col items-center px-4 pt-6 pb-5">
            <EquippedChips equipped={equipped} />

            <div className="relative mt-2">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={assets.arlo.celebrate}
                  alt="Arlo"
                  width={168}
                  height={168}
                  className="h-[168px] w-[168px] object-contain drop-shadow-[0_18px_28px_rgba(27,20,51,0.25)]"
                  priority
                />
              </motion.div>

              {/* Floating cosmetic markers */}
              {equipped.hats ? (
                <PropChip
                  className="-top-1 left-2 -rotate-12"
                  color={
                    avatarStudioMockData.items.find((i) => i.id === equipped.hats)
                      ?.accent
                  }
                  icon={WandSparkles}
                />
              ) : null}
              {equipped.glasses ? (
                <PropChip
                  className="top-10 -right-1 rotate-8"
                  color={
                    avatarStudioMockData.items.find(
                      (i) => i.id === equipped.glasses,
                    )?.accent
                  }
                  icon={Glasses}
                />
              ) : null}
              {equipped.capes ? (
                <PropChip
                  className="right-0 bottom-8 -rotate-6"
                  color={
                    avatarStudioMockData.items.find(
                      (i) => i.id === equipped.capes,
                    )?.accent
                  }
                  icon={Sparkles}
                />
              ) : null}
            </div>

            <p className="mt-2 text-center text-[13px] font-bold text-[#4a3d78]/90">
              Dress Arlo — coins only, vibes forever
            </p>
          </div>
        </motion.section>

        {/* Categories */}
        <motion.div
          className="mt-5 flex gap-2 overflow-x-auto px-[18px] pb-1"
          variants={fadeUp}
        >
          {avatarStudioMockData.categories.map((cat) => {
            const active = category === cat.id;
            const Icon = categoryIcon[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-extrabold",
                  active
                    ? "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
                    : "border border-[#ebe4f6] bg-white text-[#8a7cb8]",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Shop grid */}
        <motion.section className="mt-4 px-[18px]" variants={fadeUp}>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-[18px] font-semibold text-[#1b1730]">
              Shop
            </h2>
            <span className="text-[11px] font-bold text-[#8a7cb8]">
              {items.length} looks
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-2.5">
            {items.map((item, i) => (
              <ShopTile
                key={item.id}
                item={item}
                owned={owned.includes(item.id)}
                equipped={equipped[item.category] === item.id}
                canAfford={coins >= item.cost}
                offset={i % 2 === 1}
                onBuy={() => {
                  const ok = buy(item.id, item.cost);
                  if (ok) equip(item.category, item.id);
                }}
                onEquip={() => equip(item.category, item.id)}
              />
            ))}
          </ul>
        </motion.section>
      </motion.div>
    </div>
  );
}

function EquippedChips({
  equipped,
}: {
  equipped: Partial<Record<AvatarCategory, string>>;
}) {
  const slots = (
    Object.entries(equipped) as [AvatarCategory, string][]
  ).filter(([, id]) => Boolean(id));

  if (slots.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {slots.map(([cat, id]) => {
        const item = avatarStudioMockData.items.find((i) => i.id === id);
        if (!item) return null;
        return (
          <span
            key={cat}
            className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-[#2b1b57] uppercase shadow-sm"
          >
            {item.name}
          </span>
        );
      })}
    </div>
  );
}

function PropChip({
  className,
  color,
  icon: Icon,
}: {
  className?: string;
  color?: string;
  icon: typeof WandSparkles;
}) {
  return (
    <span
      className={cn(
        "absolute flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-[0_6px_14px_rgba(27,20,51,0.25)]",
        className,
      )}
      style={{ background: color ?? "#6B4EFF" }}
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} />
    </span>
  );
}

function ShopTile({
  item,
  owned,
  equipped,
  canAfford,
  offset,
  onBuy,
  onEquip,
}: {
  item: AvatarItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  offset?: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const Icon = categoryIcon[item.category];

  return (
    <li className={cn(offset && "translate-y-2")}>
      <motion.div
        className={cn(
          "overflow-hidden rounded-[22px] border bg-white p-3 shadow-[0_8px_20px_rgba(70,40,150,0.08)]",
          equipped
            ? "border-arc-purple-400 ring-2 ring-arc-purple-200"
            : "border-[#ebe4f6]",
        )}
        whileTap={{ scale: 0.98 }}
        transition={snappySpring}
      >
        <div
          className="flex h-16 items-center justify-center rounded-2xl"
          style={{ background: `${item.accent}22` }}
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
            style={{ background: item.accent }}
          >
            <Icon className="h-5 w-5" strokeWidth={2.4} />
          </span>
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="truncate font-display text-[14px] font-semibold text-[#1b1730]">
              {item.name}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px] font-extrabold tracking-wide uppercase",
                item.rarity === "legendary" && "text-[#c79a2e]",
                item.rarity === "rare" && "text-arc-purple-500",
                item.rarity === "common" && "text-[#8a7cb8]",
              )}
            >
              {item.rarity}
            </p>
          </div>
          {equipped ? (
            <Eye className="h-4 w-4 shrink-0 text-arc-purple-500" strokeWidth={2.5} />
          ) : owned ? (
            <Check className="h-4 w-4 shrink-0 text-[#178a52]" strokeWidth={3} />
          ) : !canAfford ? (
            <Lock className="h-4 w-4 shrink-0 text-[#c3badb]" strokeWidth={2.5} />
          ) : null}
        </div>

        {owned ? (
          <button
            type="button"
            onClick={onEquip}
            disabled={equipped}
            className={cn(
              "mt-3 w-full rounded-xl py-2.5 font-display text-[13px] font-semibold",
              equipped
                ? "bg-[#f0ecf7] text-[#8a7cb8]"
                : "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]",
            )}
          >
            {equipped ? "Equipped" : "Equip"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            disabled={!canAfford && item.cost > 0}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-1 rounded-xl py-2.5 font-display text-[13px] font-semibold",
              canAfford || item.cost === 0
                ? "bg-[#1b1433] text-white"
                : "bg-[#efe9f8] text-[#b3a8d6]",
            )}
          >
            {item.cost === 0 ? (
              "Claim free"
            ) : (
              <>
                <Coins className="h-3.5 w-3.5 text-arc-gold-400" strokeWidth={2.5} />
                {item.cost}
              </>
            )}
          </button>
        )}
      </motion.div>
    </li>
  );
}
