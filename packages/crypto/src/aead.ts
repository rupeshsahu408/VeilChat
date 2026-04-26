import { hkdf } from "./kdf.js";

/**
 * Authenticated encryption used by Double Ratchet. Each message key
 * (32 bytes) is expanded with HKDF into a 32-byte AES key + 12-byte IV.
 * AES-GCM-256 binds the associated data into the authentication tag.
 */

export interface DerivedAead {
  aesKey: Uint8Array;
  iv: Uint8Array;
}

export async function deriveAead(messageKey: Uint8Array): Promise<DerivedAead> {
  const out = await hkdf(
    messageKey,
    new Uint8Array(32), // zero salt
    "veil/ratchet/aead/v1",
    32 + 12,
  );
  return {
    aesKey: out.slice(0, 32),
    iv: out.slice(32, 44),
  };
}

export async function aesGcmEncrypt(
  key: Uint8Array,
  iv: Uint8Array,
  plaintext: Uint8Array,
  associatedData: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const ct = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
      additionalData: associatedData as BufferSource,
    },
    cryptoKey,
    plaintext as BufferSource,
  );
  return new Uint8Array(ct);
}

export async function aesGcmDecrypt(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  associatedData: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const pt = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
      additionalData: associatedData as BufferSource,
    },
    cryptoKey,
    ciphertext as BufferSource,
  );
  return new Uint8Array(pt);
}
