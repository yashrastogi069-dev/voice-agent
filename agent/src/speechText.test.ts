import { describe, expect, it } from "vitest";
import { createPronunciationHint, prepareSpeechText, spellIndianNumber } from "./speechText";

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
});
