import { describe, expect, it } from "vitest";
import { DELHI_COLLEGE_PROFILES } from "../../server/demoContent";
import { getCollegeProfile, profileInstructions } from "./collegeKnowledge";

describe("live college-agent grounding", () => {
  it("selects only an enabled official college profile and falls back safely", () => {
    expect(getCollegeProfile("jmc-2026").institution).toContain("Jesus and Mary College");
    expect(getCollegeProfile("unknown-profile").profileId).toBe(DELHI_COLLEGE_PROFILES[0].profileId);
  });

  it("puts strict live-call behavior and factual boundaries into the agent instructions", () => {
    const instructions = profileInstructions(getCollegeProfile("jmc-2026"));
    expect(instructions).toContain("Never continue an answer after the caller interrupts");
    expect(instructions).toContain("do not want to guess");
    expect(instructions).toContain("do-not-call tool immediately");
    expect(instructions).toContain("₹28,680");
    expect(instructions).not.toContain("Northbridge College");
  });
});
