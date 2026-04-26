# @veil-protocol/crypto

The cryptographic core of [Veil](https://veil.app). Framework-free TypeScript. Runs in any modern browser and Node.js ≥ 20 (anywhere `crypto.subtle` and `crypto.getRandomValues` are available).

This package contains the **same code** that runs inside the Veil client. It is published in this open-source repository so that anyone can:

1. Read it line by line.
2. Run the included test vectors to verify the primitives behave correctly.
3. Use it directly in their own end-to-end-encrypted projects.

---

## What's implemented

| Module | Spec |
|---|---|
| `x25519` | RFC 7748, via [`@noble/curves`](https://github.com/paulmillr/noble-curves) |
| `kdf` | HKDF-SHA-256 (RFC 5869) and HMAC-SHA-256 via WebCrypto |
| `aead` | AES-GCM-256 via WebCrypto |
| `x3dh` | [Signal X3DH](https://signal.org/docs/specifications/x3dh/) |
| `ratchet` | [Signal Double Ratchet](https://signal.org/docs/specifications/doubleratchet/) |
| `group` | Sender-Keys group encryption (WhatsApp-style fan-out) |
| `safetyNumber` | Signal-style 60-digit numeric fingerprint |
| `mediaCrypto` | Per-blob AES-GCM-256 with random key + IV |
| `identity` | Ed25519 identity keypair + signing |
| `argon2` | Argon2id PIN-derived AES-GCM-256 (via [`hash-wasm`](https://github.com/Daninet/hash-wasm)) |
| `recoveryPhrase` | BIP-39 deterministic identity derivation (via [`@scure/bip39`](https://github.com/paulmillr/scure-bip39)) |
| `envelope` | The plaintext message wire format used inside the ratchet |

All cryptographic primitives are sourced from well-audited libraries (Noble Curves, Hash-WASM, Scure BIP-39). We don't roll our own.

---

## Run the test vectors

```bash
pnpm install
pnpm test
```

The suite executes:

- **AEAD** roundtrip + AD-binding tests
- **HKDF** RFC 5869 test vectors
- **X25519** known-answer DH tests
- **X3DH** end-to-end handshake (initiator and responder agree on the same secret)
- **Double Ratchet** end-to-end conversation including out-of-order delivery
- **Sender Keys** group encryption with skipped messages
- **Safety Numbers** determinism + symmetry
- **Media** roundtrip with random keys

---

## Install

```bash
pnpm add @veil-protocol/crypto
# or
npm install @veil-protocol/crypto
```

## Quick start: 1:1 encrypted session

```ts
import {
  generateX25519KeyPair,
  generateIdentityKeyPair,
  signWithIdentity,
  x3dhInitiate,
  x3dhRespond,
  initRatchetAlice,
  initRatchetBob,
  ratchetEncrypt,
  ratchetDecrypt,
} from "@veil-protocol/crypto";

// Bob publishes long-term keys + a signed prekey
const bobIdEd = generateIdentityKeyPair();           // Ed25519 (signing)
const bobIdX  = generateX25519KeyPair();             // X25519 (DH)
const bobSpk  = generateX25519KeyPair();             // signed prekey
const bobSpkSig = signWithIdentity(bobIdEd.privateKey, bobSpk.publicKey);

// Alice has her own identity
const aliceIdEd = generateIdentityKeyPair();
const aliceIdX  = generateX25519KeyPair();

// Alice runs X3DH against Bob's bundle
const x3dh = await x3dhInitiate({
  myIdentityX25519: aliceIdX,
  peerIdentityX25519Pub: bobIdX.publicKey,
  peerIdentityEd25519Pub: bobIdEd.publicKey,
  peerSignedPreKey: { keyId: 1, publicKey: bobSpk.publicKey, signature: bobSpkSig },
  peerOneTimePreKey: null,
});

const aliceState = await initRatchetAlice({
  rootKey: x3dh.sharedSecret,
  peerSignedPreKeyPub: bobSpk.publicKey,
  associatedData: x3dh.associatedData,
});

const enc = new TextEncoder();
const msg = await ratchetEncrypt(aliceState, enc.encode("Hello Bob"), new Uint8Array());

// Bob receives, runs X3DH responder, then decrypts
const bobX3dh = await x3dhRespond({
  myIdentityX25519: bobIdX,
  mySignedPreKey: bobSpk,
  myOneTimePreKey: null,
  peerIdentityX25519Pub: aliceIdX.publicKey,
  peerEphemeralPub: x3dh.ephemeral.publicKey,
});

const bobState = initRatchetBob({
  rootKey: bobX3dh.sharedSecret,
  mySignedPreKey: bobSpk,
  associatedData: bobX3dh.associatedData,
});

const plaintext = await ratchetDecrypt(bobState, msg.header, msg.ciphertext, new Uint8Array());
console.log(new TextDecoder().decode(plaintext)); // "Hello Bob"
```

See `tests/` for more end-to-end examples including group chats, out-of-order delivery, and safety numbers.

---

## License

AGPL-3.0. See the repository root [`LICENSE`](../../LICENSE) for full terms.
