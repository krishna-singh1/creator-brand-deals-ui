"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { components } from "./api/client";

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
  LEAVE_REVIEW: { title: "Rate your partner", body: "A quick rating helps everyone on BrandDeal choose good partners." },
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

/** Every deal action returns the full deal: write it into the cache so the page updates in place. */
export function useDealAction<V>(dealId: string, action: (v: V) => Promise<Deal>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (deal) => {
      queryClient.setQueryData(dealKey(dealId), deal);
      queryClient.invalidateQueries({ queryKey: ["deals", "list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
