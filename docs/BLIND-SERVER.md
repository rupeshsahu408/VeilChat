# Blind-Server Contract

Veil's server is intentionally a **dumb relay**. It must never see plaintext
content, plaintext metadata that links users together beyond what's needed for
delivery, or any key material capable of decrypting a message. This document
enumerates exactly what the server is and is not allowed to know.

The TypeScript surface that this contract pins is in
[`server-contract/`](../server-contract/). Any compliant Veil server — including
the one we run — must conform to those types and to the rules below.

---

## What the server stores

For each user account:

- A **server-side identifier** (UUIDv4). Never derived from a phone number,
  email, or anything personally identifying.
- An **identifier HMAC** for lookup: `HMAC(server_pepper, normalize(handle))`.
  The server cannot reverse this back to a handle, but two clients submitting
  the same handle hit the same row.
- The **public** halves of `IK_ed`, `IK_x`, the current `SPK`, the SPK
  signature, and a queue of one-time `OPK` public keys.
- An auth credential (an Argon2id-hashed password + JWT refresh-token state, or
  an OIDC subject claim). This protects the inbox, not the contents.

For each conversation:

- A list of opaque envelopes: `{from_user_id, to_user_id, ciphertext_blob,
  enqueued_at}`. The server cannot read `ciphertext_blob`; it routes it.
- For groups: the membership roster (so we know who to deliver to) and an
  opaque epoch counter. Per-member sender-key chains are *never* stored
  server-side — each member has them locally, distributed via SKDMs.

For each media upload:

- The opaque encrypted blob bytes and an `Etag/blobId`. Never the AES key.

Anything else — read receipts, typing indicators, link-preview metadata,
reactions — travels inside the same end-to-end-encrypted envelope as the
message body.

---

## What the server **must not** do

1. **Decrypt anything.** The server has no AES, ChaCha, or X25519 private
   keys for any user, ever. The server-contract types deliberately do not
   include any field that could carry a private key.
2. **Verify pre-key signatures.** Pre-key signature validation is the
   client's job — the client refuses to start a session if the SPK
   signature doesn't verify against the peer's `IK_ed`. The server forwards
   the signature blob unchanged.
3. **Substitute pre-keys.** When a client uploads a bundle, the server
   stores it byte-for-byte. It does not re-sign, re-encode, or normalize.
4. **Synthesize messages.** Every envelope on the wire must originate from
   a client account. The server cannot construct a ciphertext, because it
   has no chain key.
5. **Log plaintext metadata it doesn't strictly need.** Specifically:
   - No persistent IP logs beyond the duration of an active TCP connection.
   - No user-agent fingerprinting.
   - No cleartext push-notification payloads — pushes carry only an opaque
     `convId` that maps to "you have a message".

---

## Replay, ordering, and offline delivery

- Each envelope carries a 64-bit `seq` assigned by the sender's local
  ratchet (it's the `n` field of the ratchet header). The receiver detects
  reorder and gaps from the header, not from the server's enqueue time.
- The server may persist envelopes for offline recipients, but **MUST
  delete** them on successful delivery acknowledgement. Compliant servers
  cap the queue at 30 days.
- Duplicate delivery is allowed; the receiver's ratchet (or the
  group-sender-key cache) is responsible for idempotency.

---

## Key-rotation and consistency

- Pre-key bundles are versioned. When a client uploads a new SPK, the
  previous SPK remains queryable for a short grace period (recommended:
  72 h) so in-flight initial messages still resolve.
- A client should treat **any change in a peer's `IK_ed`** as a security
  event: rotate the conversation, drop the old ratchet state, and surface
  a new safety number to the user. The server does not gate this — if a
  malicious server swapped a peer's identity key, the safety number would
  change, which is exactly the signal a vigilant user is meant to catch.

---

## What an audit can and cannot check

A third-party auditor with read-only access to a Veil server can verify:

- That stored envelopes look like opaque ciphertext (high entropy, no
  detectable plaintext patterns).
- That no row in any table contains a plausible private key (length-32
  fields with associated public keys, decryptable AES keys, etc.).
- That the schema does not contain plaintext message bodies.

An auditor **cannot** verify, from the server alone, that no operator has
modified the server binary at runtime to siphon traffic. That property
comes from:

- The published [`server-contract/`](../server-contract/) being identical
  to what the deployed server exposes (clients refuse unknown fields).
- Reproducible builds of the server (out of scope for this repo, but
  required of any production deployment).
- The client doing all signature verification itself.
