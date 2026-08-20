import { describe, expect, it } from "vitest";
import { getCollegeProfile } from "./collegeKnowledge";
import { retrieveApprovedFacts } from "./factRetrieval";

describe("approved fact retrieval", () => {
  const jmc = getCollegeProfile("jmc-2026");
  it("returns the current official fee fact for a supported question", () => {
    expect(retrieveApprovedFacts(jmc, "What are the B.Com fees?").facts.join(" ")).toContain("₹28,680");
  });
  it("answers a natural Hindi question with the selected B.Voc fee rather than the default programme", () => {
    expect(retrieveApprovedFacts(jmc, "बी वॉक हेल्थकेयर मैनेजमेंट की फीस कितनी है?").facts.join(" ")).toContain("₹37,070");
  });
  it("recognizes Hindi admissions and programme questions", () => {
    expect(retrieveApprovedFacts(jmc, "कौन-कौन से कोर्स हैं?")).toMatchObject({ supported: true, topic: "programmes" });
    expect(retrieveApprovedFacts(jmc, "एडमिशन कब शुरू होगा?")).toMatchObject({ supported: true, topic: "admissions" });
  });
  it("returns a useful approved overview for a broad Hindi information request", () => {
    const result = retrieveApprovedFacts(jmc, "मुझे कॉलेज के बारे में जानकारी चाहिए");
    expect(result).toMatchObject({ supported: true, callbackRequired: false, topic: "overview" });
    expect(result.facts.join(" ")).toContain("B.Com. (Hons.)");
  });
  it("lists fees across approved programmes when a course is not specified", () => {
    const result = retrieveApprovedFacts(jmc, "फीस कितनी है?");
    expect(result.facts.join(" ")).toContain("₹37,070");
    expect(result.facts.join(" ")).toContain("₹28,680");
  });
  it("answers verified JMC questions on CUET, CSAS, minority seats, payment, and added programme fees", () => {
    expect(retrieveApprovedFacts(jmc, "Is CUET required?")).toMatchObject({ supported: true, callbackRequired: false, topic: "cuet" });
    expect(retrieveApprovedFacts(jmc, "CSAS form कैसे भरना है?")).toMatchObject({ supported: true, callbackRequired: false, topic: "csas" });
    expect(retrieveApprovedFacts(jmc, "Christian minority seats कितनी हैं?")).toMatchObject({ supported: true, callbackRequired: false, topic: "minority-seats" });
    expect(retrieveApprovedFacts(jmc, "Psychology fees कितनी है?").facts.join(" ")).toContain("₹29,180");
    expect(retrieveApprovedFacts(jmc, "fees का payment कैसे करें?")).toMatchObject({ supported: true, callbackRequired: false, topic: "fee-payment" });
  });
  it("requires a callback for unsupported questions rather than inventing an answer", () => {
    expect(retrieveApprovedFacts(jmc, "What is your placement percentage?")).toMatchObject({ supported: false, callbackRequired: true, facts: [] });
  });
});
