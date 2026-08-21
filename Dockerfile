# syntax=docker/dockerfile:1
# LiveKit Cloud worker image. The web application remains separately runnable
# in development; this container serves only the durable voice-agent worker.
FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# LiveKit's native runtime requires the system CA bundle to reach LiveKit Cloud.
RUN apt-get update -qq \
  && apt-get install --no-install-recommends -y ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@10.4.1

FROM base AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

# Bundle local TypeScript sources while leaving package dependencies external.
# This allows the runtime image to use production dependencies only.
RUN pnpm exec esbuild agent/src/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --packages=external \
  --outfile=dist-agent/index.js \
  && pnpm prune --prod

FROM base AS runtime
ARG UID=10001
RUN adduser --disabled-password --gecos "" --home "/app" --shell "/sbin/nologin" --uid "${UID}" appuser

WORKDIR /app
COPY --from=build --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appuser /app/dist-agent ./dist-agent

USER appuser
ENV NODE_ENV=production

# `start` registers the worker and waits for LiveKit job dispatches.
CMD ["node", "dist-agent/index.js", "start"]
