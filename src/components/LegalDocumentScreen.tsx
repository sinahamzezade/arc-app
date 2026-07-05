"use client";

import { useRouter } from "next/navigation";
import {
  MotionBackButton,
  MotionReveal,
  MotionStagger,
  OnboardingPage,
} from "@/components/motion";
import { fadeUp } from "@/lib/motion/onboarding";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalDocumentScreenProps = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalDocumentScreen({
  title,
  lastUpdated,
  sections,
}: LegalDocumentScreenProps) {
  const router = useRouter();

  return (
    <OnboardingPage className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <MotionBackButton className="pt-4" onClick={() => router.back()} />

      <MotionReveal
        as="article"
        className="mt-4 flex flex-1 flex-col overflow-hidden pb-4"
        variant="fadeUp"
      >
        <div className="text-center">
          <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
            {title}
          </h1>
          <p className="mt-1 text-arc-caption text-arc-navy-500">
            Last updated {lastUpdated}
          </p>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          <MotionStagger className="space-y-6">
            {sections.map((section) => (
              <MotionReveal as="section" key={section.title} custom={fadeUp}>
                <h2 className="font-rounded text-arc-body font-bold text-arc-navy-900">
                  {section.title}
                </h2>
                <div className="mt-2 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-arc-small leading-relaxed text-arc-navy-700"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </MotionReveal>
            ))}
          </MotionStagger>
        </div>
      </MotionReveal>
    </OnboardingPage>
  );
}
