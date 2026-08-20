# Faster India Telephony Path — Research Notes

## Verified Provider Findings

| Option | Verified setup path | Speed benefit | India / production caveat |
| --- | --- | --- | --- |
| **Twilio minimal upgrade** | Create an account, verify email and personal phone, upgrade before creating an Elastic SIP Trunk; then configure calling permissions in Console → Voice → Settings → Geo permissions. | Fastest LiveKit-compatible proof-of-connectivity route after a small upgrade. | Trial Voice is restricted to verified recipients and the signup country, and Twilio does not enable SIP Trunking until upgrade; it remains a proof-of-technology path, not an Indian business-caller-ID production route. |
| **Plivo Zentrunk + LiveKit** | Plivo Console → SIP Trunking → Outbound Trunks → Create Trunk → create credentials → enable Secure Trunking → copy Termination SIP Domain; create a corresponding LiveKit outbound trunk. | Self-service trunk creation and a direct official LiveKit guide. | Indian traffic still requires an India-region account, India KYC/number approval, LiveKit India region pinning, and India media anchoring; it is faster for configuration but not a no-compliance production shortcut. |
| **Exotel vSIP / AgentStream** | Exotel account + KYC, then support/account-team vSIP enablement and ExoPhone provisioning; connect LiveKit after SIP details are supplied. | Strong India-native compliance path after provisioning. | Slower because KYC and account-team provisioning are normally required. |

## Primary Source Details

1. Twilio’s trial documentation says trials include Voice units, can call only verified numbers, restrict Voice to the sign-up country, and expire after 30 days. It lists India among trial-supported countries. [Twilio Trial Account](https://www.twilio.com/docs/usage/trials)
2. Twilio documents Voice geographic permissions under Console → Voice → Settings → Geo permissions and recommends enabling only required low-risk destinations. [Twilio Geo Permissions](https://www.twilio.com/docs/sip-trunking/voice-dialing-geographic-permissions)
3. Plivo documents instant console provisioning for Zentrunk, free trial account signup, credentials/IP ACL authentication, and outbound trunk creation through Console → Zentrunk → Outbound Trunks. [Plivo SIP Trunking](https://plivo.com/docs/sip-trunking)
4. LiveKit’s Plivo guide gives exact console steps for a Plivo outbound trunk followed by a LiveKit outbound trunk. It states that Indian numbers or Indian destinations require LiveKit region pinning and that calls fail without it. [LiveKit + Plivo](https://docs.livekit.io/telephony/start/providers/plivo/)
5. Exotel’s vSIP guide describes partner SIP → Exotel → Indian PSTN outbound routing and directs customers to sign up, complete KYC, and email support/account teams for SIP trunking enablement. [Exotel vSIP](https://support.exotel.com/support/solutions/articles/3000133452-flow-and-api-configuration-guide-for-voice-ai-contact-centre-platforms-via-exotel-virtual-sip-trunk)
6. Plivo’s India calling documentation requires an India-registered business for Indian numbers and domestic routes, explicit digital consent for commercial calling, India data-region account setup, and India media anchoring for both legs. Its India voice-agent guidance says calls fail if the platform is not region-pinned or deployed in India. [Plivo India Calling](https://www.plivo.com/docs/voice/concepts/india-calling) [Plivo Voice Agents in India](https://www.plivo.com/docs/voice-agents/sip-trunking/deploy/calling-in-india/)

## Interactive Documentation Check

On 2026-08-20, the LiveKit provider quickstart was opened and confirmed that it presents both API and Console procedures for Plivo inbound and outbound trunks. Twilio’s official trial page was also opened and confirmed its verified-recipient restriction, India trial availability, and sign-up-country calling restriction. These findings match the source notes above.

## Preliminary Decision Rule

Use a **minimal Twilio upgrade** only if the immediate goal is to hear one controlled real LiveKit call to a verified number quickly; the trial can verify the number but cannot create the required SIP trunk. Use **Plivo Zentrunk + LiveKit** only if you can meet the India account/KYC, number, media-anchoring, and region-pinning conditions; it has a superior self-service console path but is not a shortcut around Indian telecom requirements. Retain **Exotel** for the India-native production path if its compliance, approved caller identity, and account support are more important than fastest provisioning.
