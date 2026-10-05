"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card, ErrorText, Input, SectionTitle, SuccessText } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatPaise, rupeesToPaise } from "@/lib/format";

type DeliverableType = components["schemas"]["DeliverableType"];
type RateCardData = components["schemas"]["RateCard"];

/** Creator's own prices next to the platform's suggested range (docs/07-pricing.md §6). */
export function RateCard() {
  const { data } = useQuery({ queryKey: ["creator", "rates"], queryFn: () => unwrap(api.GET("/creator/rates")) });
  if (!data) return null;
  // Remount when the card's shape changes (account added/removed, new suggestions), not when prices are saved.
  const shape = data.entries.map((e) => `${e.deliverableType}:${e.suggested?.minPaise ?? "-"}`).join(",");
  return <RateCardForm key={shape} data={data} />;
}

function RateCardForm({ data }: { data: RateCardData }) {
  const queryClient = useQueryClient();
  const [prices, setPrices] = useState<Partial<Record<DeliverableType, string>>>(() =>
    Object.fromEntries(data.entries.map((e) => [e.deliverableType, e.pricePaise != null ? String(e.pricePaise / 100) : ""])),
  );

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        api.PUT("/creator/rates", {
          body: {
            entries: Object.entries(prices)
              .filter(([, v]) => v !== "" && v !== undefined)
              .map(([type, v]) => ({ deliverableType: type as DeliverableType, pricePaise: rupeesToPaise(Number(v)) })),
          },
        }),
      ),
    onSuccess: (card) => queryClient.setQueryData(["creator", "rates"], card),
  });

  return (
    <Card>
      <SectionTitle
        title="Rate card"
        subtitle="Your usual price per deliverable. Suggested ranges come from creators with similar followers and engagement."
      />
      {data.entries.length === 0 ? (
        <p className="text-sm text-zinc-500">Add a social account to set your rates.</p>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {data.entries.map((entry) => (
            <div key={entry.deliverableType} className="grid items-center gap-2 sm:grid-cols-[1fr_12rem_10rem]">
              <span className="text-sm font-medium">{DELIVERABLE_LABELS[entry.deliverableType]}</span>
              <span className="text-sm text-zinc-500">
                {entry.suggested
                  ? `Suggested ${formatPaise(entry.suggested.minPaise)}–${formatPaise(entry.suggested.maxPaise)}${entry.suggested.estimated ? " (est.)" : ""}`
                  : "No suggestion yet"}
              </span>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="₹"
                value={prices[entry.deliverableType] ?? ""}
                onChange={(e) => setPrices((p) => ({ ...p, [entry.deliverableType]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save rates"}
            </Button>
            <SuccessText>{save.isSuccess && "Saved."}</SuccessText>
            <ErrorText>{save.isError && errorMessage(save.error)}</ErrorText>
          </div>
        </form>
      )}
    </Card>
  );
}
