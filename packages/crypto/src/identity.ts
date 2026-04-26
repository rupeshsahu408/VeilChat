import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToBase64 } from "./base64.js";

/**
 * Long-term Ed25519 identity keypair. Used for:
 *   - Signing the X25519 signed prekey (so peers verify it during X3DH).
 *   - Generating safety-number fingerprints.
 *   - Any other identity proof a higher layer needs.
 */

export interface IdentityKeyPair {
  /** 32 bytes raw. */
  privateKey: Uint8Array;
  /** 32 bytes raw. */
  publicKey: Uint8Array;
}

export function generateIdentityKeyPair(): IdentityKeyPair {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/** Sign a message with the identity Ed25519 private key. Returns 64-byte signature. */
export function signWithIdentity(
  privateKey: Uint8Array,
  message: Uint8Array,
): Uint8Array {
  return ed25519.sign(message, privateKey);
}

/** Verify an Ed25519 signature. */
export function verifyWithIdentity(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

/** Sign a UTF-8 string and return a base64 signature. */
export function signMessage(privateKey: Uint8Array, message: string): string {
  const sig = ed25519.sign(new TextEncoder().encode(message), privateKey);
  return bytesToBase64(sig);
}

/** Short fingerprint of a 32-byte public key: 8 hex chars formatted xxxx-xxxx. */
export async function publicKeyFingerprint(
  publicKey: Uint8Array,
): Promise<string> {
  const buf = new Uint8Array(new ArrayBuffer(publicKey.length));
  buf.set(publicKey);
  const hash = await crypto.subtle.digest("SHA-256", buf as BufferSource);
  const bytes = new Uint8Array(hash);
  let hex = "";
  for (let i = 0; i < 4; i++) hex += bytes[i]!.toString(16).padStart(2, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}
