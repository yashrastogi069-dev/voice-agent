# Controlled Live-Agent Activation Checklist

This project is intentionally **not able to place calls yet**. The server requires explicit live-call activation and rejects unsigned provider events. The first permitted call must be a controlled test to a number you own or directly control.

## Prerequisites

| Requirement | Status required before the first call |
| --- | --- |
| LiveKit project | Create a project and issue `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`. |
| Exotel SIP route | Provision an approved Indian caller ID and outbound SIP trunk, then create the LiveKit outbound trunk and record `LIVEKIT_OUTBOUND_TRUNK_ID`. |
| Caller identity | Store the approved `+91...` caller number in `LIVEKIT_CALLER_ID`. |
| Callback security | Generate and store `LIVE_CALL_PROVIDER_EVENT_SECRET`; sign carrier events with HMAC-SHA256 in the `X-Live-Call-Signature` header. |
| Controlled test number | Add one consented number you own or control, in E.164 format. |
| Written authorization | Confirm authorization for the caller ID, institution profile, and controlled test. |
| Speech selection | Configure and evaluate Hindi/English streaming STT and TTS models for the approved script. |

## Safe Activation Sequence

1. Enter the required secrets through the managed secret form; do not commit them or place them in a GitHub issue.
2. Run the agent configuration verifier and confirm the controlled-dial requirements are present.
3. Keep `LIVE_CALLS_ENABLED=false` while reviewing speech output, provider callback signing, and the selected permitted contact.
4. Set `LIVE_CALLS_ENABLED=true` only for the approved controlled window. The operations console still requires an explicit confirmation immediately before dialling.
5. Make one call to the permitted test number, then verify that the `liveCallAttempts` record transitions through provider events and that any callback or DNC event is delivered to the configured business-event endpoint.
6. Disable live calls again if the status sequence, voice quality, grounding behavior, interruption behavior, or DNC handling is not acceptable.

## Provider Callback Contract

Send a JSON body to `POST /api/live-call/provider-event`. The body must include the LiveKit room name as `roomName`, `room_name`, or `room`, together with a recognized status such as `ringing`, `answered`, `completed`, `busy`, `no_answer`, `failed`, or `cancelled`. Compute the HMAC-SHA256 of the exact JSON body using `LIVE_CALL_PROVIDER_EVENT_SECRET` and send the hexadecimal result in `X-Live-Call-Signature` (an optional `sha256=` prefix is accepted).

The server rejects unsigned or invalid events. It persists accepted provider states against the matching LiveKit room and treats `completed`, `busy`, `no_answer`, `failed`, and `cancelled` as terminal outcomes.

## Deferred n8n Integration

The n8n workflow remains outside the live audio path. When n8n is available at a public HTTPS URL, import `n8n/voice-agent-events.workflow.json`, configure its signed endpoint, and use it for callback follow-up, DNC propagation, CRM tasks, notifications, and carrier-failure handling. Do not route real-time call audio through n8n.

For credential acquisition details, see [GETTING_LIVE_CREDENTIALS.md](./GETTING_LIVE_CREDENTIALS.md).
