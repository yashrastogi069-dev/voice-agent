import { cli, defineAgent, inference, type JobContext, ServerOptions, voice } from "@livekit/agents";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { CollegeAdmissionsAgent } from "./collegeAgent";
import { getCollegeProfile } from "./collegeKnowledge";
import {
  LIVE_ROOM_INPUT_OPTIONS,
  LIVE_TURN_HANDLING,
  LIVE_USER_AWAY_TIMEOUT_SECONDS,
  LIVE_WORKER_IDLE_PROCESSES,
} from "./runtimePolicy";

dotenv.config({ path: ".env.local" });

type AgentProcessData = { tts?: inference.TTS };

function createTts(): inference.TTS {
  return new inference.TTS({
    model: process.env.LIVEKIT_TTS_MODEL ?? "elevenlabs/eleven_flash_v2_5",
    voice: process.env.LIVEKIT_TTS_VOICE ?? "Xb7hH8MSUJpSbSDYk0k2",
    language: process.env.AGENT_TTS_LANGUAGE ?? "hi",
    modelOptions: {
      auto_mode: true,
      apply_text_normalization: "auto",
      apply_language_text_normalization: true,
      speed: 1.05,
    },
  });
}

function profileIdFromRoom(ctx: JobContext): string | undefined {
  try {
    const metadata = JSON.parse(ctx.room.metadata || "{}") as { collegeProfileId?: string };
    return metadata.collegeProfileId;
  } catch {
    return undefined;
  }
}

export default defineAgent<AgentProcessData>({
  prewarm: (proc) => {
    const tts = createTts();
    if (process.env.LIVEKIT_TTS_PREWARM === "true") {
      tts.prewarm();
    }
    proc.userData.tts = tts;
  },
  entry: async (ctx: JobContext) => {
    const profile = getCollegeProfile(profileIdFromRoom(ctx));
    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: process.env.LIVEKIT_STT_MODEL ?? "elevenlabs/scribe_v2_realtime",
        language: process.env.AGENT_STT_LANGUAGE ?? "hi",
      }),
      llm: new inference.LLM({
        model: process.env.LIVEKIT_LLM_MODEL ?? "google/gemma-4-31b-it",
        modelOptions: { temperature: 0.15, max_completion_tokens: 110 },
      }),
      tts: ctx.proc.userData.tts ?? createTts(),
      turnHandling: LIVE_TURN_HANDLING,
      userAwayTimeout: LIVE_USER_AWAY_TIMEOUT_SECONDS,
    });

    await session.start({
      agent: new CollegeAdmissionsAgent(profile),
      room: ctx.room,
      inputOptions: LIVE_ROOM_INPUT_OPTIONS,
    });
    await ctx.connect();
    await session.say(
      `नमस्ते, मैं ${profile.institution} से बोल रही हूँ। मैं आपको कोर्स, फीस या एडमिशन की जानकारी दे सकती हूँ। आप किस बारे में जानना चाहेंगे?`,
      { allowInterruptions: true },
    );
  },
});

cli.runApp(new ServerOptions({
  agent: fileURLToPath(import.meta.url),
  agentName: "delhi-college-outbound-agent",
  numIdleProcesses: LIVE_WORKER_IDLE_PROCESSES,
}));
