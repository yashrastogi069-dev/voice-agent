export const FIXED_OUTCOMES = [
  "interested",
  "callback",
  "not_interested",
  "dnc",
] as const;

export type FixedOutcome = (typeof FIXED_OUTCOMES)[number];

type ContactState = {
  consentStatus: "opt_in" | "unknown" | "opted_out";
  dnc: boolean;
};

type CampaignState = {
  status: "draft" | "approved" | "paused";
  callingStartHour: number;
  callingEndHour: number;
  frequencyCap: number;
};

export type EligibilityResult = { allowed: true } | { allowed: false; reason: string };

export function getIstHour(date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date)
  );
}

export function isWithinIstCallingWindow(
  date = new Date(),
  startHour = 9,
  endHour = 21
): boolean {
  const hour = getIstHour(date);
  return hour >= startHour && hour < endHour;
}

export function evaluateOutboundEligibility(input: {
  contact: ContactState;
  campaign: CampaignState;
  previousAttempts: number;
  now?: Date;
}): EligibilityResult {
  if (input.contact.dnc || input.contact.consentStatus === "opted_out") {
    return { allowed: false, reason: "Dialling is blocked because this contact has an active do-not-call request." };
  }
  if (input.contact.consentStatus !== "opt_in") {
    return { allowed: false, reason: "Dialling is blocked because valid consent is not recorded." };
  }
  if (input.campaign.status !== "approved") {
    return { allowed: false, reason: "Dialling is blocked until this campaign is approved." };
  }
  if (!isWithinIstCallingWindow(input.now, input.campaign.callingStartHour, input.campaign.callingEndHour)) {
    return { allowed: false, reason: "Dialling is blocked outside the permitted 9am–9pm IST calling window." };
  }
  if (input.previousAttempts >= input.campaign.frequencyCap) {
    return { allowed: false, reason: "Dialling is blocked because this contact has reached the campaign frequency cap." };
  }
  return { allowed: true };
}

export function asFixedOutcome(value: string): FixedOutcome {
  return FIXED_OUTCOMES.includes(value as FixedOutcome)
    ? (value as FixedOutcome)
    : "callback";
}
