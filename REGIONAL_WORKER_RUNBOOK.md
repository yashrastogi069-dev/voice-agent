# Regional LiveKit Worker Runbook

## Purpose

This runbook addresses the measured real-session startup defect in which an Agent Console room in Sydney waited for a self-hosted sandbox worker registered through Dubai. The worker eventually joined and spoke correctly, but the delayed `ctx.connect()` made the session appear frozen. A phone agent must not use this transient sandbox process as its durable worker.

## Required Production Placement

For India-focused calls, deploy the durable LiveKit worker in **Mumbai (`ap-south`)**. LiveKit documents that agent deployments are region-specific, that users normally connect to the nearest available deployment, and that a new deployment must be created to change an existing deployment’s region.[1] LiveKit also recommends co-locating the agent and model stack for low voice-agent latency and identifies Mumbai as its India agent deployment region.[2]

| Environment | Worker command | Intended use | Quality status |
| --- | --- | --- | --- |
| Local or sandbox | `pnpm agent:start` | Code verification only | **Not suitable** for latency acceptance when LiveKit routes it outside the target region |
| Staging in Mumbai | `pnpm agent:start` inside the selected regional agent deployment | Controlled microphone and permitted-number evaluation | Required before carrier activation |
| Production in Mumbai | Managed regional agent deployment or an always-on regional worker pool | India phone calls after all compliance gates pass | Required for launch |

## Deployment Procedure

First, create a **separate staging project** in LiveKit Cloud. Staging and production should not share an agent server or project because LiveKit recommends separate environments to prevent development activity from processing production traffic.[3] Configure the staging worker with the same model IDs and only the existing secure environment variables; do not copy secrets into source control or the public GitHub repository.

Create a new agent deployment in the `ap-south` region. LiveKit’s deployment region is immutable after creation, so do not attempt to move the existing deployment in place. Create the Mumbai deployment under a separate agent name or configuration, then use explicit dispatch to select it during the controlled regional test.[1]

Run the worker with `pnpm agent:start`, rather than the deprecated `pnpm agent:dev` command. The production command starts the LiveKit agent server and exposes its default private health endpoint on port 8081. LiveKit agent servers register with LiveKit over an outbound WebSocket connection and do not need a public inbound port for normal job handling.[3]

Before allowing a real test call, run `pnpm check && pnpm test`, start a single Mumbai worker, and conduct a browser microphone test with one Hindi fee question, one English-switch question, and one interruption. Confirm the session metadata reports the expected India-local agent region, then record first greeting time, first STT final, first LLM token, first answer audio, and any interruption event. Do not evaluate regional latency using a sandbox worker routed through Dubai, and keep `LIVE_CALLS_ENABLED=false` until this test and the carrier approval gates pass.

## Operational Safeguards

Keep at least one worker warm and run a graceful shutdown policy. LiveKit’s worker model creates a job subprocess per session; if the agent server crashes, active child jobs are terminated, while an individual job crash should not bring down the whole server.[3] The hosting platform must give an in-progress voice conversation enough termination grace time to drain naturally. LiveKit’s deployment guidance notes that voice conversations may require more than ten minutes of graceful shutdown time.[3]

For an India carrier route, use the India SIP endpoint and region-pinning process when the carrier is later configured. LiveKit’s India guidance recommends an India-local SIP provider and Mumbai agent deployment to avoid international media hops and associated jitter or packet loss.[2] This work remains outside the live worker’s current disabled carrier path.

## Acceptance Criteria

The Mumbai deployment is accepted only if the worker joins the controlled room without the observed multi-second cross-region delay, speaks the Hindi opening once, receives a real microphone question, answers approved facts before escalation, and handles one interruption without resuming obsolete audio. Retain the LiveKit session evidence and the local quality-evaluation report for each acceptance run.

## References

[1]: https://docs.livekit.io/deploy/admin/regions/agent-deployment/ "LiveKit — Agent deployment regions"
[2]: https://livekit.com/blog/building-performant-voice-agents-india "LiveKit — Building performant voice agents in India"
[3]: https://docs.livekit.io/deploy/custom/deployments/ "LiveKit — Self-hosted agent deployments"
