# Sarvam First, Then Twilio: Beginner Checklist

This project uses **two different services for two different jobs**. They work together; one does not replace the other.

| Service | Job in this project | When to set it up |
| --- | --- | --- |
| **Sarvam** | Understands Hindi/Hinglish speech and produces a natural Indian-language voice. | **Now**, before any phone carrier. |
| **Twilio** | Provides the SIP trunk and phone network route to call an ordinary number. | **Later**, after the Hindi quality test passes. |
| **LiveKit** | Connects the browser, agent worker, models, and later SIP trunk in real time. | Already created and working. |

> **Correct order:** Sarvam → free LiveKit browser test → knowledge refinement → Twilio upgrade and SIP trunk → one verified-number phone test.

## Part A — Do Now: Sarvam Hindi and Hinglish Setup

### 1. Create the Sarvam account

1. Open [Sarvam Dashboard](https://dashboard.sarvam.ai/).
2. Sign up and complete email verification.
3. Open **Key Management**.
4. Select **Create API Key**.
5. Name it `india-voice-agent-test`.
6. Copy the key once and store it safely. Do not paste it into GitHub, screenshots, or normal chat.

Sarvam documents free signup credits for API exploration. Its LiveKit integrations support Indian languages and code-mixed English/Hindi audio. [1] [2] [3]

### 2. Add the Sarvam key securely

Reply in this conversation only with **`Sarvam key ready`**. A protected secret field will be opened for `SARVAM_API_KEY`; add the actual key there. It will not be exposed in code or GitHub.

### 3. Let the project switch its speech stack

After the key is secure, the project will be changed to use these deliberate defaults:

| Function | Configuration | Why |
| --- | --- | --- |
| Speech recognition | Sarvam `saaras:v3`, Hindi/English code-mixed mode | Better handling of Hindi and Hinglish questions. |
| Speech output | Sarvam `bulbul:v3`, `hi-IN`, Indian voice | Avoids the current English-default TTS voice. |
| Speaking style | Short conversational answers, pace 1.0 | Sounds clearer and permits interruption. |
| Pronunciation | Existing college-name normalization plus a future dictionary if needed | Improves programme and college names. |

Sarvam recommends `saaras:v3` for newer Indian-language recognition and `bulbul:v3` with an explicit language code for newer TTS implementations. [2] [3]

### 4. Test it for free in LiveKit

1. Open your LiveKit project.
2. Open **Agents** → **`delhi-college-outbound-agent`**.
3. Select **Launch Console** → **Start a session**.
4. Allow microphone permission.
5. Test these sentences in this order:

```text
नमस्ते, मुझे JMC के बारे में जानकारी चाहिए।
बी.कॉम ऑनर्स की फीस कितनी है?
मुझे CUET और एडमिशन के बारे में बताइए।
I want to know about scholarships.
```

6. Confirm three things: the agent hears your Hindi correctly, replies in natural Hindi/Hinglish, and gives an approved answer instead of guessing.

Do **not** create a Twilio SIP trunk until this test is good enough.

## Part B — Do Later: Twilio Phone Connection

### 5. Upgrade Twilio only after Sarvam passes

Twilio Trial alone cannot create an Elastic SIP Trunk. When the browser test is satisfactory and you want a real phone call, upgrade the Twilio account with the smallest appropriate paid option. [4]

### 6. Limit the first call

1. Verify **one phone number you own or control** in Twilio.
2. Enable only the required India destination in **Voice** → **Settings** → **Geo permissions**.
3. Create one trunk: **Products & Services** → **Elastic SIP Trunking** → **Trunks** → **Create new SIP trunk**.
4. Configure a termination domain, credential list, and matching LiveKit outbound trunk exactly as described in [`TWILIO_CONTROLLED_TEST_SETUP.md`](./TWILIO_CONTROLLED_TEST_SETUP.md).
5. Give the project only the secure LiveKit trunk ID and protected runtime values.
6. Explicitly approve one call to the verified number. The application will then run its protected preflight gate before dialing.

## Do Not Do These Things

Do not import student contacts, buy an automated dialer package, turn on live calling, or create a campaign before the Sarvam browser test and the one verified-number Twilio test both pass. Do not put Sarvam, LiveKit, or Twilio credentials into the public GitHub repository.

## References

[1]: https://docs.sarvam.ai/api/getting-started/ratelimits "Sarvam credits and rate limits"
[2]: https://docs.livekit.io/agents/models/stt/sarvam/ "LiveKit Sarvam speech-to-text integration"
[3]: https://docs.livekit.io/agents/models/tts/sarvam/ "LiveKit Sarvam text-to-speech integration"
[4]: https://www.twilio.com/docs/sip-trunking/scale-and-limits "Twilio SIP Trunking scale and limits"
