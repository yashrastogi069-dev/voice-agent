import type { CollegeProfile } from "./collegeKnowledge";
import { JMC_STUDENT_FAQ } from "./jmcStudentFaq";

export type FactLookup = { supported: boolean; callbackRequired: boolean; topic: string; facts: string[] };

export function buildTurnGrounding(profile: CollegeProfile, question: string): string {
  const result = retrieveApprovedFacts(profile, question);
  if (!result.supported) {
    return "CURRENT-TURN GROUNDING: There is no approved fact for this question. Say only that you do not have confirmed official information for this detail. Do not mention a website, counsellor, callback, or human unless the caller explicitly asks for one.";
  }

  const confirmation = result.callbackRequired
    ? "The detail may change or needs individual confirmation. State every approved fact first. Do not offer a callback, website, counsellor, or human unless the caller explicitly asks after hearing these facts."
    : "Answer with these approved facts first. Do not mention a website, counsellor, callback, or human in this answer.";
  return `CURRENT-TURN GROUNDING — topic: ${result.topic}. ${confirmation}\nApproved facts:\n${result.facts.map(fact => `- ${fact}`).join("\n")}`;
}

function jmcFeeFacts(question: string): string[] {
  const value = question.toLowerCase();
  const courseEntries = Object.entries(JMC_STUDENT_FAQ.courseFees);
  const matchingCourse = courseEntries.find(([course]) => {
    const courseValue = course.toLowerCase();
    if (/psychology|मनोविज्ञान/.test(value)) return courseValue.includes("psychology");
    if (/mathematics|maths|गणित/.test(value)) return courseValue.includes("mathematics");
    if (/retail|रिटेल/.test(value)) return courseValue.includes("retail");
    if (/itep|teacher education|टीचर/.test(value)) return courseValue.includes("itep");
    if (/b\.?el\.?ed|बी\s*एल\s*एड/.test(value)) return courseValue.includes("b.el.ed");
    if (/healthcare|हेल्थकेयर|बी\s*वोक|बी\s*वॉक|b\.?\s*voc/.test(value)) return courseValue.includes("healthcare");
    if (/commerce|कॉमर्स|बी\s*कॉम|b\.?\s*com/.test(value)) return courseValue.includes("b.com");
    if (/economics|इकोनॉमिक्स|अर्थशास्त्र/.test(value)) return courseValue.includes("economics");
    return false;
  });
  return matchingCourse
    ? [`${matchingCourse[0]}: ${matchingCourse[1]}`]
    : courseEntries.map(([course, fee]) => `${course}: ${fee}`);
}

function jmcProgrammeFacts(): string[] {
  return Object.keys(JMC_STUDENT_FAQ.courseFees).map(course => `${course}: undergraduate programme listed in the approved JMC 2026–27 fee document.`);
}

function selectCourse(profile: CollegeProfile, question: string) {
  const value = question.toLowerCase();
  if (/बी\s*वोक|बी\s*वॉक|b\.?\s*voc|healthcare|हेल्थकेयर/.test(value)) {
    return profile.courses.find(item => item.name.toLowerCase().includes("b.voc")) ?? profile.courses[0];
  }
  if (/बी\s*कॉम|b\.?\s*com|commerce|कॉमर्स/.test(value)) {
    return profile.courses.find(item => item.name.toLowerCase().includes("b.com")) ?? profile.courses[0];
  }
  if (/इकोनॉमिक्स|economics|अर्थशास्त्र/.test(value)) {
    return profile.courses.find(item => item.name.toLowerCase().includes("economics")) ?? profile.courses[0];
  }
  return profile.courses.find(item => value.includes(item.name.toLowerCase().replace(/\./g, ""))) ?? profile.courses[0];
}

