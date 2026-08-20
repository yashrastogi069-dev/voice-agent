# India Voice Agent Control Center

India Voice Agent Control Center is a TypeScript application for operating **consent-controlled AI voice workflows** in India. It has three product areas: outbound student-information calls, inbound support, and delegated calling tasks. The current implementation prioritizes a guarded real-time outbound calling foundation for Delhi college admissions information.

> **Current status:** The application is ready for controlled carrier integration, but live calls remain disabled until approved provider credentials, an authorized caller identity, a permitted test number, and an explicit operator approval are present. This repository does not contain secrets, customer data, recordings, or live provider credentials.

## What Is Included

| Area | Included capability |
| --- | --- |
| Operations console | Contact consent/DNC controls, college-profile selection, campaign gates, and controlled dial readiness checks. |
| Live voice agent | Self-hostable LiveKit Agents foundation with interruption handling, bounded context, Hindi/English speech formatting, grounded college facts, callback tools, and DNC tools. |
| Telephony safety | E.164 validation, IST calling-window controls, frequency caps, profile activation gates, explicit live-call enablement, signed provider-event processing, and persistent call-attempt lifecycle tracking. |
| College knowledge | Verified, source-separated Delhi college profiles, including JMC, LSR, and SRCC. Only source-complete profiles can be activated for live calling. |
| Automation | Importable n8n workflow for deferred post-call business events. It is intentionally not part of the live audio path. |
| Quality | TypeScript validation plus automated server, agent, lifecycle, speech, policy, and client interaction tests. |

## Repository Map

```text
client/                    React operations console
server/                    Express, tRPC, database, protected call controls
agent/                     LiveKit real-time agent and SIP dial adapter
drizzle/                   Database schema and migrations
n8n/                       Importable post-call automation workflow
GETTING_LIVE_CREDENTIALS.md
LIVE_AGENT_ACTIVATION.md
EXOTEL_BEGINNER_SETUP.md
FASTEST_TEST_CALL_OPTIONS.md
GITHUB_UPDATE_WORKFLOW.md
```

## Local Setup

1. Install Node.js 22+ and pnpm.
2. Clone the repository.
3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Configure the managed database and authentication settings required by the project template.
5. Keep all carrier, LiveKit, speech, and webhook credentials in environment settings—not in files committed to GitHub.
6. Run the application and validations:

   ```bash
   pnpm dev
   pnpm check
   pnpm test
   ```

## Live Telephony Activation

Use the documentation in this order:

1. [`FASTEST_TEST_CALL_OPTIONS.md`](./FASTEST_TEST_CALL_OPTIONS.md) explains the fastest controlled test choices and their limitations.
2. [`EXOTEL_BEGINNER_SETUP.md`](./EXOTEL_BEGINNER_SETUP.md) provides the Exotel account, KYC, and SIP request steps.
3. [`GETTING_LIVE_CREDENTIALS.md`](./GETTING_LIVE_CREDENTIALS.md) lists the secure values required by the application.
4. [`LIVE_AGENT_ACTIVATION.md`](./LIVE_AGENT_ACTIVATION.md) defines the controlled first-call process.

Never initiate outreach to real students until provider setup, consent checks, caller identity, approved content, and the controlled test process are complete.

## Public Repository Security Boundary

The public repository intentionally excludes the following:

| Excluded item | Reason |
| --- | --- |
| `.env*` files and provider credentials | Prevents secret leakage. |
| Student contact lists, consent evidence, recordings, transcripts, and operational exports | Protects personal and sensitive operational data. |
| Runtime logs and generated management metadata | Avoids publishing internal diagnostics and non-source artifacts. |
| `node_modules/`, build outputs, caches, and local databases | Reproducible from source and not appropriate for source control. |

If you are using an external AI tool, share this repository URL first:

**https://github.com/yashrastogi069-dev/voice-agent**

If the tool cannot read GitHub links, provide the raw README URL instead:

**https://raw.githubusercontent.com/yashrastogi069-dev/voice-agent/main/README.md**

## Contributing and Repository Updates

See [`GITHUB_UPDATE_WORKFLOW.md`](./GITHUB_UPDATE_WORKFLOW.md) for the required validation, review, commit, and push sequence. Do not commit secrets, real contact data, or live-call artifacts.
