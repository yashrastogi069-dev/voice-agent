import { createHmac, timingSafeEqual } from "node:crypto";

export const LIVE_CALL_STATUSES = ["queued", "dialing", "ringing", "answered", "completed", "no_answer", "busy", "failed", "cancelled"] as const;
export type LiveCallStatus = typeof LIVE_CALL_STATUSES[number];

export type ProviderCallEvent = {
  roomName: string;
  providerEventId?: string;
  status: LiveCallStatus;
  rawPayload: Record<string, unknown>;
  ended: boolean;
};

const statusMap: Record<string, LiveCallStatus> = {
  dialing: "dialing",
  initiated: "dialing",
  queued: "dialing",
  ringing: "ringing",
  answered: "answered",
  accepted: "answered",
  active: "answered",
  in_progress: "answered",
  completed: "completed",
  complete: "completed",
  ended: "completed",
  disconnected: "completed",
  hangup: "completed",
  no_answer: "no_answer",
  unanswered: "no_answer",
  busy: "busy",
  failed: "failed",
  error: "failed",
  canceled: "cancelled",
  cancelled: "cancelled",
};

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function normalizeProviderCallEvent(payload: Record<string, unknown>): ProviderCallEvent {
  const roomName = nonEmptyString(payload.roomName) ?? nonEmptyString(payload.room_name) ?? nonEmptyString(payload.room);
  if (!roomName) throw new Error("Provider event is missing the LiveKit room name.");
  const rawStatus = nonEmptyString(payload.status) ?? nonEmptyString(payload.event) ?? nonEmptyString(payload.callStatus) ?? "";
  const status = statusMap[rawStatus.toLowerCase().replaceAll("-", "_")];
  if (!status) throw new Error("Provider event contains an unsupported call status.");
  return {
    roomName,
    providerEventId: nonEmptyString(payload.providerEventId) ?? nonEmptyString(payload.eventId) ?? nonEmptyString(payload.callId) ?? nonEmptyString(payload.call_id),
    status,
    rawPayload: payload,
    ended: ["completed", "no_answer", "busy", "failed", "cancelled"].includes(status),
  };
}

export function providerEventSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyProviderEventSignature(rawBody: string, signature: string | undefined, secret: string | undefined): boolean {
  if (!signature || !secret) return false;
  const expected = Buffer.from(providerEventSignature(rawBody, secret), "hex");
  const actual = Buffer.from(signature.trim().replace(/^sha256=/i, ""), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
