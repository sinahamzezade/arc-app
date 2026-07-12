"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import {
  ACCESS_TOKEN_SKEW_MS,
  bindAuthTokenHooks,
  refreshAccessToken,
} from "@/lib/api/client";
import { meApi } from "@/lib/api/auth";
import { useEconomyStore } from "@/store/useEconomyStore";

function hasRewards(
  profile: { totalXp?: number; gems?: number; coins?: number } | null | undefined,
) {
  return (
    profile != null &&
    typeof profile.totalXp === "number" &&
    typeof profile.gems === "number" &&
    typeof profile.coins === "number"
  );
}

function EconomyBridge() {
  const { data, status, update } = useSession();
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      useEconomyStore.getState().reset();
      fetchingRef.current = false;
      return;
    }

    if (status !== "authenticated") return;

    const profile = data?.profile;
    if (hasRewards(profile)) {
      useEconomyStore.getState().hydrateFromProfile(profile!);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    void meApi
      .get()
      .then((res) => {
        useEconomyStore.getState().hydrateFromProfile(res.profile);
        void update({ profile: res.profile });
      })
      .catch(() => {
        fetchingRef.current = false;
      });
  }, [
    status,
    data?.profile?.totalXp,
    data?.profile?.gems,
    data?.profile?.coins,
    update,
  ]);

  return null;
}

function TokenBridge({ children }: { children: React.ReactNode }) {
  const { data, status, update } = useSession();
  const tokenRef = useRef<string | null>(data?.accessToken ?? null);
  const expiresRef = useRef<number | null>(data?.accessTokenExpires ?? null);

  tokenRef.current = data?.accessToken ?? null;
  expiresRef.current = data?.accessTokenExpires ?? null;

  useEffect(() => {
    bindAuthTokenHooks({
      getAccessToken: () => tokenRef.current,
      applySession: (patch) => {
        tokenRef.current = patch.accessToken;
        expiresRef.current =
          Date.now() + (patch.expiresIn || 900) * 1000;
        void update({
          accessToken: patch.accessToken,
          expiresIn: patch.expiresIn,
          profile: patch.profile,
          user: patch.user,
        });
        if (hasRewards(patch.profile)) {
          useEconomyStore.getState().hydrateFromProfile(patch.profile!);
        }
      },
      onUnauthorized: () => {
        tokenRef.current = null;
        expiresRef.current = null;
        useEconomyStore.getState().reset();
        void signOut({ redirect: false });
      },
    });
  }, [update]);

  // Proactive rotate before access JWT dies (cookie → /auth/refresh).
  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const expires = expiresRef.current;
      if (!expires) return;

      const wait = Math.max(0, expires - Date.now() - ACCESS_TOKEN_SKEW_MS);

      timer = setTimeout(async () => {
        if (cancelled) return;
        const next = await refreshAccessToken();
        if (!cancelled && next) schedule();
      }, wait);
    };

    // Already stale / near expiry → refresh now.
    const expires = expiresRef.current;
    if (expires && Date.now() >= expires - ACCESS_TOKEN_SKEW_MS) {
      void refreshAccessToken().then((next) => {
        if (!cancelled && next) schedule();
      });
    } else {
      schedule();
    }

    const onFocus = () => {
      const exp = expiresRef.current;
      if (exp && Date.now() >= exp - ACCESS_TOKEN_SKEW_MS) {
        void refreshAccessToken();
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, data?.accessTokenExpires]);

  return (
    <>
      <EconomyBridge />
      {children}
    </>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <TokenBridge>{children}</TokenBridge>
    </SessionProvider>
  );
}
