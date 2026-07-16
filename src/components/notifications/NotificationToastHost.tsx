"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  Bell,
  Calendar,
  Flame,
  Gift,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { mapNotificationDto } from "@/lib/notifications/map-notification";
import type { NotificationItem } from "@/lib/notifications/types";
import { assets } from "@/lib/assets";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import {
  answerIncomingCallFromToast,
  subscribeNotificationNew,
} from "@/lib/chat/realtime-bus";
import type { CallMode } from "@/lib/api/calls";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };
const AUTO_DISMISS_MS = 5600;
const CALL_TOAST_MS = 90_000;

const iconMap = {
  trophy: Trophy,
  award: Award,
  gift: Gift,
  "user-plus": UserPlus,
  star: Star,
  sparkles: Sparkles,
  calendar: Calendar,
  flame: Flame,
} as const;

const categoryInk: Record<NotificationItem["category"], string> = {
  learning: "#6b4eff",
  streak: "#ff8a3d",
  coach: "#b35cff",
  social: "#2d8cff",
  rewards: "#c79a2e",
  system: "#8a7cb8",
};

const categoryLabel: Record<NotificationItem["category"], string> = {
  learning: "Learning",
  streak: "Streak",
  coach: "Coach",
  social: "Social",
  rewards: "Reward",
  system: "System",
};

/**
 * App-wide floating signal box when unread count rises.
 * Light clay stamp — reads over soft sheet pages.
 */
