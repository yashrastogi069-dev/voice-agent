import { describe, expect, it } from "vitest";
import {
  assessSpeechResponse,
  BoundedConversationState,
  LIVE_ROOM_INPUT_OPTIONS,
  LIVE_TURN_HANDLING,
  LIVE_USER_AWAY_TIMEOUT_SECONDS,
  LIVE_WORKER_IDLE_PROCESSES,
} from "./runtimePolicy";

describe("real-time conversation policy", () => {
  it("keeps enough post-greeting silence for a normal phone caller to begin speaking", () => {
    expect(LIVE_USER_AWAY_TIMEOUT_SECONDS).toBe(45);
  });

  it("does not end a live agent session solely because a caller briefly disconnects", () => {
    expect(LIVE_ROOM_INPUT_OPTIONS.closeOnDisconnect).toBe(false);
  });

  it("keeps a single warm worker process in the constrained live-test environment", () => {
    expect(LIVE_WORKER_IDLE_PROCESSES).toBe(1);
  });

  it("keeps interruption enabled and avoids resuming obsolete speech after a caller takes the turn", () => {
    expect(LIVE_TURN_HANDLING.interruption?.enabled).toBe(true);
    expect(LIVE_TURN_HANDLING.interruption?.minDuration).toBeLessThanOrEqual(250);
    expect(LIVE_TURN_HANDLING.interruption?.resumeFalseInterruption).toBe(false);
    expect(LIVE_TURN_HANDLING.endpointing?.maxDelay).toBeLessThanOrEqual(1200);
  });

  it("waits for a completed user turn before generating a reply so approved-fact routing can take precedence", () => {
    expect(LIVE_TURN_HANDLING.preemptiveGeneration).toEqual({ enabled: false });
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
