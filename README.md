# Veil

> **Private by design. Visible to no one but you.**

Veil is an open-source, end-to-end encrypted Progressive Web App (PWA) messenger built on the [Signal Protocol](https://signal.org/docs/) (X3DH + Double Ratchet). It uses a **blind-server architecture** — the server never sees plaintext messages, contact lists, or media. All cryptography happens on your device, in your browser. No app store required.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Built with TypeScript](https://img.shields.io/badge/Built_with-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8.svg)](https://web.dev/progressive-web-apps/)

---

## Why Veil

Modern messengers either lock you into a single ecosystem or quietly monetize your metadata. Veil is the opposite:

- **No ads. No tracking. No data mining.**
- **No app store** — installs straight from the browser as a PWA.
- **No phone number required** — sign up anonymously with a random ID.
- **Open source under AGPL-3.0** — anyone can audit, fork, or self-host. Modified server code stays open, even when run as a service.

---

## Features

### Messaging
- **1-to-1 chats** — End-to-end encrypted via the Signal Protocol (X3DH handshake + Double Ratchet).
- **Group chats** — WhatsApp-style Sender Keys for efficient encrypted fan-out.
- **Rich content** — Text (Markdown), images, voice notes, reactions, replies, edits, and "delete for everyone."
- **Encrypted polls** in 1:1 and group chats.
- **Disappearing messages** with configurable TTL.
- **View-once media** — image or voice that vanishes after a single view.
- **Scheduled messages** — send at a future time.
- **Safe link previews** — generated server-side without leaking your IP to the linked site.

### Privacy & Security
- **Safety Numbers** — verify a contact's Ed25519 identity key fingerprint to defeat MITM attacks.
- **The Vault** — a biometric/PIN-locked hidden area for sensitive chats. Vaulted threads do not appear in the inbox until the Vault is unlocked, and only for that session.
- **Stealth Mode** — disables read receipts and typing indicators.
- **Block lists, last-seen controls, mood/status updates** — full granular privacy controls.
- **Local encryption at rest** — IndexedDB content protected by an Unlock Gate; sensitive keys derived with Argon2id.

### Identity
- **Three sign-up modes**: Email, Phone, or fully anonymous **Random ID** (no PII).
- **Passkeys (WebAuthn)** — first-class TouchID / FaceID / hardware-key support.
- **BIP-39 12-word recovery phrase** for account restoration.
- **Daily verification password** (optional) — extra gate to keep the local session active.

---

## Security Model

Veil treats the server as untrusted infrastructure. Plaintext never leaves the client.

| Surface | Mechanism |
|---|---|
| 1:1 session establishment | **X3DH** (Extended Triple Diffie-Hellman) with prekeys |
| 1:1 ongoing messages | **Double Ratchet** — forward secrecy + post-compromise security |
| Group messages | **Sender Keys** — fan-out chain keys distributed via 1:1 sessions |
| Media (images, voice) | **AES-GCM-256**, encrypted client-side; server only sees ciphertext |
| Identity verification | **Ed25519** key fingerprints (Safety Numbers) |
| Local-key derivation | **Argon2id** from user PIN |
| Server role | **Blind mailbox** — stores and forwards encrypted envelopes; routes WebSocket and Web Push notifications |

The server cannot decrypt messages. Even a fully compromised Veil server cannot read user content, recover prior messages (forward secrecy), or impersonate a user (without breaking Ed25519).

---

## Tech Stack

- **Client**: React + Vite, Tailwind CSS, Framer Motion, Zustand, Dexie (IndexedDB)
- **Server**: Node.js + Fastify + tRPC, Drizzle ORM, PostgreSQL
- **Storage**: Cloudflare R2 (S3-compatible) for encrypted media blobs
- **Push**: Firebase Cloud Messaging + VAPID Web Push
- **Identity**: WebAuthn (Passkeys), Argon2id, BIP-39
- **Type safety**: Shared Zod schemas across the tRPC boundary

---

## Monorepo Layout

```
veil/
├── apps/
│   ├── client/        # React + Vite PWA (all crypto lives here)
│   └── server/        # Node + Fastify + tRPC backend (blind mailbox)
├── packages/
│   └── shared/        # Shared TypeScript types & Zod schemas
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Local Development

Requires Node.js ≥ 20 and pnpm ≥ 10.

```bash
pnpm install
pnpm dev
```

| Service | URL |
|---|---|
| Client (PWA) | http://localhost:5000 |
| Server health check | http://localhost:3001/health |

Vite proxies `/api/*` to the server on port 3001.

### Other scripts

```bash
pnpm build       # Build all workspaces
pnpm typecheck   # Run TypeScript across all workspaces
pnpm lint        # Lint all workspaces
```

---

## Environment Variables

Each app reads its own `.env` file. See `.env.example` in `apps/client/` and `apps/server/` for the full list (database URL, R2 credentials, FCM keys, VAPID keys, etc.). **Secrets are never committed.**

---

## Contributing

Contributions are welcome — bug reports, fixes, security audits, translations, and documentation improvements all matter.

Because Veil is licensed under **AGPL-3.0**, any contribution you submit will be distributed under the same terms. By opening a pull request you agree to license your work under AGPL-3.0.

For security-sensitive issues, please **do not** open a public issue. Use private disclosure instead.

---

## License

Veil is licensed under the **GNU Affero General Public License v3.0** — see the [LICENSE](./LICENSE) file for the full text.

The AGPL-3.0 in plain English:

- You may **use, modify, and redistribute** Veil freely.
- Any modified version you distribute **must also be released under AGPL-3.0** with full source code.
- If you **run a modified version of the Veil server as a network service** (e.g. you host it for others to use), you **must offer the source code of your modifications to your users**.

This last clause — the "AGPL clause" — is what closes the SaaS loophole and is the same protection [Signal-Server](https://github.com/signalapp/Signal-Server) uses.

---

## Acknowledgements

Veil's cryptographic design is based directly on the public specifications of the [Signal Protocol](https://signal.org/docs/) developed by Open Whisper Systems and the [Signal Foundation](https://signal.org/). We are deeply grateful for their decade of work making private communication a real, rigorous engineering discipline rather than a marketing slogan.
