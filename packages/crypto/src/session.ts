/**
 * Session helpers — pure-function wrappers that compose X3DH +
 * Double-Ratchet for the common "send first message" / "receive first
 * message" cases.
 *
 * These helpers contain no I/O, no DB, no tRPC, no clock. They take
 * inputs in / return outputs out so they can be unit-tested with
 * deterministic vectors.
 */

import type { X25519KeyPair } from "./x25519.js";
import { x3dhInitiate, x3dhRespond } from "./x3dh.js";
import {
  initRatchetAlice,
  initRatchetBob,
  ratchetEncrypt,
  ratchetDecrypt,
  type RatchetState,
  type EncryptedRatchetMessage,
  type MessageHeader,
} from "./ratchet.js";

export interface PreKeyBundle {
  identityX25519Pub: Uint8Array;
  identityEd25519Pub: Uint8Array;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  oneTimePreKey: { keyId: number; publicKey: Uint8Array } | null;
}

export interface InitiatorSendInput {
  myIdentityX25519: X25519KeyPair;
  peerBundle: PreKeyBundle;
  plaintext: Uint8Array;
  /** Optional bytes mixed into the AEAD AD (e.g. encoded header). */
  extraAd?: Uint8Array;
}

export interface InitiatorSendOutput {
  state: RatchetState;
  message: EncryptedRatchetMessage;
  /** PreKeyMessage metadata the responder needs to reproduce X3DH. */
  preKeyEnvelope: {
    ephemeralPublicKey: Uint8Array;
    usedSignedPreKeyId: number;
    usedOneTimePreKeyId: number | null;
  };
}

/** Initiator path: do X3DH, set up ratchet, encrypt one message. */
export async function initiatorSendFirstMessage(
  input: InitiatorSendInput,
): Promise<InitiatorSendOutput> {
  const x3 = await x3dhInitiate({
    myIdentityX25519: input.myIdentityX25519,
    peerIdentityX25519Pub: input.peerBundle.identityX25519Pub,
    peerIdentityEd25519Pub: input.peerBundle.identityEd25519Pub,
    peerSignedPreKey: input.peerBundle.signedPreKey,
    peerOneTimePreKey: input.peerBundle.oneTimePreKey,
  });
  const state = await initRatchetAlice({
    rootKey: x3.sharedSecret,
    peerSignedPreKeyPub: input.peerBundle.signedPreKey.publicKey,
    associatedData: x3.associatedData,
  });
  const message = await ratchetEncrypt(
    state,
    input.plaintext,
    input.extraAd ?? new Uint8Array(),
  );
  return {
    state,
    message,
    preKeyEnvelope: {
      ephemeralPublicKey: x3.ephemeral.publicKey,
      usedSignedPreKeyId: x3.usedSignedPreKeyId,
      usedOneTimePreKeyId: x3.usedOneTimePreKeyId,
    },
  };
}

export interface ResponderReceiveInput {
  myIdentityX25519: X25519KeyPair;
  mySignedPreKey: X25519KeyPair;
  myOneTimePreKey: X25519KeyPair | null;
  peerIdentityX25519Pub: Uint8Array;
  peerEphemeralPub: Uint8Array;
  message: { header: MessageHeader; ciphertext: Uint8Array };
  extraAd?: Uint8Array;
}

export interface ResponderReceiveOutput {
  state: RatchetState;
  plaintext: Uint8Array;
}

/** Responder path: derive X3DH, init ratchet, decrypt the first message. */
export async function responderReceiveFirstMessage(
  input: ResponderReceiveInput,
): Promise<ResponderReceiveOutput> {
  const x3 = await x3dhRespond({
    myIdentityX25519: input.myIdentityX25519,
    mySignedPreKey: input.mySignedPreKey,
    myOneTimePreKey: input.myOneTimePreKey,
    peerIdentityX25519Pub: input.peerIdentityX25519Pub,
    peerEphemeralPub: input.peerEphemeralPub,
  });
  const state = initRatchetBob({
    rootKey: x3.sharedSecret,
    mySignedPreKey: input.mySignedPreKey,
    associatedData: x3.associatedData,
  });
  const plaintext = await ratchetDecrypt(
    state,
    input.message.header,
    input.message.ciphertext,
    input.extraAd ?? new Uint8Array(),
  );
  return { state, plaintext };
}
