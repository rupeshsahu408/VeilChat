# Security Policy

VeilChat publishes its cryptographic core in this repository so that
anyone can independently verify the security claims of the VeilChat
messenger. We take security reports seriously and we will work with
you in good faith to investigate and resolve them.

This policy describes how to report a vulnerability, what to expect
from us in response, and what is and is not in scope.

---

## Reporting a vulnerability

**Please do not open a public GitHub issue, pull request, or discussion
for security-sensitive findings.** Public disclosure before a fix is
available puts every VeilChat user at risk.

Instead, send a report to:

> **Help@sendora.me**

Use the subject line `[VeilChat security]` so we can route it quickly.
If you would like to send the report encrypted, request our PGP key in
your initial (non-sensitive) email and we will send it back to you;
include the fingerprint in any follow-up so you can verify it.

A useful report contains, at minimum:

- A short description of the issue and why you believe it is a
  vulnerability.
- The affected component (e.g. `packages/crypto/src/ratchet.ts`,
  `server-contract/wire-format.ts`, the protocol spec, etc.).
- A reproduction — ideally a minimal failing test case or a code
  snippet that demonstrates the problem.
- The version, commit SHA, or release tag the issue was found against.
- The impact you believe the issue has (confidentiality, integrity,
  availability, forward secrecy, post-compromise security, etc.).
- Any suggested mitigation, if you have one.

If you cannot share a full reproduction publicly but can share it
privately, say so and we will coordinate.

## What to expect from us

- **Acknowledgement within 72 hours** of receipt. If you have not
  heard from us in that window, please send a follow-up — your
  original report may have been caught by a spam filter.
- **An initial assessment within 7 days**, including whether we
  consider the report in scope, the severity we have assigned, and
  the rough timeline we expect to need for a fix.
- **Regular updates** at least every 14 days while the report is
  open, even if the only update is "still investigating."
- **Coordinated disclosure** once a fix is ready. We will agree on a
  publication date with you, credit you in the changelog and the
  release notes if you wish to be credited, and link to any write-up
  you choose to publish.
- **No legal action against good-faith research.** See the safe
  harbor section below.

## Severity and timelines

We use a simple four-tier model. The targets below are intent, not
contractual guarantees — a complex protocol-level finding will
sometimes take longer than a missing input check.

| Severity | Examples | Target time to fix |
|---|---|---|
| **Critical** | Ability to recover plaintext or private keys; ability to silently impersonate a user; complete break of forward secrecy | 7 days |
| **High** | Significant downgrade of post-compromise security; metadata leak the threat model says shouldn't exist; nonce reuse | 30 days |
| **Medium** | Implementation bugs that don't directly break confidentiality but weaken margins (e.g. bad randomness in non-critical paths) | 90 days |
| **Low / Informational** | Hardening suggestions, defence-in-depth improvements, documentation issues with security implications | Best effort |

## Supported versions

This repository is in active development. Until the first stable
release, we provide security fixes for the **`main` branch only**.
Once `@veil-protocol/crypto` reaches a `1.x` release on npm, we will
support the latest minor version of the current major and the last
released minor of the previous major.

| Version | Supported |
|---|---|
| `main` | ✅ |
| `0.x` published releases | ✅ (latest only) |
| Forks | ❌ — please report to the fork's maintainers |

## Scope

### In scope

- The cryptographic implementation in `packages/crypto/`.
- The server contract in `server-contract/` (schema and wire format).
- The protocol specification and threat model in `docs/`.
- The build, release, and CI configuration in `.github/workflows/`
  (e.g. supply-chain weaknesses, ability to inject artifacts into a
  release).

### Out of scope

- The VeilChat application, its UI, its server infrastructure, and
  its proprietary codebase. Those are not in this repository. If you
  have found an issue in the deployed VeilChat product, please still
  email **Help@sendora.me** — we will route it internally.
- Vulnerabilities in upstream dependencies (`@noble/curves`,
  `@scure/bip39`, `hash-wasm`, etc.) that are already publicly known
  and have a CVE — please report those upstream. We will, of course,
  upgrade promptly once a fix is published.
- Findings that require an attacker to already control the user's
  device, the user's operating system, or the user's hardware. Those
  are explicitly out of scope per the threat model.
- Best-practice or stylistic suggestions that have no security
  consequence.

## Safe harbor

If you make a good-faith effort to comply with this policy when
researching VeilChat — that is, you don't access data that isn't
yours, you don't disrupt the service, you give us reasonable time to
fix the issue before disclosing, and you don't ask for payment or use
the finding to extort us — we will not pursue legal action against
you and we will represent that your research was authorized in any
dispute that may arise.

We currently do not run a paid bug bounty program, but we acknowledge
researchers in our changelog and release notes if they wish to be
credited.

---

Thank you for helping keep VeilChat and its users safe.
