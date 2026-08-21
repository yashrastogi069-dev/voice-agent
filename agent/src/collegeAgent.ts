import { llm, voice } from "@livekit/agents";
import type { ChatContext, ChatMessage } from "@livekit/agents";
import type { ModelSettings } from "@livekit/agents";
import { ReadableStream, TransformStream } from "node:stream/web";
import { z } from "zod";
import { profileInstructions, type CollegeProfile } from "./collegeKnowledge";
import { buildVoiceAgentEvent, publishVoiceAgentEvent } from "./events";
import { BoundedConversationState, LIVE_TURN_HANDLING } from "./runtimePolicy";
import { buildApprovedStudentConversationReply, buildTurnGrounding, retrieveApprovedFacts } from "./factRetrieval";
import { SpeechTextBuffer } from "./speechText";

export class CollegeAdmissionsAgent extends voice.Agent {
  readonly profile: CollegeProfile;
  readonly conversationState = new BoundedConversationState();

  constructor(profile: CollegeProfile) {
    super({
      instructions: profileInstructions(profile),
      tools: {
        request_counsellor_callback: llm.tool({
          description: "Create a callback request only when the caller explicitly asks for a counsellor, human, or callback after receiving the approved answer. Do not offer or call this tool during the early information exchange, and never use it merely because an approved detail is unavailable in a general answer.",
          parameters: z.object({
            contactId: z.string().describe("The caller contact identifier from the session metadata"),
            programmeInterest: z.string().describe("The programme or subject the caller wants to discuss"),
            callbackWindow: z.string().describe("The caller's requested callback time, or not specified"),
          }),
          flags: llm.ToolFlag.CANCELLABLE,
          onDuplicate: "replace",
          execute: async ({ contactId, programmeInterest, callbackWindow }) => {
            const event = buildVoiceAgentEvent({
              event: "callback_requested",
              contactId,
              collegeProfileId: profile.profileId,
              payload: { programmeInterest, callbackWindow },
            });
            const result = await publishVoiceAgentEvent(event);
            return { recorded: true, delivered: result.delivered, eventId: event.eventId };
          },
        }),
        record_do_not_call: llm.tool({
          description: "Record a do-not-call request immediately when the caller says stop, do not call, remove me, unsubscribe, or otherwise asks not to receive further calls.",
          parameters: z.object({
            contactId: z.string().describe("The caller contact identifier from the session metadata"),
            reason: z.string().describe("Short caller-provided reason, if any"),
          }),
          flags: llm.ToolFlag.CANCELLABLE,
          onDuplicate: "replace",
          execute: async ({ contactId, reason }) => {
            const event = buildVoiceAgentEvent({
              event: "dnc_recorded",
              contactId,
              collegeProfileId: profile.profileId,
              payload: { reason },
            });
            const result = await publishVoiceAgentEvent(event);
            return { recorded: true, delivered: result.delivered, eventId: event.eventId };
          },
        }),
        lookup_approved_college_facts: llm.tool({
          description: "For every question about the college, courses, fees, payment, CUET, CSAS, minority seats, location, eligibility, scholarships, or admissions, call this tool before answering. It is also required for broad questions such as 'tell me about the college' and Hindi or Hinglish equivalents. Give the returned supported facts first. Offer a callback only if the returned result says the topic is unsupported or requires confirmation.",
          parameters: z.object({ question: z.string() }),
          flags: llm.ToolFlag.CANCELLABLE,
          onDuplicate: "replace",
          execute: async ({ question }) => retrieveApprovedFacts(profile, question),
        }),
      },
      turnHandling: LIVE_TURN_HANDLING,
    });
    this.profile = profile;
  }

  override async onUserTurnCompleted(chatCtx: ChatContext, newMessage: ChatMessage): Promise<void> {
    if (!newMessage.textContent?.trim()) {
      throw new voice.StopResponse();
    }
    this.conversationState.add({ role: "student", text: newMessage.textContent });
    chatCtx.addMessage({
      role: "developer",
      content: buildTurnGrounding(this.profile, newMessage.textContent),
    });
  }

  override async llmNode(chatCtx: ChatContext, toolCtx: llm.ToolContext, modelSettings: ModelSettings) {
    const studentMessages = chatCtx.items
      .filter((item): item is ChatMessage => "role" in item && item.role === "user")
      .map(item => item.textContent?.trim())
      .filter((text): text is string => Boolean(text));
    const question = studentMessages.at(-1);
    const priorStudentTurns = studentMessages.slice(0, -1);
    const approvedReply = question
      ? buildApprovedStudentConversationReply(this.profile, question, priorStudentTurns)
      : null;

    if (approvedReply) {
      console.info("college_agent_llm_route", {
        profileId: this.profile.profileId,
        matchedApprovedConversationRoute: true,
        priorStudentTurnCount: priorStudentTurns.length,
        responseCharacters: approvedReply.length,
      });
      return ReadableStream.from([approvedReply]);
    }

    return CollegeAdmissionsAgent.default.llmNode(this, chatCtx, toolCtx, modelSettings);
  }

  override async ttsNode(text: ReadableStream<string> | AsyncIterable<string>, modelSettings: ModelSettings) {
    const readable = text instanceof ReadableStream ? text : ReadableStream.from(text);
    const formatter = new SpeechTextBuffer(this.profile.profileId);
    const transformer = new TransformStream<string, string>({
      transform(chunk, controller) { for (const segment of formatter.push(chunk)) controller.enqueue(segment); },
      flush(controller) { for (const segment of formatter.flush()) controller.enqueue(segment); },
    });
    return CollegeAdmissionsAgent.default.ttsNode(this, readable.pipeThrough(transformer), modelSettings);
  }
}
