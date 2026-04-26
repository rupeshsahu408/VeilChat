import { describe, expect, it } from "vitest";
import { concatBytes, hkdf, hmacSha256 } from "../src/kdf.js";

const hex = (b: Uint8Array) =>
  [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h: string) =>
  new Uint8Array(h.match(/.{1,2}/g)!.map((x) => parseInt(x, 16)));

describe("HKDF-SHA256 (RFC 5869 test vectors)", () => {
  it("vector A.1 (basic)", async () => {
    const ikm = fromHex("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b");
    const salt = fromHex("000102030405060708090a0b0c");
    const info = fromHex("f0f1f2f3f4f5f6f7f8f9");
    const okm = await hkdf(ikm, salt, info, 42);
    expect(hex(okm)).toBe(
      "3cb25f25faacd57a90434f64d0362f2a" +
        "2d2d0a90cf1a5a4c5db02d56ecc4c5bf" +
        "34007208d5b887185865",
    );
  });

  it("vector A.2 (longer inputs/outputs)", async () => {
    const ikm = fromHex(
      "000102030405060708090a0b0c0d0e0f" +
        "101112131415161718191a1b1c1d1e1f" +
        "202122232425262728292a2b2c2d2e2f" +
        "303132333435363738393a3b3c3d3e3f" +
        "404142434445464748494a4b4c4d4e4f",
    );
    const salt = fromHex(
      "606162636465666768696a6b6c6d6e6f" +
        "707172737475767778797a7b7c7d7e7f" +
        "808182838485868788898a8b8c8d8e8f" +
        "909192939495969798999a9b9c9d9e9f" +
        "a0a1a2a3a4a5a6a7a8a9aaabacadaeaf",
    );
    const info = fromHex(
      "b0b1b2b3b4b5b6b7b8b9babbbcbdbebf" +
        "c0c1c2c3c4c5c6c7c8c9cacbcccdcecf" +
        "d0d1d2d3d4d5d6d7d8d9dadbdcdddedf" +
        "e0e1e2e3e4e5e6e7e8e9eaebecedeeef" +
        "f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff",
    );
    const okm = await hkdf(ikm, salt, info, 82);
    expect(hex(okm)).toBe(
      "b11e398dc80327a1c8e7f78c596a4934" +
        "4f012eda2d4efad8a050cc4c19afa97c" +
        "59045a99cac7827271cb41c65e590e09" +
        "da3275600c2f09b8367793a9aca3db71" +
        "cc30c58179ec3e87c14c01d5c1f3434f" +
        "1d87",
    );
  });
});

describe("HMAC-SHA256 (RFC 4231 test vectors)", () => {
  it("vector 1", async () => {
    const key = fromHex("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b");
    const data = new TextEncoder().encode("Hi There");
    const out = await hmacSha256(key, data);
    expect(hex(out)).toBe(
      "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
    );
  });

  it("vector 2", async () => {
    const key = new TextEncoder().encode("Jefe");
    const data = new TextEncoder().encode("what do ya want for nothing?");
    const out = await hmacSha256(key, data);
    expect(hex(out)).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });
});

describe("concatBytes", () => {
  it("concatenates correctly", () => {
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([3]);
    const c = new Uint8Array([4, 5, 6]);
    expect(Array.from(concatBytes(a, b, c))).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("returns empty for no args", () => {
    expect(concatBytes().length).toBe(0);
  });
});
