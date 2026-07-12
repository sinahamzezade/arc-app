import { ApiError } from "./errors";
import type { ApiErrorBody, AuthSessionResponse } from "./types";

/** Same-origin via Next rewrite → backend (keeps refresh cookie working). */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "/api/v1";

/** Refresh ~60s before access JWT expires. */
export const ACCESS_TOKEN_SKEW_MS = 60_000;

type RequestOptions = {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  /** Extra request headers (e.g. Idempotency-Key). */
  headers?: Record<string, string>;
  /** Skip one refresh retry (used by refresh itself). */
  skipRefresh?: boolean;
};

export type SessionPatch = {
  accessToken: string;
  expiresIn: number;
  profile?: AuthSessionResponse["profile"];
  user?: { emailVerified?: boolean };
};

type TokenHooks = {
  getAccessToken: () => string | null;
  /** Apply rotated access token (and optional profile) into Auth.js session. */
  applySession: (patch: SessionPatch) => void;
  /** Refresh cookie gone / invalid — clear local session. */
  onUnauthorized?: () => void;
};

let hooks: TokenHooks = {
  getAccessToken: () => null,
  applySession: () => undefined,
};

let refreshInFlight: Promise<AuthSessionResponse | null> | null = null;

export function bindAuthTokenHooks(next: TokenHooks) {
  hooks = next;
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return new ApiError({
      statusCode: body.statusCode ?? res.status,
      code: body.code ?? `HTTP_${res.status}`,
      message: body.message ?? res.statusText,
    });
  } catch {
    return new ApiError({
      statusCode: res.status,
      code: `HTTP_${res.status}`,
      message: res.statusText || "Request failed",
    });
  }
}

/**
 * POST /auth/refresh with httpOnly `refresh_token` cookie.
 * Rotates refresh cookie + returns new access token. Single-flight.
 * Does not call onUnauthorized when cookie simply absent (avoids sign-out
 * storms before login has persisted the cookie).
 */
export async function refreshAccessToken(): Promise<AuthSessionResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: "{}",
      });

      if (!res.ok) {
        // Only hard-logout when a refresh token existed but is now invalid.
        const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
        if (body?.message !== "Refresh token missing") {
          hooks.onUnauthorized?.();
        }
        return null;
      }

      const data = (await res.json()) as AuthSessionResponse;
      if (!data.accessToken) {
        hooks.onUnauthorized?.();
        return null;
      }

      hooks.applySession({
        accessToken: data.accessToken,
        expiresIn: data.expiresIn ?? 900,
        profile: data.profile,
        user: { emailVerified: data.user?.emailVerified },
      });

      return data;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = options.accessToken ?? hooks.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const isAuthBootstrap =
    path.includes("/auth/login") ||
    path.includes("/auth/register") ||
    path.includes("/auth/refresh") ||
    path.includes("/auth/google") ||
    path.includes("/auth/apple");

  if (res.status === 401 && !options.skipRefresh && !isAuthBootstrap) {
    const next = await refreshAccessToken();
    if (next?.accessToken) {
      return apiFetch<T>(path, {
        ...options,
        accessToken: next.accessToken,
        skipRefresh: true,
      });
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
