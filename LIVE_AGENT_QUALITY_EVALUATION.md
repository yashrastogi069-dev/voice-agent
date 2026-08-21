# Live Agent Quality Evaluation

## Scope

This evaluation checks the running self-hosted `delhi-college-outbound-agent` through a real LiveKit WebRTC session. It does not represent a PSTN call; carrier dialing remains disabled until a compliant India route is configured.

| Scenario | Pass condition | Evidence source |
| --- | --- | --- |
| Opening | Deterministic Hindi greeting; no website, counsellor, callback, or human-help suggestion | Live session transcript and worker log |
| Hindi language policy | Hindi/Hinglish questions receive Hindi answers; English begins only after a clear English request | Live session transcript |
| Rupee speech | `₹37,070` reaches TTS as `सैंतीस हज़ार सत्तर रुपये` | Speech-buffer unit test and live transcript |
| Grounded answers | JMC admissions and fee questions use approved facts before an escalation is considered | Retrieval tool trace and response transcript |
| Escalation | No early website, counsellor, or callback language for supported questions | Response transcript and tool trace |
| TTS continuity | No provider wait comparable to the previous 34-second receive stall | Worker timing trace |
| Interruption recovery | A new caller turn stops obsolete speech and produces only the new answer | Live session event trace |

## Initial Baseline — 20 August 2026

The prior agent session showed an ElevenLabs TTS receive interval of roughly 34.7 seconds before response audio could complete. The clean session started after the streaming changes did not reproduce that behavior for the fixed opening. The TTS websocket began receiving at `16:48:03.175` and completed at `16:48:06.190`, a 3.0-second receive interval; no provider error was logged during this greeting. Audio forwarding completed at `16:48:14.114`, covering synthesis plus the greeting’s natural playback duration.

## Repair Cycle — 20 August 2026

The live agent now uses deterministic current-turn grounding. For each caller question, the worker adds the relevant approved JMC facts to the live conversation before the LLM replies. This closes the failure observed in the first real-model run, in which the model sometimes ignored its optional fact-lookup tool and prematurely offered a counsellor callback. The grounding rule also prevents early website, counsellor, callback, human-help, college-channel, and University-channel language unless the caller explicitly asks.

| Criterion | Verified result | Evidence |
| --- | --- | --- |
| Hindi-first policy | The fixed opening is Hindi, and a clear English request produces an English response. | Live worker greeting; real-model student harness |
| Spoken fee support | Hindi fee turns retain JMC’s verified first-year fee and the speech pipeline normalizes `₹37,070` to `सैंतीस हज़ार सत्तर रुपये`. | Speech tests and direct TTS probe |
| Grounded fee response | The real model answered B.Voc Healthcare Management with `₹37,070` and stated that examination fee is excluded. | Real-model student harness |
| Examination-fee boundary | The real model now says that examination fee is not included and that its separate amount is not confirmed; it no longer directs the student to an external admissions channel. | Real-model student harness after repair |
| CUET and CSAS | Hindi questions produced the approved CUET-UG and DU CSAS explanation. | Real-model student harness after repair |
| Psychology coverage | The real model confirmed B.A. (Hons.) Psychology and gave the verified `₹29,180` first-year fee. | Real-model student harness after repair |
| Unsupported hostel query | The real model stated only that it had no confirmed official hostel information, with no premature callback offer. | Real-model student harness after repair |
| Direct TTS continuity | Four representative Hindi/English messages emitted audio frames. After the first cold request, first-audio timing was approximately 1.5–1.6 seconds for Hindi admissions, Hindi currency, and English-switch phrases. | `agent/scripts/measureTtsLatency.mjs` |
| Real WebRTC greeting audio | A participant-backed temporary room subscribed to the real worker’s outbound audio and received 816 greeting frames. In the corresponding worker trace, TTS processing ran from `17:23:22.6` to `17:23:26.2`, rather than the previous 34-second receive stall. | `agent/scripts/dispatchGreetingAudioProbe.mjs`; worker trace |

The full regression suite currently passes with **14 test files and 58 tests**. The new student-journey suite contains 16 checks spanning Hindi and English course/fee questions, examination-fee scope, online payment wording, instalments, CUET, CSAS, Christian-minority seats, location, eligibility, scholarships, and explicit non-fabrication for hostel, placement, ranking, and individual-admission outcomes.

## Remaining Live-Audio Validation Work

The participant-backed WebRTC test successfully joins a temporary room, dispatches the current worker, receives the Hindi greeting as actual audio, and confirms the extended 45-second post-greeting grace period is configured. Its synthetic microphone publisher has not yet produced a completed realtime-STT turn: the worker subscribes to the test track but logs no input speech start. This is a limitation of the test publisher’s audio-timing path, not evidence of a production-agent reply failure. The next cycle will either correct that publisher timing or use the authenticated Agent Console microphone for a human voice turn, then verify STT transcript, grounded answer, TTS output, and interruption handling in one live session.

## Regional Worker Finding — 21 August 2026

The authenticated LiveKit Agent Console session was hosted in `osydney1a`, while the sandbox-hosted self-managed worker registered in `odubai1a`. The worker received the job immediately but did not complete `ctx.connect()` for about 18 seconds. Because the fixed greeting correctly waits for room connection, the user experienced the console as stalled. Once joined, the worker published the Hindi greeting successfully and the console showed two participants, the ElevenLabs TTS model, and the expected transcript. Therefore, this incident is a **worker-placement and room-join problem**, not a Hindi, grounding, LLM, rupee-normalization, or TTS-stream failure.

The corrective production requirement is to run the durable worker in LiveKit Cloud Mumbai (`ap-south`) or equivalent India-local infrastructure, not in a transient sandbox whose LiveKit connection is routed through another region. The corresponding deployment procedure is recorded in `REGIONAL_WORKER_RUNBOOK.md`. No PSTN dialing has been enabled.
