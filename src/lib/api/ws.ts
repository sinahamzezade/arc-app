/** Direct Nest origin for Socket.IO (not proxied through Next). */
export function getWsBase(): string {
  const explicit =
    process.env.NEXT_PUBLIC_WS_BASE?.trim() ||
    process.env.NEXT_PUBLIC_API_PROXY_ORIGIN?.trim();

  if (explicit) {
    return explicit.replace(/\/$/, "").replace(/\/api\/v1\/?$/, "");
  }

  // Dev/LAN: Nest listens on :9000 on the same host the app is opened from.
  // Do NOT use NEXT_PUBLIC_API_URL — that is the Next app origin, not Socket.IO.
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return `${protocol}//${hostname}:9000`;
    }
  }

  return "http://localhost:9000";
}
