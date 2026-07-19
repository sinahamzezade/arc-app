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

/** True when local identity PK ≠ server `chat_user_keys` (new device / cleared IDB). */
export class E2eIdentityMismatchError extends E2eNotReadyError {
  readonly code = "IDENTITY_MISMATCH" as const;
  constructor(
    message = "This device can’t read older messages. Reset keys to chat again.",
  ) {
    super(message);
    this.name = "E2eIdentityMismatchError";
  }
}

export const E2E_UNABLE_TO_DECRYPT = "🔒 Unable to decrypt";
/** Softer inbox preview when ciphertext can’t open on this device. */
export const E2E_DEVICE_LOCKED_PREVIEW = "Encrypted — open chat to continue";

type ConvSession = {
  key: Uint8Array;
  epoch: number;
  /** Fingerprint of server wrap — only set after successful seal_open. */
  wrapFp: string;
};

type ReadyOpts = { allowCreate: boolean; allowReset: boolean };

const convCache = new Map<string, ConvSession>();
/** Send path (create/reset allowed) — must not share promises with decrypt. */
const inflightSend = new Map<string, Promise<ConvSession>>();
/** Decrypt path (read-only) — never awaits a wrap wipe. */
const inflightDecrypt = new Map<string, Promise<ConvSession>>();
let publishedForUser: { userId: string; publicKeyB64: string } | null = null;
let activeUserId: string | null = null;
let identityMismatch = false;

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

function inflightKey(conversationId: string, opts: ReadyOpts): string {
  return `${conversationId}:c${opts.allowCreate ? 1 : 0}:r${opts.allowReset ? 1 : 0}`;
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
    inflightSend.clear();
    inflightDecrypt.clear();
    publishedForUser = null;
    identityMismatch = false;
  }
  activeUserId = userId;
}

export function getE2eIdentityMismatch(): boolean {
  return identityMismatch;
}

export function isE2eDeviceMismatchMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    message === E2E_UNABLE_TO_DECRYPT ||
    message.includes("Unable to decrypt") ||
    message.includes("Could not open conversation key") ||
    message.includes("not wrapped yet") ||
    message.includes("can’t read older messages") ||
    message.includes("can't read older messages")
  );
}

