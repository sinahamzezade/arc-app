import "server-only";

import { backendApiBase } from "@/lib/auth/backend";

const SERVER_FETCH_TIMEOUT_MS = 3_000;

/**
 * Authenticated backend read for Server Components.
 * Never caches personalized responses and never serializes the access token.
 */
export async function serverApiFetch<T>(
  path: string,
  accessToken: string,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${backendApiBase()}${normalizedPath}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
  });

  const body = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : `Backend request failed (${response.status})`;
    throw new Error(message);
  }

  if (body == null) {
    throw new Error("Backend returned an empty response");
  }

  return body;
}

/** Preserve existing client loading/error behavior when server prefetch fails. */
export async function tryServerApiFetch<T>(
  path: string,
  accessToken: string,
): Promise<T | undefined> {
  try {
    return await serverApiFetch<T>(path, accessToken);
  } catch {
    return undefined;
  }
}
