import { describe, expect, it } from "vitest";
import { decryptBlob, encryptBlob } from "../src/mediaCrypto.js";

describe("Media (per-blob AES-GCM)", () => {
  it("round-trips a file blob", async () => {
    const pt = new Uint8Array(64 * 1024);
    crypto.getRandomValues(pt);
    const { ciphertext, keyB64 } = await encryptBlob(pt);
    expect(ciphertext.length).toBe(pt.length + 12 + 16);
    const back = await decryptBlob(ciphertext, keyB64);
    expect(Array.from(back)).toEqual(Array.from(pt));
  });

  it("rejects ciphertext encrypted under a different key", async () => {
    const pt = new TextEncoder().encode("photo.jpg bytes");
    const { ciphertext } = await encryptBlob(pt);
    const { keyB64: otherKey } = await encryptBlob(pt);
    await expect(decryptBlob(ciphertext, otherKey)).rejects.toThrow();
  });

  it("rejects truncated ciphertext", async () => {
    const pt = new TextEncoder().encode("hi");
    const { ciphertext, keyB64 } = await encryptBlob(pt);
    const trimmed = ciphertext.subarray(0, 10);
    await expect(decryptBlob(trimmed, keyB64)).rejects.toThrow();
  });

  it("rejects ciphertext modified in transit", async () => {
    const pt = new TextEncoder().encode("hi");
    const { ciphertext, keyB64 } = await encryptBlob(pt);
    ciphertext[ciphertext.length - 1] = (ciphertext[ciphertext.length - 1] ?? 0) ^ 0x01;
    await expect(decryptBlob(ciphertext, keyB64)).rejects.toThrow();
  });
});
