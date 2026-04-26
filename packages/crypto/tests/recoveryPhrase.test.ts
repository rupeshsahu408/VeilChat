import { describe, expect, it } from "vitest";
import {
  deriveIdentityFromPhrase,
  deriveX25519PrivateFromPhrase,
  generateRecoveryPhrase,
  isValidRecoveryPhrase,
} from "../src/recoveryPhrase.js";

describe("BIP-39 recovery phrase", () => {
  it("generates a 12-word phrase that validates", () => {
    const phrase = generateRecoveryPhrase();
    expect(phrase.split(/\s+/).length).toBe(12);
    expect(isValidRecoveryPhrase(phrase)).toBe(true);
  });

  it("rejects a tampered phrase (bad checksum)", () => {
    // Deterministic test vector. The canonical BIP-39 zero-entropy
    // phrase ends in "about" because SHA-256(0x00 × 16) starts with
    // the nibble 0011, matching the last 4 bits (checksum) of the
    // word "about" (index 3 = 0b000_0000_0011).
    //
    // Replacing the final word with "abandon" (index 0 = 0b000_0000_0000)
    // keeps the 128 entropy bits unchanged (still all zero, so the
    // expected checksum is still 0011) but stores 0000 instead. The
    // checksum mismatch is guaranteed — no probabilistic flakiness.
    //
    // The previous form of this test mutated a randomly-generated
    // phrase and relied on the new checksum *not* coincidentally
    // matching the old one, which fails ~1 run in 16 on any platform.
    const valid =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    expect(isValidRecoveryPhrase(valid)).toBe(true);

    const tampered =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";
    expect(isValidRecoveryPhrase(tampered)).toBe(false);
  });

  it("rejects a phrase containing a non-wordlist word", () => {
    // Word "notaword" is not in the BIP-39 English wordlist, so
    // validation must fail on wordlist membership before it even
    // reaches the checksum check.
    const phrase =
      "notaword abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    expect(isValidRecoveryPhrase(phrase)).toBe(false);
  });

  it("derives the same identity key for the same phrase", () => {
    const phrase = generateRecoveryPhrase();
    const a = deriveIdentityFromPhrase(phrase);
    const b = deriveIdentityFromPhrase(phrase);
    expect(Array.from(a.privateKey)).toEqual(Array.from(b.privateKey));
    expect(Array.from(a.publicKey)).toEqual(Array.from(b.publicKey));
  });

  it("derives different identity keys for different phrases", () => {
    const a = deriveIdentityFromPhrase(generateRecoveryPhrase());
    const b = deriveIdentityFromPhrase(generateRecoveryPhrase());
    expect(Array.from(a.publicKey)).not.toEqual(Array.from(b.publicKey));
  });

  it("produces a deterministic X25519 private key", () => {
    const phrase = generateRecoveryPhrase();
    const a = deriveX25519PrivateFromPhrase(phrase);
    const b = deriveX25519PrivateFromPhrase(phrase);
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(a.length).toBe(32);
  });
});
