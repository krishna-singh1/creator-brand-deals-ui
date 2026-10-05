"use client";

import { useState } from "react";

import { Button, Card, ErrorText, Field, Input, SectionTitle, Select, Textarea } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDate } from "@/lib/campaigns";
import { type Deal, useDealAction } from "@/lib/deals";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatPaise, rupeesToPaise } from "@/lib/format";

import { PRODUCT } from "@/lib/product";

type PaymentMode = "UPI" | "BANK_TRANSFER" | "OTHER";
const MODE_LABELS: Record<PaymentMode, string> = { UPI: "UPI", BANK_TRANSFER: "Bank transfer", OTHER: "Other" };

/** Product shipping: brand records it, creator confirms receipt. */
export function ShipmentPanel({ deal, isBrand }: { deal: Deal; isBrand: boolean }) {
  const [courier, setCourier] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const path = { params: { path: { dealId: deal.id } } };
  const ship = useDealAction(deal.id, () =>
    unwrap(api.POST("/deals/{dealId}/product-shipped", { ...path, body: { courier: courier || undefined, trackingId: trackingId || undefined } })),
  );
  const receive = useDealAction(deal.id, () => unwrap(api.POST("/deals/{dealId}/product-received", path)));
  const s = deal.shipment;

  return (
    <Card>
      <SectionTitle title="Product" subtitle={deal.productValuePaise ? `Worth ${formatPaise(deal.productValuePaise)} (MRP)` : undefined} />
      {s ? (
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Shipped</dt>
            <dd className="text-ink">{s.shippedAt ? formatDateTime(s.shippedAt) : "—"}</dd>
          </div>
          {(s.courier || s.trackingId) && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Tracking</dt>
              <dd className="text-ink">{[s.courier, s.trackingId].filter(Boolean).join(" · ")}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Received</dt>
            <dd className="text-ink">{s.receivedAt ? formatDateTime(s.receivedAt) : "Not yet"}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-zinc-600">{isBrand ? "Not shipped yet." : "The brand hasn't shipped it yet."}</p>
      )}
      {isBrand && deal.status === "ACTIVE" && (
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            ship.mutate(undefined);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Courier (optional)">
              <Input maxLength={60} value={courier} onChange={(e) => setCourier(e.target.value)} />
            </Field>
            <Field label="Tracking ID (optional)">
              <Input maxLength={60} value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
            </Field>
          </div>
          <ErrorText>{ship.isError && errorMessage(ship.error)}</ErrorText>
          <Button type="submit" className="self-start" disabled={ship.isPending}>
            Mark as shipped
          </Button>
        </form>
      )}
      {!isBrand && deal.status === "PRODUCT_SHIPPED" && (
        <>
          <ErrorText>{receive.isError && errorMessage(receive.error)}</ErrorText>
          <Button className="mt-5" onClick={() => receive.mutate(undefined)} disabled={receive.isPending}>
            I received the product
          </Button>
        </>
      )}
    </Card>
  );
}

/** Off-platform payment: brand records it, creator confirms. */
export function PaymentPanel({ deal, isBrand }: { deal: Deal; isBrand: boolean }) {
  const [amount, setAmount] = useState(String(deal.agreedTotalPaise / 100));
  const [mode, setMode] = useState<PaymentMode>("UPI");
  const [reference, setReference] = useState("");
  const [paidOn, setPaidOn] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const path = { params: { path: { dealId: deal.id } } };
  const mark = useDealAction(deal.id, () =>
    unwrap(
      api.POST("/deals/{dealId}/payment", {
        ...path,
        body: { amountPaise: rupeesToPaise(Number(amount)), mode, reference: reference || undefined, paidOn },
      }),
    ),
  );
  const confirm = useDealAction(deal.id, () => unwrap(api.POST("/deals/{dealId}/payment/confirm", path)));
  const p = deal.payment;

  return (
    <Card>
      <SectionTitle title="Payment" subtitle={`Agreed: ${formatPaise(deal.agreedTotalPaise)}. Paid directly, outside ${PRODUCT.name}.`} />
      {p ? (
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Amount</dt>
            <dd className="font-display text-xl text-ink">{formatPaise(p.amountPaise)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Paid on</dt>
            <dd className="text-ink">
              {formatDate(p.paidOn)} · {MODE_LABELS[p.mode as PaymentMode]}
              {p.reference ? ` · ${p.reference}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Confirmed by creator</dt>
            <dd className="text-ink">{p.confirmedAt ? formatDateTime(p.confirmedAt) : "Not yet"}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-zinc-600">Payment is recorded once all content is approved.</p>
      )}
      {isBrand && deal.status === "CONTENT_APPROVED" && (
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            mark.mutate(undefined);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount paid (₹)">
              <Input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Paid on">
              <Input type="date" required value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </Field>
            <Field label="Mode">
              <Select value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
                {(Object.keys(MODE_LABELS) as PaymentMode[]).map((m) => (
                  <option key={m} value={m}>
                    {MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reference (optional)">
              <Input maxLength={100} placeholder="UTR / transaction ID" value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
          </div>
          <ErrorText>{mark.isError && errorMessage(mark.error)}</ErrorText>
          <Button type="submit" className="self-start" disabled={mark.isPending}>
            Record payment
          </Button>
        </form>
      )}
      {!isBrand && deal.status === "PAYMENT_MARKED" && (
        <>
          <ErrorText>{confirm.isError && errorMessage(confirm.error)}</ErrorText>
          <Button className="mt-5" onClick={() => confirm.mutate(undefined)} disabled={confirm.isPending}>
            I received the payment
          </Button>
        </>
      )}
    </Card>
  );
}

/** Mutual 1–5 ratings after completion. */
export function ReviewPanel({ deal, partnerName }: { deal: Deal; partnerName: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const submit = useDealAction(deal.id, async () => {
    await unwrap(api.POST("/deals/{dealId}/reviews", { params: { path: { dealId: deal.id } }, body: { rating, comment: comment || undefined } }));
    return unwrap(api.GET("/deals/{dealId}", { params: { path: { dealId: deal.id } } }));
  });

  return (
    <Card>
      <SectionTitle title="Ratings" />
      <div className="flex flex-col gap-4 text-sm">
        {deal.myReview ? (
          <ReviewLine label="Your rating" rating={deal.myReview.rating} comment={deal.myReview.comment} />
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate(undefined);
            }}
          >
            <span className="text-zinc-700">How was working with {partnerName}?</span>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? "text-gold" : "text-zinc-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea className="min-h-20" maxLength={1000} placeholder="Optional: what stood out?" value={comment} onChange={(e) => setComment(e.target.value)} />
            <ErrorText>{submit.isError && errorMessage(submit.error)}</ErrorText>
            <Button type="submit" className="self-start" disabled={rating === 0 || submit.isPending}>
              Submit rating
            </Button>
          </form>
        )}
        {deal.counterpartyReview && (
          <ReviewLine label={`${partnerName}'s rating of you`} rating={deal.counterpartyReview.rating} comment={deal.counterpartyReview.comment} />
        )}
      </div>
    </Card>
  );
}

function ReviewLine({ label, rating, comment }: { label: string; rating: number; comment?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      <span className="text-lg text-gold" aria-label={`${rating} out of 5`}>
        {"★".repeat(rating)}
        <span className="text-zinc-300">{"★".repeat(5 - rating)}</span>
      </span>
      {comment && <p className="text-zinc-700">{comment}</p>}
    </div>
  );
}

/** Cancel with a reason (either side, before any content was submitted). */
export function CancelDeal({ deal }: { deal: Deal }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cancel = useDealAction(deal.id, () =>
    unwrap(api.POST("/deals/{dealId}/cancel", { params: { path: { dealId: deal.id } }, body: { reason } })),
  );
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm text-zinc-500 underline-offset-4 hover:text-red-700 hover:underline">
        Cancel this deal
      </button>
    );
  }
  return (
    <Card tone="danger">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          cancel.mutate(undefined);
        }}
      >
        <Field label="Why are you cancelling?" hint="The other side sees this reason.">
          <Textarea className="min-h-20" required minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <ErrorText>{cancel.isError && errorMessage(cancel.error)}</ErrorText>
        <div className="flex gap-3">
          <Button type="submit" variant="danger" disabled={reason.trim().length < 3 || cancel.isPending}>
            Cancel deal
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Keep the deal
          </Button>
        </div>
      </form>
    </Card>
  );
}
