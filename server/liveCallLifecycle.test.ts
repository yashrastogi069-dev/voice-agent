import { describe, expect, it } from "vitest";
import { normalizeProviderCallEvent, providerEventSignature, verifyProviderEventSignature } from "./liveCallLifecycle";

describe("provider call lifecycle", () => {
  it("normalizes accepted events into an answered call", () => {
    expect(normalizeProviderCallEvent({ room_name: "outbound-3-test", event: "accepted", call_id: "carrier-1" })).toMatchObject({ roomName: "outbound-3-test", providerEventId: "carrier-1", status: "answered", ended: false });
  });

  it("normalizes terminal no-answer, busy, and completion events", () => {
    expect(normalizeProviderCallEvent({ roomName: "outbound-3-test", status: "no-answer" })).toMatchObject({ status: "no_answer", ended: true });
    expect(normalizeProviderCallEvent({ roomName: "outbound-3-test", status: "busy" })).toMatchObject({ status: "busy", ended: true });
    expect(normalizeProviderCallEvent({ roomName: "outbound-3-test", status: "failed" })).toMatchObject({ status: "failed", ended: true });
    expect(normalizeProviderCallEvent({ roomName: "outbound-3-test", status: "completed" })).toMatchObject({ status: "completed", ended: true });
  });

  it("requires a room name and recognized provider status", () => {
    expect(() => normalizeProviderCallEvent({ status: "ringing" })).toThrow("room name");
    expect(() => normalizeProviderCallEvent({ roomName: "outbound-3-test", status: "invented" })).toThrow("unsupported");
  });

  it("validates timing-safe HMAC signatures", () => {
    const raw = '{"roomName":"outbound-3-test","status":"ringing"}';
    const signature = providerEventSignature(raw, "test-secret");
    expect(verifyProviderEventSignature(raw, `sha256=${signature}`, "test-secret")).toBe(true);
    expect(verifyProviderEventSignature(raw, signature, "wrong-secret")).toBe(false);
  });
});
