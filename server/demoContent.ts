export const DEMO_COLLEGE_KNOWLEDGE = {
  isSynthetic: true,
  institution: "Northbridge College of Applied Studies",
  opening:
    "We are sharing information about selected undergraduate programmes for the upcoming academic intake. May I ask whether you are exploring college options at the moment?",
  courses: [
    {
      name: "BBA in Digital Business",
      duration: "3 years",
      fee: "₹1,20,000 per year",
      eligibility: "Class 12 completion from a recognised board",
    },
    {
      name: "BCA in Applied Computing",
      duration: "3 years",
      fee: "₹1,35,000 per year",
      eligibility: "Class 12 completion; Mathematics is recommended",
    },
    {
      name: "BA in Media and Communication",
      duration: "3 years",
      fee: "₹1,10,000 per year",
      eligibility: "Class 12 completion from a recognised board",
    },
  ],
  scholarship:
    "The fictional demo college offers merit-based scholarships of up to 25% after an admissions review. An admissions counsellor confirms eligibility and availability.",
  admissions:
    "The demonstration admissions process includes an enquiry, eligibility review, application submission, and counsellor follow-up. Exact dates are confirmed by a human admissions counsellor.",
  campus:
    "The demo knowledge base describes a city-campus learning environment with labs, project studios, and career-support sessions. A human counsellor can share official campus details.",
  hindi: {
    opening:
      "हम आगामी शैक्षणिक सत्र के लिए कुछ स्नातक पाठ्यक्रमों की जानकारी साझा कर रहे हैं। क्या आप अभी कॉलेज विकल्पों के बारे में सोच रहे हैं?",
    unavailable:
      "मैं केवल स्वीकृत डेमो जानकारी साझा कर सकती हूँ। सही जानकारी के लिए मैं एक एडमिशन काउंसलर से कॉल बैक का अनुरोध कर सकती हूँ।",
    callback:
      "ज़रूर, मैं एडमिशन काउंसलर से कॉल बैक का अनुरोध दर्ज कर देती हूँ।",
    dnc:
      "समझ गई। मैं आपके लिए आगे की आउटरीच बंद करने का अनुरोध दर्ज कर रही हूँ।",
    notInterested: "कोई बात नहीं। आपके समय के लिए धन्यवाद।",
  },
};

export const DEMO_APPROVED_SCRIPT = `The assistant must identify itself as AI, explain that the call is a browser-only demonstration, introduce Northbridge College of Applied Studies, ask whether the student is exploring college options, and answer only from the approved knowledge base. It must offer a counsellor callback for unapproved questions, immediately honour a do-not-call request, and never claim admission, placement, rankings, accreditation, or availability.`;

export const DEMO_WORKFLOW_POLICIES = {
  outbound: {
    label: "Outbound student engagement",
    permissions: ["Approved knowledge only", "Create callback request", "Record DNC"],
    blocks: ["No consent", "Active DNC", "Outside 9am–9pm IST", "Unapproved campaign"],
  },
  inbound: {
    label: "Inbound support",
    permissions: ["Answer general approved FAQs", "Create support request", "Transfer to a human"],
    blocks: ["Account changes", "Payment details", "Unverified personal data"],
  },
  delegated: {
    label: "Delegated task",
    permissions: ["Gather information", "Report options", "Request owner confirmation"],
    blocks: ["Purchases", "Binding commitments", "Sharing credentials"],
  },
};
