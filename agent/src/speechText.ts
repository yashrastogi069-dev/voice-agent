const SMALL_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

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

/** Converts stored admission facts into speech-safe output before a TTS engine receives them. */
export function prepareSpeechText(input: string): string {
  return input
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bB\.?\s*Com\.?\s*\(?(Hons?\.?|Honours?)\)?/gi, "Bachelor of Commerce Honours")
    .replace(/\bB\.?\s*A\.?\s*\(?(Hons?\.?|Honours?)\)?/gi, "Bachelor of Arts Honours")
    .replace(/\bB\.?\s*Sc\.?\s*\(?(Hons?\.?|Honours?)\)?/gi, "Bachelor of Science Honours")
    .replace(/₹\s?([\d,]+)/g, (_, amount: string) => `${spellIndianNumber(Number(amount.replace(/,/g, "")))} rupees`)
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
