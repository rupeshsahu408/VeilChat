# VeilChat Transparency Statement

This document is the single, public summary of **what VeilChat is, what
this repository contains, what the VeilChat service can and cannot see,
and how anyone — user, journalist, security researcher, or court — can
independently verify our claims**.

If anything below is unclear, or you find any statement here that
appears to contradict the code, please open an issue or email
**Help@sendora.me**. Honest mistakes will be corrected publicly.

---

## 1. What this repository is

This repository is the **transparency layer** of the VeilChat
messenger. It contains, in full and under [AGPL-3.0](./LICENSE):

- The **cryptographic core** that runs inside the VeilChat client
  ([`packages/crypto/`](./packages/crypto/)).
- The **server contract** — the only database rows the VeilChat
  server is permitted to persist and the only request/response shapes
  it is permitted to accept or emit ([`server-contract/`](./server-contract/)).
- The **protocol specification, threat model, and audit guide**
  ([`docs/`](./docs/)).
- The **CI, static-analysis, and supply-chain configuration** that
  re-verifies all of the above on every change
  ([`.github/workflows/`](./.github/workflows/)).

It is the same code, byte-for-byte, that ships in the VeilChat client
for the cryptographic primitives and protocol layer.

## 2. What this repository deliberately does not contain

- The VeilChat application UI, branding, marketing assets, or product
  source code.
- The VeilChat server source code, infrastructure configuration, or
  operational runbooks.
- Any user data, telemetry, analytics, or business logic.

This separation is intentional. It exists so that the public can
audit the security-critical parts of VeilChat without giving anyone
the tools to clone the brand or impersonate the product. The
[trademark policy](./TRADEMARK.md) explains the brand boundary.

## 3. What VeilChat can see, and what it cannot

This is the most important section in this document. We will be
specific. If we ever update this list, the change will appear in the
git history of this file.

### What VeilChat **cannot** see

- **The contents of your messages.** Messages are end-to-end encrypted
  using the [Double Ratchet](./docs/PROTOCOL.md) (1:1) and Sender Keys
  (group). The server has no key that can decrypt them.
- **The contents of your media** (photos, videos, voice notes,
  documents). Media is encrypted with AES-GCM keys that are themselves
  encrypted to the recipient. The server stores ciphertext only.
- **Your private identity, signed-prekey, or one-time-prekey secret
  keys.** Private keys never leave your device.
- **Your recovery passphrase.** Recovery uses BIP-39, with the seed
  protected at rest by Argon2id with parameters specified in
  [`packages/crypto/`](./packages/crypto/). The server never sees the
  passphrase or the seed.
- **The plaintext of your contact list.** Contacts are looked up via
  HMAC'd identifiers, not raw phone numbers or emails.
- **Group membership in clear.** Group state is derived client-side
  from envelopes the server cannot decrypt.

### What VeilChat **can** see (and what we do about it)

- **The IP address you connect from**, at the moment you connect, the
  same way every internet service can. Mitigated by: short connection
  logs, no permanent association between IP and account, and an option
  for users to connect through Tor or a VPN.
- **The size of encrypted blobs and the time they are sent.** Some
  metadata leak from packet size and timing is unavoidable in any
  online messenger. Mitigated by: padding to bucketed sizes (see
  [`docs/PROTOCOL.md`](./docs/PROTOCOL.md)) and by not retaining
  packet-level logs longer than is operationally necessary.
- **Account existence and a public identity key per account.** This is
  what allows two users to find each other. The server cannot derive a
  human identity (name, phone, email) from the public key alone.

### What VeilChat **does not have, by design**

- A "master key" that can decrypt user messages.
- A backdoor for law enforcement, governments, or VeilChat staff.
- A mechanism to read past messages even after compromising the
  server. (The Double Ratchet provides forward secrecy and
  post-compromise security; see the [threat model](./docs/THREAT-MODEL.md).)

If a court orders us to hand over user messages, the technical answer
is the same as the policy answer: we do not have them.

## 4. How to verify these claims yourself

You do not have to take our word for any of the above. The point of
this repository is that you can check.

### The 60-second check

```bash
git clone https://github.com/rupeshsahu408/VeilChat.git
cd VeilChat
pnpm install
pnpm --filter @veil-protocol/crypto test
```

You will see 40 tests across 9 files execute, including:

- The published **RFC 5869** test vectors for HKDF.
- The published **RFC 4231** test vectors for HMAC-SHA-256.
- End-to-end vectors for X3DH, Double Ratchet, Sender Keys, AEAD,
  recovery-phrase derivation, media encryption, safety numbers, and
  envelope encoding.

If those tests pass on your machine, the code on your machine
implements the protocol as described.

### The continuous check

Three GitHub Actions workflows re-verify this repository on every
push, every pull request, and on a weekly schedule:

- **[CI](./.github/workflows/ci.yml)** — typecheck, build, and the
  full test suite, on Ubuntu / macOS / Windows × Node 20 / 22.
- **[CodeQL](./.github/workflows/codeql.yml)** — GitHub's static
  security analyzer, with the `security-and-quality` query suite.
