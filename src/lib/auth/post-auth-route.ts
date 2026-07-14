import type { Profile, QuestionnaireStatus } from "@/lib/api/types";

export type PostAuthInput = {
  emailVerified?: boolean;
  email?: string | null;
  profile?: Profile | null;
  /** When false, skip email-verify gate (OTP flag off). Default true. */
  otpVerificationEnabled?: boolean;
};

/** True when intake questionnaire finished. Missing status = incomplete. */
export function isQuestionnaireComplete(
  profile?: Profile | null,
): boolean {
  return profile?.questionnaireStatus === ("completed" satisfies QuestionnaireStatus);
}

/**
 * Where to send user after login / when hitting app while incomplete.
 * Order: verify email → questionnaire → home.
 */
export function resolvePostAuthPath(input: PostAuthInput): string {
  const {
    emailVerified,
    email,
    profile,
    otpVerificationEnabled = true,
  } = input;

  const needsVerify = otpVerificationEnabled && !emailVerified;
  if (needsVerify) {
    if (email) {
      return `/verify-email?email=${encodeURIComponent(email)}&purpose=verify`;
    }
    return "/login";
  }

  if (!isQuestionnaireComplete(profile)) {
    return "/questionnaire";
  }

  return "/home";
}

export function isAuthPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  // Referral landing — keep out of prefix list (`/r` would match `/rank` etc.)
  if (pathname === "/r" || pathname.startsWith("/r/")) return true;
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

/** Intake funnel — allowed while questionnaire incomplete. */
export function isOnboardingFunnelPath(pathname: string): boolean {
  return (
    pathname === "/questionnaire" ||
    pathname.startsWith("/questionnaire/") ||
    pathname === "/intake/chat" ||
    pathname.startsWith("/intake/")
  );
}