export function retrieveApprovedFacts(profile: CollegeProfile, question: string): FactLookup {
  const value = question.toLowerCase();
  const course = selectCourse(profile, question);
  const hasSpecificCourse = /बी\s*वोक|बी\s*वॉक|b\.?\s*voc|healthcare|हेल्थकेयर|बी\s*कॉम|b\.?\s*com|commerce|कॉमर्स|इकोनॉमिक्स|economics|अर्थशास्त्र/.test(value);
  const isJmc = profile.profileId === "jmc-2026";
  if (/placement|hostel|ranking|rank\b|accreditation|admission.*(मिल|guarantee|confirm)|क्या.*admission.*होग/.test(value)) {
    return { supported: false, callbackRequired: true, topic: "unsupported", facts: [] };
  }
  if (isJmc && /christian|minority|ईसाई|क्रिश्चियन|अल्पसंख्यक/.test(value)) return { supported: true, callbackRequired: false, topic: "minority-seats", facts: [JMC_STUDENT_FAQ.minoritySeats] };
  if (isJmc && /exam fee|examination fee|परीक्षा शुल्क|एग्जाम फीस/.test(value)) return { supported: true, callbackRequired: false, topic: "exam-fee", facts: [JMC_STUDENT_FAQ.feeScope] };
  if (isJmc && /instal+ment|किस्त/.test(value)) return { supported: true, callbackRequired: true, topic: "fees", facts: [JMC_STUDENT_FAQ.feeScope] };
  if (isJmc && /how.*pay|payment method|online payment|payment.*कैसे|कैसे.*पे|भुगतान.*कैसे|online.*(fee|फीस|pay)|(?:fee|फीस).*(online|भर|pay)|फीस.*भुगतान/.test(value)) return { supported: true, callbackRequired: false, topic: "fee-payment", facts: [JMC_STUDENT_FAQ.feePayment, JMC_STUDENT_FAQ.feeScope] };
  if (isJmc && /scholarship|fee concession|student.?aid|book bank|financial assistance|financial aid|freeship|स्कॉलरशिप|छात्रवृत्ति|वित्तीय.?सहायता|आर्थिक.?सहायता|फीस.?रियायत|फीस.?माफी|बुक.?बैंक/.test(value)) {
    return { supported: true, callbackRequired: true, topic: "financial-assistance", facts: [JMC_STUDENT_FAQ.scholarships, JMC_STUDENT_FAQ.financialAssistance, JMC_STUDENT_FAQ.financialAssistanceBoundary] };
  }
  if (/fee|fees|cost|price|payment|rupee|₹|फीस|शुल्क|कितनी|कितना|कीमत|पैसे|how much/.test(value)) {
    const facts = isJmc ? jmcFeeFacts(question) : hasSpecificCourse ? [`${course.name}: ${course.fee}`] : profile.courses.map(item => `${item.name}: ${item.fee}`);
    return { supported: true, callbackRequired: /confirm|exact|instalment|सटीक|कन्फर्म/.test(value), topic: "fees", facts };
  }
  if (/course|programme|program|degree|study|subject|पाठ्यक्रम|कोर्स|विषय|कौन.?कौन|क्या.?पढ़/.test(value)) return { supported: true, callbackRequired: false, topic: "programmes", facts: isJmc ? jmcProgrammeFacts() : profile.courses.map(item => `${item.name}: ${item.duration}`) };
  if (isJmc && /cuet|सी\s*यू\s*ई\s*टी/.test(value)) return { supported: true, callbackRequired: false, topic: "cuet", facts: [JMC_STUDENT_FAQ.admissionBasis, JMC_STUDENT_FAQ.csas] };
  if (isJmc && /csas|सी\s*एस\s*ए\s*एस|register|registration|apply|application|आवेदन|रजिस्टर|फॉर्म/.test(value)) return { supported: true, callbackRequired: false, topic: "csas", facts: [JMC_STUDENT_FAQ.csas, JMC_STUDENT_FAQ.admissionBasis] };
  if (/eligib|qualif|admission requirement|पात्रता|योग्यता|कौन.?अप्लाई|कौन.?ले सकता/.test(value)) {
    const facts = isJmc && /psychology|मनोविज्ञान|mathematics|गणित/.test(value)
      ? ["University of Delhi 2026–27 admission rules and the relevant programme eligibility requirements apply. The approved JMC facts do not state a programme-specific subject-combination rule, so it should be confirmed before a decision."]
      : [`${course.name}: ${course.eligibility}`];
    return { supported: true, callbackRequired: true, topic: "eligibility", facts };
  }
  if (isJmc && /कुछ और|और बताइ|और बता|थोड़ा और|more (?:information|details)|something else|tell me more/.test(value)) {
    return {
      supported: true,
      callbackRequired: false,
      topic: "overview",
      facts: [
        "JMC's approved 2026–27 student information covers undergraduate programmes, first-year fees, CUET UG and CSAS admissions, online fee payment, Christian Minority Women seat policy, location, scholarships, fee concession, Student's Aid Fund, and the Book Bank Scheme.",
        "JMC has approved fee-document entries for Economics, Psychology, B.Com. and B.Com. Honours, Mathematics, two B.Voc. programmes, B.El.Ed., and ITEP.",
      ],
    };
  }
  if (/scholar|financial aid|freeship|स्कॉलरशिप|छात्रवृत्ति|वित्तीय.?सहायता/.test(value)) return { supported: true, callbackRequired: true, topic: "scholarship", facts: [profile.scholarship] };
  if (/where|location|address|कहाँ|कहा|लोकेशन|पता/.test(value)) return { supported: true, callbackRequired: false, topic: "location", facts: [`${profile.institution} is located in ${profile.location}.`] };
  if (/admission|प्रवेश|कब.?शुरू|तारीख/.test(value)) return { supported: true, callbackRequired: true, topic: "admissions", facts: [profile.admissions] };
  if (/information|details|about|tell me|जानकारी|बताइए|बताओ|कॉलेज.?के.?बारे/.test(value)) {
    return {
      supported: true,
      callbackRequired: false,
      topic: "overview",
      facts: [
        `${profile.institution}: ${profile.academicYear} approved undergraduate information.`,
        `Programmes: ${profile.courses.map(item => item.name).join(", ")}.`,
        profile.admissions,
      ],
    };
  }
  return { supported: false, callbackRequired: true, topic: "unsupported", facts: [] };
}
