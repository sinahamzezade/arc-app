import sodium from "libsodium-wrappers";
import {
  decodeEnvelope,
  encodeEnvelope,
  E2E_PREFIX,
  fromBase64Url,
  toBase64Url,
} from "./codec";

let ready: Promise<typeof sodium> | null = null;

export async function getSodium(): Promise<typeof sodium> {
  if (!ready) {
    ready = sodium.ready.then(() => sodium);
  }
  return ready;
}

export type IdentityKeyPair = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  publicKeyB64: string;
};

export async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
  const s = await getSodium();
  const kp = s.crypto_box_keypair();
  return {
    publicKey: kp.publicKey,
    privateKey: kp.privateKey,
    publicKeyB64: toBase64Url(kp.publicKey),
  };
}

export async function generateConversationKey(): Promise<Uint8Array> {
  const s = await getSodium();
  return s.randombytes_buf(s.crypto_secretbox_KEYBYTES);
}

export async function sealConversationKey(
  conversationKey: Uint8Array,
  recipientPublicKeyB64: string,
): Promise<string> {
  const s = await getSodium();
  const pk = fromBase64Url(recipientPublicKeyB64);
  const sealed = s.crypto_box_seal(conversationKey, pk);
  return toBase64Url(sealed);
}

export async function openConversationKey(
  wrappedKeyB64: string,
  identity: IdentityKeyPair,
): Promise<Uint8Array | null> {
  const s = await getSodium();
  try {
    const sealed = new Uint8Array(fromBase64Url(wrappedKeyB64));
    const opened = s.crypto_box_seal_open(
      sealed,
      new Uint8Array(identity.publicKey),
      new Uint8Array(identity.privateKey),
    );
    return new Uint8Array(opened);
  } catch {
    return null;
  }
}

export async function encryptMessage(
  plaintext: string,
  conversationKey: Uint8Array,
): Promise<string> {
  const s = await getSodium();
  const nonce = s.randombytes_buf(s.crypto_secretbox_NONCEBYTES);
  const msg = s.from_string(plaintext);
  const cipher = s.crypto_secretbox_easy(msg, nonce, conversationKey);
  const packed = new Uint8Array(nonce.length + cipher.length);
  packed.set(nonce, 0);
  packed.set(cipher, nonce.length);
  return encodeEnvelope(packed);
}

export async function decryptMessage(
  envelope: string,
  conversationKey: Uint8Array,
): Promise<string | null> {
  const packed = decodeEnvelope(envelope);
  if (!packed) return null;
  const s = await getSodium();
  const nlen = s.crypto_secretbox_NONCEBYTES;
  if (packed.length <= nlen) return null;
  // Copy views — some WASM builds mis-handle subarray byteOffset.
  const nonce = new Uint8Array(packed.subarray(0, nlen));
  const cipher = new Uint8Array(packed.subarray(nlen));
  try {
    const plain = s.crypto_secretbox_open_easy(
      cipher,
      nonce,
      conversationKey,
    );
    return s.to_string(plain);
  } catch {
    return null;
  }
}

const BLOB_MAGIC = new TextEncoder().encode(E2E_PREFIX);

export async function encryptBlob(
  plaintext: Uint8Array,
  conversationKey: Uint8Array,
): Promise<Uint8Array> {
  const s = await getSodium();
  const nonce = s.randombytes_buf(s.crypto_secretbox_NONCEBYTES);
  const cipher = s.crypto_secretbox_easy(plaintext, nonce, conversationKey);
  const out = new Uint8Array(
    BLOB_MAGIC.length + nonce.length + cipher.length,
  );
  out.set(BLOB_MAGIC, 0);
  out.set(nonce, BLOB_MAGIC.length);
  out.set(cipher, BLOB_MAGIC.length + nonce.length);
  return out;
}

export async function decryptBlob(
  data: Uint8Array,
  conversationKey: Uint8Array,
): Promise<Uint8Array | null> {
  const s = await getSodium();
  const nlen = s.crypto_secretbox_NONCEBYTES;
  let offset = 0;
  let packed = data;
  if (
    data.length > BLOB_MAGIC.length &&
    BLOB_MAGIC.every((b, i) => data[i] === b)
  ) {
    offset = BLOB_MAGIC.length;
    packed = data.subarray(offset);
  }
  if (packed.length <= nlen) return null;
  const nonce = new Uint8Array(packed.subarray(0, nlen));
  const cipher = new Uint8Array(packed.subarray(nlen));
  try {
    return s.crypto_secretbox_open_easy(cipher, nonce, conversationKey);
  } catch {
    return null;
  }
}

export function identityFromStored(
  publicKeyB64: string,
  privateKeyB64: string,
): IdentityKeyPair {
  return {
    publicKey: fromBase64Url(publicKeyB64),
    privateKey: fromBase64Url(privateKeyB64),
    publicKeyB64,
  };
}