- **[OpenSSF Scorecard](./.github/workflows/scorecard.yml)** — scores
  the repository against industry security best practices and
  publishes the result publicly at
  [scorecard.dev](https://scorecard.dev/viewer/?uri=github.com/rupeshsahu408/VeilChat).

All three workflows pin every action they use to a full commit SHA,
so the build is reproducible and supply-chain attacks via mutable
tags are not possible.

### The contract check

Read [`server-contract/schema.ts`](./server-contract/) and
[`server-contract/wire-format.ts`](./server-contract/). These are the
**only** rows a compliant VeilChat server is permitted to store and
the **only** wire shapes it is permitted to accept or emit. If you can
find a field in either file that could carry a plaintext message or a
private key, file an issue — we consider that a security bug.

### The published-package check

Once a tagged release of `@veil-protocol/crypto` exists on npm, you
can verify — without trusting us, npm, or this repository — that the
tarball you just installed was built from this exact source by this
exact CI workflow:

```bash
npm install @veil-protocol/crypto
npm audit signatures
```

A successful run prints something like:

```
audited 1 package in 1s
1 package has a verified registry signature
1 package has a verified attestation
```

The **attestation** is a [Sigstore](https://www.sigstore.dev/) record,
signed by public-good infrastructure (not by us), that links the
published tarball back to:

- this GitHub repository,
- the exact commit SHA of the release tag,
- the exact GitHub Actions workflow run that built it
  ([`.github/workflows/release.yml`](./.github/workflows/release.yml)).

The release workflow refuses to publish at all unless three gates
pass: the git tag is GPG-signed (`git verify-tag`), the tag matches
`vMAJOR.MINOR.PATCH`, and `packages/crypto/package.json`'s version
matches the tag. So `npm audit signatures` printing "verified
attestation" is a transitive proof that all three gates passed for
the version you installed.

If `npm audit signatures` ever fails on a `@veil-protocol/crypto`
release, **do not use that install** and please report it to
**Help@sendora.me** (subject `[VeilChat security]`). It would mean
either npm has been compromised or someone has impersonated the
package — both are critical findings.

### The third-party check (planned)

A third-party security audit is planned before the `1.0` release of
`@veil-protocol/crypto`. The audit report — including any findings,
their severity, and our responses — will be published in this
repository under [`docs/AUDIT.md`](./docs/AUDIT.md). The current state
of that document is the honest current state of the audit.

## 5. Public commitments

We commit to the following, publicly and in writing here:

1. **The code in this repository is the code that runs in the VeilChat
   client** for the cryptographic primitives and protocol layer. If we
   ever ship a different implementation in the client, we will publish
   it here at the same time.
2. **All security disclosures are handled per [SECURITY.md](./SECURITY.md)**:
   72-hour acknowledgement, severity-tiered timelines, coordinated
   disclosure, researcher credit, safe harbor.
3. **All cryptographic test vectors are published** in
   [`packages/crypto/tests/`](./packages/crypto/tests/) and run in CI
   on every change.
4. **Major-version dependency updates are reviewed by a human** before
   merge (see [`.github/dependabot.yml`](./.github/dependabot.yml)).
   Patch and minor updates flow automatically with full CI gating.
5. **Security findings from CodeQL and Scorecard are public**. They
   appear in the GitHub **Security** tab of this repository and on
   scorecard.dev. We do not hide failing checks; we fix them.
6. **The brand and the code are separate.** The names "VeilChat" and
   "Veil Protocol" and the VeilChat logo are reserved trademarks
   ([`TRADEMARK.md`](./TRADEMARK.md)) so users can trust that an app
   labelled "VeilChat" is the audited build, not a fork.
7. **Out-of-scope is named, not hidden.** This document, the threat
   model, and the security policy explicitly state what we don't
   protect against (e.g. compromise of the user's own device).

## 6. What is intentionally not yet here

We will be honest about what is missing today. The following items
are on the roadmap and their absence is openly acknowledged:

- A **completed third-party audit** of the crypto package.
  Status: planned for before `1.0`.
- A **published, signed `0.1.0` release** of `@veil-protocol/crypto`
  on npm with provenance attestation. Status: release workflow is in
  place ([`.github/workflows/release.yml`](./.github/workflows/release.yml))
  and the verification path is documented above; the first signed tag
  has not yet been pushed.
- A **fuzzing harness** for the wire-format parser and the envelope
  codec. Status: planned.
- A **transparency report** detailing government data requests and
  our response to each. Status: planned once the service is live and
  we have something to report.
- A **warrant canary**. Status: under consideration; will be
  introduced if and when it becomes legally meaningful in the
  jurisdictions VeilChat operates in.

When any of these land, this document will be updated with a link
and a date.

---

## Contact

- **Security disclosures:** Help@sendora.me, subject `[VeilChat security]`.
  Full policy: [SECURITY.md](./SECURITY.md).
- **Brand abuse:** Help@sendora.me, subject `[VeilChat brand]`. Full
  policy: [TRADEMARK.md](./TRADEMARK.md).
- **Anything else, including this document:** Help@sendora.me with a
  descriptive subject.

We read every report. We respond honestly. That is the point.
