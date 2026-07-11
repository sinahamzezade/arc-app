"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  Check,
  Coins,
  CreditCard,
  Flame,
  Linkedin,
  Lock,
  Pencil,
  Settings,
  UserPlus,
  WandSparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import {
  profileMockData,
  type ProfileMockData,
  type ProfileSkill,
} from "@/lib/profile/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

const pageStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: softSpring },
};

const heroGlowStyle = {
  background:
    "radial-gradient(ellipse 80% 70% at 12% 0%, rgba(255,201,40,0.28) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 92% 18%, rgba(107,78,255,0.5) 0%, transparent 52%), #18142e",
} as const;

export default function ProfileScreen({
  data = profileMockData,
}: {
  data?: ProfileMockData;
}) {
  const xpPercent = Math.min(
    100,
    Math.round((data.xpIntoLevel / data.xpForNextLevel) * 100),
  );

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <motion.div
        className="relative pb-8"
        variants={pageStagger}
        initial="hidden"
        animate="visible"
      >
        <IdentitySlab data={data} xpPercent={xpPercent} />

        <div className="relative px-4 pt-4">
          <motion.div className="space-y-5" variants={pageStagger}>
            <StatsBento data={data} />
            <SkillsStampRail skills={data.skills} />
            <ActionTwinRow coins={data.coins} />
            <SharePassportButton />
            <UtilityList plan={data.plan} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function IdentitySlab({
  data,
  xpPercent,
}: {
  data: ProfileMockData;
  xpPercent: number;
}) {
  return (
    <motion.section
      variants={fadeUp}
      className="relative overflow-hidden px-[18px] pt-[calc(env(safe-area-inset-top)+16px)] pb-10 text-white"
      style={heroGlowStyle}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-10 h-40 w-40 rounded-full bg-arc-purple-500/30 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 pt-1">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-white/60 uppercase">
            Your Arc
          </p>
          <h1 className="mt-1 font-display text-[40px] leading-[0.95] font-bold tracking-[-0.04em] text-white">
            {data.userName}
          </h1>
          <p className="mt-2.5 max-w-[15rem] text-[13.5px] leading-snug font-bold text-white/80">
            <span className="text-white/55">{data.fromRole}</span>
            <span className="mx-1.5 text-arc-gold-400">→</span>
            <span className="text-white">{data.becoming}</span>
          </p>
        </div>

        <motion.div
          variants={fadeScale}
          className="relative -mr-1 shrink-0"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <XpRing percent={xpPercent} level={data.level} />
          <button
            type="button"
            aria-label="Edit avatar"
            className="absolute -right-0.5 -bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-arc-purple-500 shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </motion.div>
      </div>

      <div className="relative mt-5 flex h-8 items-center gap-2">
        <span className="inline-flex h-7 items-center rounded-full bg-white/15 px-3 text-[11.5px] font-black tracking-wide text-white">
          LVL {data.level}
        </span>
        <span className="inline-flex h-7 items-center rounded-full bg-arc-gold-400/25 px-3 text-[11.5px] font-black tracking-wide text-arc-gold-300">
          DAY {data.day}
        </span>
        <span className="ml-auto inline-flex h-7 items-center gap-1.5 text-[12px] font-extrabold text-white/80">
          <Zap className="h-3.5 w-3.5 text-arc-gold-400" strokeWidth={2.5} />
          {data.xpIntoLevel}
          <span className="font-bold text-white/40">/</span>
          {data.xpForNextLevel} XP
        </span>
      </div>

      {/* Curve into light body */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-5 rounded-t-[28px] bg-[#f3effc]"
      />
    </motion.section>
  );
}

function XpRing({ percent, level }: { percent: number; level: number }) {
  const size = 108;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative h-[108px] w-[108px]">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FFC928"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ ...softSpring, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-[10px] overflow-hidden rounded-full bg-gradient-to-b from-[#6B4EFF] to-[#4B2FD6] shadow-[inset_0_-6px_16px_rgba(0,0,0,0.25)]">
        <Image
          src={assets.arlo.thumbsUp}
          alt=""
          width={96}
          height={96}
          className="h-full w-full object-cover object-top"
          priority
        />
      </div>
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-arc-gold-400 px-2 py-0.5 font-display text-[10px] font-bold text-[#3a2800] shadow-[0_3px_0_#c98a00]">
        {level}
      </span>
    </div>
  );
}

function StatsBento({ data }: { data: ProfileMockData }) {
  return (
    <motion.div variants={fadeUp} className="grid grid-cols-5 gap-2.5">
      <div className="col-span-2 row-span-2 flex min-h-[148px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#18142e] p-4 text-white shadow-[0_12px_28px_rgba(24,20,46,0.22)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF8A3D]/20">
          <Flame className="h-5 w-5 text-[#FF8A3D]" strokeWidth={2.4} />
        </span>
        <div>
          <p className="font-display text-[42px] leading-none font-bold tracking-[-0.04em]">
            {data.weekStreak}
          </p>
          <p className="mt-1 text-[11px] font-extrabold tracking-[0.08em] text-white/50 uppercase">
            Week streak
          </p>
        </div>
      </div>

      <StatTile
        className="col-span-3"
        icon={Zap}
        iconClass="bg-arc-purple-100 text-arc-purple-500"
        value={data.xp.toLocaleString()}
        label="Total XP"
        accent="#6B4EFF"
      />
      <StatTile
        className="col-span-3"
        icon={Award}
        iconClass="bg-[#fff3c4] text-[#c98a00]"
        value={`${data.badgesEarned}/${data.badgesTotal}`}
        label="Badges"
        accent="#c98a00"
      />
    </motion.div>
  );
}

function StatTile({
  className,
  icon: Icon,
  iconClass,
  value,
  label,
  accent,
}: {
  className?: string;
  icon: LucideIcon;
  iconClass: string;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[70px] items-center gap-3 rounded-[20px] bg-white px-3.5 py-3 shadow-[0_6px_18px_rgba(70,40,150,0.07)]",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p
          className="font-display text-[20px] leading-none font-semibold tracking-[-0.02em]"
          style={{ color: accent }}
        >
          {value}
        </p>
        <p className="mt-0.5 text-[11px] font-extrabold tracking-[0.06em] text-arc-lavender-500 uppercase">
          {label}
        </p>
      </div>
    </div>
  );
}

function SkillsStampRail({ skills }: { skills: ProfileSkill[] }) {
  const verifiedCount = skills.filter((s) => s.status === "verified").length;

  return (
    <motion.section variants={fadeUp}>
      <div className="mb-3 px-0.5">
        <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-[#2b1b57]">
          Skill passport
        </h2>
        <p className="text-[12.5px] font-bold text-arc-lavender-600">
          {verifiedCount} verified · keep stacking proof
        </p>
      </div>

      <div className="-mx-[18px] flex gap-2.5 overflow-x-auto px-[18px] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {skills.map((skill, i) => (
          <SkillStamp key={skill.id} skill={skill} index={i} />
        ))}
      </div>
    </motion.section>
  );
}

function SkillStamp({ skill, index }: { skill: ProfileSkill; index: number }) {
  const verified = skill.status === "verified";
  const progress = skill.status === "in_progress";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -2 : 1.5 }}
      transition={{ ...softSpring, delay: 0.15 + index * 0.05 }}
      className={cn(
        "relative flex h-[118px] w-[118px] shrink-0 flex-col items-center justify-center rounded-[22px] border-2 border-dashed px-2.5 text-center",
        verified && "border-[#7ad9a8] bg-[#e8f9f0] shadow-[0_8px_0_#b7ebcf]",
        progress && "border-arc-purple-300 bg-white shadow-[0_8px_0_#d8ccff]",
        skill.status === "locked" &&
          "border-[#e3dbf5] bg-[#faf8ff] opacity-70 shadow-[0_8px_0_#ebe4f6]",
      )}
    >
      <span
        className={cn(
          "mb-2 flex h-9 w-9 items-center justify-center rounded-2xl",
          verified && "bg-[#2dbe65] text-white",
          progress && "bg-arc-purple-500 text-white",
          skill.status === "locked" && "bg-[#ebe4f6] text-arc-lavender-500",
        )}
      >
        {verified ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : progress ? (
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <Lock className="h-4 w-4" strokeWidth={2.5} />
        )}
      </span>
      <p
        className={cn(
          "line-clamp-2 text-[12.5px] leading-tight font-extrabold",
          verified || progress ? "text-[#2b1b57]" : "text-[#8a7cb8]",
        )}
      >
        {skill.name}
      </p>
      <p
        className={cn(
          "mt-1.5 text-[9.5px] font-black tracking-[0.08em] uppercase",
          verified && "text-[#209b51]",
          progress && "text-arc-purple-500",
          skill.status === "locked" && "text-arc-lavender-500",
        )}
      >
        {verified ? "Verified" : progress ? "In progress" : "Locked"}
      </p>
    </motion.div>
  );
}