export async function ensureIdentityPublished(
  accessToken?: string | null,
  userId?: string | null,
  opts?: { force?: boolean },
): Promise<IdentityKeyPair> {
  const uid = resolveUserId(userId, accessToken);
  if (!uid) {
    throw new E2eNotReadyError("Not signed in for secure chat");
  }
  setE2eUserId(uid);
  const identity = await loadOrCreateIdentity(uid);

  // Always reconcile with server — never trust in-memory publish flag alone.
  try {
    const { keys } = await chatApi.getPublicKeys([uid], accessToken);
    const serverKey = keys.find((k) => k.userId === uid)?.publicKey;
    if (serverKey && serverKey === identity.publicKeyB64) {
      identityMismatch = false;
      publishedForUser = { userId: uid, publicKeyB64: identity.publicKeyB64 };
      return identity;
    }
    if (serverKey && serverKey !== identity.publicKeyB64) {
      identityMismatch = true;
      // Do not silently overwrite — old wraps stay sealed to serverKey.
      if (!opts?.force) {
        return identity;
      }
    }
  } catch {
    /* publish below */
  }

  await chatApi.putMyPublicKey(identity.publicKeyB64, accessToken);
  identityMismatch = false;
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

async function sealWrapsForMembers(
  conversationKey: Uint8Array,
  memberIds: string[],
  byUser: Map<string, string>,
): Promise<Array<{ userId: string; wrappedKey: string }>> {
  return Promise.all(
    memberIds.map(async (id) => ({
      userId: id,
      wrappedKey: await sealConversationKey(conversationKey, byUser.get(id)!),
    })),
  );
}

async function createWraps(
  conversationId: string,
  memberIds: string[],
  accessToken?: string | null,
  epoch = 1,
  existingKey?: Uint8Array,
): Promise<ConvSession> {
  const identity = await ensureIdentityPublished(accessToken, null, {
    force: true,
  });
  const uid = resolveUserId(null, accessToken);
  if (!uid) throw new E2eNotReadyError("Not signed in for secure chat");

  const { keys } = await chatApi.getPublicKeys(memberIds, accessToken);
  const byUser = new Map(keys.map((k) => [k.userId, k.publicKey]));
  // Self must seal to local identity — server row can lag another tab's publish.
  byUser.set(uid, identity.publicKeyB64);
  const missing = memberIds.filter((id) => !byUser.has(id));
  if (missing.length) {
    throw new E2eNotReadyError("Peer has not enabled secure chat yet");
  }

  const conversationKey = existingKey
    ? copyKey(existingKey)
    : await generateConversationKey();

  const tryPutAndOpen = async (
    keyEpoch: number,
  ): Promise<ConvSession | null> => {
    const wraps = await sealWrapsForMembers(conversationKey, memberIds, byUser);
    const put = await chatApi.putKeyWraps(
      conversationId,
      { epoch: keyEpoch, wraps },
      accessToken,
    );
    // Insert-only server: no-op means stale wrap still owns this epoch.
    if (typeof put.inserted === "number" && put.inserted === 0 && wraps.length > 0) {
      return null;
    }
    const refreshed = await chatApi.getKeyWraps(conversationId, accessToken);
    if (!refreshed.wrappedKey || refreshed.epoch == null) return null;
    const opened = await openConversationKey(refreshed.wrappedKey, identity);
    if (!opened) return null;
    return rememberSession(uid, conversationId, {
      key: copyKey(opened),
      epoch: refreshed.epoch,
      wrapFp: wrapFingerprint(refreshed.wrappedKey),
    });
  };

  const first = await tryPutAndOpen(epoch);
  if (first) return first;

  // Dual-bootstrap / stale wraps: wipe and republish once with same plaintext key.
  await chatApi.resetKeyWraps(conversationId, accessToken);
  const retry = await tryPutAndOpen(epoch);
  if (retry) return retry;

  throw new E2eNotReadyError(
    "Could not open conversation key on this device",
  );
}

/**
 * Resolve the active conversation key for encrypt/decrypt.
 * Never wipes wraps during a read-only open — that destroyed history on reopen.
 */
async function ensureConversationReadyInner(
  conversationId: string,
  accessToken: string | null | undefined,
  opts: ReadyOpts,
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
      // Never stamp failed wrap fingerprint — that poisons the session cache.
      const local = await listConversationKeys(uid, conversationId);
      if (local[0] && !opts.allowReset) {
        return rememberSession(uid, conversationId, {
          key: copyKey(local[0].key),
          epoch: local[0].epoch,
          wrapFp: `local:${local[0].epoch}`,
        });
      }
      if (!opts.allowReset) {
        if (identityMismatch) {
          throw new E2eIdentityMismatchError();
        }
        throw err;
      }
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
      wrapFp: `local:${localKeys[0].epoch}`,
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
      if (identityMismatch) {
        throw new E2eIdentityMismatchError();
      }
      throw new E2eNotReadyError(
        "Secure chat keys exist but this device is not wrapped yet",
      );
    }
    await chatApi.resetKeyWraps(conversationId, accessToken);
    return createWraps(conversationId, wrapInfo.memberIds, accessToken, 1);
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
    if (identityMismatch) {
      throw new E2eIdentityMismatchError();
    }
    throw new E2eNotReadyError("Conversation key not ready");
  }

  // Dual-bootstrap guard: another client may have just written wraps.
  if (!wrapInfo.hasWraps) {
    await new Promise((r) =>
      setTimeout(r, 40 + Math.floor(Math.random() * 80)),
    );
    const again = await chatApi.getKeyWraps(conversationId, accessToken);
    if (again.wrappedKey && again.epoch != null) {
      const opened = await openConversationKey(again.wrappedKey, identity);
      if (opened) {
        return rememberSession(uid, conversationId, {
          key: copyKey(opened),
          epoch: again.epoch,
          wrapFp: wrapFingerprint(again.wrappedKey),
        });
      }
      // Peer sealed to a stale identity — fall through to create/reset.
      if (opts.allowReset) {
        await chatApi.resetKeyWraps(conversationId, accessToken);
        return createWraps(
          conversationId,
          again.memberIds.length ? again.memberIds : wrapInfo.memberIds,
          accessToken,
          (again.epoch ?? 0) + 1,
        );
      }
      if (identityMismatch) {
        throw new E2eIdentityMismatchError();
      }
      throw new E2eNotReadyError(
        "Could not open conversation key on this device",
      );
    }
    if (again.hasWraps && !again.wrappedKey) {
      if (opts.allowReset) {
        await chatApi.resetKeyWraps(conversationId, accessToken);
        return createWraps(
          conversationId,
          again.memberIds.length ? again.memberIds : wrapInfo.memberIds,
          accessToken,
          1,
        );
      }
      throw new E2eNotReadyError(
        "Secure chat keys exist but this device is not wrapped yet",
      );
    }
  }

  return createWraps(conversationId, wrapInfo.memberIds, accessToken, 1);
}

