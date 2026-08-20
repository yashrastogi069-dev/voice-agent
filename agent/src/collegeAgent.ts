import { llm, voice } from "@livekit/agents";
import type { ChatContext, ChatMessage } from "@livekit/agents";
import { z } from "zod";
import { profileInstructions, type CollegeProfile } from "./collegeKnowledge";
import { buildVoiceAgentEvent, publishVoiceAgentEvent } from "./events";
import { LIVE_TURN_HANDLING } from "./runtimePolicy";

export class CollegeAdmissionsAgent extends voice.Agent {
  readonly profile: CollegeProfile;

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
      },
      turnHandling: LIVE_TURN_HANDLING,
    });
    this.profile = profile;
  }

  override async onUserTurnCompleted(_chatCtx: ChatContext, newMessage: ChatMessage): Promise<void> {
    if (!newMessage.textContent?.trim()) {
      throw new voice.StopResponse();
    }
  }
}
