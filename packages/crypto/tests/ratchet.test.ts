import { describe, expect, it } from "vitest";
import { generateIdentityKeyPair, signWithIdentity } from "../src/identity.js";
import { generateX25519KeyPair } from "../src/x25519.js";
import {
  initiatorSendFirstMessage,
  responderReceiveFirstMessage,
} from "../src/session.js";
import {
  ratchetDecrypt,
  ratchetEncrypt,
  serializeRatchet,
  deserializeRatchet,
  type RatchetState,
} from "../src/ratchet.js";

const dec = (b: Uint8Array) => new TextDecoder().decode(b);
const enc = (s: string) => new TextEncoder().encode(s);

async function freshSession(): Promise<{ alice: RatchetState; bob: RatchetState }> {
  const aliceIdX = generateX25519KeyPair();
  const bobIdEd = generateIdentityKeyPair();
  const bobIdX = generateX25519KeyPair();
  const bobSpk = generateX25519KeyPair();
  const spkSig = signWithIdentity(bobIdEd.privateKey, bobSpk.publicKey);

  const sent = await initiatorSendFirstMessage({
    myIdentityX25519: aliceIdX,
    peerBundle: {
      identityX25519Pub: bobIdX.publicKey,
      identityEd25519Pub: bobIdEd.publicKey,
      signedPreKey: { keyId: 1, publicKey: bobSpk.publicKey, signature: spkSig },
      oneTimePreKey: null,
    },
    plaintext: enc("hello bob"),
  });

  const recv = await responderReceiveFirstMessage({
    myIdentityX25519: bobIdX,
    mySignedPreKey: bobSpk,
    myOneTimePreKey: null,
    peerIdentityX25519Pub: aliceIdX.publicKey,
    peerEphemeralPub: sent.preKeyEnvelope.ephemeralPublicKey,
    message: sent.message,
  });
  expect(dec(recv.plaintext)).toBe("hello bob");
  return { alice: sent.state, bob: recv.state };
}

describe("Double Ratchet", () => {
  it("delivers many messages in order in both directions", async () => {
    const { alice, bob } = await freshSession();

    // Alice → Bob (5)
    for (let i = 0; i < 5; i++) {
      const m = await ratchetEncrypt(alice, enc(`a${i}`), new Uint8Array());
      const pt = await ratchetDecrypt(bob, m.header, m.ciphertext, new Uint8Array());
      expect(dec(pt)).toBe(`a${i}`);
    }
    // Bob → Alice (5) — triggers DH ratchet on Bob's side.
    for (let i = 0; i < 5; i++) {
      const m = await ratchetEncrypt(bob, enc(`b${i}`), new Uint8Array());
      const pt = await ratchetDecrypt(alice, m.header, m.ciphertext, new Uint8Array());
      expect(dec(pt)).toBe(`b${i}`);
    }
  });

  it("handles out-of-order delivery within a chain", async () => {
    const { alice, bob } = await freshSession();
    const m0 = await ratchetEncrypt(alice, enc("m0"), new Uint8Array());
    const m1 = await ratchetEncrypt(alice, enc("m1"), new Uint8Array());
    const m2 = await ratchetEncrypt(alice, enc("m2"), new Uint8Array());
    // Deliver 2, 0, 1 — Bob should cope.
    expect(dec(await ratchetDecrypt(bob, m2.header, m2.ciphertext, new Uint8Array()))).toBe("m2");
    expect(dec(await ratchetDecrypt(bob, m0.header, m0.ciphertext, new Uint8Array()))).toBe("m0");
    expect(dec(await ratchetDecrypt(bob, m1.header, m1.ciphertext, new Uint8Array()))).toBe("m1");
  });

  it("interleaves DH ratchet steps correctly (ping-pong)", async () => {
    const { alice, bob } = await freshSession();
    const log: string[] = [];
    for (let round = 0; round < 4; round++) {
      const a = await ratchetEncrypt(alice, enc(`A${round}`), new Uint8Array());
      log.push(dec(await ratchetDecrypt(bob, a.header, a.ciphertext, new Uint8Array())));
      const b = await ratchetEncrypt(bob, enc(`B${round}`), new Uint8Array());
      log.push(dec(await ratchetDecrypt(alice, b.header, b.ciphertext, new Uint8Array())));
    }
    expect(log).toEqual([
      "A0", "B0", "A1", "B1", "A2", "B2", "A3", "B3",
    ]);
  });

  it("rejects ciphertext modified in transit", async () => {
    const { alice, bob } = await freshSession();
    const m = await ratchetEncrypt(alice, enc("secret"), new Uint8Array());
    m.ciphertext[0] = (m.ciphertext[0] ?? 0) ^ 0x01;
    await expect(
      ratchetDecrypt(bob, m.header, m.ciphertext, new Uint8Array()),
    ).rejects.toThrow();
  });

  it("survives serialize/deserialize round-trips", async () => {
    const { alice, bob } = await freshSession();
    const m = await ratchetEncrypt(alice, enc("hello"), new Uint8Array());
    const bobRevived = deserializeRatchet(serializeRatchet(bob));
    const pt = await ratchetDecrypt(bobRevived, m.header, m.ciphertext, new Uint8Array());
    expect(dec(pt)).toBe("hello");
  });

  it("caps skipped message keys to prevent memory exhaustion", async () => {
    const { alice, bob } = await freshSession();
    // Send 200 messages but only deliver the last one — 199 would exceed MAX_SKIP=100.
    let last;
    for (let i = 0; i < 200; i++) {
      last = await ratchetEncrypt(alice, enc(`m${i}`), new Uint8Array());
    }
    await expect(
      ratchetDecrypt(bob, last!.header, last!.ciphertext, new Uint8Array()),
    ).rejects.toThrow(/skipped/);
  });
});
