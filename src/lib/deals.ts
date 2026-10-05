"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PRODUCT } from "@/lib/product";
import type { components } from "./api/client";
import { formatPaise } from "./format";

export type Deal = components["schemas"]["Deal"];
export type DealSummary = components["schemas"]["DealSummary"];
export type DealStatus = components["schemas"]["DealStatus"];
export type DealDeliverable = components["schemas"]["DealDeliverable"];

export const dealKey = (id: string) => ["deals", id] as const;

/** What the caller should do next (server-computed `nextAction`), phrased for the banner. */
export const NEXT_ACTION_COPY: Record<string, { title: string; body: string }> = {
  SHIP_PRODUCT: { title: "Ship the product", body: "Send the product to the creator and add tracking so they know it's coming." },
  WAIT_FOR_PRODUCT: { title: "The brand is shipping your product", body: "You'll be notified when it's on its way." },
  CONFIRM_PRODUCT_RECEIVED: { title: "Did the product arrive?", body: "Confirm once you have it, then start creating." },
  SUBMIT_CONTENT: { title: "Time to create", body: "Post your content, then submit the live link for each deliverable below." },
  WAIT_FOR_CONTENT: { title: "The creator is working on it", body: "You'll be notified as soon as content is submitted." },
  REVIEW_SUBMISSION: { title: "Content to review", body: "Approve each post or ask for changes with a clear note." },
  WAIT_FOR_BRAND: { title: "Waiting for the brand", body: "The brand is reviewing your content." },
  MARK_PAID: { title: "Pay the creator", body: "Pay off-platform (UPI or bank transfer), then record it here." },
  WAIT_FOR_PAYMENT_CONFIRMATION: { title: "Payment recorded", body: "Waiting for the creator to confirm they received it." },
  CONFIRM_PAYMENT: { title: "Confirm your payment", body: "Check your account, then confirm the payment arrived." },
  LEAVE_REVIEW: { title: "Rate your partner", body: `A quick rating helps everyone on ${PRODUCT.name} choose good partners.` },
};

/** nextAction is computed per side; WAIT_* means the other party acts next. Disputes pause the deal. */
export const isYourMove = (d: Pick<DealSummary, "nextAction" | "status">) =>
  !!d.nextAction && !d.nextAction.startsWith("WAIT_") && d.status !== "DISPUTED";

/** "₹8,000", "Product worth ₹1,500" / "Barter", or "₹4,000 + product": barter deals have no cash amount. */
export function formatDealValue(d: {
  compensationType: DealSummary["compensationType"];
  agreedTotalPaise: number;
  productValuePaise?: number | null;
}): string {
  switch (d.compensationType) {
    case "PRODUCT":
      return d.productValuePaise != null ? `Product worth ${formatPaise(d.productValuePaise)}` : "Barter";
    case "PRODUCT_PLUS_CASH":
      return `${formatPaise(d.agreedTotalPaise)} + product`;
    default:
      return formatPaise(d.agreedTotalPaise);
  }
}

/** Every human label for a deal status (filters, timelines). */
export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  ACTIVE: "Just started",
  PRODUCT_SHIPPED: "Product shipped",
  PRODUCT_RECEIVED: "Product received",
  IN_PROGRESS: "In progress",
  UNDER_REVIEW: "Under review",
  CONTENT_APPROVED: "Content approved",
  PAYMENT_MARKED: "Payment marked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

/** Progress steps shown on the deal page; product steps only for deals with a product. */
export function dealSteps(d: Pick<Deal, "compensationType" | "agreedTotalPaise">) {
  const product = d.compensationType !== "CASH";
  const cash = d.compensationType !== "PRODUCT" && d.agreedTotalPaise > 0;
  return [
    { key: "ACTIVE", label: "Deal created" },
    ...(product ? [{ key: "PRODUCT_SHIPPED", label: "Shipped" }, { key: "PRODUCT_RECEIVED", label: "Received" }] : []),
    { key: "IN_PROGRESS", label: "Content" },
    { key: "UNDER_REVIEW", label: "Review" },
    { key: "CONTENT_APPROVED", label: "Approved" },
    ...(cash ? [{ key: "PAYMENT_MARKED", label: "Paid" }] : []),
    { key: "COMPLETED", label: "Completed" },
  ];
}

export const CANCELLABLE: DealStatus[] = ["ACTIVE", "PRODUCT_SHIPPED", "PRODUCT_RECEIVED", "IN_PROGRESS"];

/** What a deal change makes stale besides the deal itself: the deals list, both dashboards and notifications. */
const DEAL_VIEW_KEYS = [["deals", "list"], ["creator", "dashboard"], ["brand", "dashboard"], ["notifications"]];

/**
 * Refreshes everything a deal change touches. `deal: true` also refetches the deal itself (exact key, so the
 * message thread under it isn't refetched); deal actions skip it because they write the returned deal directly.
 */
export function useInvalidateDeal(dealId: string) {
  const queryClient = useQueryClient();
  return ({ deal = true }: { deal?: boolean } = {}) =>
    Promise.all([
      deal ? queryClient.invalidateQueries({ queryKey: dealKey(dealId), exact: true }) : undefined,
      ...DEAL_VIEW_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    ]);
}

/** Every deal action returns the full deal: write it into the cache so the page updates in place. */
export function useDealAction<V>(dealId: string, action: (v: V) => Promise<Deal>) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeal(dealId);
  return useMutation({
    mutationFn: action,
    onSuccess: (deal) => {
      queryClient.setQueryData(dealKey(dealId), deal);
      invalidate({ deal: false });
    },
  });
}

export type Dispute = components["schemas"]["Dispute"];
export type DisputeReason = components["schemas"]["DisputeReason"];

export const DISPUTE_REASONS: Record<DisputeReason, string> = {
  NOT_PAID: "Payment not received",
  NOT_DELIVERED: "Content not delivered",
  CONTENT_ISSUE: "Problem with the content",
  PRODUCT_NOT_RECEIVED: "Product not received",
  OTHER: "Something else",
};

export const DISPUTE_OUTCOMES: Record<NonNullable<Dispute["outcome"]>, string> = {
  RESUME: "The deal continues where it left off.",
  COMPLETE: "The deal is marked completed.",
  CANCEL: "The deal is cancelled.",
};

/** Deals a party can still raise an issue on (the API enforces the same set). */
export const DISPUTABLE: Deal["status"][] = [
  "ACTIVE",
  "PRODUCT_SHIPPED",
  "PRODUCT_RECEIVED",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "CONTENT_APPROVED",
  "PAYMENT_MARKED",
];

