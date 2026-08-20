import { cli, defineAgent, inference, type JobContext, ServerOptions, voice } from "@livekit/agents";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { CollegeAdmissionsAgent } from "./collegeAgent";
import { getCollegeProfile } from "./collegeKnowledge";
import { LIVE_TURN_HANDLING } from "./runtimePolicy";

dotenv.config({ path: ".env.local" });

function profileIdFromRoom(ctx: JobContext): string | undefined {
  try {
    const metadata = JSON.parse(ctx.room.metadata || "{}") as { collegeProfileId?: string };
    return metadata.collegeProfileId;
  } catch {
    return undefined;
  }
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const profile = getCollegeProfile(profileIdFromRoom(ctx));
    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: process.env.LIVEKIT_STT_MODEL ?? "deepgram/nova-3",
        language: process.env.AGENT_STT_LANGUAGE ?? "multi",
      }),
      llm: new inference.LLM({ model: process.env.LIVEKIT_LLM_MODEL ?? "google/gemma-4-31b-it" }),
      tts: new inference.TTS({
        model: process.env.LIVEKIT_TTS_MODEL ?? "inworld/inworld-tts-2",
        voice: process.env.LIVEKIT_TTS_VOICE ?? "Ashley",
      }),
      turnHandling: LIVE_TURN_HANDLING,
    });

    await session.start({ agent: new CollegeAdmissionsAgent(profile), room: ctx.room });
    await ctx.connect();
    await session.generateReply({
      instructions: `Greet the caller briefly as the admissions representative for ${profile.institution}. Ask whether they would like information about a programme or admissions.`,
    });
  },
});

cli.runApp(new ServerOptions({
  agent: fileURLToPath(import.meta.url),
  agentName: "delhi-college-outbound-agent",
}));
