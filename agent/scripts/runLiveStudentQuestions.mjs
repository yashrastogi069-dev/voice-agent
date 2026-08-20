import dotenv from "dotenv";
import { inference, initializeLogger, voice } from "@livekit/agents";
import { CollegeAdmissionsAgent } from "../src/collegeAgent.ts";
import { getCollegeProfile } from "../src/collegeKnowledge.ts";
import { buildTurnGrounding } from "../src/factRetrieval.ts";
import { LIVE_TURN_HANDLING } from "../src/runtimePolicy.ts";

dotenv.config({ path: ".env.local", quiet: true });
initializeLogger({ level: "warn", pretty: false });

const profile = getCollegeProfile("jmc-2026");
const scenarios = [
  { id: "hindi-fee", question: "नमस्ते, JMC में B.Voc Healthcare Management की फीस क्या है?" },
  { id: "exam-fee-follow-up", question: "क्या इस फीस में examination fee भी शामिल है?" },
  { id: "payment-terms", question: "क्या मैं fees instalment में pay कर सकती हूँ?" },
  { id: "hindi-cuet", question: "सीयूईटी के बिना एडमिशन हो सकता है?" },
  { id: "hindi-csas", question: "सीएसएएस में आवेदन कैसे करूँ?" },
  { id: "programme-list", question: "क्या Psychology Honours भी available है, और उसकी fees कितनी है?" },
  { id: "unsupported-hostel", question: "क्या JMC में hostel available है?" },
  { id: "english-switch", question: "Can you answer in English from now on?" },
];

const session = new voice.AgentSession({
  llm: new inference.LLM({
    model: process.env.LIVEKIT_LLM_MODEL ?? "google/gemma-4-31b-it",
    modelOptions: { temperature: 0.15, max_completion_tokens: 110 },
  }),
  tts: new inference.TTS({
    model: process.env.LIVEKIT_TTS_MODEL ?? "elevenlabs/eleven_flash_v2_5",
    voice: process.env.LIVEKIT_TTS_VOICE ?? "Xb7hH8MSUJpSbSDYk0k2",
    language: process.env.AGENT_TTS_LANGUAGE ?? "hi",
    modelOptions: {
      auto_mode: true,
      apply_text_normalization: "auto",
      apply_language_text_normalization: true,
      speed: 1.05,
    },
  }),
  turnHandling: LIVE_TURN_HANDLING,
});

const results = [];
try {
  const agent = new CollegeAdmissionsAgent(profile);
  await session.start({ agent, record: false });
  for (const scenario of scenarios) {
    const startedAt = performance.now();
    const groundedContext = agent.chatCtx.copy();
    groundedContext.addMessage({ role: "developer", content: buildTurnGrounding(profile, scenario.question) });
    await agent.updateChatCtx(groundedContext);
    const run = await session.run({ userInput: scenario.question, inputModality: "text" });
    await run.wait();
    const messages = run.events
      .filter(event => event.type === "message" && event.item.role === "assistant")
      .map(event => event.item.textContent ?? "")
      .filter(Boolean);
    const tools = run.events
      .filter(event => event.type === "function_call")
      .map(event => event.item.name);
    const toolErrors = run.events
      .filter(event => event.type === "function_call_output" && event.item.isError)
      .map(event => event.item.output);
    results.push({
      ...scenario,
      responseMs: Number((performance.now() - startedAt).toFixed(0)),
      assistantText: messages.join(" "),
      tools,
      toolErrors,
      eventCount: run.events.length,
    });
  }
} finally {
  await session.close();
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), profile: profile.profileId, results }, null, 2));
