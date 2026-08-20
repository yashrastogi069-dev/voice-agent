import { describe, expect, it } from "vitest";
import { buildOutboundDialPlan } from "./dial";

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
});
