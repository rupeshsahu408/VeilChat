import { describe, expect, it } from "vitest";
import {
  decodeGroupHeader,
  freshChainKey,
  groupDecrypt,
  groupEncrypt,
  type SenderKeyState,
} from "../src/group.js";
import { bytesToBase64 } from "../src/base64.js";

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);

function makeStates(): { sender: SenderKeyState; receiver: SenderKeyState } {
  const ck = bytesToBase64(freshChainKey());
  const base = {
    groupId: "grp-1",
    senderUserId: "alice",
    epoch: 0,
    chainKey: ck,
    n: 0,
    skipped: {},
    updatedAt: new Date().toISOString(),
  };
  return {
    sender: { ...base, skipped: {} },
    receiver: { ...base, skipped: {} },
  };
}

describe("Group sender-key chat", () => {
  it("delivers messages in order", async () => {
    const { sender, receiver } = makeStates();
    for (let i = 0; i < 4; i++) {
      const { headerB64, ciphertextB64 } = await groupEncrypt(sender, enc(`m${i}`));
      const { header, bytes } = decodeGroupHeader(headerB64);
      const ct = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
      const pt = await groupDecrypt(receiver, bytes, header, ct);
      expect(pt).not.toBeNull();
      expect(dec(pt!)).toBe(`m${i}`);
    }
  });

  it("handles out-of-order delivery within an epoch", async () => {
    const { sender, receiver } = makeStates();
    const msgs = [];
    for (let i = 0; i < 5; i++) {
      const { headerB64, ciphertextB64 } = await groupEncrypt(sender, enc(`m${i}`));
      msgs.push({ headerB64, ciphertextB64 });
    }
    // Deliver 3, 0, 1, 4, 2.
    const order = [3, 0, 1, 4, 2];
    for (const i of order) {
      const { header, bytes } = decodeGroupHeader(msgs[i]!.headerB64);
      const ct = Uint8Array.from(atob(msgs[i]!.ciphertextB64), (c) => c.charCodeAt(0));
      const pt = await groupDecrypt(receiver, bytes, header, ct);
      expect(pt).not.toBeNull();
      expect(dec(pt!)).toBe(`m${i}`);
    }
  });

  it("rejects messages that don't decrypt cleanly", async () => {
    const { sender, receiver } = makeStates();
    const { headerB64, ciphertextB64 } = await groupEncrypt(sender, enc("hello"));
    const { header, bytes } = decodeGroupHeader(headerB64);
    const ct = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
    ct[0] = (ct[0] ?? 0) ^ 0x01;
    const pt = await groupDecrypt(receiver, bytes, header, ct);
    expect(pt).toBeNull();
  });

  it("a receiver without the chain key cannot decrypt", async () => {
    const { sender } = makeStates();
    // Different (random) chain key on the receiver side — simulates someone
    // who has the ciphertext but never received the SKDM.
    const wrong: SenderKeyState = {
      groupId: "grp-1",
      senderUserId: "alice",
      epoch: 0,
      chainKey: bytesToBase64(freshChainKey()),
      n: 0,
      skipped: {},
      updatedAt: new Date().toISOString(),
    };
    const { headerB64, ciphertextB64 } = await groupEncrypt(sender, enc("secret"));
    const { header, bytes } = decodeGroupHeader(headerB64);
    const ct = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
    const pt = await groupDecrypt(wrong, bytes, header, ct);
    expect(pt).toBeNull();
  });
});
