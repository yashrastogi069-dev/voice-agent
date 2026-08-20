import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { updateLiveCallAttemptFromProviderEvent } from "../db";
import { normalizeProviderCallEvent, verifyProviderEventSignature } from "../liveCallLifecycle";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.post("/api/live-call/provider-event", express.text({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const rawBody = typeof req.body === "string" ? req.body : "";
    const signature = req.get("X-Live-Call-Signature") ?? undefined;
    if (!verifyProviderEventSignature(rawBody, signature, process.env.LIVE_CALL_PROVIDER_EVENT_SECRET)) {
      res.status(401).json({ error: "Invalid provider event signature." });
      return;
    }
    try {
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const event = normalizeProviderCallEvent(payload);
      await updateLiveCallAttemptFromProviderEvent(event);
      res.status(202).json({ accepted: true });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid provider event." });
    }
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