export function NotificationToastHost() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { data: unreadCount } = useUnreadNotificationCount();
  const prevCount = useRef<number | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const showToast = useCallback(
    (item: NotificationItem) => {
      if (seenIds.current.has(item.id)) return;
      seenIds.current.add(item.id);
      clearTimer();
      setToast(item);
      const holdMs =
        item.type === "incoming_call" ? CALL_TOAST_MS : AUTO_DISMISS_MS;
      dismissTimer.current = setTimeout(() => setToast(null), holdMs);
    },
    [clearTimer],
  );

  // Prefer live WS payload — instant toast, no list round-trip.
  useEffect(() => {
    return subscribeNotificationNew((payload) => {
      const action = payload.notification.actionUrl ?? "";
      if (pathname.startsWith("/notifications")) {
        prevCount.current = payload.unreadCount;
        return;
      }
      // Already in that chat thread — skip toast (message stream is enough).
      if (
        action.startsWith("/chat/") &&
        (pathname === action || pathname.startsWith(`${action}/`))
      ) {
        prevCount.current = payload.unreadCount;
        return;
      }
      prevCount.current = payload.unreadCount;
      showToast(mapNotificationDto(payload.notification));
    });
  }, [pathname, showToast]);

  useEffect(() => {
    if (unreadCount == null) return;

    if (prevCount.current == null) {
      prevCount.current = unreadCount;
      return;
    }

    const rose = unreadCount > prevCount.current;
    prevCount.current = unreadCount;

    if (!rose || !accessToken) return;
    if (pathname.startsWith("/notifications")) return;

    let cancelled = false;
    void notificationsApi
      .list({ filter: "unread", limit: 3 }, accessToken)
      .then((res) => {
        if (cancelled) return;
        const fresh = res.items
          .map(mapNotificationDto)
          .find((n) => !seenIds.current.has(n.id));
        if (fresh) showToast(fresh);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [unreadCount, accessToken, pathname, showToast, queryClient]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const hidden =
    pathname.startsWith("/notifications") || pathname.startsWith("/login");

  const onOpen = () => {
    if (!toast) return;
    const id = toast.id;

    if (toast.type === "incoming_call") {
      const payload = toast.payload ?? {};
      const callId = typeof payload.callId === "string" ? payload.callId : null;
      const conversationId =
        typeof payload.conversationId === "string"
          ? payload.conversationId
          : null;
      const fromUserId =
        typeof payload.fromUserId === "string" ? payload.fromUserId : "";
      const fromName =
        typeof payload.fromName === "string"
          ? payload.fromName
          : toast.title || "Contact";
      const mode = payload.mode === "video" ? "video" : "audio";
      if (callId && conversationId) {
        // Answer = accept now (seed alone left dead invites after WS blip).
        answerIncomingCallFromToast({
          callId,
          conversationId,
          fromUserId,
          fromName,
          mode: mode as CallMode,
        });
      }
      dismiss();
      if (accessToken) {
        void notificationsApi.markRead(id, accessToken).finally(() => {
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        });
      }
      // Stay put — CallHost overlay owns media. Do not navigate
      // (that remounted call session and looked like a decline).
      return;
    }

    const href = toast.actionUrl || "/notifications";
    dismiss();
    if (accessToken) {
      void notificationsApi.markRead(id, accessToken).finally(() => {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });
    }
    router.push(href);
  };

  const ink = toast ? (categoryInk[toast.category] ?? "#6b4eff") : "#6b4eff";

  return (
    <AnimatePresence>
      {!hidden && toast ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+10px)] z-50 mx-auto w-full max-w-md px-4"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ y: -32, opacity: 0, rotate: -2.5, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, rotate: -0.8, scale: 1 }}
            exit={{ y: -18, opacity: 0, rotate: 1.5, scale: 0.96 }}
            transition={softSpring}
            className="pointer-events-auto"
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-[24px] border border-[#ebe4f6] bg-white",
                "shadow-[0_6px_0_#d8ccff,0_18px_40px_rgba(70,40,150,0.14)]",
              )}
            >
              {/* Soft sheet wash */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[#f3effc]/55"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-10 h-36 w-36 rounded-full blur-3xl"
                style={{ background: `${ink}33` }}
              />

              {/* Category ink rail */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ background: ink }}
              />

              <div className="relative flex items-start gap-3 px-3.5 py-3.5 pl-5">
                <ToastIcon item={toast} />

                <button
                  type="button"
                  onClick={onOpen}
                  className="min-w-0 flex-1 pt-0.5 text-left"
                >
                  <p
                    className="text-[10px] font-black tracking-[0.14em] uppercase"
                    style={{ color: ink }}
                  >
                    {categoryLabel[toast.category] ?? "Signal"} · new
                  </p>
                  <p className="mt-1 font-display text-[15px] leading-tight font-bold text-[#1b1730] text-balance">
                    {toast.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug text-[#8a7cb8]">
                    {toast.body}
                  </p>
                  <motion.span
                    whileTap={{ scale: 0.97, y: 1 }}
                    transition={snappySpring}
                    className="mt-2.5 inline-flex items-center rounded-xl bg-[#ffc928] px-3 py-1.5 text-[11px] font-extrabold text-[#0f1220] shadow-[0_3px_0_#c79a2e]"
                  >
                    {toast.type === "incoming_call" ? "Answer" : "Open"}
                  </motion.span>
                </button>

                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={dismiss}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f3effc] text-[#8a7cb8] ring-1 ring-[#ebe4f6] hover:bg-[#ebe4f6] hover:text-[#1b1730]"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              {/* Clay tick strip */}
              <div
                aria-hidden
                className="relative h-1.5 opacity-70"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 7px, transparent 7px 13px)`,
                }}
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function ToastIcon({ item }: { item: NotificationItem }) {
  if (item.icon.kind === "arlo") {
    return (
      <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-arc-purple-500 shadow-[0_4px_0_#7a2fc4]">
        <Image
          src={assets.arlo.thinking}
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-cover object-top"
        />
      </span>
    );
  }

  const Icon = iconMap[item.icon.name] ?? Bell;
  return (
    <span
      className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_4px_0_rgba(70,40,150,0.18)] ring-1 ring-black/5"
      style={{ background: item.icon.bg, color: item.icon.color }}
    >
      <Icon className="h-5 w-5" strokeWidth={2.4} />
    </span>
  );
}
