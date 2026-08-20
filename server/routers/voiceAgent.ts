import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import {
  addContact,
  addContactsBulk,
  approveCampaign,
  createCampaign,
  getLiveCallContext,
  getWorkspace,
  recordPolicyAudit,
  syncCollegeProfiles,
} from "../db";
import { DEMO_COLLEGE_KNOWLEDGE } from "../demoContent";
import { evaluateOutboundEligibility, FixedOutcome } from "../voiceAgentPolicy";
import { protectedProcedure, router } from "../_core/trpc";
import { placeLiveOutboundCall } from "../../agent/src/dial";

const languageSchema = z.enum(["English", "Hindi"]);

type Knowledge = typeof DEMO_COLLEGE_KNOWLEDGE;
type ApprovedIntent = "interested" | "courses" | "fees" | "eligibility" | "scholarship" | "admissions" | "campus" | "callback" | "not_interested" | "dnc" | "unsupported";

function parseKnowledge(value: string): Knowledge {
  try {
    return JSON.parse(value) as Knowledge;
  } catch {
    return DEMO_COLLEGE_KNOWLEDGE;
  }
}

export function responseForIntent(input: {
  intent: string;
  courseIndex: number;
  language: "English" | "Hindi";
  knowledge: Knowledge;
}): { reply: string; outcome: FixedOutcome; requiresHuman: boolean; source: string } {
  const { intent, knowledge, language } = input;
  const course = knowledge.courses[Math.min(Math.max(input.courseIndex, 0), knowledge.courses.length - 1)] ?? knowledge.courses[0];
  const hindi = language === "Hindi";

  if (intent === "dnc") return { reply: hindi ? knowledge.hindi.dnc : "I understand. I’ll record your request to stop future outreach. Thank you for letting me know.", outcome: "dnc", requiresHuman: false, source: "DNC policy" };
  if (intent === "not_interested") return { reply: hindi ? knowledge.hindi.notInterested : "No problem at all. Thank you for your time, and I won’t take any more of it today.", outcome: "not_interested", requiresHuman: false, source: "Approved closing" };
  if (intent === "callback") return { reply: hindi ? knowledge.hindi.callback : "Certainly. I’ll queue a callback request for an admissions counsellor so they can help with the next steps.", outcome: "callback", requiresHuman: true, source: "Callback request" };
  if (intent === "interested") return { reply: hindi ? `बहुत अच्छा। आप इनमें से किस कार्यक्रम के बारे में जानना चाहेंगे: ${knowledge.courses.map(item => item.name).join(", ")}?` : `That’s great to hear. Which programme would you like to explore first: ${knowledge.courses.map(item => item.name).join(", ")}?`, outcome: "interested", requiresHuman: false, source: "Selected profile follow-up" };
  if (intent === "fees") return { reply: hindi ? `${course.name} की स्वीकृत वार्षिक फीस जानकारी यह है: ${course.fee}। सटीक फीस और भुगतान विकल्प के लिए मैं काउंसलर से कॉल बैक का अनुरोध कर सकती हूँ।` : `The approved fee information for ${course.name} is ${course.fee}. A counsellor can confirm the exact fee schedule and payment options.`, outcome: "interested", requiresHuman: false, source: `${course.name} fee` };
  if (intent === "courses") return { reply: hindi ? `इस कॉलेज प्रोफ़ाइल में ${knowledge.courses.map(item => item.name).join(", ")} शामिल हैं। ${course.name} ${course.duration} का कार्यक्रम है।` : `The approved college information includes ${knowledge.courses.map(item => item.name).join(", ")}. ${course.name} is a ${course.duration} programme.`, outcome: "interested", requiresHuman: false, source: "Programme list" };
  if (intent === "eligibility") return { reply: hindi ? `${course.name} के लिए स्वीकृत पात्रता यह है: ${course.eligibility}। काउंसलर आपकी व्यक्तिगत पात्रता की पुष्टि कर सकता है।` : `For ${course.name}, the approved eligibility is: ${course.eligibility}. A counsellor can confirm your individual eligibility.`, outcome: "interested", requiresHuman: false, source: `${course.name} eligibility` };
  if (intent === "scholarship") return { reply: hindi ? `स्कॉलरशिप या वित्तीय सहायता की उपलब्धता और व्यक्तिगत पात्रता की पुष्टि कॉलेज एडमिशन टीम से की जाएगी।` : knowledge.scholarship, outcome: "interested", requiresHuman: false, source: "Scholarship policy" };
  if (intent === "admissions") return { reply: hindi ? `स्वीकृत एडमिशन प्रक्रिया में एन्क्वायरी, पात्रता समीक्षा, आवेदन और काउंसलर फॉलो-अप शामिल हैं।` : knowledge.admissions, outcome: "interested", requiresHuman: false, source: "Admissions process" };
  if (intent === "campus") return { reply: hindi ? `कॉलेज की आधिकारिक जानकारी के लिए मैं काउंसलर से बात कराने का अनुरोध दर्ज कर सकती हूँ।` : knowledge.campus, outcome: "interested", requiresHuman: false, source: "Campus overview" };
  return { reply: hindi ? knowledge.hindi.unavailable : "I only have the selected college’s approved information for programmes, fees, eligibility, scholarships, admissions, and campus details. I can request an admissions-team callback for anything else.", outcome: "callback", requiresHuman: true, source: "Selected-profile boundary" };
}

