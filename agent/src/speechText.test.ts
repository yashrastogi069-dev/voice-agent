import { describe, expect, it } from "vitest";
import { createPronunciationHint, prepareProfileSpeechText, prepareSpeechText, SpeechTextBuffer, spellIndianNumber, spellIndianNumberHindi } from "./speechText";

describe("spoken college responses", () => {
  it("turns rupee figures into natural spoken Indian currency", () => {
    expect(spellIndianNumber(28680)).toBe("twenty-eight thousand six hundred eighty");
    expect(prepareSpeechText("The fee is ₹28,680.")).toBe("The fee is twenty-eight thousand six hundred eighty rupees.");
  });

  it("prevents URLs and programme punctuation from being spoken literally", () => {
    const spoken = prepareSpeechText("B.Com. (Hons.) details are at https://example.edu/admissions");
    expect(spoken).toContain("Bachelor of Commerce Honours");
    expect(spoken).not.toContain("https");
    expect(spoken).not.toContain(".com");
  });

  it("spells institution abbreviations as individual letters for speech", () => {
    expect(createPronunciationHint("SRCC and LSR information")).toBe("S R C C and L S R information");
  });

  it("normalizes profile names and currency across streaming text chunks", () => {
    expect(prepareProfileSpeechText("srcc-2026", "Shri Ram College of Commerce")).toContain("Shree Ram College of Commerce");
    const buffer = new SpeechTextBuffer("jmc-2026");
    buffer.push("The annual fee is ₹28,");
    expect(buffer.push("680.").join(" ")).toContain("twenty-eight thousand six hundred eighty rupees");
    expect(buffer.flush()).toEqual([]);
  });

  it("releases completed Hindi sentences immediately and preserves Hindi currency units", () => {
    const buffer = new SpeechTextBuffer("jmc-2026");
    expect(spellIndianNumberHindi(37070)).toBe("सैंतीस हज़ार सत्तर");
    expect(buffer.push("बी वॉक की फीस ₹37,070 है।")).toEqual(["बी वॉक की फीस सैंतीस हज़ार सत्तर रुपये है।"]);
    expect(buffer.flush()).toEqual([]);
  });

  it("releases a long punctuation-free Hindi stream before a full response is buffered", () => {
    const buffer = new SpeechTextBuffer("jmc-2026");
    const response = "जम्मू कॉलेज में एडमिशन की प्रक्रिया दिल्ली विश्वविद्यालय के सीएसएएस पोर्टल से होती है और आप कोर्स तथा फीस की जानकारी मुझसे ले सकते हैं";
    const earlySegments = buffer.push(response);
    expect(earlySegments).toHaveLength(1);
    expect(earlySegments[0].length).toBeGreaterThan(110);
    expect(earlySegments[0].length).toBeLessThan(response.length);
    expect(buffer.flush()).toEqual(["हैं"]);
  });
});
