# LiveKit Cloud Deployment Sources

The durable worker was created as LiveKit Cloud agent `CA_spsyvoM3MQec` in the `ap-south` (Mumbai) region on 2026-08-21. The worker uses the project’s existing TypeScript agent entrypoint and has no SIP/carrier configuration enabled.

## Official Sources Consulted

| Topic | Key requirement used | Source |
|---|---|---|
| Cloud agent deployment | LiveKit Cloud builds and runs agent containers; deployments are created and managed with the LiveKit CLI. | [Agent deployment overview](https://docs.livekit.io/deploy/agents/) |
| Regional placement | Agent regions are selected when created and cannot later be changed. A separate `ap-south` deployment is required for Mumbai. | [Agent deployment regions](https://docs.livekit.io/deploy/admin/regions/agent-deployment/) |
| India latency and telephony | Mumbai agent placement and an India-local SIP route are the recommended production direction for India calling. | [Building performant voice agents in India](https://livekit.com/blog/building-performant-voice-agents-india) |
| Container build contract | Node workers need a glibc-based image, CA certificates, a non-root user, fixed `start` command, and Cloud-injected secrets instead of baked credentials. | [Builds and Dockerfiles](https://docs.livekit.io/deploy/agents/builds/) |
| Secrets | LiveKit Cloud injects `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`; other runtime secrets are encrypted environment variables. | [Secrets management](https://docs.livekit.io/deploy/agents/secrets/) |
| Deployment lifecycle | New versions are rolled out with health checks; production agents can remain warm depending on plan and configuration. | [Deployment management](https://docs.livekit.io/deploy/agents/managing-deployments/) |

## Console Validation Note

The authenticated LiveKit Cloud console shows the `delhi-college-outbound-agent` deployment as **RUNNING** in `ap-south`. The console configuration requires the explicit dispatch name `delhi-college-outbound-agent` before a browser test session starts. The separate self-hosted worker entry shown in the project console is not selected for Cloud validation.
