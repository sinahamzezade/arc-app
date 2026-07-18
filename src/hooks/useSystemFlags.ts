"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  systemFlagsApi,
  type PublicSystemFlags,
} from "@/lib/api/system-flags";
import { ARLO_LESSON_TYPES_DEFAULT } from "@/lib/lesson/arlo-visibility";

const DEFAULTS: PublicSystemFlags = {
  otp_verification_enabled: true,
  intake_chat_enabled: true,
  intake_default_mode: "form",
  arlo_ai_enabled: true,
  arlo_ai_lesson_types: ARLO_LESSON_TYPES_DEFAULT,
  // Fail closed — never flash SSO before public flags resolve.
  sso_enabled: false,
  avatar_studio_enabled: true,
  // Fail closed — hide call chrome until flags resolve true.
  video_call_enabled: false,
  voice_call_enabled: false,
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
    // Key on user, not token — token rotation must not reset this query
    // to loading (gates full-screen shells on lesson routes).
    queryKey: ["system", "flags", authed ? (session?.user?.id ?? "me") : "anon"],
    queryFn: () =>
      authed
        ? systemFlagsApi.getMine(accessToken)
        : systemFlagsApi.getPublic(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: status !== "loading",
    // Keep guest flags while anon→me key flips after login (avoids SSO flash).
    placeholderData: keepPreviousData,
  });

  const flags: PublicSystemFlags = { ...DEFAULTS, ...query.data };

  return {
    flags,
    isLoading: query.isLoading || status === "loading",
    isError: query.isError,
    refetch: query.refetch,
  };
}
