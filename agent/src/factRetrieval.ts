import type { CollegeProfile } from "./collegeKnowledge";
import { JMC_STUDENT_FAQ } from "./jmcStudentFaq";

export type FactLookup = { supported: boolean; callbackRequired: boolean; topic: string; facts: string[] };

export function buildTurnGrounding(profile: CollegeProfile, question: string): string {
  const result = retrieveApprovedFacts(profile, question);
  if (!result.supported) {
    return "CURRENT-TURN GROUNDING: There is no approved fact for this question. Say only that you do not have confirmed official information for this detail. Do not mention a website, counsellor, callback, or human unless the caller explicitly asks for one.";
  }

  const confirmation = result.topic === "financial-assistance"
    ? "State every approved financial-support fact first. For the individual boundary, say only that you cannot confirm this caller's eligibility, award amount, or current deadline. Do not mention an admissions team, website, counsellor, callback, human, or any contact route."
    : result.callbackRequired
    ? "The detail may change or needs individual confirmation. State every approved fact first. Do not offer a callback, website, counsellor, or human unless the caller explicitly asks after hearing these facts."
    : "Answer with these approved facts first. Do not mention a website, counsellor, callback, or human in this answer.";
  return `CURRENT-TURN GROUNDING — topic: ${result.topic}. ${confirmation}\nApproved facts:\n${result.facts.map(fact => `- ${fact}`).join("\n")}`;
}

