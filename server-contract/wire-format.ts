/**
 * server-contract / wire-format.ts
 *
 * The authoritative request/response shapes for a compliant Veil server.
 * All payloads use camelCase JSON; all binary fields are base64.
 */

/* ─────────── Auth ─────────── */

export interface RegisterRequest {
  handleHmac: string;
  passwordVerifier: string;
  identityEd25519PubB64: string;
  identityX25519PubB64: string;
  signedPreKey: {
    keyId: number;
    publicKeyB64: string;
    signatureB64: string;
  };
  oneTimePreKeys: Array<{ keyId: number; publicKeyB64: string }>;
}
export interface RegisterResponse {
  accountId: string;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  handleHmac: string;
  passwordVerifier: string;
}
export interface LoginResponse {
  accountId: string;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/* ─────────── Pre-keys ─────────── */

export interface FetchPreKeyBundleRequest {
  /** Look up by handle HMAC; the server returns the corresponding bundle. */
  peerHandleHmac: string;
}

export interface FetchPreKeyBundleResponse {
  accountId: string;
  identityEd25519PubB64: string;
  identityX25519PubB64: string;
  signedPreKey: {
    keyId: number;
    publicKeyB64: string;
    signatureB64: string;
  };
  oneTimePreKey: { keyId: number; publicKeyB64: string } | null;
}

export interface UploadOneTimePreKeysRequest {
  keys: Array<{ keyId: number; publicKeyB64: string }>;
}
export interface UploadOneTimePreKeysResponse {
  acceptedKeyIds: number[];
}

export interface RotateSignedPreKeyRequest {
  keyId: number;
  publicKeyB64: string;
  signatureB64: string;
}
export interface RotateSignedPreKeyResponse {
  acceptedKeyId: number;
}

/* ─────────── Messaging ─────────── */

export type MessageKind = "ratchet" | "prekey" | "group" | "skdm";

export interface SendMessageRequest {
  toAccountId: string;
  kind: MessageKind;
  groupId?: string | null;
  /** Opaque base64. */
  headerB64: string;
  /** Opaque base64. */
  ciphertextB64: string;
}
export interface SendMessageResponse {
  envelopeId: string;
  enqueuedAt: string;
}

export interface DrainInboxRequest {
  /** Optional cursor — server returns envelopes with id > cursor. */
  cursor?: string | null;
  /** Soft cap on returned envelopes. */
  limit?: number;
}
export interface DrainInboxResponse {
  envelopes: Array<{
    id: string;
    fromAccountId: string;
    kind: MessageKind;
    groupId: string | null;
    headerB64: string;
    ciphertextB64: string;
    enqueuedAt: string;
  }>;
  nextCursor: string | null;
}

export interface AckEnvelopesRequest {
  envelopeIds: string[];
}
export interface AckEnvelopesResponse {
  deletedCount: number;
}

/* ─────────── Groups ─────────── */

export interface CreateGroupRequest {
  initialMemberAccountIds: string[];
}
export interface CreateGroupResponse {
  groupId: string;
  epoch: number;
}

export interface ListGroupMembersResponse {
  groupId: string;
  epoch: number;
  members: Array<{ accountId: string; role: "owner" | "admin" | "member" }>;
}

export interface ModifyGroupMembersRequest {
  groupId: string;
  add: Array<{ accountId: string; role: "admin" | "member" }>;
  remove: string[];
}
export interface ModifyGroupMembersResponse {
  groupId: string;
  /** New epoch — clients re-distribute their sender-keys at this epoch. */
  epoch: number;
}

/* ─────────── Media ─────────── */

export interface BeginMediaUploadRequest {
  /** Server-visible byte length of the encrypted blob. */
  byteLength: number;
}
export interface BeginMediaUploadResponse {
  blobId: string;
  /** Pre-signed PUT URL; the bytes uploaded MUST be the encrypted blob. */
  uploadUrl: string;
  expiresAt: string;
}

export interface ResolveMediaRequest {
  blobId: string;
}
export interface ResolveMediaResponse {
  blobId: string;
  /** Pre-signed GET URL — fetches the encrypted blob bytes. */
  downloadUrl: string;
  byteLength: number;
  expiresAt: string;
}
