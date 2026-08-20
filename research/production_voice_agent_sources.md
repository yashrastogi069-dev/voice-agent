# Production Voice-Agent Source Notes

## Real-Time Agent Orchestration

- **LiveKit Agents official documentation:** https://docs.livekit.io/agents/
- LiveKit documents a streaming STT–LLM–TTS pipeline, turn detection, interruption handling, LLM orchestration, agent handoffs, external data integration, and telephony support. These are the required runtime primitives for a voice agent that can stop speaking when the caller interrupts and begin a new turn instead of continuing an outdated answer.

## Streaming Speech Recognition

- **Deepgram language support documentation:** https://developers.deepgram.com/docs/language
- Deepgram documents language selection with a `language` parameter and says that a specified language constrains transcription to that language. It also points to multilingual code-switching for mixed-language audio. The live-agent evaluation should test Hindi, Indian English, and their expected code-switching patterns before selecting the final STT configuration.

## Existing Telephony and Regulation References

- **Exotel Connect Two Numbers API:** https://developer.exotel.com/docs/voice-v1/api-reference/connect-two-numbers
- **LiveKit telephony introduction:** https://docs.livekit.io/telephony/
- **TRAI TCCCPR:** https://trai.gov.in/tcccpr
- **TRAI Advice to Senders:** https://trai.gov.in/advice-to-senders

The current browser simulation is not a replacement for this architecture. A live implementation needs a real carrier event stream, real-time audio sessions, source-grounded knowledge retrieval, and a separate quality/evaluation loop.

## India Telephony Streaming Path

- **Exotel AgentStream developer guide:** https://developer.exotel.com/docs/agentstream/developer-guide
- Exotel documents that, after an answered call, it opens a WebSocket to the bot endpoint, streams raw PCM audio approximately every 100 ms, and accepts audio over the same socket to speak to the caller. Its VoiceBot Applet supports bidirectional media plus `clear` events, making it the relevant carrier-side primitive for barge-in: when the caller speaks, the agent can cancel pending playback and begin a new turn.
- **Exotel LiveKit SIP integration guide:** https://developer.exotel.com/docs/agentstream/livekit-integration
- Exotel documents integration of PSTN calls with LiveKit SIP infrastructure and AI agents through SIP trunking. The public page describes inbound PSTN connectivity; the outbound design must be validated with the Exotel account team or AgentStream support before it is treated as an approved production call path.
