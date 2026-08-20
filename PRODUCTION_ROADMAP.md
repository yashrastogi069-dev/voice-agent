# Production Roadmap: Delhi College Outbound Agent

## Current State

The application now supports a browser-based outbound workflow with synthetic contacts, server-side consent and do-not-call checks, campaign approval, a 9am–9pm IST calling window, selected-college knowledge boundaries, source-linked JMC, LSR, and SRCC profiles, browser speech, fixed outcomes, callback capture, and audit records. The contact records remain synthetic and the application does **not** place real telephone calls yet.

The college profiles use official University of Delhi and individual-college sources. The JMC profile can state the published 2026–27 first-year amounts from its official document; the LSR and SRCC profiles deliberately route fee questions to their admissions channels until a current, official fee table is available for their specific profile. This prevents one college’s fee from being attributed to another.

## Two Viable Production Paths

| Approach | What it does | Trade-offs | Cost shape | Setup complexity |
| --- | --- | --- | --- | --- |
| **Telephony API with a controlled agent service** | The application initiates calls with an India-capable telephony provider, receives status callbacks and audio events, and controls a real-time agent session itself. | Maximum control over policy, audit data, handoff, source boundaries, and vendor choice. It requires building and operating the real-time voice path. | Provider minutes, speech/LLM use, and always-on agent runtime. | Higher; this is the scalable engineering route. |
| **Browser simulation plus human calling workflow** | The existing product qualifies interest, records outcomes, and routes callbacks to human counsellors; people make the actual calls. | Lowest risk and fastest to operate, but no automated phone conversation. | Low; no telephony minutes or streaming runtime. | Low; it is already close to ready. |

The first route is appropriate only after the college profile, consent evidence, number provisioning, human-handoff rules, and operating review are complete. The second route is a practical interim route while those controls and vendor accounts are being prepared.

## Recommended Component Boundaries for the Telephony API Route

| Layer | Suggested tool or responsibility | Why it belongs there |
| --- | --- | --- |
| **Application and policy source of truth** | This control centre, MySQL records, and the existing server procedures | Owns contacts, consent, DNC, frequency cap, campaign approval, knowledge profile, call record, and outcome. n8n must not become the source of truth for these rules. |
| **India telephony carrier** | **Exotel** | Its official Voice API documents an India/Mumbai endpoint, E.164 contact parameters, caller IDs, status callbacks, recording, and a real-time `StreamUrl` option. [1] |
| **Real-time agent session** | **LiveKit Agents / SIP** | LiveKit documents outbound SIP participants, trunks, dispatch rules, and tested SIP-provider compatibility including Exotel. [2] |
| **Speech-to-text and text-to-speech** | Select a streaming STT provider and a high-quality multilingual TTS provider after an Indian-English/Hindi voice evaluation | This is the layer that determines latency, interruption handling, pronunciation, and naturalness. Evaluate with actual approved scripts rather than buying a voice plan first. |
| **Conversation reasoning** | A bounded LLM router and response generator | The LLM may classify intent and phrase replies, but all factual replies should be retrieved from the selected profile; unsupported questions must create a callback request. |
| **Observability** | Structured call events, provider status callbacks, transcript summaries, latency/error logs, and an error alert channel | Enables recovery from failed calls, provider webhooks, speech failure, and handoff failures. |

## Real Call Flow

```text
Approved campaign + consented contact
        ↓
Server rechecks consent, DNC, frequency cap, college profile, and IST window
        ↓
Telephony provider starts permitted call and sends status/audio events
        ↓
SIP/real-time agent session streams STT → bounded profile retrieval → LLM → TTS
        ↓
Student question resolved only from selected college profile, or escalated
        ↓
Outcome event: interested | callback | not interested | DNC
        ↓
Server persists call record and updates suppression/callback state
        ↓
n8n receives a signed business event for CRM, counsellor, and notification automation
```

Exotel documents status callbacks, recording, a WebSocket stream URL, and call outcomes such as completed, failed, busy, and no-answer; the application should record those provider events alongside the conversational outcome. [1] LiveKit documents explicit outbound SIP participant creation and SIP trunks for making outbound calls. [2]

## Where n8n Fits

n8n should be the **automation and integration layer**, not the media or real-time decision engine. Its webhook node has distinct test and production URLs, supports POST requests, and supports header/JWT/basic authentication; secure it with authentication and an IP allowlist where possible. [3]

| n8n workflow | Trigger | Actions | Source of truth |
| --- | --- | --- | --- |
| **Qualified-lead intake** | CRM, form, or spreadsheet event | Normalize lead, verify required consent fields, post to the application, notify an operator if evidence is incomplete. | Application contact and consent ledger. |
| **Campaign approval handoff** | Campaign approved in the application | Create or update a CRM campaign, notify the assigned admissions team, and create a monitored call batch reference. | Application campaign status. |
| **Call-status processing** | Signed telephony-provider callback | Map queued, answered, completed, busy, no-answer, or failed events to CRM timeline fields and operational alerts. | Application call record plus provider event ID. |
| **Callback follow-up** | `callback` outcome | Create a counsellor task with college, course interest, language, and transcript summary; send notification to the assigned team. | Application callback queue. |
| **DNC suppression propagation** | `dnc` outcome | Update the CRM contact, update marketing segments, and notify the operator if a downstream system rejects the suppression. | Application DNC ledger. |
| **Failure workflow** | Any workflow execution failure | Send the incident payload to the owner and retain the failed provider event for replay. | Application audit event and n8n execution record. |

The current configured n8n connector points at a local endpoint that is not reachable from this environment, so no workflow was created or changed. Before integration, supply a reachable n8n production URL and configure the application’s outbound webhook secrets; do not use an unauthenticated or localhost webhook for production.

## Credentials and Configuration Needed Before Real Calls

| Item | Purpose | Where it is used |
| --- | --- | --- |
| Exotel account SID, API key/token, provisioned caller ID, and callback verification secret | Starts calls and verifies provider events | Server-side only |
| SIP trunk details and LiveKit service credentials | Routes call audio to the real-time agent session | Real-time agent runtime |
| Streaming STT and TTS credentials | Transcription and natural synthesized speech | Real-time agent runtime |
| Production LLM key or selected server-side model | Intent routing and bounded response generation | Server-side only |
| n8n production webhook URLs and shared signing secret | CRM, callback, DNC, notification, and error workflows | Server-to-server only |
| CRM access token and object/field mapping | Contact, task, and call-outcome synchronization | n8n credential store |

## Launch Gates

The following sequence should be completed before enabling a real dial button. Register/provision the telephony account and business caller ID; validate each college profile with the authorised college contact; upload only contacts with documented scope-specific consent; establish a suppression-sync test; run a small staff-only test with recording and handoff; then run a limited monitored campaign. The regulator’s public sender guidance and the TCCCPR framework concern commercial communications and customer preferences; have a qualified India telecom/compliance reviewer validate the exact obligations for the intended campaign before launch. [4] [5]

> This is an engineering and operational roadmap, not legal advice. Do not treat the current browser demo or the public source profiles as authorization to place live commercial calls.

## References

[1]: https://developer.exotel.com/docs/voice-v1/api-reference/connect-two-numbers "Exotel Connect Two Numbers API"
[2]: https://docs.livekit.io/telephony/ "LiveKit Telephony Documentation"
[3]: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ "n8n Webhook Node Documentation"
[4]: https://trai.gov.in/tcccpr "TRAI Telecom Commercial Communication Customer Preference Regulation"
[5]: https://trai.gov.in/advice-to-senders "TRAI Advice to Senders"
