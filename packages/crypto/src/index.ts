/**
 * @veil-protocol/crypto
 *
 * The end-to-end cryptographic core of the Veil messenger. This package
 * is the *only* place real key material is touched. Everything else —
 * the server, the UI, the storage layer — sees ciphertext or opaque
 * keypair handles, never plaintext.
 *
 * Layout:
 *   - base64 / kdf / aead         — primitive helpers
 *   - x25519 / identity            — long-term keys + ECDH
 *   - x3dh                         — initial key agreement
 *   - ratchet                      — Double Ratchet state machine
 *   - session                      — pure helpers that compose X3DH+ratchet
 *   - group                        — sender-key group chats
 *   - mediaCrypto                  — per-blob AES-GCM for attachments
 *   - safetyNumber                 — Signal-style fingerprint pair
 *   - argon2 / recoveryPhrase      — at-rest key protection + restore
 *   - envelope                     — versioned plaintext payload format
 */

export * from "./base64.js";
export * from "./kdf.js";
export * from "./aead.js";
export * from "./x25519.js";
export * from "./identity.js";
export * from "./x3dh.js";
export * from "./ratchet.js";
export * from "./session.js";
export * from "./group.js";
export * from "./mediaCrypto.js";
export * from "./safetyNumber.js";
export * from "./argon2.js";
export * from "./recoveryPhrase.js";
export * from "./envelope.js";
