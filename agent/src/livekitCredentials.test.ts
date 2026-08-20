import { RoomServiceClient } from "livekit-server-sdk";
import { describe, expect, it } from "vitest";

const livekitUrl = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const hasCredentials = Boolean(livekitUrl && apiKey && apiSecret);

describe("LiveKit project credentials", () => {
  const configuredTest = hasCredentials ? it : it.skip;

  configuredTest(
    "authenticates to the configured project with a read-only room-list request",
    async () => {
      const client = new RoomServiceClient(livekitUrl!, apiKey!, apiSecret!);
      const rooms = await client.listRooms();

      expect(Array.isArray(rooms)).toBe(true);
    },
    15_000,
  );
});
