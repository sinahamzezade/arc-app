"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Target, LayoutList } from "lucide-react";
import { Button, Link as ArcLink } from "@/components/ui";
import { OnboardingPage } from "@/components/motion";
import { assets } from "@/lib/assets";
import { springBouncy, springSoft } from "@/lib/motion/onboarding";

const floatingBadges = [
  {
    label: "Dream Role",
    icon: Target,
    delay: 0.12,
    top: "65%",
    left: "68%",
  },
  {
    label: "Real Skills",
    icon: BookOpen,
    delay: 0.18,
    top: "53%",
    left: "65%",
  },
  {
    label: "Clear Plan",
    icon: LayoutList,
    delay: 0.24,
    top: "76%",
    left: "54%",
  },
];

function OrbitSvg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -left-16 top-[-10px]"
      width="240"
      height="90"
      viewBox="0 0 240 90"
      fill="none"
      aria-hidden
    >
      <motion.ellipse
        cx="105"
        cy="44"
        rx="92"
        ry="32"
        transform="rotate(-14 105 44)"
        stroke="#6b4eff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="580"
        initial={{ strokeDashoffset: 580, opacity: 0 }}
        animate={{ strokeDashoffset: 0, opacity: 0.7 }}
        transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.text
        x="186"
        y="16"
        fontSize="14"
        fill="#ffb800"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...springBouncy, delay: 0.25 }}
        style={{ transformOrigin: "186px 16px" }}
      >
        ✦
      </motion.text>
    </svg>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <OnboardingPage className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden">
      {/* Background image with Ken Burns */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.03 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={assets.arlo.welcome}
          alt=""
          fill
          priority
          className="object-cover object-bottom"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      </motion.div>

      {/* Top fade: sky tint */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-arc-lavender-100/90 via-arc-lavender-100/30 to-transparent" />
      {/* Bottom fade: ground fade for readability */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-linear-to-t from-arc-navy-950 via-arc-navy-950/40 to-transparent" />

      {/* Floating path badges (positioned over the middle scene) */}
      {floatingBadges.map(({ label, icon: Icon, delay, top, left }) => (
        <motion.div
          key={label}
          className="absolute z-20 flex items-center gap-1.5 rounded-arc-full bg-white/90 px-3 py-1.5 shadow-arc-card backdrop-blur-sm"
          style={{ top, left }}
          initial={{ opacity: 0, x: 28, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1, y: [0, -5, 0] }}
          transition={{
            opacity: { ...springSoft, delay },
            x: { ...springSoft, delay },
            scale: { ...springSoft, delay },
            y: {
              delay: delay + 0.2,
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-arc-purple-100">
            <Icon className="h-3 w-3 text-arc-purple-600" strokeWidth={2.5} />
          </span>
          <span className="font-rounded text-arc-caption font-semibold text-arc-navy-800">
            {label}
          </span>
        </motion.div>
      ))}
      {/* Main content */}
      <div className="relative z-10 flex min-h-dvh flex-col px-5 pt-safe-top pb-safe-bottom">
        {/* Header */}
        <motion.header
          className="pt-10 text-center"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.04, delayChildren: 0 },
            },
          }}
        >
          {/* Arc title + orbit */}
          <div className="relative mx-auto inline-block">
            <OrbitSvg />
            <motion.h1
              className="relative font-display text-arc-hero font-bold"
              style={{
                background:
                  "linear-gradient(135deg, #6b4eff 0%, #9b7bff 60%, #b96cff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              Arc
            </motion.h1>
          </div>

          <motion.h2
            className="mt-2 font-display text-arc-large-title font-bold leading-tight text-arc-navy-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            Turn ambition
            <br />
            into a roadmap
          </motion.h2>

          <motion.p
            className="mt-3 px-6 text-arc-body text-arc-navy-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            Set your goal, build real skills,
            <br />
            and move toward your dream role
            <br />
            with Arlo by your side.
          </motion.p>
        </motion.header>

        <div className="flex-1" />

        {/* CTA */}
        <motion.footer
          className="pb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              fullWidth
              variant="primary"
              onPress={() => router.push("/register")}
              className="h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
            >
              Get Started
            </Button>
          </motion.div>
          <p className="mt-5 text-center text-arc-small text-white/90">
            Already have an account?{" "}
            <ArcLink
              href="/login"
              className="font-bold text-arc-lavender-950 underline-offset-2 hover:underline"
            >
              Log in
            </ArcLink>
          </p>
        </motion.footer>
      </div>
    </OnboardingPage>
  );
}
