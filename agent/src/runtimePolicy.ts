import type { TurnHandlingOptions } from "@livekit/agents";

export const LIVE_TURN_HANDLING: Partial<TurnHandlingOptions> = {
  turnDetection: "vad",
  endpointing: { mode: "dynamic", minDelay: 280, maxDelay: 800 },
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

export const LIVE_USER_AWAY_TIMEOUT_SECONDS = 45;

export type ConversationTurn = { role: "student" | "agent"; text: string };

/** Keeps only recent, bounded text that is useful for a live spoken exchange. */
export class BoundedConversationState {
  private turns: ConversationTurn[] = [];

  constructor(private readonly maxTurns = 6, private readonly maxCharacters = 1_200) {}

  add(turn: ConversationTurn): void {
    const clean = turn.text.trim().replace(/\s+/g, " ");
    if (!clean) return;
    this.turns.push({ role: turn.role, text: clean.slice(0, this.maxCharacters) });
    this.trim();
  }

  recent(): ConversationTurn[] {
    return [...this.turns];
  }

  private trim(): void {
    while (this.turns.length > this.maxTurns || this.turns.reduce((total, turn) => total + turn.text.length, 0) > this.maxCharacters) this.turns.shift();
  }
}

export function assessSpeechResponse(text: string): string[] {
  const issues: string[] = [];
  if (text.length > 420) issues.push("response is too long for one spoken turn");
  if (/https?:\/\/|www\./i.test(text)) issues.push("response contains a URL");
  if (/\S+@\S+\.\S+/.test(text)) issues.push("response contains an email address");
  if (/\b[A-Z_]{3,}\b/.test(text)) issues.push("response may contain an unexplained all-caps identifier");
  if (/\[[^\]]+\]|\{[^}]+\}/.test(text)) issues.push("response contains formatting syntax");
  return issues;
}
