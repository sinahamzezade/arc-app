"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { cn } from "@/lib/utils";
import { pop, sectionVariants } from "./motion";

/**
 * Onboarding gate — same night-ticket language as Next Drop.
 */
export function HomeQuestionnaireCta() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      variants={sectionVariants}
      aria-labelledby="start-q-title"
      className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-[#0f1220] shadow-[0_7px_0_#0a0c16]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 right-0 h-28 w-28 rounded-full bg-arc-purple-500/30 blur-2xl"
      />

      <div className="relative px-4 pt-4 pb-1">
        <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
          First stop
        </p>
        <h2
          id="start-q-title"
          className="mt-2 font-display text-[22px] leading-[1.1] font-bold tracking-[-0.035em] text-white"
        >
          Map your trail
        </h2>
        <p className="mt-1.5 text-[13px] font-semibold text-white/50">
          A short intake so Arlo can build your path.
        </p>
      </div>

      <div className="relative px-3.5 pt-3 pb-3.5">
        <motion.div
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          transition={pop}
        >
          <Button
            fullWidth
            variant="primary"
            onPress={() => router.push("/questionnaire")}
            className={cn(
              authCtaClassName,
              "inline-flex cursor-pointer items-center justify-center gap-2",
            )}
          >
            <ClipboardList className="size-5" strokeWidth={2.5} aria-hidden />
            Start intake
            <ArrowRight className="size-5" strokeWidth={2.75} aria-hidden />
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
