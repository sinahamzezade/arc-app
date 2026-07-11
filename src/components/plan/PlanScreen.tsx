"use client";

import { BackButton } from "@/components/BackButton";
import {
  ArrowRight,
  Check,
  CreditCard,
  Lock,
  Sparkles,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import { planMockData, type PlanMockData } from "@/lib/plan/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

/**
 * Plan vault — night hero + perk tickets + upgrade lanes.
 */
export default function PlanScreen({
  data = planMockData,
}: {
  data?: PlanMockData;
}) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
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
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Subscription
            </p>
            <h1 className="mt-0.5 font-display text-[24px] leading-none font-bold tracking-[-0.03em]">
              Your plan
            </h1>
          </div>
          <CreditCard className="h-5 w-5 text-white/50" strokeWidth={2.25} />
        </div>

        <div className="relative mt-7 grid grid-cols-[1.3fr_0.9fr] items-end gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              {data.name}
            </p>
            <motion.p
              className="mt-1 font-display text-[52px] leading-[0.9] font-bold tracking-[-0.05em]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={softSpring}
            >
              {data.price.replace("/mo", "")}
              <span className="text-[18px] font-semibold text-white/40">
                /mo
              </span>
            </motion.p>
            <p className="mt-2 text-[12px] font-bold text-white/45">
              {data.billingNote}
            </p>
          </div>

          <div className="relative h-[100px]">
            <div className="absolute top-0 right-0 z-[2] w-[95%] -rotate-2 rounded-2xl bg-[#16a56b] px-3 py-2.5 shadow-[0_5px_0_#0e7a4c]">
              <p className="text-[9px] font-black tracking-wide text-white/80 uppercase">
                Status
              </p>
              <p className="mt-0.5 font-display text-[16px] font-bold capitalize">
                {data.status}
              </p>
            </div>
            <div className="absolute right-1 bottom-0 z-[1] w-[88%] rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[9px] font-black tracking-wide text-[#ffc928] uppercase">
                Renews
              </p>
              <p className="mt-0.5 font-display text-[13px] font-bold">
                {data.renewsOn}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-[1] -mt-5 space-y-4 px-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <div className="rounded-[20px] border border-[#ebe4f6] bg-white px-4 py-3.5 shadow-[0_12px_28px_rgba(70,40,150,0.08)]">
          <div className="flex items-start gap-2.5">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-arc-purple-500"
              strokeWidth={2.5}
            />
            <p className="text-[13px] leading-snug font-semibold text-[#4a3d78]">
              {data.teaser}
            </p>
          </div>
        </div>

        <section>
          <h2 className="mb-2.5 px-0.5 font-display text-[18px] font-bold text-[#1b1730]">
            What&apos;s included
          </h2>
          <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
            {data.perks.map((perk, i) => (
              <li
                key={perk.id}
                className={cn(
                  "flex items-start gap-3 px-3.5 py-3.5",
                  i < data.perks.length - 1 && "border-b border-[#f0ecf7]",
                  !perk.included && "opacity-55",
                  i === 1 && "bg-[#faf8ff]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    perk.included
                      ? "bg-[#eef9f3] text-[#16a56b]"
                      : "bg-[#efe9f8] text-[#b3a8d6]",
                  )}
                >
                  {perk.included ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[14px] font-semibold text-[#1b1730]">
                    {perk.title}
                  </p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#8a7cb8]">
                    {perk.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2.5 px-0.5 font-display text-[18px] font-bold text-[#1b1730]">
            Level up
          </h2>
          <div className="space-y-2.5">
            {data.upgrades.map((up, i) => (
              <motion.button
                key={up.id}
                type="button"
                whileTap={{ scale: 0.98, y: 1 }}
                transition={snappySpring}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[20px] border border-[#ebe4f6] bg-white p-3.5 text-left shadow-[0_8px_20px_rgba(70,40,150,0.05)]",
                  i === 1 && "ml-2 bg-[#0f1220] text-white border-transparent",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    i === 1
                      ? "bg-[#ffc928] text-[#0f1220]"
                      : "bg-[#f6f2ff] text-arc-purple-500",
                  )}
                >
                  {i === 1 ? (
                    <UserRound className="h-5 w-5" strokeWidth={2.25} />
                  ) : (
                    <Sparkles className="h-5 w-5" strokeWidth={2.25} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-semibold">
                      {up.title}
                    </span>
                    <span
                      className={cn(
                        "font-display text-[13px] font-bold",
                        i === 1 ? "text-[#ffc928]" : "text-arc-purple-500",
                      )}
                    >
                      {up.price}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[12px] font-semibold",
                      i === 1 ? "text-white/45" : "text-[#8a7cb8]",
                    )}
                  >
                    {up.blurb}
                  </span>
                </span>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    i === 1 ? "text-white/40" : "text-[#c3badb]",
                  )}
                  strokeWidth={2.5}
                />
              </motion.button>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="w-full rounded-[18px] border border-dashed border-[#d5ccec] py-3.5 text-[13px] font-extrabold text-[#8a7cb8]"
        >
          Manage billing
        </button>
      </div>
    </div>
  );
}
