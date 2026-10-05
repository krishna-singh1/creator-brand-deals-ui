"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button, Card, ErrorText, Field, Input, SectionTitle, Select, Spinner, Textarea } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import {
  type Campaign,
  type CampaignInput,
  COMPENSATION_LABELS,
  type CompensationType,
  DELIVERABLES_BY_PLATFORM,
  type DeliverableType,
  type Platform,
  PLATFORM_LABELS,
} from "@/lib/campaigns";
import { useCategories, useCities, useLanguages } from "@/lib/catalog";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatPaise, rupeesToPaise } from "@/lib/format";
import { useDebounced } from "@/lib/use-debounced";

const COMPENSATION_HINTS: Record<CompensationType, string> = {
  CASH: "A cash fee per creator",
  PRODUCT: "Your product in exchange for content",
  PRODUCT_PLUS_CASH: "Your product plus a cash fee",
};

type FormState = ReturnType<typeof initialState>;

function initialState(c?: Campaign) {
  const toRupees = (p?: number) => (p == null ? "" : String(p / 100));
  // Today's IST calendar date as UTC midnight, so day arithmetic and toISOString can't drift a day.
  const todayIst = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const inDays = (n: number) => new Date(todayIst.getTime() + n * 86_400_000).toISOString().slice(0, 10);
  return {
    title: c?.title ?? "",
    description: c?.description ?? "",
    productName: c?.productName ?? "",
    productUrl: c?.productUrl ?? "",
    productValue: toRupees(c?.productValuePaise),
    compensationType: (c?.compensationType ?? "CASH") as CompensationType,
    budgetMin: toRupees(c?.budgetMinPaise),
    budgetMax: toRupees(c?.budgetMaxPaise),
    platform: (c?.platform ?? "INSTAGRAM") as Platform,
    categoryIds: c?.categoryIds ?? [],
    deliverables: Object.fromEntries((c?.deliverables ?? []).map((d) => [d.deliverableType, d.quantity])) as Partial<
      Record<DeliverableType, number>
    >,
    followersMin: String(c?.criteria.followersMin ?? 10000),
    followersMax: String(c?.criteria.followersMax ?? 50000),
    cityIds: c?.criteria.cityIds ?? [],
    languages: c?.criteria.languages ?? [],
    gender: c?.criteria.gender ?? "ANY",
    creatorsNeeded: String(c?.creatorsNeeded ?? 5),
    guidelines: c?.guidelines ?? "",
    hashtags: (c?.hashtags ?? []).join(" "),
    mentions: (c?.mentions ?? []).join(" "),
    applyBy: c?.applyBy ?? inDays(7),
    contentWindowStart: c?.contentWindowStart ?? inDays(10),
    contentWindowEnd: c?.contentWindowEnd ?? inDays(24),
  };
}

function toInput(f: FormState): CampaignInput {
  const money = (v: string) => (v.trim() === "" ? undefined : rupeesToPaise(Number(v)));
  const words = (v: string) => v.split(/[\s,]+/).map((w) => w.trim()).filter(Boolean);
  return {
    title: f.title,
    description: f.description,
    productName: f.productName || undefined,
    productUrl: f.productUrl || undefined,
    productValuePaise: f.compensationType === "CASH" ? undefined : money(f.productValue),
    compensationType: f.compensationType,
    budgetMinPaise: f.compensationType === "PRODUCT" ? undefined : money(f.budgetMin),
    budgetMaxPaise: f.compensationType === "PRODUCT" ? undefined : money(f.budgetMax),
    platform: f.platform,
    categoryIds: f.categoryIds,
    deliverables: Object.entries(f.deliverables)
      .filter(([, q]) => (q ?? 0) > 0)
      .map(([type, quantity]) => ({ deliverableType: type as DeliverableType, quantity: quantity! })),
    criteria: {
      followersMin: Number(f.followersMin),
      followersMax: Number(f.followersMax),
      cityIds: f.cityIds,
      languages: f.languages,
      gender: f.gender as CampaignInput["criteria"]["gender"],
    },
    creatorsNeeded: Number(f.creatorsNeeded),
    guidelines: f.guidelines || undefined,
    hashtags: words(f.hashtags),
    mentions: words(f.mentions),
    applyBy: f.applyBy,
    contentWindowStart: f.contentWindowStart,
    contentWindowEnd: f.contentWindowEnd,
  };
}

/** Brief editor for new and draft campaigns. Saving keeps it as a draft; publishing happens on the detail page. */
/** Live campaigns lock what creators applied against (the API enforces the same rules). */
const LOCKED_NOTE = "Locked while the campaign is live, because creators applied against it.";

