import { describe, expect, it } from "vitest";
import { buildOutboundDialPlan, placeLiveOutboundCall } from "./dial";

describe("outbound SIP dial planning", () => {
  it("creates a per-call room with only the profile and contact metadata required by the agent", () => {
    const plan = buildOutboundDialPlan({
      contactId: "contact-42",
      phoneNumber: "+919876543210",
      collegeProfileId: "jmc-2026",
      campaignId: "campaign-7",
      contactName: "Test Student",
    });
    expect(plan.roomName).toMatch(/^outbound-campaign-7-/);
    expect(plan.participantIdentity).toMatch(/^caller-contact-42-/);
    expect(JSON.parse(plan.participantMetadata)).toMatchObject({ collegeProfileId: "jmc-2026", contactId: "contact-42" });
  });

  it("rejects a non-E.164 number before a provider client can be created", () => {
    expect(() => buildOutboundDialPlan({ contactId: "1", phoneNumber: "9876543210", collegeProfileId: "jmc-2026", campaignId: "1" })).toThrow("E.164");
  });

  it("rejects an otherwise valid non-Indian destination before a provider client can be created", () => {
    expect(() => buildOutboundDialPlan({ contactId: "1", phoneNumber: "+14155550100", collegeProfileId: "jmc-2026", campaignId: "1" })).toThrow("Indian E.164");
  });

  it("rejects a non-Indian caller ID before LiveKit provider credentials are read", async () => {
    const previousLiveCalls = process.env.LIVE_CALLS_ENABLED;
    const previousCallerId = process.env.LIVEKIT_CALLER_ID;
    try {
      process.env.LIVE_CALLS_ENABLED = "true";
      process.env.LIVEKIT_CALLER_ID = "+14155550100";
      await expect(
        placeLiveOutboundCall({ contactId: "1", phoneNumber: "+919876543210", collegeProfileId: "jmc-2026", campaignId: "1" })
      ).rejects.toThrow("approved Indian E.164");
    } finally {
      if (previousLiveCalls === undefined) delete process.env.LIVE_CALLS_ENABLED;
      else process.env.LIVE_CALLS_ENABLED = previousLiveCalls;
      if (previousCallerId === undefined) delete process.env.LIVEKIT_CALLER_ID;
      else process.env.LIVEKIT_CALLER_ID = previousCallerId;
    }
  });
});
