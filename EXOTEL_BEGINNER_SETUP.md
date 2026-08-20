# Exotel Setup for Your LiveKit Voice Agent

This guide is written for a first-time Exotel user. Your target is **one controlled outbound call to a phone number you own**, using an approved Indian business number. Do not upload student data, start a campaign, or turn on automated dialling while completing these steps.

> **The important distinction:** Exotel’s normal **Dialer / Click-to-Call** product is not the route this voice agent needs. That product first calls a human agent and then connects the customer. Your project needs **Virtual SIP Trunking (vSIP) / AgentStream SIP connectivity** so LiveKit can originate a SIP call through Exotel to the Indian phone network. Exotel’s current vSIP documentation explicitly supports outbound partner-SIP-to-Indian-PSTN call flows, but the trunk is commonly provisioned by its support or account team rather than through a beginner dashboard switch. [1] [2]

## What You Are Building

| Part | Plain-English meaning | Who sets it up |
| --- | --- | --- |
| **ExoPhone / virtual number** | Your approved Indian business caller ID; students see this number. | Exotel after KYC and provisioning. |
| **Virtual SIP trunk (vSIP)** | The technical phone line between LiveKit and Exotel. | Exotel support or account manager. |
| **LiveKit outbound trunk** | The saved LiveKit configuration that knows how to reach Exotel. | You, after Exotel gives the SIP details. |
| **Voice agent** | The application already built in this project that joins the LiveKit call room. | Already implemented; we activate it after testing. |

## Part A — Create Your Exotel Account

### Step 1: Register