function ActionTwinRow({ coins }: { coins: number }) {
  return (
    <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
      <motion.div whileTap={{ scale: 0.98 }}>
        <Link
          href="/avatar-studio"
          className="flex min-h-[132px] flex-col items-start justify-between overflow-hidden rounded-[22px] bg-gradient-to-br from-[#6B4EFF] to-[#8A5CFF] p-4 text-left text-white shadow-[0_10px_24px_rgba(107,78,255,0.28)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/18">
            <WandSparkles className="h-5 w-5" strokeWidth={2.3} />
          </span>
          <span>
            <span className="block font-display text-[15px] font-semibold">
              Avatar Studio
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] font-bold text-white/80">
              <Coins
                className="h-3.5 w-3.5 text-arc-gold-400"
                strokeWidth={2.5}
              />
              {coins.toLocaleString()} coins
            </span>
          </span>
        </Link>
      </motion.div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        className="flex min-h-[132px] flex-col items-start justify-between rounded-[22px] bg-[#fff1e6] p-4 text-left shadow-[0_8px_20px_rgba(255,138,61,0.14)]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF8A3D] text-white">
          <UserPlus className="h-5 w-5" strokeWidth={2.3} />
        </span>
        <span>
          <span className="block font-display text-[15px] font-semibold text-[#2b1b57]">
            Invite friends
          </span>
          <span className="mt-0.5 block text-[12px] font-bold text-[#c08359]">
            +50 coins each
          </span>
        </span>
      </motion.button>
    </motion.div>
  );
}

