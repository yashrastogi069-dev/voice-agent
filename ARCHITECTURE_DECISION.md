# Real-Time Voice-Agent Architecture Decision

## Decision in Plain Language

The recommended **free-first software architecture** is **Exotel SIP trunking connected to a self-hosted LiveKit Agents service**. LiveKit Agents provides the part the browser simulator lacks: continuous streaming speech input and output, real turn detection, interruption handling, conversation state, tool boundaries, and agent evaluation. The agent code itself is open source; the unavoidable external costs are the telephone carrier’s numbers/minutes and whichever speech or model APIs are selected for production quality.

This is not a claim that every component is free in live operation. A real phone call needs a regulated carrier, a provisioned caller identity, and paid network minutes. The purpose of this choice is to keep the agent runtime, the conversation logic, n8n, and operational control self-hostable rather than locking the core product into a managed-agent platform from day one.

## What “Importable n8n Workflow” Means

The project will include a JSON workflow export. It can be opened from n8n’s **Import from File** function after the local n8n instance has a public HTTPS address. Importing creates the webhook trigger, call-event routing, callback task, CRM update placeholders, DNC propagation branch, and error-alert branch inside the user’s own n8n workspace. The user then connects credentials and replaces placeholder URLs in n8n.

> n8n does **not** carry live audio or decide what the agent says. It runs slower, business-side actions after a call event: create a counsellor task, update a CRM, notify an operator, or synchronize an opt-out.

## Architecture Comparison

| Criterion | Direct Exotel AgentStream | Exotel SIP → LiveKit Agents | Managed voice-agent platform |
| --- | --- | --- | --- |
| **Live conversation quality** | Potentially excellent, but the team must build STT/TTS streaming, VAD, timing, cancellation, and buffering itself. | Excellent foundation: LiveKit documents streaming agent sessions, turn detection, interruptions, and speech cancellation primitives. [1] [2] | Can be good quickly, but behavior is constrained by the platform’s abstractions and tuning options. |
| **Barge-in / caller interruption** | Carrier can stream bidirectional PCM and supports `clear`, but the application must correctly cancel output, discard obsolete work, and restart the turn. [3] | LiveKit pauses speech when user speech is detected, truncates un-heard output from the conversation, and exposes interruption controls. [2] | Usually built in, but the exact interruption behavior is platform-specific and may be difficult to inspect or override. |
| **India phone-network fit** | Directly uses Exotel’s call streaming service and is a valid technical path for Indian calls. [3] | Uses a carrier SIP trunk while LiveKit controls rooms and agent sessions; LiveKit documents outbound SIP participants and reusable outbound trunks. [4] | Depends on whether the managed platform supports the chosen Indian carrier and required phone-number model. |
| **Software ownership** | Maximum ownership; all media/session behavior is custom code. | High ownership; agent policy, knowledge, testing, and business logic stay in the project, while LiveKit supplies well-defined real-time primitives. | Lowest ownership; core behavior, voice configuration, and observability may be platform-specific. |
| **Free-first position** | Open-source components are possible, but high engineering effort substitutes for platform cost. Carrier minutes still apply. | Agent framework is open source and can be self-hosted; carrier minutes and chosen speech/LLM services still apply. [1] | Frequently offers trials/credits, but it is not the strongest free-first long-term base because voice-agent usage is typically metered. |
| **Build effort and risk** | Highest. Audio packet timing, playback cancellation, reconnect logic, streaming transcription, and telephony-grade reliability are owned by this project. | Moderate. SIP trunking and agent server setup are still real engineering, but LiveKit removes much of the custom media-control work. | Lowest initial engineering effort, but migration and vendor constraints become larger later. |
| **Testing and evaluation** | Must assemble custom unit, conversation, and full audio evaluation tooling. | LiveKit documents Vitest behavioral tests and end-to-end agent simulations, in addition to production audio testing options. [5] | Tools vary by vendor and may not expose internal state or deterministic tests. |
| **Best use** | Fallback if Exotel AgentStream is approved but SIP trunking cannot be provisioned, or if extreme carrier-specific control is needed. | **Recommended primary path** for the requested natural, interruption-safe, maintainable agent. | Fast prototype only, not the recommended core for this project. |

## Why Option B Is the Best Choice Here

The user’s main failures were not dashboard problems: they were conversational timing, interruptibility, spoken naturalness, and ability to stay on the current question. A browser speech API plus request-response chat cannot solve those reliably. LiveKit explicitly provides the required real-time session semantics: streaming STT–LLM–TTS, a turn detector, VAD-assisted interruption handling, speech cancellation, and conversation-history truncation when a caller interrupts. [1] [2]

Direct Exotel AgentStream can send bidirectional call audio to a bot endpoint and supports `clear` events, so it is technically capable of the same result. [3] However, it makes this project responsible for every latency-sensitive part of a phone conversation. That is the wrong trade-off for a first professional version when the goal is a stable, natural agent rather than custom audio-infrastructure research.

The primary caveat is telephony provisioning. Exotel publicly documents a LiveKit SIP integration for PSTN calls and AI agents, while its public integration page describes the inbound connection. [6] LiveKit separately documents outbound SIP participant creation and outbound trunk support. [4] Before a live test, Exotel must confirm that the specific account and trunk support the intended **outbound** route. If it does not, the project should use the Direct AgentStream fallback while keeping the same agent policy, knowledge, n8n events, and evaluation suite.

## Implementation Consequences

The production work will be organized into four independently testable layers. The **agent service** handles the live LiveKit session, VAD/turn detection, interruption events, college-profile retrieval, short speaking turns, and escalation. The **application server** owns consent, DNC, campaign authorization, frequency cap, call creation request, provider event validation, audit records, and callback state. The **carrier** places and receives calls. The deferred **n8n workflow** reacts only after the application emits signed business events.

For natural quality, the agent must not read raw URLs or database identifiers aloud. Its response generator will retrieve a structured course fact, format fees in spoken Indian currency, use a per-college pronunciation dictionary, speak one short idea at a time, and cancel a queued response immediately when a real caller begins a new turn. Unsupported questions will create a counsellor callback instead of producing an improvised answer.

## Live-Test Gates

The real agent cannot dial a number until the following prerequisites are supplied: an Exotel account with a provisioned caller identity and confirmed outbound SIP or AgentStream capability; LiveKit service credentials and a persistent agent deployment target; speech and LLM credentials selected after a Hindi/Indian-English voice evaluation; a test number the user owns or controls; and a publicly reachable HTTPS/webhook address. The n8n instance may remain local until after the agent itself is working; it is not a blocker for a controlled first call.

## References

[1]: https://docs.livekit.io/agents/ "LiveKit Agents Documentation"
[2]: https://docs.livekit.io/agents/logic/turns/ "LiveKit Turn Detection and Interruptions"
[3]: https://developer.exotel.com/docs/agentstream/developer-guide "Exotel AgentStream Developer Guide"
[4]: https://docs.livekit.io/telephony/ "LiveKit Telephony Documentation"
[5]: https://docs.livekit.io/agents/start/testing/ "LiveKit Agents Testing and Evaluation"
[6]: https://developer.exotel.com/docs/agentstream/livekit-integration "Exotel LiveKit SIP Trunking Integration Guide"
