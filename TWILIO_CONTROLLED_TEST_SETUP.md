# Twilio + LiveKit Controlled Test Setup

This guide configures **one real phone-call test** for the existing LiveKit voice agent. It is deliberately limited to a phone number you own or directly control. It is **not** a student-outreach, campaign, or production India-caller-ID setup.

> **Important correction:** You can start with a Twilio Trial to verify your own number, but Twilio documents that **SIP Trunking is available only after account upgrade**. Therefore, this guide uses the smallest suitable upgraded Twilio account configuration, not a trial-only trunk. [1]

## What You Need Before Clicking Anything

| Item | Why it is needed | Do not share it publicly |
| --- | --- | --- |
| An Indian mobile number you own or directly control | The only call destination for the first test. | The actual number may be supplied later through the protected project flow. |
| Twilio account | Hosts the Elastic SIP Trunk used by LiveKit. | Keep account credentials private. |
| LiveKit project | Already selected for the agent runtime. | Keep API key and secret in protected project settings. |
| A small paid Twilio upgrade | Required before creating the Elastic SIP Trunk. | Do not buy a bulk campaign or unrelated product. |

## Part A — Twilio Account and Test Boundary

### 1. Create and verify the Twilio account

1. Open [Twilio signup](https://www.twilio.com/try-twilio).
2. Register with your normal Indian mobile number.
3. Verify email and mobile when prompted.
4. Do not put student numbers into Twilio. The first destination must be your own controlled number.

Twilio Trial Voice can call only verified recipient numbers and is restricted to the country linked to the signup number. India is listed among Twilio’s supported trial signup countries. [2]

### 2. Upgrade only when ready to create the trunk

1. In Twilio Console, use the **Upgrade** option shown in the account banner or billing area.
2. Select the smallest suitable paid account/balance option Twilio offers for a single short test.
3. Stop after the account is upgraded. You do **not** need Flex, a campaign service, a contact-center plan, bulk SMS, or an outbound dialer product.

Twilio’s SIP Trunking documentation states that a trial includes an auto-assigned number but that SIP Trunking becomes available only after account upgrade. [1]

### 3. Confirm the allowed test destination

1. In Twilio Console, open **Phone Numbers** → **Verified Caller IDs**.
2. Add the mobile number you will use for the controlled test if it is not already verified.
3. Complete the SMS or voice verification prompt on that phone.
4. In **Voice** → **Settings** → **Geo permissions**, enable only the India low-risk destination range required for the test, then save. [3]

Twilio requires a verified caller ID for SIP-trunk termination calls to the PSTN. [1]

## Part B — Create the Twilio Elastic SIP Trunk

### 4. Create the trunk

1. In Twilio Console, select **Products & Services** → **Elastic SIP Trunking** → **Trunks**.
2. Click **Create new SIP trunk**.
3. Name it: `livekit-controlled-test`.
4. Click **Create**.

### 5. Configure a termination identity

1. Open the trunk and choose the **Termination** tab.
2. In **Termination SIP URI**, enter a unique short value such as `voice-agent-test`.
3. Twilio will form a domain that ends in `.pstn.twilio.com`.
4. Copy the complete termination domain; you will use it in LiveKit. Do not add `sip:` unless the LiveKit field explicitly requires it.

LiveKit’s provider guide requires a Twilio SIP termination domain ending in `pstn.twilio.com` for the outbound route. [4]

### 6. Create SIP credentials

1. In Twilio Console, select **Voice** → **Credential lists**.
2. Click **Create new credential list**.
3. Name it: `livekit-controlled-test-auth`.
4. Add one username and a strong password. Save both values securely; do not paste them in GitHub or chat.
5. Return to **Elastic SIP Trunking** → **Manage** → **Trunks** → `livekit-controlled-test`.
6. Open **Termination** → **Authentication** → **Credential Lists**.
7. Attach `livekit-controlled-test-auth` and click **Save**.

The LiveKit Twilio integration requires the same username and password in both Twilio’s credential list and the LiveKit outbound trunk. [4]

## Part C — Create the Matching LiveKit Outbound Trunk

### 7. Create the LiveKit trunk

1. Sign in to [LiveKit Cloud](https://cloud.livekit.io/).
2. Select the project for this voice agent.
3. Open **Telephony** → **SIP trunks**.
4. Click **Create new trunk**.
5. Select **Outbound**.
6. Open the **JSON editor**.
7. Use this template, replacing every placeholder with the Twilio values you just created:

```json
{
  "name": "Twilio controlled outbound test",
  "address": "voice-agent-test.pstn.twilio.com",
  "numbers": ["<YOUR_VERIFIED_PLUS_91_CALLER_ID>"],
  "authUsername": "<TWILIO_CREDENTIAL_LIST_USERNAME>",
  "authPassword": "<TWILIO_CREDENTIAL_LIST_PASSWORD>"
}
```

8. Click **Create**.
9. Copy the resulting **SIP trunk ID**. This is the value for `LIVEKIT_OUTBOUND_TRUNK_ID`.

## Part D — Send the Project Only the Right Values

Use the secure project-secret form to supply the following values. Do not place them in GitHub, source files, screenshots, or normal chat.

| Project value | Where it comes from |
| --- | --- |
| `LIVEKIT_URL` | Existing LiveKit project settings |
| `LIVEKIT_API_KEY` | Existing LiveKit project settings |
| `LIVEKIT_API_SECRET` | Existing LiveKit project settings |
| `LIVEKIT_OUTBOUND_TRUNK_ID` | The LiveKit trunk created in Part C |
| `LIVEKIT_CALLER_ID` | The one verified `+91...` caller identity used for the test |
| `LIVE_CALL_PROVIDER_EVENT_SECRET` | A random secret used to authenticate call-status events |

In normal chat, send only this short confirmation:

```text
Twilio upgraded, LiveKit trunk created, and I approve one test call to my verified number.
```

We will then run the protected preflight checks. The agent remains disabled until all checks pass and the controlled call is explicitly approved.

## Stop Conditions

Stop and send a screenshot—not a credential—if any of these happens:

| Problem | Correct next action |
| --- | --- |
| Elastic SIP Trunking is not visible after upgrade | Send a screenshot of the console navigation and error. |
| Twilio refuses the caller identity | Recheck that the caller ID is verified and uses E.164 format. |
| The LiveKit trunk cannot authenticate | Recheck the same credential list username/password in both systems. |
| Calls to India are blocked | Recheck Twilio Voice Geo permissions and confirm only the controlled test number is enabled. |
| You are asked to create a campaign/dialer | Do not proceed; this test does not need it. |

## References

[1]: https://www.twilio.com/docs/sip-trunking/scale-and-limits "Twilio SIP Trunking scale and limits"
[2]: https://www.twilio.com/docs/usage/trials "Twilio trial account"
[3]: https://www.twilio.com/docs/sip-trunking/voice-dialing-geographic-permissions "Twilio Voice geographic permissions"
[4]: https://docs.livekit.io/telephony/start/providers/twilio/ "LiveKit Twilio SIP trunk quickstart"