function runInflight(
  map: Map<string, Promise<ConvSession>>,
  conversationId: string,
  opts: ReadyOpts,
  accessToken?: string | null,
): Promise<ConvSession> {
  const key = inflightKey(conversationId, opts);
  const existing = map.get(key);
  if (existing) return existing;
  const pending = ensureConversationReadyInner(conversationId, accessToken, opts)
    .finally(() => {
      map.delete(key);
    });
  map.set(key, pending);
  return pending;
}

export async function ensureConversationReady(
  conversationId: string,
  accessToken?: string | null,
): Promise<ConvSession> {
  return runInflight(
    inflightSend,
    conversationId,
    { allowCreate: true, allowReset: true },
    accessToken,
  );
}

async function ensureConversationForDecrypt(
  conversationId: string,
  accessToken?: string | null,
): Promise<ConvSession | null> {
  try {
    return await runInflight(
      inflightDecrypt,
      conversationId,
      { allowCreate: false, allowReset: false },
      accessToken,
    );
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

/**
 * Force-publish local identity, wipe conversation wraps, create fresh keys.
 * Old ciphertext stays undecryptable on this device (expected).
 */
export async function resetConversationSecureKeys(
  conversationId: string,
  accessToken?: string | null,
): Promise<void> {
  await ensureIdentityPublished(accessToken, null, { force: true });
  clearConversationKeyCache(conversationId);
  await chatApi.resetKeyWraps(conversationId, accessToken);
  await ensureConversationReady(conversationId, accessToken);
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
  byUser.set(uid, identity.publicKeyB64);
  const missing = memberIds.filter((id) => !byUser.has(id));
  if (missing.length) {
    throw new E2eNotReadyError("New member has not enabled secure chat yet");
  }

  const wraps = await sealWrapsForMembers(session.key, memberIds, byUser);
  const put = await chatApi.putKeyWraps(
    conversationId,
    { epoch: session.epoch, wraps },
    accessToken,
  );
  if (typeof put.inserted === "number" && put.inserted === 0 && wraps.length > 0) {
    // Epoch already has wraps — bump via reset+create for newcomers.
    await chatApi.resetKeyWraps(conversationId, accessToken);
    await createWraps(
      conversationId,
      memberIds,
      accessToken,
      session.epoch + 1,
      session.key,
    );
  }
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
          wrapFp: `local:${row.epoch}`,
        });
        return plain;
      }
    }
  }

  return E2E_UNABLE_TO_DECRYPT;
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
    for (const key of [...inflightSend.keys()]) {
      if (key.startsWith(`${conversationId}:`)) inflightSend.delete(key);
    }
    for (const key of [...inflightDecrypt.keys()]) {
      if (key.startsWith(`${conversationId}:`)) inflightDecrypt.delete(key);
    }
  } else {
    convCache.clear();
    inflightSend.clear();
    inflightDecrypt.clear();
  }
}

export function resetE2ePublishState(): void {
  publishedForUser = null;
  identityMismatch = false;
}
