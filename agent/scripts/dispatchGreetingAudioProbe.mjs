import dotenv from "dotenv";
import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";
import { AudioStream, RemoteAudioTrack, Room } from "@livekit/rtc-node";

dotenv.config({ path: ".env.local", quiet: true });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
if (!url || !apiKey || !apiSecret) throw new Error("LiveKit credentials are required for the audio probe");

const roomName = `quality-audio-${Date.now()}`;
const roomService = new RoomServiceClient(url, apiKey, apiSecret);
const dispatchClient = new AgentDispatchClient(url, apiKey, apiSecret);
const listener = new Room();
const startedAt = performance.now();
let listenerConnectedAt = null;
let dispatchedAt = null;
let agentTrackSubscribedAt = null;
let firstFrameMs = null;
let frameCount = 0;
let agentIdentity = null;
let audioStreamError = null;
let audioStream = null;
let agentPresentAfterListenerDisconnect = null;
let agentParticipantCountAfterListenerDisconnect = null;
const listenerIdentity = `quality-listener-${Date.now()}`;

const waitFor = async (predicate, timeoutMs, intervalMs = 100) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return predicate();
};

listener.on("trackSubscribed", async (track, _publication, participant) => {
  if (!(track instanceof RemoteAudioTrack)) return;
  agentIdentity = participant.identity;
  agentTrackSubscribedAt ??= performance.now();
  try {
    audioStream = new AudioStream(track);
    for await (const _frame of audioStream) {
      if (firstFrameMs === null) firstFrameMs = Number((performance.now() - startedAt).toFixed(0));
      frameCount += 1;
    }
  } catch (error) {
    audioStreamError = error instanceof Error ? error.message : String(error);
  }
});

listener.on("participantConnected", participant => {
  if (participant.identity !== listenerIdentity) agentIdentity ??= participant.identity;
});

try {
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 30,
    maxParticipants: 3,
    metadata: JSON.stringify({ collegeProfileId: "jmc-2026", purpose: "quality-audio-probe" }),
  });
  const token = new AccessToken(apiKey, apiSecret, { identity: listenerIdentity, ttl: 120 });
  token.addGrant({ roomJoin: true, room: roomName, canPublish: false, canSubscribe: true, canPublishData: false });
  await listener.connect(url, await token.toJwt(), { autoSubscribe: true });
  listenerConnectedAt = performance.now();
  const dispatch = await dispatchClient.createDispatch(roomName, "delhi-college-outbound-agent");
  dispatchedAt = performance.now();
  await waitFor(() => firstFrameMs !== null, 45_000);
  await listener.disconnect();
  await new Promise(resolve => setTimeout(resolve, 2_000));
  const remainingParticipants = await roomService.listParticipants(roomName);
  agentParticipantCountAfterListenerDisconnect = remainingParticipants.filter(participant => participant.identity !== listenerIdentity).length;
  agentPresentAfterListenerDisconnect = agentIdentity !== null
    ? remainingParticipants.some(participant => participant.identity === agentIdentity)
    : agentParticipantCountAfterListenerDisconnect > 0;
  console.log(JSON.stringify({
    roomName,
    dispatchId: dispatch.id,
    agentIdentity,
    listenerConnectedMs: Number(((listenerConnectedAt ?? performance.now()) - startedAt).toFixed(0)),
    dispatchMs: Number(((dispatchedAt ?? performance.now()) - startedAt).toFixed(0)),
    agentTrackSubscribedMs: agentTrackSubscribedAt === null ? null : Number((agentTrackSubscribedAt - startedAt).toFixed(0)),
    firstAudioMs: firstFrameMs,
    firstAudioAfterDispatchMs: firstFrameMs === null || dispatchedAt === null ? null : Number((firstFrameMs - (dispatchedAt - startedAt)).toFixed(0)),
    firstAudioAfterTrackSubscribedMs: firstFrameMs === null || agentTrackSubscribedAt === null ? null : Number((firstFrameMs - (agentTrackSubscribedAt - startedAt)).toFixed(0)),
    frameCount,
    audioStreamError,
    agentPresentAfterListenerDisconnect,
    agentParticipantCountAfterListenerDisconnect,
    passed: firstFrameMs !== null && frameCount > 0 && agentPresentAfterListenerDisconnect === true,
  }, null, 2));
} finally {
  audioStream?.cancel();
  await listener.disconnect().catch(() => undefined);
  await roomService.deleteRoom(roomName).catch(() => undefined);
}

process.exit(0);