export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const live = campaign?.status === "PUBLISHED";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const { data: languages = [] } = useLanguages();
  const [f, setF] = useState(() => initialState(campaign));
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((s) => ({ ...s, [key]: value }));
  const toggle = (key: "categoryIds" | "languages" | "cityIds", value: string, max = 99) =>
    set(key, f[key].includes(value) ? f[key].filter((v) => v !== value) : f[key].length >= max ? f[key] : [...f[key], value]);

  const save = useMutation({
    mutationFn: () =>
      campaign
        ? unwrap(api.PUT("/campaigns/{campaignId}", { params: { path: { campaignId: campaign.id } }, body: toInput(f) }))
        : unwrap(api.POST("/campaigns", { body: toInput(f) })),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["brand", "dashboard"] });
      router.push(`/brand/campaigns/${saved.id}`);
    },
  });

  const input = toInput(f);
  const suggestionKey = useDebounced({
    platform: input.platform,
    criteria: input.criteria,
    deliverables: input.deliverables,
  });
  const suggestion = useQuery({
    queryKey: ["campaigns", "budget-suggestion", suggestionKey],
    queryFn: () => unwrap(api.POST("/campaigns/budget-suggestion", { body: suggestionKey })),
    enabled: suggestionKey.deliverables.length > 0 && suggestionKey.criteria.followersMax >= suggestionKey.criteria.followersMin,
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Card>
        <SectionTitle title="The brief" subtitle="What should creators make, and why will their audience care?" />
        <div className="flex flex-col gap-5">
          <Field label="Campaign title">
            <Input required minLength={5} maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Monsoon chai ritual" />
          </Field>
          <Field label="Description" hint="At least 20 characters. The product, the story, and what great looks like.">
            <Textarea required minLength={20} maxLength={5000} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Product name (optional)">
              <Input maxLength={120} value={f.productName} onChange={(e) => set("productName", e.target.value)} />
            </Field>
            <Field label="Product link (optional)">
              <Input type="url" maxLength={500} placeholder="https://" value={f.productUrl} onChange={(e) => set("productUrl", e.target.value)} />
            </Field>
          </div>
          <fieldset disabled={live} className="contents">
            <Chips label={live ? "Niches (locked while live)" : "Niches (up to 3)"}>
              {categories.map((c) => (
                <Chip key={c.id} on={f.categoryIds.includes(c.id)} onClick={() => toggle("categoryIds", c.id, 3)}>
                  {c.name}
                </Chip>
              ))}
            </Chips>
          </fieldset>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Deliverables" subtitle={live ? LOCKED_NOTE : "Choose the platform and how many of each piece you need per creator."} />
        <fieldset disabled={live} className="flex flex-col gap-5 disabled:opacity-60">
          <div className="flex gap-2">
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
              <Chip
                key={p}
                on={f.platform === p}
                onClick={() => setF((s) => ({ ...s, platform: p, deliverables: {} }))}
              >
                {PLATFORM_LABELS[p]}
              </Chip>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DELIVERABLES_BY_PLATFORM[f.platform].map((type) => {
              const qty = f.deliverables[type] ?? 0;
              return (
                <div
                  key={type}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${qty > 0 ? "border-gold bg-gold/5" : "border-zinc-200"}`}
                >
                  <span className="text-sm text-ink">{DELIVERABLE_LABELS[type]}</span>
                  <Stepper
                    label={DELIVERABLE_LABELS[type]}
                    value={qty}
                    onChange={(n) => set("deliverables", { ...f.deliverables, [type]: n })}
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card>
        <SectionTitle title="Compensation" subtitle={live ? LOCKED_NOTE : "Per creator. Barter works best when the product's value matches the work."} />
        <fieldset disabled={live} className="contents">
        <div className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(COMPENSATION_LABELS) as CompensationType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => set("compensationType", t)}
                aria-pressed={f.compensationType === t}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-300 ${
                  f.compensationType === t ? "border-gold bg-gold/5 shadow-soft" : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <span className="font-display text-lg text-ink">{COMPENSATION_LABELS[t]}</span>
                <span className="text-xs text-zinc-500">{COMPENSATION_HINTS[t]}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {f.compensationType !== "CASH" && (
              <Field label="Product MRP (₹)">
                <Input required type="number" min={0} value={f.productValue} onChange={(e) => set("productValue", e.target.value)} />
              </Field>
            )}
            {f.compensationType !== "PRODUCT" && (
              <>
                <Field label="Cash budget from (₹)">
                  <Input required type="number" min={0} step={1} value={f.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} />
                </Field>
                <Field label="Up to (₹, optional)">
                  <Input type="number" min={0} step={1} value={f.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} />
                </Field>
              </>
            )}
          </div>
          {suggestion.data && (
            <p className="flex animate-fade-in items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-zinc-700">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-gold" />
              Creators in this range usually charge{" "}
              <span className="font-medium text-ink">
                {formatPaise(suggestion.data.minPaise)}–{formatPaise(suggestion.data.maxPaise)}
              </span>{" "}
              per creator for these deliverables.
            </p>
          )}
        </div>
        </fieldset>
      </Card>

      <Card>
        <SectionTitle title="Who you're looking for" subtitle="Follower range is a hard filter. Cities, languages and gender improve the match score." />
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Followers from">
              <Input required disabled={live} type="number" min={0} step={1} value={f.followersMin} onChange={(e) => set("followersMin", e.target.value)} />
            </Field>
            <Field label="Followers up to">
              <Input required disabled={live} type="number" min={0} step={1} value={f.followersMax} onChange={(e) => set("followersMax", e.target.value)} />
            </Field>
            <Field label="Creators needed" hint={live ? `At least ${campaign?.approvedCount ?? 0}: that many are approved.` : undefined}>
              <Input
                required
                type="number"
                min={live ? Math.max(1, campaign?.approvedCount ?? 1) : 1}
                max={100}
                value={f.creatorsNeeded}
                onChange={(e) => set("creatorsNeeded", e.target.value)}
              />
            </Field>
          </div>
          {live && <p className="text-xs text-zinc-500">Follower range, cities, gender and languages: {LOCKED_NOTE.toLowerCase()}</p>}
          <fieldset disabled={live} className="contents">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Preferred cities (optional)">
              <Select value="" onChange={(e) => e.target.value && toggle("cityIds", e.target.value, 20)}>
                <option value="">Add a city…</option>
                {cities.filter((c) => !f.cityIds.includes(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Audience gender">
              <Select value={f.gender} onChange={(e) => set("gender", e.target.value as FormState["gender"])}>
                <option value="ANY">Any</option>
                <option value="FEMALE">Female creators</option>
                <option value="MALE">Male creators</option>
              </Select>
            </Field>
          </div>
          {f.cityIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {f.cityIds.map((id) => (
                <Chip key={id} on onClick={() => toggle("cityIds", id)}>
                  {cities.find((c) => c.id === id)?.name ?? "City"} ×
                </Chip>
              ))}
            </div>
          )}
          <Chips label="Content languages (optional)">
            {languages.map((l) => (
              <Chip key={l.code} on={f.languages.includes(l.code)} onClick={() => toggle("languages", l.code, 10)}>
                {l.name}
              </Chip>
            ))}
          </Chips>
          </fieldset>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Timeline & guidelines"
          subtitle={live ? "Content goes live after applications close. While live, dates can only move later." : "Content goes live after applications close."}
        />
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Apply by">
              <Input required type="date" min={live ? campaign?.applyBy : undefined} value={f.applyBy} onChange={(e) => set("applyBy", e.target.value)} />
            </Field>
            <Field label="Content from">
              <Input required type="date" value={f.contentWindowStart} onChange={(e) => set("contentWindowStart", e.target.value)} />
            </Field>
            <Field label="Content until">
              <Input
                required
                type="date"
                min={live ? campaign?.contentWindowEnd : undefined}
                value={f.contentWindowEnd}
                onChange={(e) => set("contentWindowEnd", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Guidelines (optional)" hint="Do's and don'ts, key messages, disclosure reminders.">
            <Textarea maxLength={5000} value={f.guidelines} onChange={(e) => set("guidelines", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Hashtags (optional)" hint="Separate with spaces">
              <Input value={f.hashtags} onChange={(e) => set("hashtags", e.target.value)} placeholder="#MonsoonRitual #ad" />
            </Field>
            <Field label="Mentions (optional)" hint="Separate with spaces">
              <Input value={f.mentions} onChange={(e) => set("mentions", e.target.value)} placeholder="@yourbrand" />
            </Field>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-full border border-zinc-200 bg-white/90 px-6 py-3 shadow-lift backdrop-blur">
        <ErrorText>{save.isError && errorMessage(save.error)}</ErrorText>
        <span className="text-xs text-zinc-500">
          {!save.isError &&
            (live
              ? "Changes go live right away. Creators who applied or were invited are told what changed."
              : "Saves as a draft. Nothing is public until you publish.")}
        </span>
        <Button type="submit" disabled={save.isPending || f.categoryIds.length === 0 || input.deliverables.length === 0}>
          {save.isPending ? (
            <>
              <Spinner /> Saving…
            </>
          ) : campaign ? (
            "Save changes"
          ) : (
            "Save draft"
          )}
        </Button>
      </div>
    </form>
  );
}

function Chips({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-600">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-4 py-1.5 text-sm transition-all duration-300 ${
        on ? "border-ink bg-ink text-ivory shadow-soft" : "border-zinc-300 text-zinc-700 hover:border-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
        className="grid size-8 place-items-center rounded-full border border-zinc-300 text-ink transition-colors hover:border-ink disabled:opacity-30"
      >
        −
      </button>
      <span className="w-5 text-center font-display text-lg tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={value === 10}
        onClick={() => onChange(value + 1)}
        className="grid size-8 place-items-center rounded-full border border-zinc-300 text-ink transition-colors hover:border-ink disabled:opacity-30"
      >
        +
      </button>
    </span>
  );
}
