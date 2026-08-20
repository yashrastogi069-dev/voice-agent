const requiredForAgentRuntime = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"] as const;
const optionalModelConfig = ["LIVEKIT_STT_MODEL", "LIVEKIT_LLM_MODEL", "LIVEKIT_TTS_MODEL", "LIVEKIT_TTS_VOICE", "LIVEKIT_OUTBOUND_TRUNK_ID", "LIVEKIT_CALLER_ID"] as const;
const requiredForControlledDial = ["LIVEKIT_OUTBOUND_TRUNK_ID", "LIVEKIT_CALLER_ID", "LIVE_CALL_PROVIDER_EVENT_SECRET"] as const;

const missing = requiredForAgentRuntime.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`Live agent is not ready to connect. Add: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("LiveKit runtime credentials are present.");
}

const unsetOptional = optionalModelConfig.filter(key => !process.env[key]);
if (unsetOptional.length > 0) {
  console.log(`Using documented defaults for: ${unsetOptional.join(", ")}`);
}

if (process.env.LIVE_CALLS_ENABLED !== "true") {
  console.log("Live dialling remains disabled. This is the expected safe state until a controlled test is approved.");
} else {
  const missingDialConfig = requiredForControlledDial.filter(key => !process.env[key]);
  if (missingDialConfig.length > 0) {
    console.error(`Live dialling is not ready. Add: ${missingDialConfig.join(", ")}`);
    process.exitCode = 1;
  }
}
