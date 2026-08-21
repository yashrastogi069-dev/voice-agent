import dotenv from "dotenv";
import { inference, initializeLogger } from "@livekit/agents";
import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";
import { AudioSource, AudioStream, LocalAudioTrack, RemoteAudioTrack, Room, TrackSource } from "@livekit/rtc-node";

dotenv.config({ path: ".env.local", quiet: true });
initializeLogger({ level: "warn", pretty: false });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
if (!url || !apiKey || !apiSecret) throw new Error("LiveKit credentials are required for the end-to-end audio probe");

const roomName = `quality-student-audio-${Date.now()}`;
const question = "सीयूईटी के बिना एडमिशन हो सकता है?";
const roomService = new RoomServiceClient(url, apiKey, apiSecret);
const dispatchClient = new AgentDispatchClient(url, apiKey, apiSecret);
const listener = new Room();
let source;
let microphoneTrack;
const startedAt = performance.now();
const audioTracks = [];
const transcriptionPayloads = [];
let firstAgentAudioMs = null;
let agentAudioFrames = 0;
let agentIdentity = null;
let dispatchId = null;
let studentAudioFrames = 0;
let studentAudioSamples = 0;
let studentAudioPeak = 0;
let studentAudioFormat = null;

listener.registerTextStreamHandler("lk.transcription", async (reader, participantInfo) => {
  transcriptionPayloads.push({ identity: participantInfo.identity, payload: await reader.readAll() });
});

listener.on("trackSubscribed", async (track, _publication, participant) => {
  if (!(track instanceof RemoteAudioTrack)) return;
  agentIdentity = participant.identity;
  audioTracks.push(participant.identity);
  for await (const _frame of new AudioStream(track)) {
    if (firstAgentAudioMs === null) firstAgentAudioMs = Number((performance.now() - startedAt).toFixed(0));
    agentAudioFrames += 1;
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

try {
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 45,
    maxParticipants: 3,
    metadata: JSON.stringify({ collegeProfileId: "jmc-2026", purpose: "end-to-end-student-audio-probe" }),
  });
  const token = new AccessToken(apiKey, apiSecret, { identity: `quality-student-${Date.now()}`, ttl: 180 });
  token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: false });
  await listener.connect(url, await token.toJwt(), { autoSubscribe: true });

  const dispatch = await dispatchClient.createDispatch(roomName, "delhi-college-outbound-agent");
  dispatchId = dispatch.id;

  // Give the real worker time to join, complete its Hindi greeting, and clear AEC warm-up before the student speaks.
  await sleep(14_000);

  const speakerTts = new inference.TTS({
    model: process.env.LIVEKIT_TTS_MODEL ?? "elevenlabs/eleven_flash_v2_5",
    voice: process.env.LIVEKIT_TTS_VOICE ?? "Xb7hH8MSUJpSbSDYk0k2",
    language: "hi",
    modelOptions: { auto_mode: true, apply_text_normalization: "auto", apply_language_text_normalization: true, speed: 1.0 },
  });
  const stream = speakerTts.stream();
  stream.pushText(question);
  stream.flush();
  stream.endInput();
  const first = await stream.next();
  if (first.done || first.value === stream.constructor.END_OF_STREAM) throw new Error("The student-question TTS stream produced no audio");
  source = new AudioSource(first.value.frame.sampleRate, first.value.frame.channels);
  studentAudioFormat = { sampleRate: first.value.frame.sampleRate, channels: first.value.frame.channels };
  microphoneTrack = LocalAudioTrack.createAudioTrack("quality-student-microphone", source);
  const publication = await listener.localParticipant.publishTrack(microphoneTrack, { source: TrackSource.MICROPHONE });
  await publication.waitForSubscription();
  const captureStudentFrame = async frame => {
    studentAudioFrames += 1;
    studentAudioSamples += frame.data.length;
    for (const sample of frame.data) studentAudioPeak = Math.max(studentAudioPeak, Math.abs(sample));
    await source.captureFrame(frame);
  };
  await sleep(400);
  await captureStudentFrame(first.value.frame);
  for await (const event of stream) {
    if (!event || typeof event !== "object" || !("frame" in event)) continue;
    await captureStudentFrame(event.frame);
  }
  await source.waitForPlayout();
  await speakerTts.close();

  // Allow STT endpointing, grounded LLM generation, and response TTS to complete.
  await sleep(13_000);
  console.log(JSON.stringify({
    roomName,
    dispatchId,
    question,
    agentIdentity,
    firstAgentAudioMs,
    agentAudioFrames,
    studentAudioFormat,
    studentAudioFrames,
    studentAudioDurationMs: studentAudioFormat === null ? null : Number(((studentAudioSamples / studentAudioFormat.channels / studentAudioFormat.sampleRate) * 1000).toFixed(0)),
    studentAudioPeak,
    audioTracks,
    transcriptionPayloads,
    passed: agentAudioFrames > 0 && transcriptionPayloads.length > 0,
  }, null, 2));
} finally {
  await microphoneTrack?.close().catch(() => undefined);
  await source?.close().catch(() => undefined);
  await listener.disconnect().catch(() => undefined);
  await roomService.deleteRoom(roomName).catch(() => undefined);
}
