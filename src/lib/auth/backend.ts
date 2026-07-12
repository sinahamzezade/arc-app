import type { AuthUser, Profile } from "@/lib/api/types";

/**
 * Absolute backend origin for server-side Auth.js authorize() calls.
 * Browser still uses Next rewrite `/api/v1` → same host.
 */
export function backendApiBase(): string {
  const origin = (
    process.env.API_PROXY_ORIGIN ||
    process.env.AUTH_BACKEND_URL ||
    "http://localhost:9000"
  ).replace(/\/$/, "");
  return `${origin}/api/v1`;
}

export type ArcAuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  accessToken: string;
  expiresIn: number;
  profile: Profile;
};

export async function loginAgainstBackend(
  email: string,
  password: string,
): Promise<ArcAuthUser> {
  const res = await fetch(`${backendApiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseAuthResponse(res);
}

export async function registerAgainstBackend(input: {
  name: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}): Promise<ArcAuthUser> {
  const res = await fetch(`${backendApiBase()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseAuthResponse(res);
}

export async function oauthAgainstBackend(
  provider: "google" | "apple",
  idToken: string,
): Promise<ArcAuthUser> {
  const res = await fetch(`${backendApiBase()}/auth/${provider}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ idToken }),
  });
  return parseAuthResponse(res);
}

export async function logoutAgainstBackend(accessToken?: string | null) {
  try {
    await fetch(`${backendApiBase()}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: "{}",
    });
  } catch {
    /* ignore */
  }
}

async function parseAuthResponse(res: Response): Promise<ArcAuthUser> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data as { message?: string }).message || "Authentication failed",
    ) as Error & { code?: string; statusCode?: number };
    err.code = (data as { code?: string }).code;
    err.statusCode = (data as { statusCode?: number }).statusCode ?? res.status;
    throw err;
  }

  const body = data as {
    user: AuthUser;
    profile: Profile;
    accessToken: string;
    expiresIn: number;
  };

  return {
    id: body.user.id,
    email: body.user.email,
    emailVerified: body.user.emailVerified,
    accessToken: body.accessToken,
    expiresIn: body.expiresIn,
    profile: body.profile,
  };
}
