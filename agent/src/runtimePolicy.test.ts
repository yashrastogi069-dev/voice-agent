import { describe, expect, it } from "vitest";
import { assessSpeechResponse, LIVE_TURN_HANDLING } from "./runtimePolicy";

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
});
