import { fromBase64Url, toBase64Url } from "./codec";

const DB_NAME = "arc-chat-e2e";
const STORE = "conv-keys";
const DB_VERSION = 3;

export type StoredConvKey = {
  /** `${userId}:${conversationId}:${epoch}` */
  id: string;
  userId: string;
  conversationId: string;
  epoch: number;
  keyB64: string;
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("identity")) {
        db.createObjectStore("identity");
      }
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("byConv", ["userId", "conversationId"], {
          unique: false,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
  });
}

function rowId(userId: string, conversationId: string, epoch: number) {
  return `${userId}:${conversationId}:${epoch}`;
}

/** Persist a conversation key so reopen can decrypt history after wrap rekey. */
export async function saveConversationKey(
  userId: string,
  conversationId: string,
  epoch: number,
  key: Uint8Array,
): Promise<void> {
  if (typeof indexedDB === "undefined" || !userId || !conversationId) return;
  const db = await openDb();
  const row: StoredConvKey = {
    id: rowId(userId, conversationId, epoch),
    userId,
    conversationId,
    epoch,
    keyB64: toBase64Url(key),
    updatedAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IDB put conv key failed"));
  });
}

/** Newest-first conversation keys for decrypt fallback. */
export async function listConversationKeys(
  userId: string,
  conversationId: string,
): Promise<Array<{ epoch: number; key: Uint8Array }>> {
  if (typeof indexedDB === "undefined" || !userId || !conversationId) {
    return [];
  }
  const db = await openDb();
  const rows = await new Promise<StoredConvKey[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("byConv");
    const req = idx.getAll([userId, conversationId]);
    req.onsuccess = () => resolve((req.result as StoredConvKey[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error("IDB list conv keys failed"));
  });
  return rows
    .sort((a, b) => b.epoch - a.epoch || b.updatedAt - a.updatedAt)
    .map((r) => ({
      epoch: r.epoch,
      key: fromBase64Url(r.keyB64),
    }));
}
