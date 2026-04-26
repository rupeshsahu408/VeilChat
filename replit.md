# veil-protocol

Open-source transparency repository for the Veil messenger.

## Purpose

This repo contains *only* what proves Veil's end-to-end security claims —
the cryptographic core, the server contract, and the docs / threat model.
It deliberately omits the product UI, brand assets, and business logic so
the codebase isn't useful for cloning the brand, only for auditing it.

## Architecture

- **pnpm workspace.** Single `packages/*` workspace.
- **`packages/crypto/` — `@veil-protocol/crypto`.** Framework-free TypeScript
  ESM package implementing X3DH, Double Ratchet, Sender Keys, BIP-39
  recovery, Argon2id at-rest protection, AES-GCM media encryption, safety
  numbers, and the chat envelope codec. Browser + Node compatible.
  - Primitives: `@noble/curves` (X25519/Ed25519), `@scure/bip39`,
    `hash-wasm` (Argon2id), platform WebCrypto (AES-GCM, HKDF, HMAC, SHA).
  - 40 tests across 9 files including RFC 5869 / RFC 4231 published
    vectors. Run via `pnpm --filter @veil-protocol/crypto test`.
- **`server-contract/`.** Pure TypeScript types: `schema.ts` (the only
  rows a compliant Veil server is allowed to persist) and
  `wire-format.ts` (the only request/response shapes it's allowed to
  accept/emit). The contract enforces blindness — no field can carry
  plaintext or private key material.
- **`docs/`.** Plain-Markdown spec and audit material:
  `PROTOCOL.md`, `BLIND-SERVER.md`, `THREAT-MODEL.md`, `AUDIT.md`.

## Workflow

The `Start application` workflow runs `pnpm --filter @veil-protocol/crypto
test` and prints results to console. There is no web UI.

## Continuous integration

`.github/workflows/ci.yml` runs `pnpm install`, `typecheck`, `build`, and
`test` for `@veil-protocol/crypto` on every push and pull request to
`main`, across a 3×2 matrix (Ubuntu / macOS / Windows × Node 20 / 22).
The README's green CI badge points at this workflow so the test suite —
including the published RFC 5869 / RFC 4231 vectors — is verifiable from
outside the repo.

## Security disclosure, static analysis, and dependency updates

`SECURITY.md` documents the coordinated-disclosure policy: report
to **Help@sendora.me** with subject `[VeilChat security]`, 72-hour
acknowledgement, severity tiers, supported versions, scope, and
safe harbor. Two GitHub-Actions workflows back this up:

- `.github/workflows/codeql.yml` runs CodeQL on `javascript-typescript`
  with the `security-and-quality` query suite on every push and PR to
  `main` plus a weekly Monday cron.
- `.github/dependabot.yml` opens weekly PRs (Monday 06:00 UTC) for
  the `npm` and `github-actions` ecosystems, with grouped updates for
  the crypto primitives (`@noble/*`, `@scure/*`, `hash-wasm`) and dev
  tooling (`typescript`, `vitest`, `@types/*`). Major-version bumps
  are deliberately ignored so they get human review.
- `.github/workflows/scorecard.yml` runs the OpenSSF Scorecard action
  on push to `main`, on a weekly Monday cron, and on branch-protection
  changes. Results are published to scorecard.dev (badge in the README
  links there) and uploaded as SARIF to GitHub code scanning.

Every action used in the three workflows is **pinned to a full commit
SHA** with the human-readable version tag preserved as a trailing
comment (e.g. `actions/checkout@34e1148... # v4`). Dependabot's
`github-actions` ecosystem updates the SHAs automatically. This makes
the OpenSSF Scorecard `Pinned-Dependencies` check pass and prevents
supply-chain attacks via mutable tag references.

## Public transparency statement

`TRANSPARENCY.md` is the canonical, public summary of what VeilChat
is, what this repo contains, what the service can and cannot see,
and how anyone can verify each claim. It links out to `LICENSE`,
`SECURITY.md`, `TRADEMARK.md`, the protocol docs, the server contract,
and the three CI workflows. The README's "Verify the cryptography
yourself" section now points to it. Contact for any correction is
`Help@sendora.me`.

## Brand and trademark policy

The product brand is **VeilChat** (with the underlying spec referred to
as **Veil Protocol**). The AGPL-3.0 license in `LICENSE` covers the
source code only; the names "VeilChat" / "Veil Protocol", the logo at
`brand/veilchat-logo.png`, and the associated visual identity are
reserved trademarks of the VeilChat project and are **not** licensed
under AGPL. The full policy — including permitted descriptive uses,
prohibited fork naming, and how to report abuse — lives in
`TRADEMARK.md`. The README has a "Brand and trademarks" section that
links to it. Brand-abuse reports go to `brand@veil.app`.

## Commands

- `pnpm install` — install workspace dependencies.
- `pnpm test` — run all tests across the workspace.
- `pnpm --filter @veil-protocol/crypto test` — crypto package tests only.
- `pnpm --filter @veil-protocol/crypto build` — emit `dist/` ESM build.
- `pnpm --filter @veil-protocol/crypto typecheck` — strict TypeScript check.

## License

AGPL-3.0-only.

## Notes for future work

- The repository has obsolete server secrets in `.replit` (`JWT_SECRET`,
  `REFRESH_TOKEN_SECRET`, `IDENTIFIER_HMAC_PEPPER`) left over from the
  original Veil monorepo. They aren't read anywhere in this codebase. If
  they need to be removed, use the environment-secrets tooling rather
  than editing `.replit` directly.
- The deployed Veil server itself is *not* in this repo; only the
  contract that constrains it. A reference server implementation is
  intentionally out of scope.
