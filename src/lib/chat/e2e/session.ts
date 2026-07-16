import { chatApi } from "@/lib/api/chat";
import { isE2eEnvelope } from "./codec";
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
/** Conversations where we already wiped wraps after a decrypt miss. */
const rekeyedAfterDecryptMiss = new Set<string>();
let publishedForUser: { userId: string; publicKeyB64: string } | null = null;
let activeUserId: string | null = null;

/** Read `sub` from JWT access token (no verify — already authed). */
function userIdFromAccessToken(token?: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
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
): Promise<ConvSession> {
  const identity = await ensureIdentityPublished(accessToken);
  const { keys } = await chatApi.getPublicKeys(memberIds, accessToken);
  const byUser = new Map(keys.map((k) => [k.userId, k.publicKey]));
  const missing = memberIds.filter((id) => !byUser.has(id));
  if (missing.length) {
    throw new E2eNotReadyError("Peer has not enabled secure chat yet");
  }

  const conversationKey = await generateConversationKey();
  const epoch = 1;
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
  return {
    key,
    epoch: refreshed.epoch,
    wrapFp: wrapFingerprint(refreshed.wrappedKey),
  };
}

async function ensureConversationReadyInner(
  conversationId: string,
  accessToken?: string | null,
  allowReset = true,
): Promise<ConvSession> {
  const identity = await ensureIdentityPublished(accessToken);
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
      const session = {
        key,
        epoch: wrapInfo.epoch,
        wrapFp: wrapFingerprint(wrapInfo.wrappedKey),
      };
      convCache.set(conversationId, session);
      return session;
    } catch (err) {
      // Stale wrap sealed to an old identity — reset and rebuild once.
      if (!allowReset) throw err;
      convCache.delete(conversationId);
      await chatApi.resetKeyWraps(conversationId, accessToken);
      const rebuilt = await createWraps(
        conversationId,
        wrapInfo.memberIds,
        accessToken,
      );
      convCache.set(conversationId, rebuilt);
      return rebuilt;
    }
  }

  if (wrapInfo.hasWraps && !wrapInfo.wrappedKey) {
    if (!allowReset) {
      throw new E2eNotReadyError(
        "Secure chat keys exist but this device is not wrapped yet",
      );
    }
    // Missing our wrap while others exist — reset whole conversation keys.
    await chatApi.resetKeyWraps(conversationId, accessToken);
    const rebuilt = await createWraps(
      conversationId,
      wrapInfo.memberIds,
      accessToken,
    );
    convCache.set(conversationId, rebuilt);
    return rebuilt;
  }

  if (!wrapInfo.memberIds.length) {
    throw new E2eNotReadyError("No conversation members");
  }

  const session = await createWraps(
    conversationId,
    wrapInfo.memberIds,
    accessToken,
  );
  convCache.set(conversationId, session);
  return session;
}

export async function ensureConversationReady(
  conversationId: string,
  accessToken?: string | null,
): Promise<ConvSession> {
  const existing = inflight.get(conversationId);
  if (existing) return existing;

  const pending = ensureConversationReadyInner(conversationId, accessToken)
    .catch((err) => {
      throw err;
    })
    .finally(() => {
      inflight.delete(conversationId);
    });
  inflight.set(conversationId, pending);
  return pending;
}

/** After adding group members — re-seal current key for newcomers. */
export async function rewrapConversationKeys(
  conversationId: string,
  accessToken?: string | null,
): Promise<void> {
  const identity = await ensureIdentityPublished(accessToken);
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
    session = {
      key,
      epoch: wrapInfo.epoch,
      wrapFp: wrapFingerprint(wrapInfo.wrappedKey),
    };
    convCache.set(conversationId, session);
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
  try {
    const session = await ensureConversationReady(conversationId, accessToken);
    const plain = await decryptMessage(body, session.key);
    if (plain != null) return plain;

    // Opened wrap but payload miss → split/stale conversation keys.
    // Wipe once so the next send bootstraps a consistent key for both sides.
    if (!rekeyedAfterDecryptMiss.has(conversationId)) {
      rekeyedAfterDecryptMiss.add(conversationId);
      convCache.delete(conversationId);
      inflight.delete(conversationId);
      await chatApi.resetKeyWraps(conversationId, accessToken).catch(() => undefined);
    }
    return "🔒 Unable to decrypt";
  } catch {
    return "🔒 Unable to decrypt";
  }
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
  const session = await ensureConversationReady(conversationId, accessToken);
  const plain = await decryptBlob(data, session.key);
  if (!plain) throw new E2eNotReadyError("Could not decrypt attachment");
  return plain;
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
