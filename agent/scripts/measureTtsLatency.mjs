import dotenv from "dotenv";
import { inference, initializeLogger } from "@livekit/agents";

dotenv.config({ path: ".env.local" });
initializeLogger({ level: "warn", pretty: false });

const cases = [
  { id: "hindi-fee", text: "जे एम सी में बी वॉक की फीस सैंतीस हज़ार सत्तर रुपये है।" },
  { id: "hindi-admissions", text: "एडमिशन दिल्ली विश्वविद्यालय के सीएसएएस प्रक्रिया के ज़रिए होता है। आप किस कोर्स के बारे में जानना चाहेंगे?" },
  { id: "english-switch", text: "Yes, I can answer in English. Which course or admission detail would you like to know?" },
  { id: "two-sentence-answer", text: "मनोविज्ञान ऑनर्स की फीस अट्ठाईस हज़ार छह सौ अस्सी रुपये है। फीस का भुगतान ऑनलाइन किया जाता है।" },
];

const tts = new inference.TTS({
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

const results = [];
try {
  for (const testCase of cases) {
    const startedAt = performance.now();
    let firstFrameAt;
    let finalFrameAt;
    let frames = 0;
    let requestId;

    const stream = tts.stream();
    stream.pushText(testCase.text);
    stream.flush();
    stream.endInput();

    for await (const event of stream) {
      frames += 1;
      requestId ??= event.requestId;
      firstFrameAt ??= performance.now();
      if (event.final) finalFrameAt = performance.now();
    }

    results.push({
      id: testCase.id,
      text: testCase.text,
      firstAudioMs: Number(((firstFrameAt ?? performance.now()) - startedAt).toFixed(0)),
      totalSynthesisMs: Number(((finalFrameAt ?? performance.now()) - startedAt).toFixed(0)),
      frames,
      requestId: requestId ?? null,
      passed: frames > 0 && Boolean(finalFrameAt),
    });
  }
} finally {
  await tts.close();
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