1. Open [Exotel’s India signup page](https://my.in.exotel.com/auth/register).
2. Create the account using the business or organization that is authorized to make the calls.
3. During initial product selection, choose **Browser Calling** if Exotel asks you to select a starting product. Exotel’s vSIP onboarding guide uses that selection for initial account creation. [1]
4. Verify your email address and mobile number if Exotel prompts you to do so.

Do **not** buy an unrelated dialer plan solely because it appears first in the dashboard. You need Exotel’s team to confirm vSIP/AgentStream SIP enablement for LiveKit before paying for or configuring a larger outbound campaign.

### Step 2: Complete KYC before asking for the phone route

1. Sign in to the Exotel dashboard.
2. Open **My Account**.
3. Open the **KYC Docs** tab.
4. First verify that the company information shown in the dashboard exactly matches the documents you will upload.
5. Upload the documents appropriate to your entity type. For a company, Exotel lists organization/incorporation evidence, company PAN, business address proof, and an authorized-signatory photograph among the KYC materials; its support page lists the acceptable alternatives for companies, partnerships, NGOs, and proprietorships. [3]
6. Submit the documents and wait for Exotel to confirm KYC/CAF approval.

> **Do not use another person’s documents, personal number, or a caller name you are not authorized to represent.** The business caller ID and entity KYC must match the entity that is permitted to make the calls.

## Part B — Request the Correct Exotel Product

There may be no visible **“create LiveKit trunk”** button in your account. That is normal. Send the request below through your Exotel account manager, the dashboard support/chat facility, or **hello@exotel.com**. Exotel’s vSIP guide directs customers to that address to enable SIP trunking and provision a virtual number/ExoPhone. [1]

### Copy and send this message

```text
Subject: Request for controlled outbound LiveKit SIP trunk test in India

Hello Exotel Team,

I have completed / am completing KYC for my Exotel account. I need a controlled outbound AI voice-agent test to one Indian mobile number that I own or directly control.

Please enable Exotel Virtual SIP Trunking (vSIP) or the appropriate AgentStream SIP product for LiveKit Cloud. The required call direction is:

LiveKit Cloud SIP outbound trunk → Exotel SIP gateway → Indian PSTN → my controlled test number.

Please confirm whether my account supports this exact outbound SIP origination route. If your current LiveKit integration instead requires Exotel to originate and bridge the call into LiveKit, please provide the supported outbound architecture and configuration steps for that route.

For the supported route, please provide:
1. An approved Indian ExoPhone / virtual caller number in E.164 format (+91...).
2. SIP gateway hostname or FQDN, port, and required transport (TLS or TCP).
3. SIP username and password, or the exact alternative authentication method.
4. Supported codecs (please confirm PCMA / G.711 A-law and any other required codec).
5. Required LiveKit Cloud India static IP ranges or FQDN / IP-whitelisting process.
6. Whether outbound calls can be limited to one controlled +91 test number during integration.
7. Call status event / webhook documentation for ringing, answered, completed, busy, no-answer, failed, and cancelled outcomes.
8. Any CAF, caller-ID, consent, commercial, or compliance prerequisites for this use case.

This is not a bulk campaign. Please keep the service limited to a single approved controlled test until validation is complete.

Thank you.
```

### What Exotel should give you

| Ask for this | Example format | Where it goes later |
| --- | --- | --- |
| Approved ExoPhone | `+9111...` or another approved `+91...` business number | `LIVEKIT_CALLER_ID` |
| SIP hostname | `sip.example.exotel...` | LiveKit trunk **address** |
| SIP port and transport | e.g. TLS/TCP with provider-provided port | LiveKit trunk configuration |
| SIP username/password | Provider-specific credentials | LiveKit trunk authentication; **never GitHub** |
| Whitelist instructions | LiveKit India IP ranges or authentication-only acceptance | Exotel configuration |
| Exotel provisioning reference | Ticket number or support confirmation | Keep for testing/escalation |
| Status-event instructions | Document or webhook specification | Used after a stable app callback URL is ready |

Exotel documents vSIP signaling over SIP/TCP or SIP/TLS and PCMA/PCMU media support, along with static-IP whitelisting for outbound partner-SIP-to-PSTN traffic. [1]

## Part C — Configure LiveKit Only After Exotel Replies

Once Exotel has confirmed the route and supplied the values above, use your existing LiveKit project.

1. Sign in to [LiveKit Cloud](https://cloud.livekit.io/).
2. Select the project whose URL, API key, and API secret you already have.
3. In the left navigation, open **Telephony** → **SIP trunks**.
4. Click **Create new trunk**.
5. Select **Outbound** as the trunk direction.
6. Open the **JSON editor** tab.
7. Enter the values supplied by Exotel. The field names below follow LiveKit’s outbound-trunk format; replace every placeholder and do not copy the placeholder values literally. [2]

```json
{
  "name": "Exotel India controlled outbound",
  "address": "<EXOTEL_SIP_HOSTNAME>",
  "numbers": ["<APPROVED_EXOTEL_PLUS_91_CALLER_ID>"],
  "authUsername": "<EXOTEL_SIP_USERNAME>",
  "authPassword": "<EXOTEL_SIP_PASSWORD>"
}
```

8. Click **Create**.
9. Copy the returned **SIP trunk ID**. This becomes `LIVEKIT_OUTBOUND_TRUNK_ID`.
10. Do not use `"*"` for numbers. Keep the trunk restricted to the one Exotel-approved caller ID for the first test.

LiveKit recommends creating a stored outbound trunk and reusing it rather than creating a new trunk per call. It returns the trunk ID after creation. [2]

## Part D — Send Back Only the Right Values

Use the secure project-secret form—not normal chat and not GitHub—to enter:

| Secure value | Source |
| --- | --- |
| `LIVEKIT_URL` | Your LiveKit project |
| `LIVEKIT_API_KEY` | Your LiveKit project |
| `LIVEKIT_API_SECRET` | Your LiveKit project |
| `LIVEKIT_OUTBOUND_TRUNK_ID` | The LiveKit trunk you created above |
| `LIVEKIT_CALLER_ID` | The approved Exotel `+91...` caller ID |
| `LIVE_CALL_PROVIDER_EVENT_SECRET` | A random secret generated by you; it protects callback events |

In a normal message, send only:

1. The controlled test number you own or control, in E.164 format, such as `+919876543210`.
2. Confirmation that you are authorized to use that number and caller identity for the test.
3. Whether Exotel approved **direct LiveKit → Exotel SIP outbound** or told you to use its bridged / AgentStream route instead.

## Part E — Do Not Configure These Yet

Do not switch on the app’s `LIVE_CALLS_ENABLED` setting yet. Do not add contacts or run an outbound campaign. Do not send a public callback URL to Exotel yet—the final callback endpoint must be on a stable deployed application domain and signed with `LIVE_CALL_PROVIDER_EVENT_SECRET` first.

The correct first test is one approved call, during the permitted 9 AM–9 PM India window, to your own controlled number. We will inspect the call lifecycle, voice quality, Hindi/English recognition, interruption behavior, callback/DNC behavior, and carrier status before allowing any student outreach.

## If Exotel Says “We Only Offer Click-to-Call”

Reply that you do **not** need the ordinary two-leg human-agent dialer. Ask specifically for the **Virtual SIP Trunking / AgentStream SIP integration team** and repeat the architecture line from the request template. Exotel’s standard click-to-call documentation describes calling an agent first, which is different from this AI SIP route. [4]

If Exotel says LiveKit direct outbound origination is unavailable for your account, ask them for the approved **Exotel-originated, LiveKit-bridged outbound** design or their **AgentStream** integration path. We can adapt the adapter only after the supported architecture and credentials are in writing; do not guess SIP settings.

## Quick Troubleshooting

| Problem | What to do |
| --- | --- |
| No trunk option in the dashboard | Expected on many accounts. Open a support request using the supplied template. |
| KYC rejected | Correct the company information first, then upload documents matching that entity. |
| Exotel provides only an ExoPhone but no SIP route | Ask for vSIP/AgentStream SIP provisioning; an ExoPhone alone is insufficient for the LiveKit path. |
| Exotel asks for IP ranges | Ask whether credentials are sufficient; otherwise use the current LiveKit India static-IP documentation with Exotel’s exact whitelist procedure. [2] |
| A support representative suggests a large campaign | State that you need one controlled test only and do not enable bulk dialing yet. |
| They ask for your SIP password by email/chat later | Do not send it to GitHub or ordinary chat. Use their secure provisioning channel and the project’s secure secret form. |

## References

[1]: https://support.exotel.com/support/solutions/articles/3000133452-flow-and-api-configuration-guide-for-voice-ai-contact-centre-platforms-via-exotel-virtual-sip-trunk "Exotel vSIP flow and API configuration guide"
[2]: https://docs.livekit.io/telephony/making-calls/outbound-trunk/ "LiveKit SIP outbound trunk documentation"
[3]: https://support.exotel.com/support/solutions/articles/35760 "Exotel KYC document upload guidance"
[4]: https://developer.exotel.com/docs/call-support/call-features/outgoing-calls "Exotel outgoing calls documentation"
