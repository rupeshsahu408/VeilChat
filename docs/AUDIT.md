# Audit Guide

This guide is for security researchers, auditors, and curious users who want
to verify that Veil's claims match its implementation. It is meant to be
short enough to read in one sitting.

## What's published here

- [`packages/crypto/`](../packages/crypto) — the entire end-to-end
  cryptographic core, with no app, no UI, no network, and no server-side
  state. Building it produces a small, framework-agnostic ESM library.
- [`server-contract/`](../server-contract) — the exact wire-level types and
  schema the production server is allowed to expose. Anything outside this
  surface is non-conformant.
- [`docs/`](.) — protocol spec, server contract, and threat model.

## What's not here, on purpose

- The product UI (mobile app shell, web client, design system, brand
  assets). These have nothing to do with the security claims and would only
  invite cloning.
- Business logic, growth code, billing, telemetry. Out of scope for crypto
  audit.
- The deployed server's source. The server is constrained by
  `server-contract/` — substituting any conformant server should be
  indistinguishable to a client.

## Reproducing the test vectors

```bash
# Node 20+ and pnpm 9+ assumed.
pnpm install
pnpm --filter @veil-protocol/crypto test
```

The suite includes:

- **RFC 5869** HKDF-SHA-256 test vectors A.1 and A.2.
- **RFC 4231** HMAC-SHA-256 test vectors 1 and 2.
- AES-GCM round-trip + tamper-detection.
- X3DH symmetry (initiator and responder derive the same secret).
- X3DH signature rejection (bad SPK signature → no session).
- Double Ratchet: in-order, out-of-order, ping-pong DH ratchet, ciphertext
  tamper-detection, serialise/deserialise round-trip, 100-skipped-key
  DoS bound.
- Group sender-key: in-order, out-of-order within an epoch, tamper
  rejection, missing-key rejection.
- BIP-39: 12-word generation, checksum validation, deterministic
  derivation.
- Safety numbers: format, symmetry, sensitivity to either party's key.
- Media: per-blob AES-GCM round-trip, key-mismatch and tamper rejection.
- Envelope codec: v1/v2 round-trip and graceful fallback for legacy
  plaintext.

If any of these fails on a stock Node 20, **that is a bug** — please open
an issue.

## What to look at first

If you have one hour:

1. [`docs/PROTOCOL.md`](./PROTOCOL.md) — five-page spec.
2. [`packages/crypto/src/x3dh.ts`](../packages/crypto/src/x3dh.ts) — the
   four-DH agreement, signature check, and HKDF binding.
3. [`packages/crypto/src/ratchet.ts`](../packages/crypto/src/ratchet.ts) —
   the Double Ratchet state machine, including the skipped-key bound.
4. [`docs/THREAT-MODEL.md`](./THREAT-MODEL.md) — the in-scope / out-of-scope
   table.

If you have one day:

5. [`packages/crypto/src/group.ts`](../packages/crypto/src/group.ts) and the
   matching test, which together describe sender-key group chats.
6. [`packages/crypto/src/argon2.ts`](../packages/crypto/src/argon2.ts) and
   [`packages/crypto/src/recoveryPhrase.ts`](../packages/crypto/src/recoveryPhrase.ts) —
   at-rest protection and recovery.
7. [`server-contract/wire-format.ts`](../server-contract/wire-format.ts) and
   [`server-contract/schema.ts`](../server-contract/schema.ts) — the full
   server surface the client trusts.

## How to report a finding

- For protocol or cryptographic bugs, please file a public GitHub issue.
- For runtime vulnerabilities affecting the deployed Veil service, please
  email the security address listed in the production app's about screen
  with PGP, or submit through the published bug-bounty program. Coordinated
  disclosure is appreciated.

## License

This repository is published under **AGPL-3.0-only**. The published crypto
package may be used, audited, embedded, and modified subject to the AGPL.
Brand assets and the production application's name and likeness are not part
of this repository and are not licensed for reuse.
