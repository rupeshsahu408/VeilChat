import { ed25519 } from "@noble/curves/ed25519.js";
import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from "@scure/bip39";
import { wordlist as englishWordlist } from "@scure/bip39/wordlists/english";
import type { IdentityKeyPair } from "./identity.js";

/**
 * BIP-39 12-word recovery phrase. Provides deterministic identity
 * derivation: the same phrase always reproduces the same Ed25519
 * identity key, which lets a user restore their account on a new
 * device without involving the server.
 *
 * The X25519 private key for X3DH is derived from the second half of
 * the same 64-byte seed.
 */

/** Generate a 12-word BIP-39 mnemonic (128 bits of entropy). */
export function generateRecoveryPhrase(): string {
  return generateMnemonic(englishWordlist, 128);
}

/** Validate a BIP-39 mnemonic (checksum + wordlist membership). */
export function isValidRecoveryPhrase(phrase: string): boolean {
  return validateMnemonic(phrase.trim().toLowerCase(), englishWordlist);
}

/**
 * Deterministically derive an Ed25519 identity keypair from a phrase.
 * The private key is the first 32 bytes of the BIP-39 PBKDF2-SHA512 seed.
 */
export function deriveIdentityFromPhrase(phrase: string): IdentityKeyPair {
  const seed = mnemonicToSeedSync(phrase.trim().toLowerCase());
  const privateKey = Uint8Array.from(seed.slice(0, 32));
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Deterministically derive an X25519 private key from a phrase.
 * Uses bytes 32–63 of the BIP-39 seed as the private scalar; the
 * caller computes the public key with `x25519PublicKeyFromPrivate`.
 */
export function deriveX25519PrivateFromPhrase(phrase: string): Uint8Array {
  const seed = mnemonicToSeedSync(phrase.trim().toLowerCase());
  return Uint8Array.from(seed.slice(32, 64));
}
