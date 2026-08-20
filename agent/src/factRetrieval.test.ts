import { describe, expect, it } from "vitest";
import { getCollegeProfile } from "./collegeKnowledge";
import { retrieveApprovedFacts } from "./factRetrieval";

describe("approved fact retrieval", () => {
  const jmc = getCollegeProfile("jmc-2026");
  it("returns the current official fee fact for a supported question", () => {
    expect(retrieveApprovedFacts(jmc, "What are the B.Com fees?").facts.join(" ")).toContain("₹28,680");
  });
  it("requires a callback for unsupported questions rather than inventing an answer", () => {
    expect(retrieveApprovedFacts(jmc, "What is your placement percentage?")).toMatchObject({ supported: false, callbackRequired: true, facts: [] });
  });
});
