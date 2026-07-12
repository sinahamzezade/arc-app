import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  isAuthPublicPath,
  isOnboardingFunnelPath,
  isQuestionnaireComplete,
  hasOnboardingRoles,
  resolvePostAuthPath,
} from "@/lib/auth/post-auth-route";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const loggedIn = Boolean(session?.user?.id);

  if (isAuthPublicPath(pathname)) {
    if (
      loggedIn &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/")
    ) {
      const dest = resolvePostAuthPath({
        emailVerified: Boolean(
          (session?.user as { emailVerified?: boolean } | undefined)
            ?.emailVerified,
        ),
        email: session?.user?.email,
        profile: session?.profile,
      });
      if (dest !== pathname) {
        return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
      }
    }
    return NextResponse.next();
  }

  if (!loggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const emailVerified = Boolean(
    (session?.user as { emailVerified?: boolean } | undefined)?.emailVerified,
  );
  const profile = session?.profile ?? null;

  if (!emailVerified && !pathname.startsWith("/verify-email")) {
    const email = session?.user?.email;
    if (email) {
      return NextResponse.redirect(
        new URL(
          `/verify-email?email=${encodeURIComponent(email)}&purpose=verify`,
          req.nextUrl.origin,
        ),
      );
    }
  }

  if (
    emailVerified &&
    !hasOnboardingRoles(profile) &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/questionnaire")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  if (
    emailVerified &&
    hasOnboardingRoles(profile) &&
    !isQuestionnaireComplete(profile) &&
    !isOnboardingFunnelPath(pathname)
  ) {
    return NextResponse.redirect(new URL("/questionnaire", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
