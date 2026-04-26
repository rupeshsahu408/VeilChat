import { describe, expect, it } from "vitest";
import { generateIdentityKeyPair, signWithIdentity } from "../src/identity.js";
import { generateX25519KeyPair } from "../src/x25519.js";
import { x3dhInitiate, x3dhRespond } from "../src/x3dh.js";

describe("X3DH key agreement", () => {
  it("initiator and responder derive the same shared secret", async () => {
    const aliceIdEd = generateIdentityKeyPair();
    const aliceIdX = generateX25519KeyPair();

    const bobIdEd = generateIdentityKeyPair();
    const bobIdX = generateX25519KeyPair();
    const bobSpk = generateX25519KeyPair();
    const bobOpk = generateX25519KeyPair();

    // Bob signs his SPK pub with his Ed25519 identity.
    const spkSig = signWithIdentity(bobIdEd.privateKey, bobSpk.publicKey);

    const init = await x3dhInitiate({
      myIdentityX25519: aliceIdX,
      peerIdentityX25519Pub: bobIdX.publicKey,
      peerIdentityEd25519Pub: bobIdEd.publicKey,
      peerSignedPreKey: { keyId: 1, publicKey: bobSpk.publicKey, signature: spkSig },
      peerOneTimePreKey: { keyId: 7, publicKey: bobOpk.publicKey },
    });

    const resp = await x3dhRespond({
      myIdentityX25519: bobIdX,
      mySignedPreKey: bobSpk,
      myOneTimePreKey: bobOpk,
      peerIdentityX25519Pub: aliceIdX.publicKey,
      peerEphemeralPub: init.ephemeral.publicKey,
    });

    expect(Array.from(init.sharedSecret)).toEqual(Array.from(resp.sharedSecret));
    expect(init.sharedSecret.length).toBe(32);
    expect(Array.from(init.associatedData)).toEqual(Array.from(resp.associatedData));
    expect(init.usedSignedPreKeyId).toBe(1);
    expect(init.usedOneTimePreKeyId).toBe(7);
  });

  it("works without a one-time pre-key (degraded forward secrecy)", async () => {
    const aliceIdEd = generateIdentityKeyPair();
    const aliceIdX = generateX25519KeyPair();
    const bobIdEd = generateIdentityKeyPair();
    const bobIdX = generateX25519KeyPair();
    const bobSpk = generateX25519KeyPair();

    const spkSig = signWithIdentity(bobIdEd.privateKey, bobSpk.publicKey);

    const init = await x3dhInitiate({
      myIdentityX25519: aliceIdX,
      peerIdentityX25519Pub: bobIdX.publicKey,
      peerIdentityEd25519Pub: bobIdEd.publicKey,
      peerSignedPreKey: { keyId: 1, publicKey: bobSpk.publicKey, signature: spkSig },
      peerOneTimePreKey: null,
    });

    const resp = await x3dhRespond({
      myIdentityX25519: bobIdX,
      mySignedPreKey: bobSpk,
      myOneTimePreKey: null,
      peerIdentityX25519Pub: aliceIdX.publicKey,
      peerEphemeralPub: init.ephemeral.publicKey,
    });

    expect(Array.from(init.sharedSecret)).toEqual(Array.from(resp.sharedSecret));
    expect(init.usedOneTimePreKeyId).toBeNull();
  });

  it("rejects an invalid signed-prekey signature", async () => {
    const aliceIdX = generateX25519KeyPair();
    const bobIdEd = generateIdentityKeyPair();
    const bobIdX = generateX25519KeyPair();
    const bobSpk = generateX25519KeyPair();
    const evilEd = generateIdentityKeyPair();

    // Sign with a *different* identity key — Alice should reject.
    const badSig = signWithIdentity(evilEd.privateKey, bobSpk.publicKey);

    await expect(
      x3dhInitiate({
        myIdentityX25519: aliceIdX,
        peerIdentityX25519Pub: bobIdX.publicKey,
        peerIdentityEd25519Pub: bobIdEd.publicKey,
        peerSignedPreKey: { keyId: 1, publicKey: bobSpk.publicKey, signature: badSig },
        peerOneTimePreKey: null,
      }),
    ).rejects.toThrow(/signature/);
  });

  it("different sessions produce different secrets (ephemeral entropy)", async () => {
    const aliceIdX = generateX25519KeyPair();
    const bobIdEd = generateIdentityKeyPair();
    const bobIdX = generateX25519KeyPair();
    const bobSpk = generateX25519KeyPair();
    const spkSig = signWithIdentity(bobIdEd.privateKey, bobSpk.publicKey);
    const bundle = {
      myIdentityX25519: aliceIdX,
      peerIdentityX25519Pub: bobIdX.publicKey,
      peerIdentityEd25519Pub: bobIdEd.publicKey,
      peerSignedPreKey: { keyId: 1, publicKey: bobSpk.publicKey, signature: spkSig },
      peerOneTimePreKey: null,
    };
    const a = await x3dhInitiate(bundle);
    const b = await x3dhInitiate(bundle);
    expect(Array.from(a.sharedSecret)).not.toEqual(Array.from(b.sharedSecret));
  });
});
