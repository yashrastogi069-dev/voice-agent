import { describe, expect, it } from "vitest";
import { getCollegeProfile } from "./collegeKnowledge";
import { buildTurnGrounding, retrieveApprovedFacts } from "./factRetrieval";

const jmc = getCollegeProfile("jmc-2026");

describe("prospective-student JMC knowledge journey", () => {
  const supportedScenarios = [
    { question: "JMC में B.Voc Healthcare Management की फीस कितनी है?", topic: "fees", expected: "₹37,070" },
    { question: "Psychology Honours की first-year fees क्या है?", topic: "fees", expected: "₹29,180" },
    { question: "क्या examination fee इस amount में शामिल है?", topic: "exam-fee", expected: "excluding examination fees" },
    { question: "क्या फीस online भर सकते हैं?", topic: "fee-payment", expected: "online payment" },
    { question: "क्या CUET के बिना admission हो सकता है?", topic: "cuet", expected: "CUET UG scores" },
    { question: "सीयूईटी के बिना एडमिशन हो सकता है?", topic: "cuet", expected: "CUET UG scores" },
    { question: "CSAS registration कैसे करना है?", topic: "csas", expected: "Common Seat Allocation System" },
    { question: "सीएसएएस में आवेदन कैसे करूँ?", topic: "csas", expected: "Common Seat Allocation System" },
    { question: "क्या Christian Minority Women के लिए seats reserved हैं?", topic: "minority-seats", expected: "50 percent" },
    { question: "मैं Christian नहीं हूँ, क्या फिर भी apply कर सकती हूँ?", topic: "minority-seats", expected: "remaining 50 percent" },
    { question: "JMC कहाँ है?", topic: "location", expected: "New Delhi" },
    { question: "कौन-कौन से courses हैं, क्या Psychology Honours भी है?", topic: "programmes", expected: "B.A. (Hons.) Psychology" },
  ];

  it.each(supportedScenarios)("returns grounded $topic facts for a student asking: $question", ({ question, topic, expected }) => {
    const result = retrieveApprovedFacts(jmc, question);
    expect(result).toMatchObject({ supported: true, callbackRequired: false, topic });
    expect(result.facts.join(" ")).toContain(expected);
  });

  it("keeps changing eligibility and instalment questions grounded without inventing an answer", () => {
    expect(retrieveApprovedFacts(jmc, "क्या मैं instalment में fees pay कर सकती हूँ?")).toMatchObject({ supported: true, callbackRequired: true, topic: "fees" });
    expect(retrieveApprovedFacts(jmc, "Psychology के लिए exact eligibility क्या है?")).toMatchObject({ supported: true, callbackRequired: true, topic: "eligibility" });
  });

  it("answers JMC scholarship and financial-assistance questions with approved facts before any individual confirmation", () => {
    const scholarship = retrieveApprovedFacts(jmc, "क्या मेरे लिए scholarship available है?");
    expect(scholarship).toMatchObject({ supported: true, callbackRequired: true, topic: "financial-assistance" });
    expect(scholarship.facts.join(" ")).toContain("merit and talent");
    expect(scholarship.facts.join(" ")).toContain("Student's Aid Fund");

    const concession = retrieveApprovedFacts(jmc, "फीस रियायत या financial assistance मिलती है?");
    expect(concession).toMatchObject({ supported: true, callbackRequired: true, topic: "financial-assistance" });
    expect(concession.facts.join(" ")).toContain("fee concession");
    expect(concession.facts.join(" ")).toContain("Book Bank Scheme");
  });

  it("does not fabricate placement, hostel, ranking, or personal-admission outcomes", () => {
    for (const question of ["JMC का placement percentage क्या है?", "क्या hostel available है?", "JMC की ranking कितनी है?", "क्या मुझे admission मिल जाएगा?"]) {
      expect(retrieveApprovedFacts(jmc, question)).toMatchObject({ supported: false, callbackRequired: true, topic: "unsupported", facts: [] });
    }
  });

  it("builds deterministic answer-first guardrails for both supported and unsupported student turns", () => {
    const paymentGrounding = buildTurnGrounding(jmc, "क्या फीस online भर सकते हैं?");
    expect(paymentGrounding).toContain("college fees are accepted through its online payment system");
    expect(paymentGrounding).toContain("Do not mention a website, counsellor, callback, or human");

    const hostelGrounding = buildTurnGrounding(jmc, "क्या JMC में hostel available है?");
    expect(hostelGrounding).toContain("There is no approved fact");
    expect(hostelGrounding).toContain("unless the caller explicitly asks");
  });

  it("keeps the examination-fee boundary informative without an early external redirect", () => {
    const result = retrieveApprovedFacts(jmc, "क्या examination fee इस amount में शामिल है?");
    expect(result.facts.join(" ")).toContain("do not confirm a separate examination-fee amount");
    expect(result.facts.join(" ")).not.toMatch(/admission channels|confirm through the college/i);
  });
});
