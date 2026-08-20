import type { TurnHandlingOptions } from "@livekit/agents";

export const LIVE_TURN_HANDLING: Partial<TurnHandlingOptions> = {
  turnDetection: "vad",
  endpointing: { mode: "dynamic", minDelay: 380, maxDelay: 1100 },
  interruption: {
    enabled: true,
    mode: "vad",
    minDuration: 220,
    minWords: 1,
    falseInterruptionTimeout: 900,
    resumeFalseInterruption: false,
    discardAudioIfUninterruptible: true,
  },
  preemptiveGeneration: { enabled: true },
};

export function assessSpeechResponse(text: string): string[] {
  const issues: string[] = [];
  if (text.length > 420) issues.push("response is too long for one spoken turn");
  if (/https?:\/\/|www\./i.test(text)) issues.push("response contains a URL");
  if (/\S+@\S+\.\S+/.test(text)) issues.push("response contains an email address");
  if (/\b[A-Z_]{3,}\b/.test(text)) issues.push("response may contain an unexplained all-caps identifier");
  if (/\[[^\]]+\]|\{[^}]+\}/.test(text)) issues.push("response contains formatting syntax");
  return issues;
}
