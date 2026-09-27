"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card, ErrorText, Input, PageTitle, SectionTitle, SuccessText } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatCount, formatDateTime } from "@/lib/format";

import { AdminShell } from "../admin-shell";

type RateTable = components["schemas"]["RateTable"];
type Row = components["schemas"]["RateTableRow"];
type Modifier = components["schemas"]["PricingModifier"];

export default function AdminPricingPage() {
  return (
    <AdminShell>
      <Pricing />
    </AdminShell>
  );
}

function Pricing() {
  const { data } = useQuery({ queryKey: ["admin", "rate-table"], queryFn: () => unwrap(api.GET("/admin/pricing/rate-table")) });
  // Remount the editor per version so its draft starts from the published table.
  return data ? <Editor key={data.version} table={data} /> : <p className="text-sm text-zinc-500">Loading…</p>;
}

function Editor({ table }: { table: RateTable }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>(table.rows);
  const [modifiers, setModifiers] = useState<Modifier[]>(table.modifiers);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(rows) !== JSON.stringify(table.rows) || JSON.stringify(modifiers) !== JSON.stringify(table.modifiers);
  const publish = useMutation({
    mutationFn: () => unwrap(api.PUT("/admin/pricing/rate-table", { body: { rows, modifiers } })),
    onSuccess: (next) => {
      setSaved(true);
      queryClient.setQueryData(["admin", "rate-table"], next);
    },
  });

  const setRow = (i: number, patch: Partial<Row>) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setModifier = (i: number, patch: Partial<Modifier>) =>
    setModifiers((all) => all.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const groups = [...new Set(rows.map((r) => `${r.platform}|${r.deliverableType}`))];

  return (
    <div className="flex flex-col gap-8">
      <PageTitle
        eyebrow="Admin"
        title="Pricing rate table"
        subtitle={`Version ${table.version}, live since ${formatDateTime(table.activatedAt)}. Publishing creates a new version that suggestions use immediately.`}
      >
        <div className="flex flex-col items-end gap-2">
          <Button
            disabled={!dirty || publish.isPending}
            onClick={() => {
              if (window.confirm("Publish these prices? Suggestions for every creator and brand change right away.")) publish.mutate();
            }}
          >
            {publish.isPending ? "Publishing…" : `Publish version ${table.version + 1}`}
          </Button>
          {dirty && (
            <button
              type="button"
              className="text-sm text-zinc-500 hover:text-ink"
              onClick={() => {
                setRows(table.rows);
                setModifiers(table.modifiers);
              }}
            >
              Discard changes
            </button>
          )}
        </div>
      </PageTitle>
      <ErrorText>{publish.isError && errorMessage(publish.error)}</ErrorText>
      {saved && !dirty && <SuccessText>Published. New suggestions use version {table.version}.</SuccessText>}

      {groups.map((g) => {
        const [platform, type] = g.split("|");
        return (
          <Card key={g} className="overflow-x-auto">
            <SectionTitle title={DELIVERABLE_LABELS[type] ?? type} subtitle={`${platform.toLowerCase()} · base price per piece (₹), before engagement multipliers`} />
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Tier</th>
                  <th className="py-2 pr-4 font-medium">Followers from</th>
                  <th className="py-2 pr-4 font-medium">to</th>
                  <th className="py-2 pr-4 font-medium">Min ₹</th>
                  <th className="py-2 font-medium">Max ₹</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) =>
                  `${r.platform}|${r.deliverableType}` !== g ? null : (
                    <tr key={`${g}-${r.tier}`}>
                      <td className="py-1.5 pr-4 font-medium text-ink">{r.tier}</td>
                      <td className="py-1.5 pr-4">
                        <NumberInput label={`${type} ${r.tier} followers from`} value={r.followersMin} onChange={(v) => setRow(i, { followersMin: v ?? 0 })} />
                      </td>
                      <td className="py-1.5 pr-4">
                        {r.followersMax == null ? (
                          <span className="text-zinc-500">and up</span>
                        ) : (
                          <NumberInput label={`${type} ${r.tier} followers to`} value={r.followersMax} onChange={(v) => setRow(i, { followersMax: v ?? 0 })} />
                        )}
                      </td>
                      <td className="py-1.5 pr-4">
                        <NumberInput
                          label={`${type} ${r.tier} min rupees`}
                          value={r.basePaise.minPaise / 100}
                          onChange={(v) => setRow(i, { basePaise: { ...r.basePaise, minPaise: Math.round((v ?? 0) * 100) } })}
                        />
                      </td>
                      <td className="py-1.5">
                        <NumberInput
                          label={`${type} ${r.tier} max rupees`}
                          value={r.basePaise.maxPaise / 100}
                          onChange={(v) => setRow(i, { basePaise: { ...r.basePaise, maxPaise: Math.round((v ?? 0) * 100) } })}
                        />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </Card>
        );
      })}

      <Card>
        <SectionTitle title="Multipliers" subtitle="Engagement-rate bands scale the base range. One band applies per suggestion." />
        <ul className="flex flex-col divide-y divide-zinc-100 text-sm">
          {modifiers.map((m, i) => (
            <li key={m.code} className="flex flex-wrap items-center gap-4 py-3">
              <span className="w-40 font-medium text-ink">{m.code}</span>
              <span className="w-44 text-zinc-500">{describeRule(m)}</span>
              <label className="flex items-center gap-2">
                ×
                <NumberInput label={`${m.code} multiplier`} step="0.05" value={m.multiplier} onChange={(v) => setModifier(i, { multiplier: v ?? 0 })} />
              </label>
              <label className="flex items-center gap-2 text-zinc-700">
                <input type="checkbox" className="size-4 accent-ink" checked={m.active} onChange={(e) => setModifier(i, { active: e.target.checked })} />
                Active
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function describeRule(m: Modifier) {
  const min = m.rule?.erMin as number | undefined;
  const max = m.rule?.erMax as number | undefined;
  if (min == null && max == null) return "";
  if (min == null) return `ER below ${max}%`;
  if (max == null) return `ER ${min}% and above`;
  return `ER ${min}–${max}%`;
}

function NumberInput({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (v: number | null) => void; step?: string }) {
  return (
    <Input
      type="number"
      min={0}
      step={step}
      aria-label={label}
      className="h-9 w-28 px-3"
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      title={Number.isInteger(value) && value >= 1000 ? formatCount(value) : undefined}
    />
  );
}
