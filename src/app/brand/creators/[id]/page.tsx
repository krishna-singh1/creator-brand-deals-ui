"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { CreatorAvatar } from "@/components/creator-avatar";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Field, PageTitle, SectionTitle, Select, Textarea } from "@/components/ui";
import { ApiRequestError, api, unwrap } from "@/lib/api/client";
import { reliability } from "@/lib/applications";
import { isVerified, useBrandProfile } from "@/lib/brand";
import { useCategories } from "@/lib/catalog";
import type { CreatorPublicProfile } from "@/lib/creators";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatCount, formatPaise } from "@/lib/format";
import { isVerifiedSource, verifiedSourceLabel } from "@/lib/verification";

export default function BrandCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Profile id={id} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Profile({ id }: { id: string }) {
  const { data: c, isError, error } = useQuery({
    queryKey: ["brand", "creators", id],
    queryFn: () => unwrap(api.GET("/brand/creators/{creatorId}", { params: { path: { creatorId: id } } })),
  });
  const { data: categories = [] } = useCategories();
  if (isError) return <ErrorText>{errorMessage(error)}</ErrorText>;
  if (!c) return <ContentSkeleton />;
  const r = reliability(c);
  const niches = categories.filter((cat) => c.categoryIds.includes(cat.id)).map((cat) => cat.name);

  return (
    <div className="flex flex-col gap-10">
      <Link href="/brand/creators" className="text-sm text-zinc-500 hover:text-ink">
        ← All creators
      </Link>
      <PageTitle eyebrow={niches.join(" · ") || "Creator"} title={c.displayName}>
        <CreatorAvatar name={c.displayName} url={c.avatarUrl} size="size-20 text-3xl" />
      </PageTitle>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="grid gap-5 sm:grid-cols-4">
            <Stat label="Followers" value={formatCount(c.followers)} />
            <Stat label="Engagement" value={`${c.engagementRate}%`} />
            <Stat label="Deals done" value={String(r.completed)} />
            <Stat label="Rating" value={c.ratingAvg ? `★ ${Number(c.ratingAvg).toFixed(1)}` : "—"} />
            <p className="flex flex-wrap gap-2 text-xs text-zinc-600 sm:col-span-4">
              {isVerifiedSource(c.metricSource) ? <span className="text-emerald-700">{verifiedSourceLabel(c.metricSource)}.</span> : <span>Self-declared metrics.</span>}
              {c.city && <span>Based in {c.city}.</span>}
              {c.languages && c.languages.length > 0 && <span>Creates in {c.languages.join(", ").toUpperCase()}.</span>}
              {r.cancelled > 0 && <span>{r.cancelled} deal{r.cancelled === 1 ? "" : "s"} cancelled by the creator.</span>}
              {r.oftenCancels && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200">Often cancels</span>}
            </p>
          </Card>
          {c.bio && (
            <Card>
              <SectionTitle title="About" />
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-700">{c.bio}</p>
            </Card>
          )}
          <Accounts creator={c} />
          {c.portfolio.length > 0 && (
            <Card>
              <SectionTitle title="Past work" />
              <ul className="flex flex-col gap-2 text-sm">
                {c.portfolio.map((p) => (
                  <li key={p.id}>
                    <a href={p.url} target="_blank" rel="noreferrer" className="link-underline text-ink">
                      {p.brandName ? `${p.brandName} · ` : ""}
                      {p.platform === "FACEBOOK" ? "Facebook" : "Instagram"} post
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <InvitePanel creatorId={c.id} creatorName={c.displayName} />
          {c.rateCard && c.rateCard.length > 0 && (
            <Card>
              <SectionTitle title="Rates" subtitle="What they usually charge. They quote per campaign." />
              <ul className="flex flex-col gap-2 text-sm">
                {c.rateCard.map((rate) => (
                  <li key={rate.deliverableType} className="flex justify-between gap-3">
                    <span className="text-zinc-700">{DELIVERABLE_LABELS[rate.deliverableType]}</span>
                    <span className="font-medium text-ink">{rate.pricePaise != null ? formatPaise(rate.pricePaise) : "—"}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

function Accounts({ creator: c }: { creator: CreatorPublicProfile }) {
  return (
    <Card>
      <SectionTitle title="Accounts" />
      <ul className="flex flex-col gap-3 text-sm">
        {c.socialAccounts.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3">
            <a href={a.profileUrl} target="_blank" rel="noreferrer" className="link-underline font-medium text-ink">
              {a.platform === "FACEBOOK" ? "Facebook" : "Instagram"} · @{a.handle}
            </a>
            <span className="text-zinc-600">
              {formatCount(a.followers)} followers · {a.engagementRate}% engagement
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Invite to one of the brand's live campaigns, with an optional note. */
function InvitePanel({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  const queryClient = useQueryClient();
  const { data: brand } = useBrandProfile();
  const { data: live } = useQuery({
    queryKey: ["campaigns", "mine", "PUBLISHED", "invite"],
    queryFn: () => unwrap(api.GET("/campaigns/mine", { params: { query: { status: "PUBLISHED", limit: 50 } } })),
  });
  const campaigns = live?.items ?? [];
  const [campaignId, setCampaignId] = useState("");
  const [message, setMessage] = useState("");
  const [sentTo, setSentTo] = useState<string[]>([]);
  const chosen = campaignId || campaigns[0]?.id || "";
  const invite = useMutation({
    mutationFn: (campaignId: string) =>
      unwrap(
        api.POST("/campaigns/{campaignId}/invites", {
          params: { path: { campaignId } },
          body: { creatorId, message: message.trim() || undefined },
        }),
      ),
    onSuccess: (_, campaignId) => {
      setSentTo((s) => [...s, campaignId]);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["applications", "campaign", campaignId] });
    },
  });
  // The "sent" state lives in memory only; after a reload the API's duplicate check tells us instead.
  const alreadyInvited = invite.error instanceof ApiRequestError && invite.error.code === "APPLICATION_ALREADY_EXISTS";
  const error = invite.isError && !alreadyInvited ? errorMessage(invite.error) : null;

  if (brand && !isVerified(brand)) {
    return (
      <Card tone="highlight">
        <SectionTitle title="Invite to a campaign" />
        <p className="text-sm text-zinc-700">Invites unlock once we&apos;ve verified your brand.</p>
        <Link href="/brand/profile" className="link-underline mt-3 inline-block text-sm font-medium text-ink">
          Check your verification →
        </Link>
      </Card>
    );
  }
  if (live && campaigns.length === 0) {
    return (
      <Card tone="highlight">
        <SectionTitle title="Invite to a campaign" />
        <p className="text-sm text-zinc-700">Publish a campaign first, then invite {creatorName} to it.</p>
        <Link href="/brand/campaigns/new" className="link-underline mt-3 inline-block text-sm font-medium text-ink">
          Create a campaign →
        </Link>
      </Card>
    );
  }
  return (
    <Card tone="highlight">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (chosen) invite.mutate(chosen);
        }}
      >
        <SectionTitle title="Invite to a campaign" subtitle={`${creatorName} gets an email and can reply with a pitch and quote.`} />
        <Field label="Campaign">
          <Select value={chosen} onChange={(e) => setCampaignId(e.target.value)}>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Note (optional)" hint="Why them? A personal line gets more replies.">
          <Textarea className="min-h-20" maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        {sentTo.includes(chosen) ? (
          <p className="text-sm font-medium text-emerald-800">Invite sent. You&apos;ll see them in the campaign&apos;s applicants.</p>
        ) : alreadyInvited && invite.variables === chosen ? (
          <p className="text-sm font-medium text-zinc-700">Already invited or applied to this campaign.</p>
        ) : (
          <Button type="submit" disabled={!chosen || invite.isPending}>
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        )}
      </form>
    </Card>
  );
}
