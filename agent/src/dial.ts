import { RoomServiceClient, SipClient } from "livekit-server-sdk";

export type OutboundDialInput = {
  contactId: string;
  phoneNumber: string;
  collegeProfileId: string;
  campaignId: string;
  contactName?: string;
};

export type OutboundDialPlan = {
  roomName: string;
  participantIdentity: string;
  participantMetadata: string;
};

const E164 = /^\+[1-9]\d{7,14}$/;
const INDIA_E164 = /^\+91\d{10}$/;

export function buildOutboundDialPlan(input: OutboundDialInput): OutboundDialPlan {
  if (!E164.test(input.phoneNumber)) throw new Error("A valid E.164 phone number is required.");
  if (!INDIA_E164.test(input.phoneNumber)) throw new Error("Outbound destination must be an Indian E.164 (+91) number.");
  if (!input.contactId || !input.collegeProfileId || !input.campaignId) throw new Error("Contact, college profile, and campaign identifiers are required.");
  const nonce = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  const participantIdentity = `caller-${input.contactId}-${nonce}`;
  return {
    roomName: `outbound-${input.campaignId}-${nonce}`,
    participantIdentity,
    participantMetadata: JSON.stringify({
      contactId: input.contactId,
      collegeProfileId: input.collegeProfileId,
      campaignId: input.campaignId,
      contactName: input.contactName ?? "Student",
    }),
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Live outbound calling is not configured: missing ${name}.`);
  return value;
}

function requiredIndiaCallerId(): string {
  const callerId = requiredEnv("LIVEKIT_CALLER_ID");
  if (!INDIA_E164.test(callerId)) {
    throw new Error("LIVEKIT_CALLER_ID must be an approved Indian E.164 (+91) caller ID.");
  }
  return callerId;
}

/**
 * Places a real outbound SIP call only when LIVE_CALLS_ENABLED=true. The UI must perform its own
 * consent and campaign checks before this layer is invoked; this adapter is the final provider call.
 */
export async function placeLiveOutboundCall(input: OutboundDialInput) {
  if (process.env.LIVE_CALLS_ENABLED !== "true") {
    throw new Error("Live outbound calls are disabled. Set LIVE_CALLS_ENABLED=true only after controlled-call approval.");
  }

  const callerId = requiredIndiaCallerId();
  const livekitUrl = requiredEnv("LIVEKIT_URL");
  const apiKey = requiredEnv("LIVEKIT_API_KEY");
  const apiSecret = requiredEnv("LIVEKIT_API_SECRET");
  const trunkId = requiredEnv("LIVEKIT_OUTBOUND_TRUNK_ID");
  const plan = buildOutboundDialPlan(input);
  const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  const sip = new SipClient(livekitUrl, apiKey, apiSecret);

  await roomService.createRoom({
    name: plan.roomName,
    metadata: plan.participantMetadata,
    emptyTimeout: 60,
    departureTimeout: 30,
    maxParticipants: 2,
  });

  const participant = await sip.createSipParticipant(trunkId, input.phoneNumber, plan.roomName, {
    fromNumber: callerId,
    participantIdentity: plan.participantIdentity,
    participantName: input.contactName ?? "Student",
    participantMetadata: plan.participantMetadata,
    ringingTimeout: 30,
    maxCallDuration: 900,
    waitUntilAnswered: false,
    krispEnabled: process.env.LIVEKIT_KRISP_ENABLED === "true",
  });

  return { roomName: plan.roomName, participantId: participant.participantId, participantIdentity: plan.participantIdentity };
}
