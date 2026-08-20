import dotenv from "dotenv";
import { AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";

dotenv.config({ path: ".env.local" });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
if (!url || !apiKey || !apiSecret) throw new Error("LiveKit credentials are required for the greeting probe");

const roomName = `quality-greeting-${Date.now()}`;
const roomService = new RoomServiceClient(url, apiKey, apiSecret);
const dispatchClient = new AgentDispatchClient(url, apiKey, apiSecret);

try {
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 30,
    maxParticipants: 2,
    metadata: JSON.stringify({ collegeProfileId: "jmc-2026", purpose: "quality-greeting-probe" }),
  });
  const dispatch = await dispatchClient.createDispatch(roomName, "delhi-college-outbound-agent");
  console.log(JSON.stringify({ roomName, dispatchId: dispatch.id, status: "dispatched" }));
  await new Promise(resolve => setTimeout(resolve, 18_000));
} finally {
  await roomService.deleteRoom(roomName).catch(() => undefined);
}
