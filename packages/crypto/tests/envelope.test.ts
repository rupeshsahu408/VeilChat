import { describe, expect, it } from "vitest";
import { decodeEnvelope, encodeEnvelope } from "../src/envelope.js";

describe("Chat envelope codec", () => {
  it("round-trips a v1 text envelope", () => {
    const env = { v: 1 as const, t: "text" as const, body: "hello" };
    const back = decodeEnvelope(encodeEnvelope(env));
    expect(back).toEqual(env);
  });

  it("round-trips a v2 image envelope with TTL + reply ref", () => {
    const env = {
      v: 2 as const,
      t: "image" as const,
      body: "look",
      media: {
        blobId: "blob-1",
        mime: "image/jpeg",
        keyB64: "AAAA",
      },
      ttl: 600,
      re: { id: "msg-1", body: "what's that?", dir: "in" as const },
    };
    expect(decodeEnvelope(encodeEnvelope(env))).toEqual(env);
  });

  it("treats raw plaintext (legacy v0) as a text envelope", () => {
    const env = decodeEnvelope("just a string");
    expect(env).toEqual({ v: 1, t: "text", body: "just a string" });
  });

  it("treats malformed JSON as a text envelope", () => {
    const env = decodeEnvelope("{not json");
    expect(env).toEqual({ v: 1, t: "text", body: "{not json" });
  });
});
