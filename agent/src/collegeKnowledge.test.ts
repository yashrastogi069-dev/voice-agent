import { describe, expect, it } from "vitest";
import { DELHI_COLLEGE_PROFILES } from "../../server/demoContent";
import { getCollegeProfile, profileInstructions } from "./collegeKnowledge";

describe("live college-agent grounding", () => {
  it("selects only an enabled official college profile and falls back safely", () => {
    expect(getCollegeProfile("jmc-2026").institution).toContain("Jesus and Mary College");
    expect(getCollegeProfile("unknown-profile").profileId).toBe("jmc-2026");
  });

  it("puts strict live-call behavior and factual boundaries into the agent instructions", () => {
    const instructions = profileInstructions(getCollegeProfile("jmc-2026"));
    expect(instructions).toContain("Never continue an answer after the caller interrupts");
    expect(instructions).toContain("do not want to guess");
    expect(instructions).toContain("do-not-call tool immediately");
    expect(instructions).toContain("₹28,680");
    expect(instructions).toContain("begin in Hindi");
    expect(instructions).toContain("only then answer in English");
    expect(instructions).toContain("do not tell a caller to check a website");
    expect(instructions).not.toContain("Northbridge College");
  });

  it("places every approved JMC fee-document programme in the live speaking profile", () => {
    const jmc = getCollegeProfile("jmc-2026");
    expect(jmc.courses).toHaveLength(9);
    expect(jmc.courses.map(course => course.name)).toEqual(expect.arrayContaining([
      "B.A. (Hons.) Psychology",
      "B.Sc. (Hons.) Mathematics",
      "B.Voc. Retail Management and IT",
      "B.El.Ed.",
      "ITEP",
    ]));
  });
});
