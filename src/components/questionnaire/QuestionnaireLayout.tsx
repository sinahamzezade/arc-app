"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  MotionBackButton,
  MotionReveal,
  MotionStagger,
  OnboardingPage,
} from "@/components/motion";
import { assets } from "@/lib/assets";
import { mascotEnter } from "@/lib/motion/onboarding";
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
    <OnboardingPage
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom",
        className,
      )}
    >
      <MotionBackButton className="pt-4" onClick={onBack} />

      {stepNumber !== undefined && (
        <QuestionnaireProgress stepNumber={stepNumber} className="mt-2" />
      )}

      <MotionStagger className="flex min-h-0 flex-1 flex-col">
        {showAvatar && (
          <MotionReveal
            custom={mascotEnter}
            className="mt-6 flex justify-center"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-arc-purple-100 ring-4 ring-arc-purple-50">
              <Image
                src={assets.arlo.thinking}
                alt="Arlo"
                fill
                className="object-cover object-top"
                sizes="64px"
                priority
              />
            </div>
          </MotionReveal>
        )}

        <MotionReveal className="mt-5 text-center">
          <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-arc-body text-arc-navy-500">{subtitle}</p>
          )}
        </MotionReveal>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pb-4">
          {children}
        </div>

        <MotionReveal className="shrink-0 pt-2 pb-4">{footer}</MotionReveal>
      </MotionStagger>
    </OnboardingPage>
  );
}
