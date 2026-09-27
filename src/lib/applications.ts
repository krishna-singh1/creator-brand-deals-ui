import type { components } from "./api/client";

export type Application = components["schemas"]["Application"];
export type ApplicationStatus = components["schemas"]["ApplicationStatus"];
export type Applicant = components["schemas"]["Applicant"];
export type MyApplication = components["schemas"]["MyApplication"];
export type QuoteLineSuggestion = components["schemas"]["QuoteLineSuggestion"];

/** Waiting for the brand's decision (the creator can still withdraw). */
export const OPEN_STATUSES: ApplicationStatus[] = ["APPLIED", "SHORTLISTED"];

export const isOpen = (status: ApplicationStatus) => OPEN_STATUSES.includes(status);

export const STATUS_COPY: Record<ApplicationStatus, string> = {
  INVITED: "The brand invited you",
  APPLIED: "Sent. The brand will review it soon.",
  SHORTLISTED: "Shortlisted. You're in the brand's final pick.",
  APPROVED: "Approved. Your deal is ready.",
  REJECTED: "Not selected this time.",
  WITHDRAWN: "You withdrew this application.",
  DECLINED: "You declined this invite.",
  EXPIRED: "The campaign closed before a decision.",
};

/** Pre-fill: the middle of the suggested range per unit, rounded to ₹100. */
export function suggestedUnitPaise(line: QuoteLineSuggestion): number {
  const mid = (line.range.minPaise + line.range.maxPaise) / 2 / line.quantity;
  return Math.round(mid / 10_000) * 10_000;
}
