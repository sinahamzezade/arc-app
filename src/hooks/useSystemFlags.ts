"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  systemFlagsApi,
  type PublicSystemFlags,
} from "@/lib/api/system-flags";

const DEFAULTS: PublicSystemFlags = {
  otp_verification_enabled: true,
  intake_chat_enabled: true,
  intake_default_mode: "form",
  arlo_ai_enabled: true,
  sso_enabled: true,
  avatar_studio_enabled: true,
};

/**
 * Public feature flags for client UI.
 * Logged-in → /system/flags/me (per-user overrides).
 * Guest → /system/flags (system defaults).
 */
export function useSystemFlags() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken ?? null;
  const authed = status === "authenticated" && Boolean(accessToken);

  const query = useQuery({
    queryKey: ["system", "flags", authed ? accessToken : "anon"],
    queryFn: () =>
      authed
        ? systemFlagsApi.getMine(accessToken)
        : systemFlagsApi.getPublic(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: status !== "loading",
  });

  const flags = query.data ?? DEFAULTS;

  return {
    flags,
    isLoading: query.isLoading || status === "loading",
    isError: query.isError,
    refetch: query.refetch,
  };
}
