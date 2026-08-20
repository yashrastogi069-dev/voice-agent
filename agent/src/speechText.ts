const SMALL_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const HINDI_UNDER_HUNDRED = ["शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस", "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस", "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास", "पचास", "इक्यावन", "बावन", "तिरेपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ", "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर", "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उन्नासी", "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी", "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पंचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे"];

function belowThousand(value: number): string {
  if (value < 20) return SMALL_NUMBERS[value];
  if (value < 100) return `${TENS[Math.floor(value / 10)]}${value % 10 ? `-${SMALL_NUMBERS[value % 10]}` : ""}`;
  return `${SMALL_NUMBERS[Math.floor(value / 100)]} hundred${value % 100 ? ` ${belowThousand(value % 100)}` : ""}`;
}

export function spellIndianNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) return String(value);
  if (value < 1000) return belowThousand(value);
  if (value < 100000) return `${belowThousand(Math.floor(value / 1000))} thousand${value % 1000 ? ` ${belowThousand(value % 1000)}` : ""}`;
  if (value < 10000000) return `${belowThousand(Math.floor(value / 100000))} lakh${value % 100000 ? ` ${spellIndianNumber(value % 100000)}` : ""}`;
  return `${belowThousand(Math.floor(value / 10000000))} crore${value % 10000000 ? ` ${spellIndianNumber(value % 10000000)}` : ""}`;
}

export function spellIndianNumberHindi(value: number): string {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) return String(value);
  if (value < 100) return HINDI_UNDER_HUNDRED[value];
  if (value < 1000) return `${HINDI_UNDER_HUNDRED[Math.floor(value / 100)]} सौ${value % 100 ? ` ${spellIndianNumberHindi(value % 100)}` : ""}`;
  if (value < 100000) return `${spellIndianNumberHindi(Math.floor(value / 1000))} हज़ार${value % 1000 ? ` ${spellIndianNumberHindi(value % 1000)}` : ""}`;
  if (value < 10000000) return `${spellIndianNumberHindi(Math.floor(value / 100000))} लाख${value % 100000 ? ` ${spellIndianNumberHindi(value % 100000)}` : ""}`;
  return `${spellIndianNumberHindi(Math.floor(value / 10000000))} करोड़${value % 10000000 ? ` ${spellIndianNumberHindi(value % 10000000)}` : ""}`;
}

/** Converts stored admission facts into speech-safe output before a TTS engine receives them. */
export function prepareSpeechText(input: string): string {
  const hasDevanagari = /[\u0900-\u097F]/.test(input);
  return input
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bB\.?\s*Com\.?\s*\(?(Hons?\.?|Honours?)\)?/gi, "Bachelor of Commerce Honours")
    .replace(/\bB\.?\s*A\.?\s*\(?(Hons?\.?|Honours?)\)?/gi, "Bachelor of Arts Honours")
    .replace(/\bB\.?\s*Sc\.?\s*\(?(Hons?\.?|Honours?)\)?/gi, "Bachelor of Science Honours")
    .replace(/₹\s?([\d,]+)/g, (_, amount: string) => hasDevanagari ? `${spellIndianNumberHindi(Number(amount.replace(/,/g, "")))} रुपये` : `${spellIndianNumber(Number(amount.replace(/,/g, "")))} rupees`)
    .replace(/\b(\d{4})[–-](\d{2})\b/g, "$1 to $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function createPronunciationHint(text: string): string {
  return prepareSpeechText(text)
    .replace(/SRCC/g, "S R C C")
    .replace(/LSR/g, "L S R")
    .replace(/JMC/g, "J M C");
}

const PROFILE_PRONUNCIATION: Record<string, Array<[RegExp, string]>> = {
  "lsr-2026": [[/Lady Shri Ram College for Women/gi, "Lady Shree Ram College for Women"], [/Lajpat Nagar-IV/gi, "Lajpat Nagar Four"]],
  "srcc-2026": [[/Shri Ram College of Commerce/gi, "Shree Ram College of Commerce"], [/Maurice Nagar/gi, "Morris Nagar"]],
  "jmc-2026": [[/B\.Voc\./gi, "Bachelor of Vocation"]],
};

export function prepareProfileSpeechText(profileId: string, text: string): string {
  return (PROFILE_PRONUNCIATION[profileId] ?? []).reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), createPronunciationHint(text));
}

export class SpeechTextBuffer {
  private buffer = "";
  constructor(private readonly profileId: string) {}
  push(chunk: string): string[] {
    this.buffer += chunk;
    const completeSentences: string[] = [];
    const sentenceBoundary = /[.!?।](?:\s+|$)/g;
    let previousBoundary = 0;
    let boundary: RegExpExecArray | null;
    while ((boundary = sentenceBoundary.exec(this.buffer)) !== null) {
      completeSentences.push(this.buffer.slice(previousBoundary, boundary.index + 1));
      previousBoundary = boundary.index + boundary[0].length;
    }
    this.buffer = this.buffer.slice(previousBoundary);
    if (!completeSentences.length && this.buffer.length > 110) {
      const breakIndex = Math.max(this.buffer.lastIndexOf(" "), this.buffer.lastIndexOf("।"), this.buffer.lastIndexOf(","));
      if (breakIndex > 60) {
        completeSentences.push(this.buffer.slice(0, breakIndex + 1));
        this.buffer = this.buffer.slice(breakIndex + 1).trimStart();
      }
    }
    return completeSentences.map(piece => prepareProfileSpeechText(this.profileId, piece));
  }
  flush(): string[] {
    if (!this.buffer.trim()) return [];
    const final = prepareProfileSpeechText(this.profileId, this.buffer);
    this.buffer = "";
    return [final];
  }
}
