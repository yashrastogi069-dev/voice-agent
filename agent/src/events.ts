export type VoiceAgentEventName = "callback_requested" | "dnc_recorded";

export type VoiceAgentEvent = {
  eventId: string;
  event: VoiceAgentEventName;
  contactId: string;
  collegeProfileId: string;
  createdAt: string;
  payload: Record<string, string>;
};

export function buildVoiceAgentEvent(input: Omit<VoiceAgentEvent, "eventId" | "createdAt">): VoiceAgentEvent {
  return {
    ...input,
    eventId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sends an outcome to the application or, later, a signed n8n webhook. A missing endpoint is
 * intentionally non-fatal during local agent development; live launch validation rejects it.
 */
export async function publishVoiceAgentEvent(event: VoiceAgentEvent): Promise<{ delivered: boolean }> {
  const endpoint = process.env.VOICE_AGENT_EVENT_WEBHOOK_URL;
  if (!endpoint) return { delivered: false };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Voice-Agent-Event": event.eventId },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error(`Voice agent event endpoint returned ${response.status}`);
  return { delivered: true };
}
