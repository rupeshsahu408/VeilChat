# Threat Model

This document states *exactly* what Veil defends against, what it doesn't, and
where the trust boundaries are. Pretending to defend against attacks that the
protocol can't realistically stop would itself be a bug.

---

## In scope

### 1. Passive network attacker

**Capability.** Can observe all traffic between client and server, including
TLS metadata.

**Mitigation.** All payloads are end-to-end encrypted under per-message keys
derived from the Double Ratchet. TLS terminates at the server; the
server-to-client TLS tunnel does not weaken end-to-end secrecy.

**Result.** Attacker learns *that* Alice is talking to *some* contact at
*some* rate, but not which contact, what was said, or any media bytes.

### 2. Active network attacker (downgrade / MITM)

**Capability.** Can drop, reorder, or replay packets; can substitute their
own pre-key bundle for Bob's during the X3DH key fetch.

**Mitigation.** SPK signatures are verified by the *client*, not the server,
against `IK_ed` — which is the long-term identity material reflected in the
**safety number**. A swapped identity key produces a different safety
number, which the user is invited to verify out-of-band on first contact and
on any change.

**Result.** Replay/drop is detected by the ratchet; substitution is detected
by safety-number change.

### 3. Compromised or malicious server operator

**Capability.** Can read everything stored in the database, modify it,
selectively delay or drop messages, and answer pre-key requests with
attacker-controlled bundles.

**Mitigation.** See [BLIND-SERVER.md](./BLIND-SERVER.md). The server has no
private keys. Pre-key substitution falls under threat 2 above and is
caught by safety numbers.

**Result.** Operator learns the same metadata as a passive observer
(envelope sizes, send times, pairs of routing IDs). Operator cannot read
content, cannot impersonate users without producing a visible safety-number
change, and cannot retroactively decrypt past sessions even with full
database compromise (forward secrecy from the DH ratchet).

### 4. Stolen / lost device, attacker without the PIN

**Capability.** Has the device's IndexedDB at rest.

**Mitigation.** All sensitive material (identity keys, ratchet state,
attachment cache) is wrapped under an Argon2id-derived AES-GCM-256 key. The
PIN is never written to disk; it must be re-entered to unlock.

**Result.** Attacker faces an Argon2id offline attack against a user-chosen
PIN. PINs of ≥ 6 random digits combined with the 64 MB / t=3 / p=1
parameters give a defender-favourable cost ratio on commodity GPUs.

### 5. Stolen device with PIN coercion

**Capability.** Adversary obtains both the device and the PIN.

**Mitigation.** Out of scope for the cryptography. Veil supports a
self-destruct PIN configuration at the application layer: entering a
secondary PIN wipes local state without unlocking. Disappearing-message TTLs
limit the value of historical content.

**Result.** Future messages are compromised until the user changes
identities. Past messages are **not** automatically recoverable from the
server (it doesn't have them in plaintext) but anything still cached on
the device is exposed.

### 6. Compromise of one party's long-term identity

**Capability.** Adversary obtains Alice's long-term `IK_ed` and `IK_x`
private keys.

**Mitigation.** The DH ratchet provides **post-compromise security**: as
soon as Alice's *next* outbound DH ratchet step succeeds (the next reply
in the conversation), the attacker is locked out of subsequent messages
even if they still hold the identity key, because the new chain key
depends on a fresh ephemeral Alice generated locally.

**Result.** Past sessions are exposed up to the moment of compromise.
Future sessions self-heal one round-trip after compromise ends.

---

## Out of scope

These attacks are real, and we don't claim Veil defends against them:

- **Endpoint compromise (malware / OS compromise on the user's device).**
  If the attacker has code execution on the device while it's unlocked,
  they have everything the device has.
- **Coercion of the user (rubber-hose / legal compulsion).** Veil offers
  no plausible deniability beyond what BIP-39 phrase memorisation buys.
- **Traffic analysis.** Connection times, message sizes, and frequency
  are observable to anyone watching the network. Padding to fixed sizes
  is supported by the protocol but currently unused on the wire.
- **Group membership confidentiality from the server.** The server knows
  who is in which group, because it has to deliver. End-to-end encrypted
  group rosters (à la MLS) are a future direction, not a current claim.
- **Side-channel attacks on the WebCrypto / Argon2 implementations.** We
  trust the platform-provided AES-GCM, the audited `@noble/curves`, and
  `hash-wasm`. A timing or power-analysis side channel against any of
  those is the platform's problem, not Veil's.
- **Account-takeover via the recovery phrase.** The phrase *is* the
  identity. Anyone who has it is, by definition, the user.
- **Quantum adversaries.** X25519 and Ed25519 are not post-quantum. A
  cryptographically-relevant quantum computer is a future event that
  invalidates all current key material; the protocol does not pretend
  otherwise.

---

## Trust assumptions, summarised

| We trust...                                | Because...                                      |
| ------------------------------------------ | ----------------------------------------------- |
| Platform CSPRNG (`crypto.getRandomValues`) | Without good randomness, no protocol works.     |
| WebCrypto AES-GCM, HKDF, HMAC, SHA         | Platform-provided, FIPS-conformant.             |
| `@noble/curves` X25519/Ed25519             | Audited, widely deployed, MIT.                  |
| `hash-wasm` Argon2id                       | Reference WASM build of the OWASP recommendation. |
| `@scure/bip39`                             | Standards-conformant, audited.                  |

We **do not** trust:

- The server.
- The network.
- Any storage device once the PIN is unset or the user is logged in.