function SharePassportButton() {
  return (
    <motion.button
      type="button"
      variants={fadeUp}
      whileTap={{ scale: 0.985, y: 3 }}
      className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0A66C2] py-[15px] font-display text-[15px] font-semibold text-white shadow-[0_5px_0_#084d92]"
    >
      <Linkedin className="h-5 w-5" strokeWidth={2.25} />
      Share skill passport
    </motion.button>
  );
}

function UtilityList({ plan }: { plan: ProfileMockData["plan"] }) {
  const items: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
  }[] = [
    {
      icon: CreditCard,
      title: `${plan.name} · ${plan.price}`,
      subtitle: plan.teaser,
    },
    {
      icon: Settings,
      title: "Settings",
      subtitle: "Account, privacy & language",
    },
  ];

  return (
    <motion.div
      variants={fadeUp}
      className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(70,40,150,0.07)]"
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[#faf8ff]",
              i === 0 && "border-b border-[#f2edfc]",
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#efe9ff] text-arc-purple-500">
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[15px] font-semibold text-[#2b1b57]">
                {item.title}
              </span>
              <span className="block text-[12.5px] font-bold text-[#8a7cb8]">
                {item.subtitle}
              </span>
            </span>
            <ArrowRight
              className="h-[18px] w-[18px] shrink-0 text-[#c3badb]"
              strokeWidth={2.5}
            />
          </button>
        );
      })}
    </motion.div>
  );
}
