"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { authApi } from "@/lib/api/auth";
import { ApiError, messageForCode } from "@/lib/api/errors";
import type { AuthSessionResponse } from "@/lib/api/types";

/** Ensure httpOnly refresh_token cookie on Next origin (path /api/v1/auth). */
async function persistRefreshCookie(data: AuthSessionResponse) {
  if (!data.refreshToken) return;
  try {
    await fetch("/api/auth/persist-refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: data.refreshToken,
        // Cookie max-age in seconds — refresh TTL, not access TTL.
        expiresIn: 30 * 24 * 60 * 60,
      }),
    });
  } catch {
    /* cookie may already be set via Set-Cookie from /api/v1 proxy */
  }
}

async function bridgeIntoSession(data: AuthSessionResponse) {
  await persistRefreshCookie(data);

  const result = await signIn("arc-bridge", {
    id: data.user.id,
    email: data.user.email,
    emailVerified: String(data.user.emailVerified),
    accessToken: data.accessToken,
    expiresIn: String(data.expiresIn),
    profile: JSON.stringify(data.profile ?? null),
    redirect: false,
  });

  if (result?.error) {
    throw Object.assign(new Error(result.error), {
      code: result.code || "INVALID_CREDENTIALS",
    });
  }
}

function rethrowAuth(err: unknown): never {
  if (err instanceof ApiError) {
    throw Object.assign(new Error(err.message), { code: err.code });
  }
  throw err;
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}) {
  try {
    const data = await authApi.login(input);
    await bridgeIntoSession(data);
  } catch (err) {
    rethrowAuth(err);
  }
}

export async function signUpWithPassword(input: {
  name: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
  referralCode?: string;
}) {
  try {
    const data = await authApi.register(input);
    await bridgeIntoSession(data);
  } catch (err) {
    rethrowAuth(err);
  }
}

export async function signInWithOAuth(
  provider: "google" | "apple",
  idToken: string,
) {
  try {
    const data =
      provider === "google"
        ? await authApi.google(idToken)
        : await authApi.apple(idToken);
    await bridgeIntoSession(data);
  } catch (err) {
    rethrowAuth(err);
  }
}

export async function signOutArc() {
  try {
    await authApi.logout();
  } catch {
    /* ignore */
  }
  try {
    await fetch("/api/auth/persist-refresh", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    /* ignore */
  }
  await signOut({ redirect: false });
}

export function useArcSession() {
  return useSession();
}

export function authErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "code" in err) {
    return messageForCode(String((err as { code: string }).code), fallback);
  }
  if (err instanceof Error && err.message) {
    return messageForCode(err.message, fallback);
  }
  return fallback;
}
