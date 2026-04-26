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
- `.github/workflows/dco.yml` runs on every pull request (opened,
  synchronized, reopened, edited). It enumerates every non-merge
  commit in `BASE_SHA..HEAD_SHA` and requires each to carry a
  `Signed-off-by: <author-name> <author-email>` trailer that matches
  the commit's `git log` author, OR (for cherry-picks / co-authors) a
  well-formed `Signed-off-by:` from any contributor. Failure mode
  prints the offending SHAs and the exact `git commit --amend
  --signoff` / `git rebase --signoff` recovery commands. The check is
  implemented inline in bash (no third-party action) for full
  auditability and zero supply-chain surface.
- `.github/workflows/release.yml` triggers on `v*.*.*` git-tag pushes.
  It refuses to publish unless (a) the tag matches `vMAJOR.MINOR.PATCH`,
  (b) `git verify-tag` succeeds (i.e. the tag is GPG-signed), and
  (c) `packages/crypto/package.json`'s version matches the tag. It then
  runs typecheck + the full test suite, builds, and publishes
  `@veil-protocol/crypto` to npm via `pnpm publish --access public
  --provenance` using OIDC (`id-token: write`) so npm records a
  cryptographic attestation linking the tarball back to this exact
  workflow run. Finally it creates a GitHub Release with auto-generated
  notes. Requires repo secret `NPM_TOKEN` (an npm automation token with
  publish rights to the `@veil-protocol` scope) and a `npm-publish`
  GitHub Environment so production publishes can be gated by required
  reviewers if desired.

Every action used in the three workflows is **pinned to a full commit
SHA** with the human-readable version tag preserved as a trailing
comment (e.g. `actions/checkout@34e1148... # v4`). Dependabot's
`github-actions` ecosystem updates the SHAs automatically. This makes
the OpenSSF Scorecard `Pinned-Dependencies` check pass and prevents
supply-chain attacks via mutable tag references.

## Contributor process

`CONTRIBUTING.md` documents the contribution process. Headline
requirements: every commit must be signed off under the Developer
Certificate of Origin 1.1 (`git commit -s`); PRs touching
`packages/crypto/` must add or update tests; security findings go
through `SECURITY.md` and never through public PRs; the four checks
that gate merge are CI, CodeQL, OpenSSF Scorecard, and DCO. The README
has a "Contributing" section pointing at it. The DCO is intentionally
chosen over a CLA — it is sufficient to keep the IP chain clean for
AGPL enforcement and trademark defence without imposing a separate
legal document on contributors.

## Repository governance: CODEOWNERS, PR template, issue templates

- `.github/CODEOWNERS` declares ownership for every security-critical
  path (the crypto package and its tests, the server contract, the
  docs, the public trust documents, the brand assets, the CI / release
  pipeline, and workspace dependency files). All paths currently route
  to `@rupeshsahu408`; the file is structured so adding a maintainer
  team later (e.g. `@veilchat/protocol-maintainers`) is a one-line
  change. Combined with branch-protection's "Require review from Code
  Owners" setting, owner review on these paths is non-bypassable.
- `.github/pull_request_template.md` enforces a structured PR: type
  of change, scope, security considerations (mandatory for
  `packages/crypto/` and `server-contract/`), testing checklist,
  related issues, pre-merge checklist (DCO sign-off, no secrets, no
  unjustified `@ts-ignore`, README updates for public API changes,
  threat-model updates when the threat model changes).
- `.github/ISSUE_TEMPLATE/` contains three structured forms
  (`bug_report.yml`, `rfc_vector.yml`, `documentation.yml`) plus a
  `config.yml` that disables blank issues and surfaces four contact
  links: security disclosure (redirect to `SECURITY.md` /
  `Help@sendora.me`), brand abuse (redirect to `TRADEMARK.md` /
  `Help@sendora.me`), the transparency statement, and the
  contribution guide. The bug-report form opens with a hard-stop
  warning and a required checkbox confirming the report is not a
  security finding.

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
