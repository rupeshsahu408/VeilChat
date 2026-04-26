# Veil Protocol

> **The cryptographic core of [Veil](https://veil.app), published openly so anyone can verify our security claims.**

Veil is a private, end-to-end encrypted messenger. We can claim "the server can't read your messages" — but you shouldn't have to take our word for it. This repository contains everything you need to **verify those claims for yourself**:

- The full Signal-Protocol implementation we ship in the Veil client.
- The blind-server contract: the database schema and wire format the server actually sees.
- A runnable test suite of cryptographic vectors so you can prove the primitives behave correctly.
- The threat model and audit guide.

The full Veil application — its UI, product features, and proprietary infrastructure — is not in this repo. **What is here is everything that touches your security.** That's the deal: full transparency on the parts that matter, nothing else.

[![CI](https://github.com/rupeshsahu408/VeilChat/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rupeshsahu408/VeilChat/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Built with TypeScript](https://img.shields.io/badge/Built_with-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)

---

## What's in this repo

```
veil-protocol/
├── packages/
│   └── crypto/              # @veil-protocol/crypto — buildable npm package
│       ├── src/             # X3DH, Double Ratchet, Sender Keys, Argon2id, BIP-39, Safety Numbers
│       └── tests/           # Cryptographic test vectors — run them yourself
├── server-contract/         # The exact data the Veil server stores and sees
│   ├── schema.ts            # PostgreSQL schema (annotated)
│   └── wire-format.ts       # tRPC / WebSocket message shapes
├── docs/
│   ├── PROTOCOL.md          # How X3DH + Double Ratchet + Sender Keys are wired
│   ├── BLIND-SERVER.md      # Why the Veil server cannot decrypt anything
│   ├── THREAT-MODEL.md      # What Veil defends against, and what it doesn't
│   └── AUDIT.md             # How to audit and verify a Veil build
└── LICENSE                  # AGPL-3.0
```

---

## Verify the cryptography yourself

```bash
pnpm install
pnpm test
```

You'll see the X3DH handshake, Double Ratchet, Sender Keys, AEAD, KDF, Safety Numbers, and media-encryption test vectors all execute against the real production code. **The same code runs in the Veil client.**

You don't have to take our word for the green badge either: the [CI workflow](./.github/workflows/ci.yml) re-runs the entire suite — including the published RFC 5869 (HKDF) and RFC 4231 (HMAC-SHA) vectors — on every push and pull request, across Linux, macOS, and Windows on Node 20 and 22.

---

## Why we publish this (and not the whole app)

| The question users ask | Where the answer lives |
|---|---|
| "Is the encryption real?" | [`packages/crypto/src/`](./packages/crypto/src) |
| "Does it match the Signal Protocol spec?" | [`docs/PROTOCOL.md`](./docs/PROTOCOL.md) |
| "Can the server decrypt my messages?" | [`server-contract/schema.ts`](./server-contract/schema.ts) and [`docs/BLIND-SERVER.md`](./docs/BLIND-SERVER.md) |
| "What does the server actually see when I send a message?" | [`server-contract/wire-format.ts`](./server-contract/wire-format.ts) |
| "What attacks does Veil defend against?" | [`docs/THREAT-MODEL.md`](./docs/THREAT-MODEL.md) |
| "How can I independently audit Veil?" | [`docs/AUDIT.md`](./docs/AUDIT.md) |

We deliberately don't publish the product UI, branding, or the proprietary growth and discovery features. None of those affect whether your messages are private — and keeping them out of an open repo means our work isn't trivially clonable into a competing app. Everything that touches your security is here. Everything that doesn't, isn't.

This is the same pattern adopted by other privacy-respecting projects (Threema's protocol library, ProtonMail's OpenPGP fork): publish the security-critical parts in full, keep the product surface private.

---

## Security Model (one-page summary)

Veil treats the server as untrusted infrastructure. Plaintext never leaves the client.

| Surface | Mechanism |
|---|---|
| 1:1 session establishment | **X3DH** (Extended Triple Diffie-Hellman) with prekeys |
| 1:1 ongoing messages | **Double Ratchet** — forward secrecy + post-compromise security |
| Group messages | **Sender Keys** — fan-out chain keys distributed via 1:1 sessions |
| Media (images, voice) | **AES-GCM-256**, encrypted client-side; server only sees ciphertext |
| Identity verification | **Ed25519** key fingerprints (Safety Numbers) |
| Local-key derivation | **Argon2id** from user PIN |
| Account recovery | **BIP-39** 12-word phrase, deterministic identity derivation |
| Server role | **Blind mailbox** — stores and forwards encrypted envelopes only |

The server cannot decrypt messages. Even a fully compromised Veil server cannot read user content, recover prior messages (forward secrecy), or impersonate a user (without breaking Ed25519).

See [`docs/PROTOCOL.md`](./docs/PROTOCOL.md) for the full protocol details.

---

## Use the crypto package directly

`@veil-protocol/crypto` is published as a standalone, framework-free npm package. You can use it in your own project, audit it line by line, or fork it.

```ts
import {
  generateX25519KeyPair,
  x3dhInitiate,
  ratchetEncrypt,
  computeSafetyNumber,
} from "@veil-protocol/crypto";
```

See [`packages/crypto/README.md`](./packages/crypto/README.md) for the full API.

---

## Reporting security issues

Please do **not** open a public GitHub issue for security-sensitive findings. Email **Help@sendora.me** with the subject `[VeilChat security]` and we'll respond within 72 hours. The full disclosure policy, supported versions, scope, and safe-harbor terms are in [SECURITY.md](./SECURITY.md).

---

## License

AGPL-3.0. Anyone may use, modify, and redistribute VeilChat's protocol implementation. Modified versions distributed as a network service must publish their source.

## Brand and trademarks

The AGPL-3.0 license covers the **source code** in this repository only.

The names **"VeilChat"** and **"Veil Protocol"**, the **VeilChat logo**
(shown below, also at [`brand/veilchat-logo.png`](./brand/veilchat-logo.png)),
and the visual identity associated with them are trademarks of the
VeilChat project. They are **not** licensed under AGPL-3.0.

<p align="left">
  <img src="./brand/veilchat-logo.png" alt="VeilChat logo" width="96" height="96" />
</p>

If you fork this repository or build a product on top of this code,
you must **rename your fork** and use your own branding. You may not
ship a product called "VeilChat", "Veil", or any confusingly similar
name, and you may not use the VeilChat logo. You may, of course, say
truthfully that your project is *based on* or *derived from* the
VeilChat protocol code.

The full policy — including what counts as fair descriptive use and
how to report brand abuse — is in [TRADEMARK.md](./TRADEMARK.md).
Suspected misuse can be reported to **Help@sendora.me** with the
subject `[VeilChat brand]`.

---

## Acknowledgements

Veil's cryptographic design is based directly on the [Signal Protocol specifications](https://signal.org/docs/) developed by Open Whisper Systems and the Signal Foundation. We are deeply grateful for their decade of work making private communication a real, rigorous engineering discipline.
