/**
 * Wire envelope used as the *plaintext* of every Signal-encrypted chat
 * message. Lets us carry text, image, voice, view-once media, link
 * previews, and group control messages through the same Double Ratchet
 * pipeline without needing a separate transport per type.
 *
 * Versioning:
 *   v1 envelope = the original {text, image, voice} union.
 *   v2 envelope = same union plus extras (TTL, view-once, link preview,
 *                 reply-to) and the group-control message types.
 *
 * Backwards compatibility: an incoming plaintext that isn't valid
 * envelope JSON is treated as a v0 plain-text message.
 */

/**
 * Reference to an encrypted media blob. The server stores the
 * ciphertext at `blobId`; the AES-GCM key for that blob is carried
 * inside this envelope (which is itself Signal-encrypted), so the
 * server never sees the key or the cleartext bytes.
 */
export interface MediaAttachment {
  blobId: string;
  mime: string;
  /** Base64 32-byte AES-GCM-256 key. */
  keyB64: string;
  /** Optional client-side metadata (dimensions, duration, etc.). */
  meta?: Record<string, unknown>;
}

export interface EnvelopeLinkPreview {
  url: string;
  resolvedUrl?: string | null;
  title?: string | null;
  description?: string | null;
  siteName?: string | null;
  /**
   * Original third-party image URL. Stored only for reference/debug.
   * Renderers MUST prefer `imageDataUrl` and never fetch this directly,
   * because doing so would leak the recipient's IP to the linked site.
   */
  imageUrl?: string | null;
  /** Server-fetched OG image, inlined as a `data:` URL. */
  imageDataUrl?: string | null;
  /** Server-fetched favicon, inlined as a `data:` URL. */
  iconDataUrl?: string | null;
}

export interface EnvelopeReplyRef {
  /** Server message id of the message being replied to. */
  id: string;
  /** Short preview of the quoted body (≤ 140 chars). */
  body: string;
  dir: "in" | "out";
}

export interface EnvelopeExtras {
  /** Disappearing-message TTL, seconds. */
  ttl?: number;
  /** Sender-driven "starts when read" disappearing TTL, seconds. */
  sttl?: number;
  /** View-once flag — recipient deletes after first view. */
  vo?: boolean;
  lp?: EnvelopeLinkPreview;
  re?: EnvelopeReplyRef;
}

/** Sender-Key Distribution Message — shares a group chain key with one peer. */
export type SenderKeyDistribution = {
  v: 2;
  t: "skdm";
  gid: string;
  ep: number;
  /** Base64 32-byte initial chain key. */
  ck: string;
} & EnvelopeExtras;

/** Sender-Key Request — receiver asks the sender to re-distribute a chain key. */
export type SenderKeyRequest = {
  v: 2;
  t: "skreq";
  gid: string;
  ep: number;
};

export type DeleteForEveryone = {
  v: 2;
  t: "del";
  target: string;
};

export type ReactionEnvelope = {
  v: 2;
  t: "rxn";
  target: string;
  emoji: string;
};

export type EditMessage = {
  v: 2;
  t: "edit";
  target: string;
  body: string;
  editedAt: string;
};

export type ChatEnvelope =
  | ({ v: 1 | 2; t: "text"; body: string } & EnvelopeExtras)
  | ({
      v: 1 | 2;
      t: "image";
      body?: string;
      media: MediaAttachment;
    } & EnvelopeExtras)
  | ({ v: 1 | 2; t: "voice"; media: MediaAttachment } & EnvelopeExtras)
  | SenderKeyDistribution
  | SenderKeyRequest
  | DeleteForEveryone
  | ReactionEnvelope
  | EditMessage;

export function encodeEnvelope(env: ChatEnvelope): string {
  return JSON.stringify(env);
}

export function decodeEnvelope(plaintext: string): ChatEnvelope {
  if (!plaintext.startsWith("{")) {
    return { v: 1, t: "text", body: plaintext };
  }
  try {
    const parsed = JSON.parse(plaintext) as Partial<ChatEnvelope> & {
      v?: number;
      t?: string;
    };
    if (parsed && (parsed.v === 1 || parsed.v === 2)) {
      return parsed as ChatEnvelope;
    }
  } catch {
    /* fall through */
  }
  return { v: 1, t: "text", body: plaintext };
}
