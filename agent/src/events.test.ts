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
});
