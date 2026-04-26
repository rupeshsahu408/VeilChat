# Veil Server Contract

This directory pins the **exact wire surface** the Veil client trusts. A
compliant server — including the production one — must implement these
endpoints, store only these fields, and never extend the schema with a field
that could carry plaintext content or private key material.

The contract is split into two files:

- [`schema.ts`](./schema.ts) — the database-level shapes. These are the
  *only* persistent fields a compliant server is allowed to keep.
- [`wire-format.ts`](./wire-format.ts) — the request/response envelopes
  that travel over HTTPS / WebSocket. These are the only shapes a compliant
  server is allowed to accept or emit.

Everything else — UI state, push delivery state, anti-abuse counters — is
either ephemeral or strictly bounded by the rules in
[../docs/BLIND-SERVER.md](../docs/BLIND-SERVER.md).

## Conformance

A server is contract-conformant iff:

1. Every persisted record matches one of the `schema.ts` types and contains
   no extra fields.
2. Every request handler accepts only the corresponding `wire-format.ts`
   request type and returns only the corresponding response type.
3. No handler dereferences, decrypts, or otherwise interprets any
   `ciphertext` or `keyB64` field. They are opaque blobs.
4. No handler issues an outbound message envelope that did not originate
   from a client account in this conversation.

A client is responsible for refusing to talk to a server that violates any
of (1)–(4) — for example by including unknown fields in a response, or by
producing a server-synthesized message envelope.

## Building a compatible server

Anyone may implement a compatible server. The minimum viable feature set is:

- Account create + login (any auth scheme — opaque to the protocol).
- Pre-key bundle upload + fetch.
- Message enqueue + drain (per recipient).
- Encrypted media blob upload + fetch.
- Group roster create / list / member-add / member-remove.

Reference implementations are out of scope for this repository.
