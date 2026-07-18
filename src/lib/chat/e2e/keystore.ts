import { toBase64Url } from "./codec";
import {
  generateIdentityKeyPair,
  identityFromStored,
  type IdentityKeyPair,
} from "./crypto";

const DB_NAME = "arc-chat-e2e";
const STORE = "identity";
const CONV_STORE = "conv-keys";
const DB_VERSION = 3;
const LEGACY_KEY = "default";

type StoredIdentity = {
  userId: string;
  publicKeyB64: string;
  privateKeyB64: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
      if (!db.objectStoreNames.contains(CONV_STORE)) {
        const store = db.createObjectStore(CONV_STORE, { keyPath: "id" });
        store.createIndex("byConv", ["userId", "conversationId"], {
          unique: false,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
  });
}

function idbGetRaw(
  store: IDBObjectStore,
  key: string,
): Promise<StoredIdentity | null> {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => {
      const v = req.result as
        | StoredIdentity
        | { publicKeyB64?: string; privateKeyB64?: string }
        | undefined;
      if (v && "publicKeyB64" in v && v.publicKeyB64 && v.privateKeyB64) {
        resolve({
          userId: (v as StoredIdentity).userId || key,
          publicKeyB64: v.publicKeyB64,
          privateKeyB64: v.privateKeyB64,
        });
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error ?? new Error("IDB get failed"));
  });
}

async function idbGet(userId: string): Promise<StoredIdentity | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const row = await idbGetRaw(store, userId);
  if (row) return { ...row, userId };
  const legacy = await idbGetRaw(store, LEGACY_KEY);
  if (legacy) return { ...legacy, userId };
  return null;
}

async function idbPut(row: StoredIdentity): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(row, row.userId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IDB put failed"));
  });
}

const cachedByUser = new Map<string, IdentityKeyPair>();
const inflightByUser = new Map<string, Promise<IdentityKeyPair>>();

/**
 * Load or create identity for a specific Arlo user.
 * Keys are per-userId so account switches on one browser stay isolated.
 * Migrates legacy v1 `default` slot when present.
 * Serialized per userId — prevents dual-generate races that rotate the
 * published public key and wipe conversation wraps.
 */
export async function loadOrCreateIdentity(
  userId: string,
): Promise<IdentityKeyPair> {
  if (!userId) {
    throw new Error("userId required for E2E identity");
  }
  const hit = cachedByUser.get(userId);
  if (hit) return hit;

  const pending = inflightByUser.get(userId);
  if (pending) return pending;

  const task = (async () => {
    const stored = await idbGet(userId);
    if (stored?.publicKeyB64 && stored?.privateKeyB64) {
      const kp = identityFromStored(stored.publicKeyB64, stored.privateKeyB64);
      cachedByUser.set(userId, kp);
      // Ensure per-user slot exists (legacy migration).
      await idbPut({
        userId,
        publicKeyB64: stored.publicKeyB64,
        privateKeyB64: stored.privateKeyB64,
      });
      return kp;
    }

    const kp = await generateIdentityKeyPair();
    await idbPut({
      userId,
      publicKeyB64: kp.publicKeyB64,
      privateKeyB64: toBase64Url(kp.privateKey),
    });
    cachedByUser.set(userId, kp);
    return kp;
  })().finally(() => {
    inflightByUser.delete(userId);
  });

  inflightByUser.set(userId, task);
  return task;
}

/** Test helper — clear in-memory cache. */
export function clearIdentityCache(userId?: string): void {
  if (userId) {
    cachedByUser.delete(userId);
    inflightByUser.delete(userId);
  } else {
    cachedByUser.clear();
    inflightByUser.clear();
  }
}
