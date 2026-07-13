/**
 * Rewrite backend referral absolute URLs onto the public app origin.
 * Prefer NEXT_PUBLIC_APP_URL, then NEXT_PUBLIC_API_URL (legacy), then window origin.
 */
export function publicAppBase(): string {
  const configured = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function toPublicReferralUrl(backendUrl: string): string {
  try {
    const parsed = new URL(backendUrl);
    const base = publicAppBase();
    if (!base) return backendUrl;
    return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return backendUrl;
  }
}
