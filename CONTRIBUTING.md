# Contributing to VeilChat Protocol

Thank you for your interest in improving the VeilChat protocol. This
repository is the public, audit-grade transparency layer of the
VeilChat messenger — see [TRANSPARENCY.md](./TRANSPARENCY.md) for the
full picture of what lives here and what does not.

Because every change here can affect the security guarantees of every
VeilChat user, we ask contributors to follow the process below. It is
not designed to discourage contribution — it is designed so that the
people relying on this code can keep relying on it.

---

## Before you start

- **Security findings do not go through pull requests.** If you have
  found a vulnerability, follow [SECURITY.md](./SECURITY.md) instead.
  Do not open a public issue or PR for it.
- **The brand is reserved.** You can fork and redistribute the code
  under AGPL-3.0, but you cannot ship it under the names "VeilChat",
  "Veil", or "Veil Protocol", and you cannot use the VeilChat logo.
  See [TRADEMARK.md](./TRADEMARK.md).
- **The full app is not in this repo.** Pull requests trying to add
  product features, UI, server code, or business logic will be closed
  with a pointer to the private repository. This repo is intentionally
  scoped to the protocol, the server contract, the docs, and the CI
  that verifies them.

## What kinds of contributions are welcome

- Bug fixes in `packages/crypto/`.
- New cryptographic test vectors (especially published RFC vectors
  and Wycheproof-style vectors).
- Improvements to the server contract that *narrow* what the server
  is permitted to see (never widen).
- Documentation, diagrams, FAQs, glossary entries, and translations
  of the protocol docs.
- CI hardening, fuzzing, reproducible-build improvements, and
  Scorecard-check fixes.
- Honest corrections to [TRANSPARENCY.md](./TRANSPARENCY.md) — if you
  find a statement there that the code does not back up, please
  report it.

## Developer Certificate of Origin (DCO)

Every commit in every pull request to this repository **must be
signed off** under the [Developer Certificate of Origin 1.1](https://developercertificate.org/).

The DCO is a short statement that you, the contributor, have the
right to submit your contribution under the project's license. It
reads, in full:

> Developer Certificate of Origin
> Version 1.1
>
> By making a contribution to this project, I certify that:
>
> (a) The contribution was created in whole or in part by me and I
>     have the right to submit it under the open source license
>     indicated in the file; or
>
> (b) The contribution is based upon previous work that, to the best
>     of my knowledge, is covered under an appropriate open source
>     license and I have the right under that license to submit that
>     work with modifications, whether created in whole or in part by
>     me, under the same open source license (unless I am permitted to
>     submit under a different license), as indicated in the file; or
>
> (c) The contribution was provided directly to me by some other
>     person who certified (a), (b) or (c) and I have not modified it.
>
> (d) I understand and agree that this project and the contribution
>     are public and that a record of the contribution (including all
>     personal information I submit with it, including my sign-off) is
>     maintained indefinitely and may be redistributed consistent with
>     this project or the open source license(s) involved.

We use the DCO instead of a Contributor License Agreement (CLA) on
purpose: the DCO is lightweight, well-understood, and used by the
Linux kernel, Git, Docker, GitLab, and most major OSS projects. It
keeps the IP chain clean enough to defend the AGPL license and the
VeilChat trademark without forcing contributors to sign a separate
legal document.

### How to sign off

Append a `Signed-off-by:` trailer to every commit message. The
easiest way is the `-s` / `--signoff` flag:

```bash
git commit -s -m "kdf: add RFC 5869 Test Case 4"
```

That produces a commit message ending with:

```
Signed-off-by: Your Real Name <your-email@example.com>
```

Two rules for the trailer:

1. **Use your real name.** Pseudonyms and "anonymous" sign-offs are
   not accepted because the DCO is a personal certification.
2. **Use a real, working email.** Anything you can receive mail at —
   personal or work — is fine. The email does not need to match your
   GitHub email, but it must match the email recorded in the commit
   author field (i.e., what `git config user.email` produces).

### What if I forgot to sign off?

`git commit --amend --signoff` fixes the most recent commit. For a
whole branch:

```bash
git rebase --signoff main
```

Then force-push your branch (`git push --force-with-lease`) and the
DCO check will re-run.

### Automated check

A GitHub Actions workflow ([`.github/workflows/dco.yml`](./.github/workflows/dco.yml))
runs on every pull request and **blocks merge** if any commit in the
PR is missing a valid `Signed-off-by:` trailer that matches the
commit author. The check tells you exactly which commits failed and
how to fix them.

## Pull-request process

1. **Open an issue first** for any non-trivial change so we can agree
   on the approach before you write the code. Tiny fixes (typos,
   one-line bugs) are fine to PR directly.
2. **Branch from `main`.** Keep PRs focused — one logical change per
   PR. A PR that fixes a bug *and* refactors three files is two PRs.
3. **Add or update tests.** Any change to `packages/crypto/` must
   come with tests. If you change behaviour covered by an existing
   RFC vector, the vector must still pass.
4. **Run the full check locally** before pushing:
   ```bash
   pnpm install
   pnpm --filter @veil-protocol/crypto typecheck
   pnpm --filter @veil-protocol/crypto build
   pnpm --filter @veil-protocol/crypto test
   ```
5. **Sign off every commit** as described above.
6. **Open the PR against `main`.** The CI, CodeQL, OpenSSF Scorecard,
   and DCO workflows will run automatically. All four must be green
   before merge.
7. **Be patient with reviews of crypto code.** Maintainers will read
   crypto-touching PRs carefully and may take longer than you expect.
   This is by design.

## Coding conventions

- TypeScript, strict mode, ESM only. No `any`. No `// @ts-ignore`
  without an inline justification.
- Framework-free in `packages/crypto/` — must run unmodified in
  modern browsers and in Node 20+.
- Prefer the audited primitives already in use (`@noble/curves`,
  `@scure/bip39`, `hash-wasm`, platform WebCrypto) over hand-rolled
  alternatives. If you need a primitive that isn't already a
  dependency, open an issue first.
- Constant-time comparisons for any value derived from a secret.
- No console logging of secret material, ever — not even behind a
  debug flag.
- Public API additions to `@veil-protocol/crypto` need a
  documentation update in the package README.

## Reporting non-security issues

For bugs, doc errors, or feature ideas that are not security
sensitive, please open a [GitHub Issue](https://github.com/rupeshsahu408/VeilChat/issues).
Include a minimal reproduction where possible.

For security findings, see [SECURITY.md](./SECURITY.md). For brand
abuse, see [TRADEMARK.md](./TRADEMARK.md).

---

Thanks again for contributing. Every signed-off commit makes the
verifiability story a little stronger.