export function classifyKnownTurn(message: string): { intent: ApprovedIntent; courseIndex: number } | null {
  const normalized = message.trim().toLowerCase();
  if (/\b(do not call|don't call|stop calling|remove me|unsubscribe|dnc)\b|कॉल मत|कॉल बंद|हटाइए/.test(normalized)) return { intent: "dnc", courseIndex: 0 };
  if (/\b(not interested|no thanks|not now|nope)\b|दिलचस्पी नहीं|नहीं चाहिए/.test(normalized)) return { intent: "not_interested", courseIndex: 0 };
  if (/\b(call ?back|callback|counsellor|counselor|call me later)\b|वापस कॉल|कॉल बैक/.test(normalized)) return { intent: "callback", courseIndex: 0 };
  if (/^(yes|yeah|yep|sure|okay|ok|interested|i am interested|haan|ha|हाँ|हां|जी हाँ|जी हां)[!. ]*$/i.test(normalized)) return { intent: "interested", courseIndex: 0 };
  return null;
}

export const voiceAgentRouter = router({
  workspace: protectedProcedure.query(({ ctx }) => getWorkspace(ctx.user.id)),

  syncCollegeProfiles: protectedProcedure.mutation(({ ctx }) => syncCollegeProfiles(ctx.user.id)),

  contacts: router({
    add: protectedProcedure.input(z.object({ fullName: z.string().min(2).max(160), phoneNumber: z.string().min(7).max(32), language: languageSchema, consentSource: z.string().min(3).max(180), consentScope: z.string().min(3).max(180) })).mutation(async ({ ctx, input }) => {
      await addContact({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
    bulkAdd: protectedProcedure.input(z.array(z.object({ fullName: z.string().min(2).max(160), phoneNumber: z.string().min(7).max(32), language: languageSchema, consentSource: z.string().min(3).max(180), consentScope: z.string().min(3).max(180) })).min(1).max(500)).mutation(async ({ ctx, input }) => {
      await addContactsBulk(input.map(contact => ({ ...contact, userId: ctx.user.id })));
      return { success: true, count: input.length };
    }),
  }),

  campaigns: router({
    create: protectedProcedure.input(z.object({ name: z.string().min(3).max(180), approvedScript: z.string().min(20), knowledgeBase: z.string().min(20), frequencyCap: z.number().int().min(1).max(5) })).mutation(async ({ ctx, input }) => {
      await createCampaign({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
    approve: protectedProcedure.input(z.object({ campaignId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await approveCampaign(ctx.user.id, input.campaignId);
      return { success: true };
    }),
  }),

  liveCall: router({
    preflight: protectedProcedure.input(z.object({ campaignId: z.number().int().positive(), contactId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const context = await getLiveCallContext(ctx.user.id, input.campaignId, input.contactId);
      const eligibility = evaluateOutboundEligibility({ contact: context.contact, campaign: context.campaign, previousAttempts: context.priorAttempts });
      const knowledge = parseKnowledge(context.campaign.knowledgeBase);
      const profileReady = knowledge.liveActivation?.eligible === true;
      return {
        allowed: eligibility.allowed && profileReady,
        reason: !eligibility.allowed ? eligibility.reason : profileReady ? "Ready for live provider configuration." : knowledge.liveActivation?.reason ?? "This college profile is not ready for a live call.",
        providerConfigured: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.LIVEKIT_OUTBOUND_TRUNK_ID && process.env.LIVE_CALLS_ENABLED === "true"),
      };
    }),
    dial: protectedProcedure.input(z.object({ campaignId: z.number().int().positive(), contactId: z.number().int().positive(), userConfirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
      const context = await getLiveCallContext(ctx.user.id, input.campaignId, input.contactId);
      const eligibility = evaluateOutboundEligibility({ contact: context.contact, campaign: context.campaign, previousAttempts: context.priorAttempts });
      const knowledge = parseKnowledge(context.campaign.knowledgeBase);
      const allowed = eligibility.allowed && knowledge.liveActivation?.eligible === true;
      await recordPolicyAudit({ userId: ctx.user.id, workflow: "outbound", eventType: "live_call_preflight", allowed, message: allowed ? "Live call passed the contact, campaign, and profile gates." : (!eligibility.allowed ? eligibility.reason : knowledge.liveActivation?.reason ?? "Profile not ready.") });
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: !eligibility.allowed ? eligibility.reason : knowledge.liveActivation?.reason ?? "This college profile is not ready for a live call." });
      try {
        const call = await placeLiveOutboundCall({ contactId: String(context.contact.id), phoneNumber: context.contact.phoneNumber, collegeProfileId: knowledge.profileId, campaignId: String(context.campaign.id), contactName: context.contact.fullName });
        return { success: true, call };
      } catch (error) {
        await notifyOwner({ title: "Live outbound call did not start", content: error instanceof Error ? error.message : "The SIP dial adapter returned an unknown error." });
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Live call could not start." });
      }
    }),
  }),

});
