import { describe, expect, it } from "vitest";
import { assessSpeechResponse, BoundedConversationState, LIVE_TURN_HANDLING } from "./runtimePolicy";

describe("real-time conversation policy", () => {
  it("keeps interruption enabled and avoids resuming obsolete speech after a caller takes the turn", () => {
    expect(LIVE_TURN_HANDLING.interruption?.enabled).toBe(true);
    expect(LIVE_TURN_HANDLING.interruption?.minDuration).toBeLessThanOrEqual(250);
    expect(LIVE_TURN_HANDLING.interruption?.resumeFalseInterruption).toBe(false);
    expect(LIVE_TURN_HANDLING.endpointing?.maxDelay).toBeLessThanOrEqual(1200);
  });

  it("rejects text that should not be sent directly to a speaking engine", () => {
    expect(assessSpeechResponse("The first-year fee is twenty-eight thousand six hundred eighty rupees.")).toEqual([]);
    expect(assessSpeechResponse("Read https://college.example/admissions and email admissions@example.edu.")).toEqual(expect.arrayContaining([
      "response contains a URL",
      "response contains an email address",
    ]));
  });

  it("keeps only bounded recent conversation context for a live speech exchange", () => {
    const state = new BoundedConversationState(2, 40);
    state.add({ role: "student", text: "First question" });
    state.add({ role: "agent", text: "First answer" });
    state.add({ role: "student", text: "Second question" });
    expect(state.recent()).toEqual([
      { role: "agent", text: "First answer" },
      { role: "student", text: "Second question" },
    ]);
  });
});
