"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 72;
const PULL_MAX = 120;

type PullToRefreshProps = {
  children: ReactNode;
  /** When false, gesture + button idle (nested non-tab routes). */
  enabled?: boolean;
};

/**
 * Document-level pull-to-refresh for main tab scroll (window scroll).
 * Shows a tappable refresh pill while pulling / refreshing.
 */
export function PullToRefresh({
  children,
  enabled = true,
}: PullToRefreshProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const startYRef = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const runRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setPull(PULL_THRESHOLD);
    try {
      await Promise.all([
        queryClient.invalidateQueries(),
        Promise.resolve(router.refresh()),
      ]);
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  }, [queryClient, refreshing, router]);

  const onTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled || refreshing) return;
      if (typeof window !== "undefined" && window.scrollY > 0) {
        startYRef.current = null;
        return;
      }
      startYRef.current = e.touches[0]?.clientY ?? null;
      setDragging(true);
    },
    [enabled, refreshing],
  );

  const onTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled || refreshing || startYRef.current == null) return;
      if (typeof window !== "undefined" && window.scrollY > 0) {
        startYRef.current = null;
        setPull(0);
        return;
      }
      const y = e.touches[0]?.clientY ?? startYRef.current;
      const delta = Math.max(0, y - startYRef.current);
      if (delta <= 0) {
        setPull(0);
        return;
      }
      // Resist past threshold so pull feels rubber-bandy.
      const resisted =
        delta < PULL_THRESHOLD
          ? delta
          : PULL_THRESHOLD + (delta - PULL_THRESHOLD) * 0.35;
      setPull(Math.min(PULL_MAX, resisted));
    },
    [enabled, refreshing],
  );

  const onTouchEnd = useCallback(() => {
    if (!enabled) return;
    const shouldRefresh = pull >= PULL_THRESHOLD && !refreshing;
    startYRef.current = null;
    setDragging(false);
    if (shouldRefresh) {
      void runRefresh();
      return;
    }
    setPull(0);
  }, [enabled, pull, refreshing, runRefresh]);

  useEffect(() => {
    if (!enabled) {
      setPull(0);
      startYRef.current = null;
    }
  }, [enabled]);

  const progress = Math.min(1, pull / PULL_THRESHOLD);
  const showPill = enabled && (pull > 8 || refreshing);

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        aria-hidden={!showPill}
        className={cn(
          "pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+10px)] z-40 flex justify-center transition-opacity duration-150",
          showPill ? "opacity-100" : "opacity-0",
        )}
        style={{
          transform: `translateY(${Math.max(0, pull * 0.35)}px)`,
        }}
      >
        <button
          type="button"
          aria-label="Refresh"
          disabled={!enabled || refreshing}
          onClick={() => void runRefresh()}
          className={cn(
            "pointer-events-auto flex h-10 items-center gap-2 rounded-full border border-[#ebe4f6] bg-white/95 px-3.5 font-display text-xs font-semibold text-arc-purple-600 shadow-[0_8px_24px_rgba(70,40,150,0.14)] backdrop-blur-xl",
            refreshing && "text-arc-purple-500",
          )}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            style={
              refreshing
                ? undefined
                : { transform: `rotate(${progress * 180}deg)` }
            }
            strokeWidth={2.4}
          />
          {refreshing ? "Refreshing…" : progress >= 1 ? "Release" : "Pull"}
        </button>
      </div>

      <div
        style={{
          transform:
            pull > 0 || refreshing
              ? `translateY(${Math.min(pull, PULL_THRESHOLD) * 0.25}px)`
              : undefined,
          transition: dragging ? undefined : "transform 180ms ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
