import { argon2id } from "hash-wasm";
import { randomBytes } from "./identity.js";

/**
 * PIN-derived key for at-rest encryption (the local-storage "Unlock Gate"
 * Veil uses to protect IndexedDB and key material on the user's device).
 *
 * Argon2id with: 64 MB memory, 3 iterations, 1 lane, 32-byte output.
 * These parameters target ~250 ms on a low-end mobile device while
 * remaining painful for an attacker brute-forcing offline.
 */

const ARGON2_OPTS = {
  iterations: 3,
  parallelism: 1,
  memorySize: 64 * 1024, // 64 MB
  hashLength: 32,
} as const;

function bs(a: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(a.length));
  out.set(a);
  return out;
}

export async function deriveKeyFromPin(
  pin: string,
  saltBytes: Uint8Array,
): Promise<CryptoKey> {
  const raw = await argon2id({
    password: pin,
    salt: saltBytes,
    ...ARGON2_OPTS,
    outputType: "binary",
  });
  return await crypto.subtle.importKey("raw", bs(raw), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export interface EncryptedBlob {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
}

export async function encryptWithPin(
  pin: string,
  plaintext: Uint8Array,
): Promise<EncryptedBlob> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKeyFromPin(pin, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: bs(iv) },
      key,
      bs(plaintext),
    ),
  );
  return { ciphertext: ct, iv, salt };
}

export async function decryptWithPin(
  pin: string,
  blob: EncryptedBlob,
): Promise<Uint8Array> {
  const key = await deriveKeyFromPin(pin, blob.salt);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bs(blob.iv) },
    key,
    bs(blob.ciphertext),
  );
  return new Uint8Array(pt);
}
