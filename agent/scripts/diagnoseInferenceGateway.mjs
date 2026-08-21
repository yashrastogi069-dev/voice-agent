import { AccessToken } from "livekit-server-sdk";
import { WebSocket } from "ws";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const baseUrl = process.env.LIVEKIT_INFERENCE_URL ?? "https://agent-gateway.livekit.cloud/v1";

if (!apiKey || !apiSecret) {
  throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET are required");
}

const token = new AccessToken(apiKey, apiSecret, {
  identity: "inference-gateway-diagnostic",
  ttl: 60,
});
token.addInferenceGrant({ perform: true });

const url = `${baseUrl.replace(/^http/, "ws")}/tts`;
const jwt = await token.toJwt();
const startedAt = performance.now();
const report = (event, details = {}) => {
  console.log(
    JSON.stringify({
      event,
      elapsedMs: Number((performance.now() - startedAt).toFixed(0)),
      ...details,
    })
  );
};

const socket = new WebSocket(url, { headers: { Authorization: `Bearer ${jwt}` } });
const timeout = setTimeout(() => {
  report("timeout");
  socket.terminate();
}, 12_000);

socket.once("open", () => {
  clearTimeout(timeout);
  report("open", { protocol: socket.protocol || null });
  socket.close();
});

socket.once("unexpected-response", (_request, response) => {
  clearTimeout(timeout);
  const chunks = [];
  response.on("data", chunk => chunks.push(Buffer.from(chunk)));
  response.on("end", () => {
    report("unexpected-response", {
      statusCode: response.statusCode ?? null,
      retryAfter: response.headers["retry-after"] ?? null,
      requestId: response.headers["x-request-id"] ?? response.headers["x-amzn-requestid"] ?? null,
      body: Buffer.concat(chunks).toString("utf8").slice(0, 2_000) || null,
    });
    socket.terminate();
    process.exitCode = 1;
  });
});

socket.once("error", error => {
  clearTimeout(timeout);
  report("error", { name: error.name, message: error.message, code: error.code ?? null });
});

socket.once("close", (code, reason) => {
  clearTimeout(timeout);
  report("close", { code, reason: reason.toString() || null });
});
