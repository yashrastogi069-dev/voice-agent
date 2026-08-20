import type { CollegeProfile } from "./collegeKnowledge";

export type FactLookup = { supported: boolean; callbackRequired: boolean; topic: string; facts: string[] };

export function retrieveApprovedFacts(profile: CollegeProfile, question: string): FactLookup {
  const value = question.toLowerCase();
  const course = profile.courses.find(item => value.includes(item.name.toLowerCase().replace(/\./g, ""))) ?? profile.courses[0];
  if (/fee|fees|cost|price|payment|rupee|₹|फीस|शुल्क/.test(value)) return { supported: true, callbackRequired: /confirm|exact|instalment/.test(value), topic: "fees", facts: [`${course.name}: ${course.fee}`] };
  if (/course|programme|program|degree|study|subject|पाठ्यक्रम|कोर्स/.test(value)) return { supported: true, callbackRequired: false, topic: "programmes", facts: profile.courses.map(item => `${item.name}: ${item.duration}`) };
  if (/eligib|cuet|qualif|admission requirement|पात्रता|योग्यता/.test(value)) return { supported: true, callbackRequired: true, topic: "eligibility", facts: [`${course.name}: ${course.eligibility}`] };
  if (/scholar|financial aid|freeship|स्कॉलरशिप|छात्रवृत्ति/.test(value)) return { supported: true, callbackRequired: true, topic: "scholarship", facts: [profile.scholarship] };
  if (/admission|apply|application|csas|register|प्रवेश|आवेदन/.test(value)) return { supported: true, callbackRequired: true, topic: "admissions", facts: [profile.admissions] };
  return { supported: false, callbackRequired: true, topic: "unsupported", facts: [] };
}
