"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "motion/react";
import { Home, Map, Swords, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/path", label: "Path", icon: Map },
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/study", label: "Study", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Tabs that smooth-scroll window to top on press (shared document scroll + Activity keep-alive). */
const SMOOTH_SCROLL_TOP = new Set<string>([
  "/home",
  "/battle",
  "/study",
  "/profile",
]);

const spring = {
  type: "spring" as const,
  stiffness: 440,
  damping: 34,
  mass: 0.85,
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function scrollWindowTopSmooth() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(to_top,#f3effc_40%,transparent)]"
      />

      <LayoutGroup id="arc-tabbar">
        <ul className="pointer-events-auto relative flex items-stretch gap-0.5 rounded-[24px] border border-[#ebe4f6] bg-white/95 p-1.5 shadow-[0_12px_36px_rgba(70,40,150,0.12)] backdrop-blur-xl">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href);
            const exactTab = pathname === tab.href;
            const smoothTop = SMOOTH_SCROLL_TOP.has(tab.href);
            const Icon = tab.icon;

            return (
              <li key={tab.href} className="relative min-w-0 flex-1">
                <Link
                  href={tab.href}
                  prefetch
                  // Avoid Next's instant jump so we can smooth-scroll ourselves.
                  scroll={smoothTop ? false : !exactTab}
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.label}
                  onClick={(e) => {
                    if (exactTab) {
                      e.preventDefault();
                      scrollWindowTopSmooth();
                      return;
                    }
                    if (smoothTop) {
                      // After Activity swaps tab, ease shared window scroll to top.
                      requestAnimationFrame(scrollWindowTopSmooth);
                    }
                  }}
                  className={cn(
                    "relative flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-[18px]",
                    active ? "text-white" : "text-[#b3a8d6]",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="tab-active-pill"
                      className="absolute inset-x-0 top-0 h-[48px] rounded-[18px] bg-arc-purple-500 shadow-[0_4px_0_#4b2fd6]"
                      transition={spring}
                    />
                  ) : null}

                  <motion.span
                    className="relative z-[1] flex items-center justify-center"
                    whileTap={{ scale: 0.9, y: 1 }}
                    transition={spring}
                  >
                    <Icon
                      className="h-[18px] w-[18px]"
                      strokeWidth={active ? 2.5 : 2}
                      fill={active ? "currentColor" : "none"}
                      fillOpacity={active ? 0.2 : 0}
                    />
                  </motion.span>

                  <span
                    className={cn(
                      "relative z-[1] font-display text-[10px] font-semibold tracking-[-0.01em]",
                      active ? "text-white" : "text-[#b3a8d6]",
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}