function jmcFeeFacts(question: string): string[] {
  const value = question.toLowerCase();
  const courseEntries = Object.entries(JMC_STUDENT_FAQ.courseFees);
  const asksBcomHonours = /b\.?\s*com\.?\s*(?:\(?\s*hons?\.?\s*\)?|honours?)|बी\s*\.?\s*कॉम\s*(?:ऑनर्स|हॉनर्स)/.test(value);
  const matchingCourse = courseEntries.find(([course]) => {
    const courseValue = course.toLowerCase();
    if (asksBcomHonours) return courseValue.includes("b.com. (hons.)");
    if (/psychology|मनोविज्ञान/.test(value)) return courseValue.includes("psychology");
    if (/mathematics|maths|गणित/.test(value)) return courseValue.includes("mathematics");
    if (/retail|रिटेल/.test(value)) return courseValue.includes("retail");
    if (/itep|teacher education|टीचर/.test(value)) return courseValue.includes("itep");
    if (/b\.?el\.?ed|बी\s*एल\s*एड/.test(value)) return courseValue.includes("b.el.ed");
    if (/healthcare|हेल्थकेयर|बी\s*वोक|बी\s*वॉक|b\.?\s*voc/.test(value)) return courseValue.includes("healthcare");
    if (/commerce|कॉमर्स|बी\s*\.?\s*कॉम|b\.?\s*com/.test(value)) return courseValue === "b.com.";
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

export function buildApprovedFinancialAssistanceReply(profile: CollegeProfile, question: string): string | null {
  if (profile.profileId !== "jmc-2026") return null;
  const value = question.toLowerCase();
  const asksAboutSupport = /scholarship|fee concession|student.?aid|book bank|financial assistance|financial aid|freeship|स्कॉलरशिप|छात्रवृत्ति|वित्तीय.?सहायता|आर्थिक.?सहायता|फीस.?रियायत|फीस.?माफी|बुक.?बैंक/.test(value);
  if (!asksAboutSupport) return null;

  const includesFee = /fee|fees|cost|price|rupee|₹|फीस|शुल्क|कितनी|कितना|कीमत|पैसे|how much/.test(value);
  const fee = includesFee ? jmcFeeFacts(question)[0] : null;
  const hindi = /[\u0900-\u097f]/.test(question);
  const asksConcession = /fee concession|फीस.?रियायत|फीस.?माफी/.test(value);
  const asksStudentAid = /student.?aid|book bank|छात्र.?सहायता|बुक.?बैंक/.test(value);

  if (hindi) {
    const feeSentence = fee ? `${fee} ` : "";
    if (asksConcession) return `${feeSentence}आर्थिक सहायता के लिए JMC में prescribed Accounts Office form पर fee concession के लिए आवेदन किया जा सकता है। concession sanction होने तक फीस देय रहती है; व्यक्तिगत पात्रता और इस वर्ष की अंतिम तारीख की पुष्टि मेरे पास नहीं है।`;
    if (asksStudentAid) return `${feeSentence}JMC जरूरतमंद विद्यार्थियों के लिए Student's Aid Fund और Book Bank Scheme सूचीबद्ध करता है। मैं आपकी व्यक्तिगत पात्रता, सहायता की राशि या इस वर्ष की अंतिम तारीख की पुष्टि नहीं कर सकती।`;
    return `${feeSentence}JMC में मेरिट और टैलेंट को मान्यता देने वाली स्कॉलरशिप के अवसर उपलब्ध हैं और शैक्षणिक वर्ष की शुरुआत में आवेदन किया जा सकता है। व्यक्तिगत पात्रता, मिलने वाली राशि और इस वर्ष की अंतिम तारीख की पुष्टि मेरे पास नहीं है।`;
  }

  const feeSentence = fee ? `${fee} ` : "";
  if (asksConcession) return `${feeSentence}Students needing financial assistance may apply for fee concession on the prescribed Accounts Office form. Fees remain payable until a concession is sanctioned; I cannot confirm individual eligibility or this year's deadline.`;
  if (asksStudentAid) return `${feeSentence}JMC lists a Student's Aid Fund and Book Bank Scheme for needy students. I cannot confirm individual eligibility, award amount, or this academic year's deadline.`;
  return `${feeSentence}JMC offers scholarship opportunities recognising merit and talent, with applications at the beginning of the academic year. I cannot confirm individual eligibility, award amount, or this academic year's deadline.`;
}

function hasHindi(text: string): boolean {
  return /[\u0900-\u097f]/.test(text);
}

function includesAny(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

/**
 * Builds concise but complete source-grounded conversational turns for the
 * student journey. These common turns are deterministic because a generic
 * model reply previously omitted verified process facts and escalated early.
 */
export function buildApprovedStudentConversationReply(
  profile: CollegeProfile,
  question: string,
  recentStudentTurns: string[] = [],
): string | null {
  if (profile.profileId !== "jmc-2026") return null;

  const value = question.toLowerCase();
  const history = recentStudentTurns.join(" ").toLowerCase();
  const hindi = hasHindi(question);
  const financial = buildApprovedFinancialAssistanceReply(profile, question);
  if (financial) return financial;

  const asksAdmissionProcess = includesAny(value, /admission.*(process|procedure|कैसे|का.*तरीका)|process.*admission|admission process|एडमिशन.*(प्रोसेस|प्रक्रिया|कैसे|तरीका)|प्रवेश.*(प्रक्रिया|कैसे)/);
  if (asksAdmissionProcess || includesAny(value, /cuet|सी\s*यू\s*ई\s*टी|csas|सी\s*एस\s*ए\s*एस/)) {
    return hindi
      ? `2026–27 के लिए JMC में undergraduate admission CUET-UG के NTA score के आधार पर है। आवेदन के लिए University of Delhi का CSAS form register करके पूरा करना होता है।`
      : `For 2026–27, JMC undergraduate admission is based on CUET-UG scores conducted by the NTA. Applicants need to register and complete the University of Delhi CSAS form.`;
  }

  const asksPayment = includesAny(value, /payment|pay|online|भुगतान|पेमेंट|फीस.*(कैसे|भर|जमा)|कैसे.*(pay|पेमेंट|भुगतान)/);
  const hasFeeContext = includesAny(history, /fee|fees|₹|फीस|शुल्क|payment|pay|पेमेंट|भुगतान/);
  if (asksPayment || (hasFeeContext && includesAny(value, /कैसे|how|yes|हाँ|haan|जी/))) {
    return hindi
      ? `JMC college fees को online payment system से accept करता है। प्रकाशित रकम first-year annual fee है और examination fee इसमें शामिल नहीं है; अलग examination-fee amount की official पुष्टि मेरे पास नहीं है।`
      : `JMC accepts college fees through its online payment system. The published amount is the first-year annual fee and excludes examination fee; I do not have a confirmed separate examination-fee amount.`;
  }

  const asksDuration = includesAny(value, /कितने.*साल|कितने.*वर्ष|duration|how many years|years.*course|course.*years/);
  if (asksDuration) {
    return hindi
      ? `JMC की official course page के अनुसार B.El.Ed. चार साल का course है और बाकी listed undergraduate degrees भी four years में semester mode से पढ़ाई जाती हैं। ITEP की अलग duration की official पुष्टि मेरे approved facts में नहीं है।`
      : `JMC's official course page states that B.El.Ed. is a four-year course and that its other listed undergraduate degrees are taught over four years in semester mode. I do not have separate approved duration confirmation for ITEP.`;
  }

  const asksCourses = includesAny(value, /courses?|programmes?|subjects?|कोर्स|पाठ्यक्रम|विषय|क्या.*पढ़|कौन.*कौन.*(कोर्स|subject)|कौनसे.*कोर्स/);
  if (asksCourses) {
    return hindi
      ? `JMC में B.A. Honours के Economics, English, Hindi, History, Political Science, Psychology और Sociology options हैं, साथ में B.A. Programme combinations। इसके अलावा B.Com. Honours, B.Com., B.Sc. Honours Mathematics, B.El.Ed., B.Voc. Healthcare Management और Retail Management and IT listed हैं।`
      : `JMC lists B.A. Honours options including Economics, English, Hindi, History, Political Science, Psychology and Sociology, alongside B.A. Programme combinations, B.Com. Honours, B.Com., B.Sc. Honours Mathematics, B.El.Ed., and B.Voc. Healthcare Management and Retail Management & IT.`;
  }

  const asksFees = includesAny(value, /fee|fees|cost|price|rupee|₹|फीस|शुल्क|कितनी|कितना|कीमत|पैसे|how much/);
  if (asksFees) {
    const selected = jmcFeeFacts(question)[0];
    const genericFeeQuestion = !/psychology|मनोविज्ञान|mathematics|maths|गणित|retail|रिटेल|itep|teacher education|टीचर|b\.?el\.?ed|बी\s*एल\s*एड|healthcare|हेल्थकेयर|बी\s*वोक|बी\s*वॉक|b\.?\s*voc|commerce|कॉमर्स|बी\s*कॉम|b\.?\s*com|economics|इकोनॉमिक्स|अर्थशास्त्र/.test(value);
    if (!genericFeeQuestion) {
      return hindi
        ? `${selected} यह JMC की published first-year annual fee है; examination fee इसमें शामिल नहीं है।`
        : `${selected} This is JMC's published first-year annual fee excluding examination fee.`;
    }
    return hindi
      ? `${JMC_STUDENT_FAQ.feeBands} ये first-year annual fees हैं और examination fee exclude है। आप किस programme का exact fee जानना चाहते हैं?`
      : `${JMC_STUDENT_FAQ.feeBands} These are first-year annual fees excluding examination fee. Which programme's exact fee would you like to know?`;
  }

  const asksOverview = includesAny(value, /और.*क्या|और बताइ|और बता|थोड़ा और|what else|tell me more|more (?:information|details)|information|details|जानकारी|बताइए|बताओ|कॉलेज.*के.*बारे/);
  if (asksOverview) {
    return hindi
      ? `मैं JMC के courses, duration, programme-wise fees, online payment, CUET-UG और CSAS process, minority-seat policy, scholarships, financial support और location की approved जानकारी दे सकती हूँ।`
      : `I can give approved JMC information on courses, duration, programme-wise fees, online payment, CUET-UG and CSAS process, minority-seat policy, scholarships, financial support, and location.`;
  }

  return null;
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
