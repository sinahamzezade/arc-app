"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/BackButton";
import {
  Bell,
  ChevronRight,
  Globe,
  Lock,
  LogOut,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { signOutArc } from "@/lib/auth/session";
import {
  settingsMockData,
  type SettingsToggle,
  type SettingsToggleId,
} from "@/lib/settings/mock-data";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

type SettingsTab = "account" | "alerts" | "privacy";

/**
 * Settings signal desk — night hero + overhang tabs + toggles.
 */
export default function SettingsScreen({
  data = settingsMockData,
}: {
  data?: typeof settingsMockData;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [tab, setTab] = useState<SettingsTab>("account");
  const [toggles, setToggles] = useState(data.toggles);
  const [signingOut, setSigningOut] = useState(false);

  const email = session?.user?.email || data.email;
  const language =
    session?.profile?.language === "en"
      ? "English"
      : session?.profile?.language || data.language;

  const setToggle = (id: SettingsToggleId) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, on: !t.on } : t)),
    );
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await signOutArc();
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  };

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
              Preferences
            </p>
            <h1 className="mt-0.5 font-display text-[26px] leading-none font-bold tracking-[-0.03em]">
              Settings
            </h1>
          </div>
        </div>

        <div className="relative mt-6">
          <p className="text-[12px] font-bold text-white/45">Signed in as</p>
          <p className="mt-1 font-display text-[18px] font-bold">{email}</p>
        </div>
      </section>

      <div className="relative z-[1] -mt-5 px-4">
        <nav
          role="tablist"
          aria-label="Settings sections"
          className="flex gap-1 rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(70,40,150,0.1)]"
        >
          {(
            [
              ["account", "Account"],
              ["alerts", "Alerts"],
              ["privacy", "Privacy"],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={cn(
                  "flex-1 rounded-[14px] py-2.5 font-display text-[13px] font-semibold",
                  active
                    ? "bg-[#0f1220] text-[#ffc928]"
                    : "text-[#8a7cb8]",
                )}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <AnimatePresence mode="wait">
          {tab === "account" ? (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={softSpring}
              className="space-y-3"
            >
              <SettingsRow
                icon={User}
                title="Account"
                detail={email}
              />
              <SettingsRow
                icon={Globe}
                title="Language"
                detail={language}
              />
              <Link href="/plan" className="block">
                <SettingsRow
                  icon={Mail}
                  title="Plan & billing"
                  detail="Core · $29/mo"
                  chevron
                />
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={signingOut}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-[#f5c4c6] bg-[#fff5f6] py-3.5 text-[13px] font-extrabold text-[#e5484d] disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.5} />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </motion.div>
          ) : null}

          {tab === "alerts" ? (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={softSpring}
            >
              <div className="mb-3 flex items-center gap-2 px-0.5">
                <Bell className="h-4 w-4 text-arc-purple-500" strokeWidth={2.5} />
                <h2 className="font-display text-[16px] font-bold text-[#1b1730]">
                  Notifications
                </h2>
              </div>
              <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
                {toggles.map((t, i) => (
                  <ToggleRow
                    key={t.id}
                    toggle={t}
                    onToggle={() => setToggle(t.id)}
                    last={i === toggles.length - 1}
                  />
                ))}
              </ul>
            </motion.div>
          ) : null}

          {tab === "privacy" ? (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={softSpring}
              className="space-y-3"
            >
              <SettingsRow
                icon={Shield}
                title="Visibility"
                detail={data.privacy}
              />
              <SettingsRow
                icon={Lock}
                title="Password"
                detail="Last changed 3 months ago"
                chevron
              />
              <div className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
                <Link
                  href="/privacy"
                  className="flex items-center justify-between border-b border-[#f0ecf7] px-4 py-3.5 text-[14px] font-semibold text-[#1b1730]"
                >
                  Privacy policy
                  <ChevronRight className="h-4 w-4 text-[#c3badb]" />
                </Link>
                <Link
                  href="/terms"
                  className="flex items-center justify-between px-4 py-3.5 text-[14px] font-semibold text-[#1b1730]"
                >
                  Terms of use
                  <ChevronRight className="h-4 w-4 text-[#c3badb]" />
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  detail,
  chevron,
}: {
  icon: typeof User;
  title: string;
  detail: string;
  chevron?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe4f6] bg-white px-3.5 py-3.5 shadow-[0_6px_16px_rgba(70,40,150,0.04)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f6f2ff] text-arc-purple-500">
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-semibold text-[#1b1730]">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8a7cb8]">
          {detail}
        </p>
      </div>
      {chevron ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-[#c3badb]" />
      ) : null}
    </div>
  );
}

function ToggleRow({
  toggle,
  onToggle,
  last,
}: {
  toggle: SettingsToggle;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3.5 py-3.5",
        !last && "border-b border-[#f0ecf7]",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-semibold text-[#1b1730]">
          {toggle.label}
        </p>
        <p className="mt-0.5 text-[12px] font-semibold text-[#8a7cb8]">
          {toggle.detail}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={toggle.on}
        aria-label={toggle.label}
        onClick={onToggle}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          toggle.on ? "bg-arc-purple-500" : "bg-[#ebe4f6]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            toggle.on && "translate-x-5",
          )}
        />
      </button>
    </li>
  );
}
