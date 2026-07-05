"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Link as ArcLink } from "@/components/ui";
import {
  MotionReveal,
  MotionStagger,
  OnboardingPage,
  WelcomeSparkles,
} from "@/components/motion";
import { pulseGlow, scaleIn } from "@/lib/motion/onboarding";
import { assets } from "@/lib/assets";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <OnboardingPage className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-white">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={assets.arlo.welcome}
          alt="Arlo the eagle welcoming you to Arc"
          fill
          priority
          className="object-cover object-bottom"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      </motion.div>

      <WelcomeSparkles />

      <div className="relative z-10 flex min-h-dvh flex-col px-5 pt-safe-top pb-safe-bottom">
        <MotionStagger as="header" className="pt-12 text-center">
          <motion.h1
            className="font-display text-arc-hero text-arc-purple-500"
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, letterSpacing: "0em" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            Arc
          </motion.h1>
          <MotionReveal as="h2" className="mt-1 font-display text-arc-heading font-bold text-arc-navy-900">
            Your AI Career Coach
          </MotionReveal>
          <MotionReveal as="p" className="mt-2 text-arc-body text-arc-navy-900">
            Learn. Grow. Land your dream job.
          </MotionReveal>
        </MotionStagger>

        <div className="flex-1" />

        <MotionStagger as="footer" className="pb-8">
          <motion.div variants={scaleIn} animate={pulseGlow}>
            <Button
              fullWidth
              variant="primary"
              onPress={() => router.push("/register")}
              className="h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
            >
              Get Started
            </Button>
          </motion.div>
          <MotionReveal as="p" className="mt-5 text-center text-arc-small text-white/90">
            Already have an account?{" "}
            <ArcLink
              href="/login"
              className="font-bold text-arc-lavender-200 underline-offset-2 hover:underline"
            >
              Log in
            </ArcLink>
          </MotionReveal>
        </MotionStagger>
      </div>
    </OnboardingPage>
  );
}
