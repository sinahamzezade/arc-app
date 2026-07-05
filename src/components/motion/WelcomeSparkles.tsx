"use client";

import { motion } from "framer-motion";

const sparkles = [
  { top: "18%", left: "12%", size: 10, delay: 0 },
  { top: "28%", right: "14%", size: 8, delay: 0.4 },
  { top: "42%", left: "22%", size: 6, delay: 0.8 },
  { top: "55%", right: "20%", size: 12, delay: 0.2 },
  { top: "68%", left: "8%", size: 7, delay: 1.1 },
];

export function WelcomeSparkles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {sparkles.map((sparkle, index) => (
        <motion.span
          key={index}
          className="absolute rotate-45 rounded-sm bg-arc-purple-400/70"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            right: sparkle.right,
            width: sparkle.size,
            height: sparkle.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.9, 0.4, 0.9],
            scale: [0, 1, 0.85, 1],
            rotate: [45, 90, 45],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
