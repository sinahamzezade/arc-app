import { chatApi } from "@/lib/api/chat";
import { isE2eEnvelope, toBase64Url } from "./codec";
import {
  listConversationKeys,
  saveConversationKey,
} from "./conv-keystore";
import {
  decryptBlob,
  decryptMessage,
  encryptBlob,
  encryptMessage,
  generateConversationKey,
  openConversationKey,
  sealConversationKey,
  type IdentityKeyPair,
} from "./crypto";
import { loadOrCreateIdentity } from "./keystore";

export class E2eNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "E2eNotReadyError";
  }
}

type ConvSession = {
  key: Uint8Array;
  epoch: number;
  /** Fingerprint of server wrap — busts stale local cache after rekey. */
  wrapFp: string;
};

const convCache = new Map<string, ConvSession>();
const inflight = new Map<string, Promise<ConvSession>>();
let publishedForUser: { userId: string; publicKeyB64: string } | null = null;
let activeUserId: string | null = null;

/** Read `sub` from JWT access token (no verify — already authed). */
function userIdFromAccessToken(token?: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const pad = part.length % 4 === 0 ? "" : "=".repeat(4 - (part.length % 4));
    const b64 = (part + pad).replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function resolveUserId(
  userId?: string | null,
  accessToken?: string | null,
): string | null {
  return userId || activeUserId || userIdFromAccessToken(accessToken);
}

function wrapFingerprint(wrappedKey: string): string {
  return wrappedKey;
}

function copyKey(key: Uint8Array): Uint8Array {
  return new Uint8Array(key);
}

async function rememberSession(
  userId: string,
  conversationId: string,
  session: ConvSession,
): Promise<ConvSession> {
  convCache.set(conversationId, session);
  await saveConversationKey(
    userId,
    conversationId,
    session.epoch,
    session.key,
  ).catch(() => undefined);
  return session;
}

export function setE2eUserId(userId: string | null): void {
  if (activeUserId && userId && activeUserId !== userId) {
    convCache.clear();
    inflight.clear();
    publishedForUser = null;
  }
  activeUserId = userId;
}

export async function ensureIdentityPublished(
  accessToken?: string | null,
  userId?: string | null,
): Promise<IdentityKeyPair> {
  const uid = resolveUserId(userId, accessToken);
  if (!uid) {
    throw new E2eNotReadyError("Not signed in for secure chat");
  }
  setE2eUserId(uid);
  const identity = await loadOrCreateIdentity(uid);
  if (
    publishedForUser?.userId === uid &&
    publishedForUser.publicKeyB64 === identity.publicKeyB64
  ) {
    return identity;
  }

  // Prefer existing server key when it matches local — avoids wipe storms.
  try {
    const { keys } = await chatApi.getPublicKeys([uid], accessToken);
    const serverKey = keys.find((k) => k.userId === uid)?.publicKey;
    if (serverKey && serverKey === identity.publicKeyB64) {
      publishedForUser = { userId: uid, publicKeyB64: identity.publicKeyB64 };
      return identity;
    }
  } catch {
    /* publish below */
  }

  await chatApi.putMyPublicKey(identity.publicKeyB64, accessToken);
  publishedForUser = { userId: uid, publicKeyB64: identity.publicKeyB64 };
  return identity;
}

async function openOrThrow(
  wrappedKey: string,
  identity: IdentityKeyPair,
): Promise<Uint8Array> {
  const key = await openConversationKey(wrappedKey, identity);
  if (!key) {
    throw new E2eNotReadyError(
      "Could not open conversation key on this device",
    );
  }
  return copyKey(key);
}

async function createWraps(
  conversationId: string,
  memberIds: string[],
  accessToken?: string | null,
  epoch = 1,
  existingKey?: Uint8Array,
): Promise<ConvSession> {
  const identity = await ensureIdentityPublished(accessToken);
  const uid = resolveUserId(null, accessToken);
  if (!uid) throw new E2eNotReadyError("Not signed in for secure chat");

  const { keys } = await chatApi.getPublicKeys(memberIds, accessToken);
  const byUser = new Map(keys.map((k) => [k.userId, k.publicKey]));
  const missing = memberIds.filter((id) => !byUser.has(id));
  if (missing.length) {
    throw new E2eNotReadyError("Peer has not enabled secure chat yet");
  }

  const conversationKey = existingKey
    ? copyKey(existingKey)
    : await generateConversationKey();
  const wraps = await Promise.all(
    memberIds.map(async (id) => ({
      userId: id,
      wrappedKey: await sealConversationKey(conversationKey, byUser.get(id)!),
    })),
  );
  await chatApi.putKeyWraps(conversationId, { epoch, wraps }, accessToken);

  const refreshed = await chatApi.getKeyWraps(conversationId, accessToken);
  if (!refreshed.wrappedKey || refreshed.epoch == null) {
    throw new E2eNotReadyError("Conversation key wrap missing after setup");
  }
  const key = await openOrThrow(refreshed.wrappedKey, identity);
  return rememberSession(uid, conversationId, {
    key,
    epoch: refreshed.epoch,
    wrapFp: wrapFingerprint(refreshed.wrappedKey),
  });
}

/**
 * Resolve the active conversation key for encrypt/decrypt.
 * Never wipes wraps during a read-only open — that destroyed history on reopen.
 */
async function ensureConversationReadyInner(
  conversationId: string,
  accessToken?: string | null,
  opts: { allowCreate: boolean; allowReset: boolean } = {
    allowCreate: true,
    allowReset: false,
  },
): Promise<ConvSession> {
  const identity = await ensureIdentityPublished(accessToken);
  const uid = resolveUserId(null, accessToken);
  if (!uid) throw new E2eNotReadyError("Not signed in for secure chat");

  const wrapInfo = await chatApi.getKeyWraps(conversationId, accessToken);

  const cached = convCache.get(conversationId);
  if (
    cached &&
    wrapInfo.wrappedKey &&
    cached.wrapFp === wrapFingerprint(wrapInfo.wrappedKey)
  ) {
    return cached;
  }

  if (wrapInfo.wrappedKey && wrapInfo.epoch != null) {
    try {
      const key = await openOrThrow(wrapInfo.wrappedKey, identity);
      return rememberSession(uid, conversationId, {
        key,
        epoch: wrapInfo.epoch,
        wrapFp: wrapFingerprint(wrapInfo.wrappedKey),
      });
    } catch (err) {
      // Prefer locally persisted key (survives wrap/identity churn) over wipe.
      const local = await listConversationKeys(uid, conversationId);
      if (local[0] && !opts.allowReset) {
        return rememberSession(uid, conversationId, {
          key: copyKey(local[0].key),
          epoch: local[0].epoch,
          wrapFp: wrapFingerprint(wrapInfo.wrappedKey),
        });
      }
      if (!opts.allowReset) throw err;
      convCache.delete(conversationId);
      await chatApi.resetKeyWraps(conversationId, accessToken);
      // Re-wrap the known local key when possible so history stays readable.
      return createWraps(
        conversationId,
        wrapInfo.memberIds,
        accessToken,
        (wrapInfo.epoch ?? 0) + 1,
        local[0]?.key,
      );
    }
  }

  // Local history keys — decrypt/send without waiting for wraps.
  const localKeys = await listConversationKeys(uid, conversationId);
  if (localKeys[0] && !opts.allowCreate) {
    return rememberSession(uid, conversationId, {
      key: copyKey(localKeys[0].key),
      epoch: localKeys[0].epoch,
      wrapFp: wrapInfo.wrappedKey
        ? wrapFingerprint(wrapInfo.wrappedKey)
        : `local:${localKeys[0].epoch}`,
    });
  }

  if (wrapInfo.hasWraps && !wrapInfo.wrappedKey) {
    if (localKeys[0]) {
      return rememberSession(uid, conversationId, {
        key: copyKey(localKeys[0].key),
        epoch: localKeys[0].epoch,
        wrapFp: `local:${localKeys[0].epoch}`,
      });
    }
    if (!opts.allowReset) {
      throw new E2eNotReadyError(
        "Secure chat keys exist but this device is not wrapped yet",
      );
    }
    await chatApi.resetKeyWraps(conversationId, accessToken);
    return createWraps(
      conversationId,
      wrapInfo.memberIds,
      accessToken,
      1,
    );
  }

  if (!wrapInfo.memberIds.length) {
    throw new E2eNotReadyError("No conversation members");
  }

  if (!opts.allowCreate) {
    if (localKeys[0]) {
      return rememberSession(uid, conversationId, {
        key: copyKey(localKeys[0].key),
        epoch: localKeys[0].epoch,
        wrapFp: `local:${localKeys[0].epoch}`,
      });
    }
    throw new E2eNotReadyError("Conversation key not ready");
  }

  // Dual-bootstrap guard: another client may have just written wraps.
  if (!wrapInfo.hasWraps) {
    await new Promise((r) => setTimeout(r, 40 + Math.floor(Math.random() * 80)));
    const again = await chatApi.getKeyWraps(conversationId, accessToken);
    if (again.wrappedKey && again.epoch != null) {
      const key = await openOrThrow(again.wrappedKey, identity);
      return rememberSession(uid, conversationId, {
        key,
        epoch: again.epoch,
        wrapFp: wrapFingerprint(again.wrappedKey),
      });
    }
    if (again.hasWraps && !again.wrappedKey) {
      throw new E2eNotReadyError(
        "Secure chat keys exist but this device is not wrapped yet",
      );
    }
  }

  return createWraps(conversationId, wrapInfo.memberIds, accessToken, 1);
}

export async function ensureConversationReady(
  conversationId: string,
  accessToken?: string | null,
): Promise<ConvSession> {
  const existing = inflight.get(conversationId);
  if (existing) return existing;

  const pending = ensureConversationReadyInner(conversationId, accessToken, {
    allowCreate: true,
    // Only send path may reset — decrypt must never wipe history.
    allowReset: true,
  })
    .finally(() => {
      inflight.delete(conversationId);
    });
  inflight.set(conversationId, pending);
  return pending;
}

async function ensureConversationForDecrypt(
  conversationId: string,
  accessToken?: string | null,
): Promise<ConvSession | null> {
  try {
    const existing = inflight.get(conversationId);
    if (existing) return existing;
    const pending = ensureConversationReadyInner(conversationId, accessToken, {
      allowCreate: false,
      allowReset: false,
    }).finally(() => {
      inflight.delete(conversationId);
    });
    inflight.set(conversationId, pending);
    return await pending;
  } catch {
    const uid = resolveUserId(null, accessToken);
    if (!uid) return null;
    const local = await listConversationKeys(uid, conversationId);
    if (!local[0]) return null;
    const session = {
      key: copyKey(local[0].key),
      epoch: local[0].epoch,
      wrapFp: `local:${local[0].epoch}`,
    };
    convCache.set(conversationId, session);
    return session;
  }
}

/** After adding group members — re-seal current key for newcomers. */
export async function rewrapConversationKeys(
  conversationId: string,
  accessToken?: string | null,
): Promise<void> {
  const identity = await ensureIdentityPublished(accessToken);
  const uid = resolveUserId(null, accessToken);
  if (!uid) throw new E2eNotReadyError("Not signed in for secure chat");

  const wrapInfo = await chatApi.getKeyWraps(conversationId, accessToken);
  let session = convCache.get(conversationId);

  if (
    !session ||
    !wrapInfo.wrappedKey ||
    session.wrapFp !== wrapFingerprint(wrapInfo.wrappedKey)
  ) {
    if (!wrapInfo.wrappedKey || wrapInfo.epoch == null) {
      return;
    }
    const key = await openOrThrow(wrapInfo.wrappedKey, identity);
    session = await rememberSession(uid, conversationId, {
      key,
      epoch: wrapInfo.epoch,
      wrapFp: wrapFingerprint(wrapInfo.wrappedKey),
    });
  }

  const memberIds = wrapInfo.memberIds;
  const { keys } = await chatApi.getPublicKeys(memberIds, accessToken);
  const byUser = new Map(keys.map((k) => [k.userId, k.publicKey]));
  const missing = memberIds.filter((id) => !byUser.has(id));
  if (missing.length) {
    throw new E2eNotReadyError("New member has not enabled secure chat yet");
  }

  const wraps = await Promise.all(
    memberIds.map(async (id) => ({
      userId: id,
      wrappedKey: await sealConversationKey(session!.key, byUser.get(id)!),
    })),
  );
  await chatApi.putKeyWraps(
    conversationId,
    { epoch: session.epoch, wraps },
    accessToken,
  );
}

export async function encryptOutgoingBody(
  conversationId: string,
  plaintext: string,
  accessToken?: string | null,
): Promise<string> {
  const session = await ensureConversationReady(conversationId, accessToken);
  return encryptMessage(plaintext, session.key);
}

export async function encryptOutgoingBlob(
  conversationId: string,
  bytes: Uint8Array,
  accessToken?: string | null,
): Promise<Uint8Array> {
  const session = await ensureConversationReady(conversationId, accessToken);
  return encryptBlob(bytes, session.key);
}

export async function decryptIncomingBody(
  conversationId: string,
  body: string | null,
  accessToken?: string | null,
): Promise<string | null> {
  if (body == null) return null;
  if (!isE2eEnvelope(body)) return body;

  const uid = resolveUserId(null, accessToken);
  const tried = new Set<string>();

  const tryKey = async (key: Uint8Array): Promise<string | null> => {
    const fp = toBase64Url(key);
    if (tried.has(fp)) return null;
    tried.add(fp);
    return decryptMessage(body, key);
  };

  // 1) Current session / server wrap (no wipe on failure).
  const session = await ensureConversationForDecrypt(
    conversationId,
    accessToken,
  );
  if (session) {
    const plain = await tryKey(session.key);
    if (plain != null) return plain;
  }

  // 2) Every locally persisted epoch for this conversation.
  if (uid) {
    const locals = await listConversationKeys(uid, conversationId);
    for (const row of locals) {
      const plain = await tryKey(row.key);
      if (plain != null) {
        convCache.set(conversationId, {
          key: copyKey(row.key),
          epoch: row.epoch,
          wrapFp: session?.wrapFp ?? `local:${row.epoch}`,
        });
        return plain;
      }
    }
  }

  return "🔒 Unable to decrypt";
}

export async function decryptIncomingBlob(
  conversationId: string,
  data: Uint8Array,
  accessToken?: string | null,
): Promise<Uint8Array> {
  const magic = new TextEncoder().encode("e2e:v1:");
  const isE2e =
    data.length > magic.length && magic.every((b, i) => data[i] === b);
  if (!isE2e) return data;

  const uid = resolveUserId(null, accessToken);
  const tried = new Set<string>();
  const tryKey = async (key: Uint8Array): Promise<Uint8Array | null> => {
    const fp = toBase64Url(key);
    if (tried.has(fp)) return null;
    tried.add(fp);
    return decryptBlob(data, key);
  };

  const session = await ensureConversationForDecrypt(
    conversationId,
    accessToken,
  );
  if (session) {
    const plain = await tryKey(session.key);
    if (plain) return plain;
  }

  if (uid) {
    const locals = await listConversationKeys(uid, conversationId);
    for (const row of locals) {
      const plain = await tryKey(row.key);
      if (plain) return plain;
    }
  }

  throw new E2eNotReadyError("Could not decrypt attachment");
}

export function clearConversationKeyCache(conversationId?: string): void {
  if (conversationId) {
    convCache.delete(conversationId);
    inflight.delete(conversationId);
  } else {
    convCache.clear();
    inflight.clear();
  }
}

export function resetE2ePublishState(): void {
  publishedForUser = null;
}
