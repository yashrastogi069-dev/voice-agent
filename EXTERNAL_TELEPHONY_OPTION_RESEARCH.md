# External Telephony Option Research

## Purpose

This note records official-source findings for a **single controlled real-call test** that avoids Exotel business KYC. It does not approve any route for production outreach or bypass regulatory requirements.

## Findings recorded on 21 August 2026

| Provider or product | What the official source confirms | Constraint for this project | Source |
| --- | --- | --- | --- |
| LiveKit Phone Numbers | LiveKit rents US numbers and currently supports **inbound calling only**. Outbound calling is listed as coming later. | The retained `+1 240 369 8658` cannot originate a US or India call and is only useful for a future US inbound test. | [LiveKit Phone Numbers](https://docs.livekit.io/telephony/start/phone-numbers/) |
| Exotel trial account | Exotel permits a KYC-free test only when an Exotel user calls another **verified Exotel user**; the documented flow dials the human caller first, then the target. | Useful only for a basic two-leg human trial. It does not supply the vSIP/AgentStream route required to connect the deployed LiveKit agent to Indian PSTN. | [Exotel trial outbound calls](https://support.exotel.com/support/solutions/articles/110606-trial-accounts-how-do-i-test-outbound-calling-) |
| Twilio trial | The official trial has free voice units, requires verified recipients, restricts calls to the signup country, and expires after 30 days. | It may support a narrow self-test only if the verified-number and signup-country rules permit the desired destination. It is not an India production route and does not avoid the separate LiveKit speech quota. | [Twilio free trial](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account) |
| Infobip Voice trial | The official 60-day trial includes 15 outbound phone calls, permits calls only to verified signup recipients, limits calls to five minutes, and lists India as available for trial outbound calls. | A potentially viable one-number India test if signup and recipient verification complete without business KYC. Its direct compatibility with the existing LiveKit worker still requires confirmation. | [Infobip Voice getting started](https://www.infobip.com/docs/voice-and-video/getting-started) |

## Non-negotiable constraints

The current LiveKit Inference gateway returns an authenticated `inference_quota_exceeded` response before STT and TTS can initialize. Therefore, no carrier test can provide a functioning conversational agent until the inference allowance resets or the speech stack changes. A call-provider trial can only validate phone routing; it cannot make the quota-blocked agent speak.

## Infobip SIP bridge follow-up

Infobip’s Calls API can bridge PSTN and SIP endpoints in principle, but its own documentation says that SIP trunking and media streaming must be activated for the account and directs the user to a dedicated Account Manager for that activation. The SIP-trunking documentation also describes channel plans and traffic billing. Therefore, **the available 60-day trial cannot currently be presented as a guaranteed free LiveKit-SIP bridge**. It remains a possible trial for a verified-recipient phone-routing or one-way voice test, subject to the portal offering it without additional verification.

Sources: [Infobip Calls API](https://www.infobip.com/docs/voice-and-video/calls) and [Infobip SIP Trunking](https://www.infobip.com/docs/voice-and-video/sip-trunking).
