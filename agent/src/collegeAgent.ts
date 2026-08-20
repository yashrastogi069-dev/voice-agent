import { llm, voice } from "@livekit/agents";
import type { ChatContext, ChatMessage } from "@livekit/agents";
import type { ModelSettings } from "@livekit/agents";
import { ReadableStream, TransformStream } from "node:stream/web";
import { z } from "zod";
import { profileInstructions, type CollegeProfile } from "./collegeKnowledge";
import { buildVoiceAgentEvent, publishVoiceAgentEvent } from "./events";
import { BoundedConversationState, LIVE_TURN_HANDLING } from "./runtimePolicy";
import { retrieveApprovedFacts } from "./factRetrieval";
import { SpeechTextBuffer } from "./speechText";

export class CollegeAdmissionsAgent extends voice.Agent {
  readonly profile: CollegeProfile;
  readonly conversationState = new BoundedConversationState();

  constructor(profile: CollegeProfile) {
    super({
      instructions: profileInstructions(profile),
      tools: {
        request_counsellor_callback: llm.tool({
          description: "Create a callback request only when the caller asks to speak to an admissions counsellor, requests more detail outside the approved profile, or asks to be called later.",
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
          description: "Look up approved college facts before answering factual questions about programmes, fees, eligibility, scholarships, or admissions. Use callback for unsupported topics.",
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

  override async onUserTurnCompleted(_chatCtx: ChatContext, newMessage: ChatMessage): Promise<void> {
    if (!newMessage.textContent?.trim()) {
      throw new voice.StopResponse();
    }
    this.conversationState.add({ role: "student", text: newMessage.textContent });
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
