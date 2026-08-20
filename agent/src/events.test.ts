import { describe, expect, it } from "vitest";
import { buildVoiceAgentEvent } from "./events";

describe("live agent business events", () => {
  it("creates traceable callback events with the selected college profile", () => {
    const event = buildVoiceAgentEvent({
      event: "callback_requested",
      contactId: "contact-42",
      collegeProfileId: "jmc-2026",
      payload: { programmeInterest: "Economics", callbackWindow: "Saturday afternoon" },
    });
    expect(event.eventId).toMatch(/^[\da-f-]{36}$/i);
    expect(event.createdAt).toBeTruthy();
    expect(event.collegeProfileId).toBe("jmc-2026");
  });

  it("creates an immediate do-not-call event with the selected college profile", () => {
    const event = buildVoiceAgentEvent({
      event: "dnc_recorded",
      contactId: "contact-42",
      collegeProfileId: "jmc-2026",
      payload: { reason: "Caller requested no future calls" },
    });
    expect(event.event).toBe("dnc_recorded");
    expect(event.payload.reason).toContain("no future calls");
  });
});
