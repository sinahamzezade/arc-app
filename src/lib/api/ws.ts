/** Direct Nest origin for Socket.IO (not proxied through Next). */
export function getWsBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_WS_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_PROXY_ORIGIN ||
    "http://localhost:9000";
  return raw.replace(/\/$/, "");
}
