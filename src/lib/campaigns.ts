import type { components } from "./api/client";
import { DELIVERABLE_LABELS, formatPaise } from "./format";

export type Campaign = components["schemas"]["Campaign"];
export type CampaignInput = components["schemas"]["CampaignInput"];
export type CampaignSummary = components["schemas"]["CampaignSummary"];
export type CampaignFeedItem = components["schemas"]["CampaignFeedItem"];
export type CampaignForCreator = components["schemas"]["CampaignForCreator"];
export type CompensationType = components["schemas"]["CompensationType"];
export type DeliverableType = components["schemas"]["DeliverableType"];
export type Platform = components["schemas"]["Platform"];

export const COMPENSATION_LABELS: Record<CompensationType, string> = {
  CASH: "Paid",
  PRODUCT: "Barter",
  PRODUCT_PLUS_CASH: "Product + cash",
};

export const PLATFORM_LABELS: Record<Platform, string> = { INSTAGRAM: "Instagram", FACEBOOK: "Facebook" };

export const DELIVERABLES_BY_PLATFORM: Record<Platform, DeliverableType[]> = {
  INSTAGRAM: ["IG_REEL", "IG_POST", "IG_CAROUSEL", "IG_STORY"],
  FACEBOOK: ["FB_POST", "FB_REEL"],
};

type Offer = Pick<CampaignSummary, "compensationType" | "budgetMinPaise" | "budgetMaxPaise" | "productValuePaise">;

/** "₹4,000–₹8,000", "Product worth ₹1,500" or both. */
export function formatOffer(c: Offer): string {
  const cash =
    c.budgetMinPaise != null
      ? c.budgetMaxPaise != null && c.budgetMaxPaise !== c.budgetMinPaise
        ? `${formatPaise(c.budgetMinPaise)}–${formatPaise(c.budgetMaxPaise)}`
        : formatPaise(c.budgetMinPaise)
      : null;
  const product = c.productValuePaise != null ? `product worth ${formatPaise(c.productValuePaise)}` : null;
  switch (c.compensationType) {
    case "CASH":
      return cash ?? "Paid";
    case "PRODUCT":
      return product ? capitalize(product) : "Barter";
    default:
      return [cash, product].filter(Boolean).join(" + ");
  }
}

/** "2 × Instagram Reel, 1 × Instagram Stories (set of 3)". */
export function formatDeliverables(list: { deliverableType: DeliverableType; quantity: number }[]): string {
  return list.map((d) => `${d.quantity} × ${DELIVERABLE_LABELS[d.deliverableType]}`).join(", ");
}

/** Days left until an ISO date (IST calendar day), 0 = today. */
export function daysLeft(isoDate: string): number {
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  return Math.round((new Date(isoDate).getTime() - today.getTime()) / 86_400_000);
}

export function formatDeadline(isoDate: string): string {
  const d = daysLeft(isoDate);
  if (d < 0) return "Closed";
  if (d === 0) return "Last day to apply";
  return `${d} day${d === 1 ? "" : "s"} left`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
