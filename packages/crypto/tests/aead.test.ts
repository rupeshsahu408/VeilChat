import { describe, expect, it } from "vitest";
import { aesGcmDecrypt, aesGcmEncrypt, deriveAead } from "../src/aead.js";

describe("AEAD (AES-GCM-256 via WebCrypto)", () => {
  it("round-trips plaintext with associated data", async () => {
    const mk = new Uint8Array(32);
    crypto.getRandomValues(mk);
    const { aesKey, iv } = await deriveAead(mk);
    const pt = new TextEncoder().encode("the quick brown fox");
    const ad = new TextEncoder().encode("AD-bytes");
    const ct = await aesGcmEncrypt(aesKey, iv, pt, ad);
    const back = await aesGcmDecrypt(aesKey, iv, ct, ad);
    expect(new TextDecoder().decode(back)).toBe("the quick brown fox");
  });

  it("rejects ciphertext when associated data is tampered with", async () => {
    const mk = new Uint8Array(32);
    crypto.getRandomValues(mk);
    const { aesKey, iv } = await deriveAead(mk);
    const ct = await aesGcmEncrypt(
      aesKey,
      iv,
      new TextEncoder().encode("hi"),
      new TextEncoder().encode("ad-1"),
    );
    await expect(
      aesGcmDecrypt(aesKey, iv, ct, new TextEncoder().encode("ad-2")),
    ).rejects.toThrow();
  });

  it("rejects ciphertext when the tag is tampered with", async () => {
    const mk = new Uint8Array(32);
    crypto.getRandomValues(mk);
    const { aesKey, iv } = await deriveAead(mk);
    const ct = await aesGcmEncrypt(
      aesKey,
      iv,
      new TextEncoder().encode("hi"),
      new Uint8Array(),
    );
    ct[ct.length - 1] = (ct[ct.length - 1] ?? 0) ^ 0x01;
    await expect(
      aesGcmDecrypt(aesKey, iv, ct, new Uint8Array()),
    ).rejects.toThrow();
  });

  it("derives different AES key+IV for different message keys", async () => {
    const a = new Uint8Array(32);
    a.fill(1);
    const b = new Uint8Array(32);
    b.fill(2);
    const ka = await deriveAead(a);
    const kb = await deriveAead(b);
    expect(ka.aesKey).not.toEqual(kb.aesKey);
    expect(ka.iv).not.toEqual(kb.iv);
  });
});
