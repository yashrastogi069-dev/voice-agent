import { describe, expect, it } from "vitest";
import { getCollegeProfile } from "./collegeKnowledge";
import { retrieveApprovedFacts } from "./factRetrieval";
import { prepareProfileSpeechText, prepareSpeechText } from "./speechText";

describe("production agent evaluations", () => {
  it("returns a verified JMC fee fact and never fabricates an unsupported fact", () => {
    const jmc = getCollegeProfile("jmc-2026");
    expect(retrieveApprovedFacts(jmc, "What are the B.Com fees?").facts.join(" ")).toContain("₹28,680");
    expect(retrieveApprovedFacts(jmc, "What is the ranking?")).toMatchObject({ supported: false, callbackRequired: true });
  });

  it("prepares college and currency text for natural speech output", () => {
    expect(prepareProfileSpeechText("jmc-2026", "JMC information")).toContain("J M C information");
    expect(prepareSpeechText("₹28,680")).toContain("twenty-eight thousand six hundred eighty rupees");
  });

  it("preserves unsupported-topic handoff rather than an invented answer", () => {
    expect(retrieveApprovedFacts(getCollegeProfile("jmc-2026"), "What is the placement percentage?")).toMatchObject({ supported: false, callbackRequired: true, facts: [] });
  });
});
