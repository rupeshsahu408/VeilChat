# Veil Protocol — Cryptographic Specification

This document describes the wire-level cryptography of the Veil messenger. It
is the source of truth that the [`@veil-protocol/crypto`](../packages/crypto)
package implements and tests.

The design is unsurprising on purpose: it is a near-direct application of the
[Signal Protocol](https://signal.org/docs/) to a JavaScript / WebCrypto stack.
We chose primitives that have public test vectors and decades of cryptanalysis
behind them, so an auditor can verify the package against published references
rather than against a novel construction.

---

## 1. Primitives

| Role                                | Primitive                | Source                                       |
| ----------------------------------- | ------------------------ | -------------------------------------------- |
| Long-term identity signature        | Ed25519                  | `@noble/curves`                              |
| Diffie–Hellman                      | X25519                   | `@noble/curves`                              |
| Key derivation                      | HKDF-SHA-256             | WebCrypto (`SubtleCrypto.deriveBits`)        |
| MAC                                 | HMAC-SHA-256             | WebCrypto                                    |
| AEAD                                | AES-GCM-256 (96-bit IV)  | WebCrypto                                    |
| Password-based KDF (at-rest unlock) | Argon2id (64 MB / 3 / 1) | `hash-wasm`                                  |
| Mnemonic recovery                   | BIP-39 (12 words, EN)    | `@scure/bip39`                               |
| Safety number digest                | SHA-512 × 5200           | WebCrypto (matches Signal's fingerprint)     |

All randomness comes from `crypto.getRandomValues` (browser) or Node's
equivalent CSPRNG.

---

## 2. Identities and Pre-Keys

Each user holds:

- **`IK_ed`** — long-term Ed25519 identity keypair. Used to sign `SPK` and
  prove identity over time.
- **`IK_x`** — long-term X25519 identity keypair. Used in X3DH.
- **`SPK`** — a signed X25519 pre-key. Rotated periodically (clients should
  rotate at least weekly). The public part is signed by `IK_ed`.
- **`OPK_i`** — a queue of one-time X25519 pre-keys. Each is consumed at most
  once; running out only degrades forward secrecy of the *initial* message,
  not the rest of the session.

The server stores only the public halves and treats them as opaque blobs. It
**never** verifies, decrypts, or otherwise interprets pre-key material. The
client verifies `Sign(IK_ed, SPK_pub)` itself before trusting a bundle.

---

## 3. Initial Key Agreement: X3DH

When Alice initiates a session with Bob she fetches Bob's `(IK_x, IK_ed,
SPK, OPK?)` bundle, generates an ephemeral X25519 key `EK_A`, and computes:

```
DH1 = DH(IK_A, SPK_B)
DH2 = DH(EK_A, IK_B)
DH3 = DH(EK_A, SPK_B)
DH4 = DH(EK_A, OPK_B)               // omitted if no OPK is available
SK  = HKDF( 0xFF·32 || DH1 || DH2 || DH3 [|| DH4] ,
            salt = 0·32, info = "veil/x3dh/v1", L = 32 )
```

`SK` becomes the **root key** of the Double Ratchet. The associated data
`AD = IK_A_pub || IK_B_pub` is bound into every AEAD operation.

Bob mirrors the same four DHs in reverse using his private halves and Alice's
ephemeral `EK_A_pub`. He arrives at the same `SK` and `AD`.

The X3DH routine refuses to produce a session if the SPK signature does not
verify. See [`packages/crypto/tests/x3dh.test.ts`](../packages/crypto/tests/x3dh.test.ts).

---

## 4. Double Ratchet

Per-message keys are derived by a Double Ratchet over `SK`:

- **DH ratchet.** On the first message *after receiving from the peer*, the
  sender rolls a fresh X25519 keypair, performs DH with the peer's latest
  pubkey, and advances the root key:
  ```
  rk, ck = HKDF(rk, DH(new_dhs, dhr), info = "veil/ratchet/rk/v1", L = 64)
  ```
- **Symmetric ratchet.** Each chain key produces a message key and the next
  chain key by HMAC with two domain-separation constants:
  ```
  ck' = HMAC(ck, 0x02)
  mk  = HMAC(ck, 0x01)
  ```
- **Per-message AEAD.** The 32-byte message key is expanded into a 32-byte
  AES key and a 12-byte IV by HKDF (`info = "veil/ratchet/aead/v1"`), and
  AES-GCM-256 encrypts the plaintext with `AD = AD_session || header_bytes`.

### Header

Each ciphertext carries a small header:

```
header = { ratchetPub: bytes(32), pn: u32, n: u32 }
```

`n` is the message number in the sender's current chain. `pn` is the length
of the previous chain so the receiver can derive any in-flight skipped keys
when the peer rotates `dhs`.

### Skipped messages

Messages may arrive out of order. The receiver derives and caches up to
**100** skipped message keys per direction. Beyond that, decryption is
refused (`Too many skipped messages`) — this is a deliberate DoS bound, not
a bug.

See [`packages/crypto/tests/ratchet.test.ts`](../packages/crypto/tests/ratchet.test.ts)
for the full delivery, out-of-order, ping-pong, tampering, and DoS tests.

---

## 5. Group Chats — Sender Keys

Group chats use the standard **Sender-Key** scheme:

- Each `(group, sender, epoch)` tuple has a 32-byte chain key. Per-message
  keys are derived exactly as in the Double Ratchet's symmetric step:
  `mk = HMAC(ck, 0x01)`, `ck' = HMAC(ck, 0x02)`.
- The chain key is shared with members through a **Sender Key Distribution
  Message** (SKDM) tunnelled inside the existing 1:1 Double Ratchet session
  with each member. The chain key never touches the server.
- Removing a member, adding a member, or any membership change starts a new
  **epoch**. Old chain keys are discarded.

The encrypted payload's associated data binds the header bytes plus the
big-endian message counter `n`, so reordering or replay across counters is
detected.

See [`packages/crypto/tests/group.test.ts`](../packages/crypto/tests/group.test.ts).

---

## 6. Media Encryption

Attachments (images, voice notes) are encrypted client-side under a
**fresh** AES-GCM-256 key per file:

```
iv  = random(12)
key = random(32)
out = iv || AES-GCM(key, iv, plaintext, AD = "")
```

The server stores `out` and a content-addressable id. The 32-byte key is
sent inside a Double-Ratchet-encrypted chat message, so the server only
ever sees opaque ciphertext.

---

## 7. At-Rest Protection

A user PIN gates access to local key material:

- `salt` = 16 random bytes.
- `key`  = `Argon2id(pin, salt, m = 64 MB, t = 3, p = 1, len = 32)`.
- AES-GCM-256 wraps the IndexedDB blob containing identity and ratchet state.

Argon2id parameters target ~250 ms on a low-end mobile device while
remaining painful to brute-force offline.

---

## 8. Account Recovery

A user can opt-in to a **12-word BIP-39 phrase**. The first 32 bytes of the
PBKDF2-SHA-512 seed are the Ed25519 identity private key; bytes 32–63 are the
X25519 identity private key. Restoring the phrase on a new device restores
the user's long-term identity without involving the server. Per-conversation
ratchet state is *not* recovered — peers will see a new safety number and
should re-verify.

---

## 9. Safety Numbers

Two devices that have negotiated a session can verify each other's identity
by comparing a **60-digit** safety number:

```
sn = format( SHA-512^5200( ver_be16 || sort(IK_A_pub, IK_B_pub) ) )
```

The result is rendered as 12 groups of 5 digits. Two parties with the same
identity keys will compute the same number, regardless of who initiated.

See [`packages/crypto/tests/safetyNumber.test.ts`](../packages/crypto/tests/safetyNumber.test.ts).

---

## 10. Versioning & Test Vectors

- Every symbolic constant is namespaced with a version (`veil/x3dh/v1`,
  `veil/ratchet/rk/v1`, `veil/ratchet/aead/v1`). Bumping the protocol means
  bumping these strings, not relying on implicit migration.
- HKDF and HMAC implementations are exercised against **published RFC 5869
  and RFC 4231 test vectors** in the test suite, so the foundation matches
  the spec byte-for-byte.

To reproduce all vectors locally:

```bash
pnpm install
pnpm --filter @veil-protocol/crypto test
```
