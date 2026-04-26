import { describe, expect, it } from "vitest";
import { computeSafetyNumber } from "../src/safetyNumber.js";
import { generateIdentityKeyPair } from "../src/identity.js";

describe("Safety numbers", () => {
  it("produces a 60-digit fingerprint formatted as 12 groups of 5", async () => {
    const a = generateIdentityKeyPair();
    const b = generateIdentityKeyPair();
    const sn = await computeSafetyNumber(a.publicKey, b.publicKey);
    const groups = sn.split(" ");
    expect(groups.length).toBe(12);
    for (const g of groups) expect(g).toMatch(/^\d{5}$/);
  });

  it("is symmetric: order of inputs doesn't matter", async () => {
    const a = generateIdentityKeyPair();
    const b = generateIdentityKeyPair();
    const sn1 = await computeSafetyNumber(a.publicKey, b.publicKey);
    const sn2 = await computeSafetyNumber(b.publicKey, a.publicKey);
    expect(sn1).toBe(sn2);
  });

  it("changes if either identity key changes", async () => {
    const a = generateIdentityKeyPair();
    const b = generateIdentityKeyPair();
    const c = generateIdentityKeyPair();
    const ab = await computeSafetyNumber(a.publicKey, b.publicKey);
    const ac = await computeSafetyNumber(a.publicKey, c.publicKey);
    expect(ab).not.toBe(ac);
  });
});
