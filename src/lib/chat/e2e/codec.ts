export const E2E_PREFIX = "e2e:v1:";

export function isE2eEnvelope(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(E2E_PREFIX);
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeEnvelope(nonceAndCipher: Uint8Array): string {
  return E2E_PREFIX + toBase64Url(nonceAndCipher);
}

export function decodeEnvelope(envelope: string): Uint8Array | null {
  if (!isE2eEnvelope(envelope)) return null;
  try {
    return fromBase64Url(envelope.slice(E2E_PREFIX.length));
  } catch {
    return null;
  }
}
