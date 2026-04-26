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
    const words = generateRecoveryPhrase().split(" ");
    words[0] = words[0] === "abandon" ? "ability" : "abandon";
    expect(isValidRecoveryPhrase(words.join(" "))).toBe(false);
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
