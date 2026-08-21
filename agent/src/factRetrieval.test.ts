import { describe, expect, it } from "vitest";
import { getCollegeProfile } from "./collegeKnowledge";
import { buildApprovedFinancialAssistanceReply, buildApprovedStudentConversationReply, buildTurnGrounding, retrieveApprovedFacts } from "./factRetrieval";

describe("approved fact retrieval", () => {
  const jmc = getCollegeProfile("jmc-2026");
  it("returns the current official fee fact for a supported question", () => {
    expect(retrieveApprovedFacts(jmc, "What are the B.Com fees?").facts.join(" ")).toContain("₹28,680");
  });
  it("answers a natural Hindi question with the selected B.Voc fee rather than the default programme", () => {
    expect(retrieveApprovedFacts(jmc, "बी वॉक हेल्थकेयर मैनेजमेंट की फीस कितनी है?").facts.join(" ")).toContain("₹37,070");
  });
  it("selects B.Com. Honours, including the dotted Hindi Console phrasing, instead of the first fee entry", () => {
    const reply = buildApprovedFinancialAssistanceReply(jmc, "बी.कॉम ऑनर्स की फीस और स्कॉलरशिप के बारे में बताइए।") ?? "";
    expect(reply).toContain("B.Com. (Hons.)");
    expect(reply).not.toContain("B.A. (Hons.) Economics:");
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
  it("grounds scholarship answers in all approved support options without a premature admissions-team referral", () => {
    const grounding = buildTurnGrounding(jmc, "बी.कॉम ऑनर्स की फीस और स्कॉलरशिप के बारे में बताइए। ");
    expect(grounding).toContain("fee concession");
    expect(grounding).toContain("Student's Aid Fund");
    expect(grounding).toContain("Book Bank Scheme");
    expect(grounding).toContain("cannot confirm this caller's eligibility");
    expect(grounding).toContain("Do not mention an admissions team");
  });
  it("answers a fee-and-scholarship question concisely without withholding the named course fee", () => {
    const reply = buildApprovedFinancialAssistanceReply(jmc, "बी.कॉम ऑनर्स की फीस और स्कॉलरशिप के बारे में बताइए। ");
    expect(reply).toContain("₹28,680");
    expect(reply).toContain("व्यक्तिगत पात्रता");
    expect(reply).not.toContain("fee concession");
    expect(reply).not.toContain("Student's Aid Fund");
    expect(reply?.length).toBeLessThan(350);
    expect(reply?.toLowerCase()).not.toContain("admissions team");
  });
  it("builds detailed approved Hindi paths for admission, payment follow-up, duration, courses, fees, and a broad follow-up", () => {
    const admission = buildApprovedStudentConversationReply(jmc, "Admission process के बारे में बताओ।") ?? "";
    expect(admission).toContain("CUET-UG");
    expect(admission).toContain("CSAS");
    expect(admission).not.toContain("50 प्रतिशत");
    expect(admission).not.toMatch(/आप चाहें|Would you/);
    expect(admission.toLowerCase()).not.toContain("website");

    const payment = buildApprovedStudentConversationReply(jmc, "Yes, please. कैसे pay करनी हैं?", ["बी.कॉम ऑनर्स की फीस कितनी है?"]) ?? "";
    expect(payment).toContain("online payment system");
    expect(payment).toContain("examination fee");
    expect(payment).not.toMatch(/आप किस|Which programme/);

    const duration = buildApprovedStudentConversationReply(jmc, "तो ये कितने साल का course हैं?") ?? "";
    expect(duration).toContain("four years");
    expect(duration).toContain("B.El.Ed.");

    const courses = buildApprovedStudentConversationReply(jmc, "कौन-कौन से courses हैं?") ?? "";
    expect(courses).toContain("B.A. Honours");
    expect(courses).toContain("Retail Management and IT");

    const fees = buildApprovedStudentConversationReply(jmc, "फीस कितनी है?") ?? "";
    expect(fees).toContain("₹37,070");
    expect(fees).toContain("₹51,730");

    const overview = buildApprovedStudentConversationReply(jmc, "तो मैं और क्या-क्या पता हैं?") ?? "";
    expect(overview).toContain("CUET-UG");
    expect(overview).toContain("scholarship");
  });
  it("requires a callback for unsupported questions rather than inventing an answer", () => {
    expect(retrieveApprovedFacts(jmc, "What is your placement percentage?")).toMatchObject({ supported: false, callbackRequired: true, facts: [] });
  });
});
