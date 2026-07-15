/**
 * Socket.IO connection config for the Study namespace.
 *
 * Socket.IO does NOT go through the Next `/api/v1` rewrite — it talks to Nest
 * directly. Resolution order:
 *   1. NEXT_PUBLIC_WS_BASE / NEXT_PUBLIC_API_PROXY_ORIGIN (explicit)
 *   2. Dev/LAN: same host on :9000 (Nest dev port)
 *   3. Production: same origin (assumes reverse proxy forwards /socket.io → Nest)
 *
 * http→ws and https→wss is handled automatically by socket.io-client from the
 * URL scheme, so always pass an http(s) origin here.
 */
export function getWsBase(): string {
  const explicit =
    process.env.NEXT_PUBLIC_WS_BASE?.trim() ||
    process.env.NEXT_PUBLIC_API_PROXY_ORIGIN?.trim();

  if (explicit) {
    return explicit.replace(/\/$/, "").replace(/\/api\/v1\/?$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname, origin } = window.location;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    // Dev / LAN: Nest listens on :9000 on the same host the app is opened from.
    if (isLocal) return `${protocol}//${hostname}:9000`;

    // Production: assume Socket.IO is reverse-proxied on the same origin.
    return origin;
  }

  return "http://localhost:9000";
}

/**
 * Socket.IO handshake path. Default `/socket.io`. Override when Nest sits
 * behind a reverse proxy subpath (must match backend WS_PATH).
 */
export function getWsPath(): string {
  const raw = process.env.NEXT_PUBLIC_WS_PATH?.trim();
  return raw && raw.length > 0 ? raw : "/socket.io";
}
