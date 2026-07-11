"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { cn } from "@/lib/utils";
import { assets } from "@/lib/assets";
import { QuestionnaireProgress } from "./QuestionnaireProgress";

type QuestionnaireLayoutProps = {
  stepNumber?: number;
  onBack: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  showAvatar?: boolean;
  className?: string;
};

export function QuestionnaireLayout({
  stepNumber,
  onBack,
  title,
  subtitle,
  children,
  footer,
  showAvatar = true,
  className,
}: QuestionnaireLayoutProps) {
  return (
    <div
      className={cn(
        "relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded",
        className,
      )}
    >
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-48 w-48 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-20px] h-28 w-28 rounded-full bg-[#ffc928]/18 blur-3xl"
        />

        <div className="relative flex items-center gap-2">
          <BackButton onClick={onBack} />

          {stepNumber !== undefined ? (
            <QuestionnaireProgress
              stepNumber={stepNumber}
              className="min-w-0 flex-1"
            />
          ) : null}

          {showAvatar ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#ffc928]/40">
              <Image
                src={assets.arlo.thinking}
                alt="Arlo"
                fill
                className="object-cover object-top"
                sizes="40px"
                priority
              />
            </div>
          ) : null}
        </div>

        <div className="relative mt-5">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
            Intake
          </p>
          <h1 className="mt-1.5 font-display text-[26px] leading-[1.05] font-bold tracking-[-0.03em]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-[22rem] text-[13px] leading-snug font-bold text-white/50">
              {subtitle}
            </p>
          ) : null}
        </div>
      </section>

      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-[#f3effc]">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-4">
          {children}
        </div>
        <div className="shrink-0 border-t border-[#ebe4f6]/80 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-sm">
          {footer}
        </div>
      </div>
    </div>
  );
}
