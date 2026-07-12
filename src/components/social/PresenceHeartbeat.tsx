"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { socialApi } from "@/lib/api/social";

const HEARTBEAT_MS = 60_000;

/**
 * Keeps Redis/memory presence alive while the app is open.
 * Doc: heartbeat every ~60s · server TTL 120s.
 */
export function PresenceHeartbeat() {
  const { status } = useSession();
  const authed = status === "authenticated";

  useEffect(() => {
    if (!authed) return;

    const beat = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void socialApi.heartbeat().catch(() => undefined);
    };

    beat();
    const id = setInterval(beat, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [authed]);

  return null;
}
