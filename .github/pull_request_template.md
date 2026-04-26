<!--
Thanks for opening a pull request to VeilChat Protocol.

Before you submit, please make sure you have read CONTRIBUTING.md and,
if your change has any security implications, SECURITY.md. Pull
requests that look like security findings will be closed and the
reporter asked to email Help@sendora.me instead — see SECURITY.md.

Fill out the sections below. Delete sections that don't apply.
-->

## Summary

<!-- One or two sentences describing what this PR changes and why. -->

## Type of change

<!-- Tick exactly one. -->

- [ ] Bug fix (no behaviour change for callers using documented APIs)
- [ ] New cryptographic test vector (RFC, Wycheproof, or upstream)
- [ ] Server-contract change that *narrows* what the server may see
- [ ] Documentation, diagram, FAQ, or glossary update
- [ ] CI / supply-chain hardening (workflows, Dependabot, Scorecard, DCO, etc.)
- [ ] Refactor with no functional change
- [ ] Other (please describe)

## Scope

<!-- Which area(s) does this touch? -->

- [ ] `packages/crypto/`
- [ ] `server-contract/`
- [ ] `docs/`
- [ ] `.github/` (CI, workflows, Dependabot, templates)
- [ ] Public trust docs (`README.md`, `SECURITY.md`, `TRADEMARK.md`, `TRANSPARENCY.md`, `CONTRIBUTING.md`)
- [ ] Other (please describe)

## Security considerations

<!--
For any change that touches packages/crypto/ or server-contract/,
describe the security impact even if you believe it is "none".

Specifically:
  - Does this change any cryptographic primitive, key derivation, or
    encoding format?
  - Does this change what the server can observe?
  - Does this change the threat model in docs/THREAT-MODEL.md?
  - Does this introduce a new dependency? If yes, why does its
    inclusion not weaken the audit story?

If your change is documentation-only and has no security impact,
write "Documentation-only; no security impact."
-->

## Testing

<!--
For changes to packages/crypto/, every PR must add or update tests.

  - What did you add?
  - What does the new test prove?
  - Did the full suite pass locally?

Paste the tail of `pnpm --filter @veil-protocol/crypto test` output if
you can.
-->

- [ ] `pnpm --filter @veil-protocol/crypto typecheck` passes locally
- [ ] `pnpm --filter @veil-protocol/crypto build` passes locally
- [ ] `pnpm --filter @veil-protocol/crypto test` passes locally
- [ ] Tests added or updated for the change (N/A for docs-only / CI-only)

## Related issues

<!--
Link any issues this PR addresses. Use the GitHub keywords
"Closes #123" or "Fixes #456" so the issue auto-closes on merge.
If your change is non-trivial and there is no issue, please open one
first per CONTRIBUTING.md.
-->

## Pre-merge checklist

- [ ] **Every commit is signed off** (`Signed-off-by:` trailer present, matching commit author). The DCO check will block merge otherwise.
- [ ] PR title is descriptive (it will appear in the changelog).
- [ ] No secrets, tokens, or private key material in the diff.
- [ ] No `console.log` of secret material introduced.
- [ ] No `// @ts-ignore` or `as any` added without an inline justification.
- [ ] If a public API was added or changed, the package README is updated.
- [ ] If the threat model changed, `docs/THREAT-MODEL.md` is updated in the same PR.
- [ ] If a new dependency was added, it is reflected in `pnpm-lock.yaml` and listed in `packages/crypto/package.json` (if scoped to the crypto package).

## Anything else reviewers should know

<!--
Trade-offs you weighed, alternatives you rejected and why, follow-up
work you intend to do in a separate PR, etc. Maintainers reviewing
crypto code value this section a lot.
-->
