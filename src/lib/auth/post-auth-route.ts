import type { Profile, QuestionnaireStatus } from "@/lib/api/types";

export type PostAuthInput = {
  emailVerified?: boolean;
  email?: string | null;
  profile?: Profile | null;
};

/** True when intake questionnaire finished. Missing status = incomplete. */
export function isQuestionnaireComplete(
  profile?: Profile | null,
): boolean {
  return profile?.questionnaireStatus === ("completed" satisfies QuestionnaireStatus);
}

/** Role snapshot from /onboarding form. */
export function hasOnboardingRoles(profile?: Profile | null): boolean {
  return Boolean(
    profile?.currentRole?.trim() && profile?.targetRole?.trim(),
  );
}

/**
 * Where to send user after login / when hitting app while incomplete.
 * Order: verify email → onboarding roles → questionnaire → home.
 */
export function resolvePostAuthPath(input: PostAuthInput): string {
  const { emailVerified, email, profile } = input;

  if (!emailVerified) {
    if (email) {
      return `/verify-email?email=${encodeURIComponent(email)}&purpose=verify`;
    }
    return "/login";
  }

  if (!hasOnboardingRoles(profile)) {
    return "/onboarding";
  }

  if (!isQuestionnaireComplete(profile)) {
    return "/questionnaire";
  }

  return "/home";
}

export function isAuthPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const prefixes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/terms",
    "/privacy",
    "/api/",
    "/manifest.json",
    "/sw.js",
  ];
  if (pathname === "/manifest.json" || pathname === "/sw.js") return true;
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p),
  );
}

/** Onboarding funnel — allowed while questionnaire incomplete. */
export function isOnboardingFunnelPath(pathname: string): boolean {
  return (
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/questionnaire" ||
    pathname.startsWith("/questionnaire/")
  );
}
