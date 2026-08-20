import { describe, expect, it } from "vitest";
import { asFixedOutcome, evaluateOutboundEligibility, isWithinIstCallingWindow } from "./voiceAgentPolicy";
import { DEMO_COLLEGE_KNOWLEDGE } from "./demoContent";
import { responseForIntent } from "./routers/voiceAgent";

const campaign = {
  status: "approved" as const,
  callingStartHour: 9,
  callingEndHour: 21,
  frequencyCap: 2,
};

const inWindow = new Date("2026-08-20T04:00:00.000Z"); // 09:30 IST

describe("outbound policy gate", () => {
  it("allows only consented, approved contacts within the IST calling window", () => {
    expect(
      evaluateOutboundEligibility({
        contact: { consentStatus: "opt_in", dnc: false },
        campaign,
        previousAttempts: 0,
        now: inWindow,
      })
    ).toEqual({ allowed: true });
  });

  it("blocks DNC contacts even if a campaign is approved", () => {
    expect(
      evaluateOutboundEligibility({
        contact: { consentStatus: "opt_in", dnc: true },
        campaign,
        previousAttempts: 0,
        now: inWindow,
      })
    ).toMatchObject({ allowed: false, reason: expect.stringContaining("do-not-call") });
  });

  it("blocks contacts without valid consent", () => {
    expect(
      evaluateOutboundEligibility({
        contact: { consentStatus: "unknown", dnc: false },
        campaign,
        previousAttempts: 0,
        now: inWindow,
      })
    ).toMatchObject({ allowed: false, reason: expect.stringContaining("consent") });
  });

  it("treats 9pm IST as outside the permitted calling window", () => {
    expect(isWithinIstCallingWindow(new Date("2026-08-20T15:30:00.000Z"))).toBe(false);
  });

  it("never returns an outcome outside the four approved classifications", () => {
    expect(asFixedOutcome("invented_outcome")).toBe("callback");
    expect(asFixedOutcome("interested")).toBe("interested");
  });

  it("falls back to a human callback instead of inventing an answer outside the approved knowledge", () => {
    const reply = responseForIntent({
      intent: "unsupported",
      courseIndex: 0,
      language: "English",
      knowledge: DEMO_COLLEGE_KNOWLEDGE,
    });
    expect(reply.outcome).toBe("callback");
    expect(reply.requiresHuman).toBe(true);
    expect(reply.source).toBe("Approved-content boundary");
    expect(reply.reply).toContain("only have approved demo information");
  });
});
