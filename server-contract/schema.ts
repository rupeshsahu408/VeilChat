/**
 * server-contract / schema.ts
 *
 * The exhaustive list of persistent records a compliant Veil server is
 * allowed to store. Anything else is a contract violation.
 *
 * The single rule: NO field below carries plaintext message content or
 * any private key material. `ciphertext` and `keyB64` are explicitly
 * called out as opaque blobs — the server treats them as bytes only.
 */

/* ─────────── Accounts & identity ─────────── */

export interface AccountRecord {
  /** Server-side UUIDv4. NEVER derived from a phone number / email / handle. */
  id: string;
  /**
   * HMAC-SHA-256 of the normalized handle under a server-side pepper.
   * The server cannot reverse this back to the handle, but two clients
   * who submit the same handle hit the same row.
   */
  handleHmac: string;
  /** Argon2id-hashed password verifier (or null when using OIDC). */
  passwordHash: string | null;
  /** ISO timestamp of account creation. */
  createdAt: string;
}

export interface IdentityRecord {
  accountId: string;
  /** Base64 32-byte Ed25519 identity public key. */
  identityEd25519PubB64: string;
  /** Base64 32-byte X25519 identity public key. */
  identityX25519PubB64: string;
  /** Updated when the user rotates identities (rare). */
  updatedAt: string;
}

/* ─────────── Pre-keys ─────────── */

export interface SignedPreKeyRecord {
  accountId: string;
  /** Client-chosen, monotonically-rising key id. */
  keyId: number;
  /** Base64 32-byte X25519 public key. */
  publicKeyB64: string;
  /** Base64 64-byte Ed25519 signature over `publicKeyB64`. */
  signatureB64: string;
  uploadedAt: string;
  /** When this SPK was superseded (so initial messages mid-rotation still resolve). */
  retiredAt: string | null;
}

export interface OneTimePreKeyRecord {
  accountId: string;
  keyId: number;
  /** Base64 32-byte X25519 public key. Consumed at most once. */
  publicKeyB64: string;
  /** Set when the OPK is fetched by an initiator and removed from the queue. */
  consumedAt: string | null;
}

/* ─────────── Messages ─────────── */

/**
 * An opaque envelope queued for delivery. The server cannot read or
 * synthesise `ciphertextB64`; it is produced exclusively by the sender's
 * Double Ratchet (or the group sender-key chain).
 */
export interface MessageEnvelopeRecord {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  /**
   * One of:
   *   - "ratchet"  — 1:1 Double Ratchet message.
   *   - "prekey"   — first 1:1 message; carries an X3DH PreKeyMessage header.
   *   - "group"    — group sender-key message.
   *   - "skdm"     — Sender-Key Distribution Message tunnelled in a 1:1 ratchet.
   */
  kind: "ratchet" | "prekey" | "group" | "skdm";
  /** Optional, only for "group" / "skdm". */
  groupId: string | null;
  /** Opaque base64 ciphertext. */
  ciphertextB64: string;
  /** Opaque base64 wire header (ratchet header, prekey envelope, etc.). */
  headerB64: string;
  enqueuedAt: string;
  /** Set on successful delivery — the row is then deleted. */
  deliveredAt: string | null;
}

/* ─────────── Groups ─────────── */

export interface GroupRecord {
  id: string;
  /** Monotonic epoch counter. Bumped on any membership change. */
  epoch: number;
  createdAt: string;
}

export interface GroupMemberRecord {
  groupId: string;
  accountId: string;
  /** "owner" | "admin" | "member". Server uses this only for permissions, not crypto. */
  role: "owner" | "admin" | "member";
  /** Epoch at which this member was added — used for SKDM redistribution. */
  joinedAtEpoch: number;
  /** Set on removal; row may be tombstoned. */
  removedAt: string | null;
}

/* ─────────── Media ─────────── */

/**
 * Encrypted media blob storage. The server only ever sees the ciphertext.
 * The 32-byte AES key is delivered to the recipient inside a ratchet-
 * encrypted chat envelope, never via this row.
 */
export interface MediaBlobRecord {
  blobId: string;
  ownerAccountId: string;
  /** Bytes are stored externally (S3/disk). This is a content reference. */
  storageRef: string;
  byteLength: number;
  createdAt: string;
  /** TTL-driven cleanup. Compliant servers cap at 30 days for undelivered. */
  expiresAt: string;
}

/* ─────────── Auth state ─────────── */

export interface RefreshTokenRecord {
  id: string;
  accountId: string;
  /** Argon2id hash of the refresh token (server stores hash only). */
  tokenHash: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}
