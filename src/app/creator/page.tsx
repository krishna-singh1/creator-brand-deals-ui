"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ActionItems } from "@/components/action-items";
import { AppShell } from "@/components/app-shell";
import { BrandLine, MatchScore } from "@/components/campaign-bits";
import { type ChecklistStep, DashboardHero, greeting, ProgressChecklist } from "@/components/dashboard";
import { DealsNeedingYou } from "@/components/deals-needing-you";
import { LoadError } from "@/components/load-error";
import { RequireSession } from "@/components/require-session";
import { Card, Skeleton, StatusBadge } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { formatDeadline, formatOffer } from "@/lib/campaigns";
import { formatPaise } from "@/lib/format";
import { PRODUCT } from "@/lib/product";

type CreatorStatus = components["schemas"]["CreatorStatus"];

/** Action items the getting-started checklist already covers. */
const CHECKLIST_ITEMS = ["COMPLETE_PROFILE", "SUBMIT_VERIFICATION", "BROWSE_CAMPAIGNS"];

export default function CreatorHome() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <Dashboard name={me.displayName} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Dashboard({ name }: { name?: string }) {
  const { data, error } = useQuery({ queryKey: ["creator", "dashboard"], queryFn: () => unwrap(api.GET("/creator/dashboard")) });
  if (error && !data) return <LoadError error={error} />;
  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-72 rounded-[2rem]" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const verified = data.status === "VERIFIED";
  const rest = data.actionItems.filter((i) => !CHECKLIST_ITEMS.includes(i.type));
  // A brand-new creator has nothing to count yet: skip a row of zeros until something happens.
  const hasActivity = verified || data.openApplications + data.activeDeals + data.completedDeals > 0;
  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Creator studio"
        title={name ? `${greeting()}, ${name}` : `Welcome to ${PRODUCT.name}`}
        subtitle={
          verified
            ? "Briefs matched to your niche, your applications and your deals, all in one place."
            : "Finish a few steps and brands start seeing you, with briefs matched to your niche and a fair price for each."
        }
        badge={<StatusBadge status={data.status} />}
        action={verified ? { href: "/creator/campaigns", label: "Browse briefs" } : undefined}
        kpis={
          hasActivity
            ? [
          { label: "Applications", value: data.openApplications, href: "/creator/applications" },
          { label: "Active deals", value: data.activeDeals, href: "/deals" },
          { label: "Completed", value: data.completedDeals },
          ...(data.declaredEarningsPaise != null
            ? [{ label: "Earned", value: data.declaredEarningsPaise, format: formatPaise, href: "/creator/earnings", highlight: true }]
            : []),
              ]
            : undefined
        }
      />
      {!verified && <SetupChecklist status={data.status} />}
      <DealsNeedingYou partner="brand" />
      {verified && <TopMatches />}
      {rest.length > 0 && <ActionItems items={rest} emptyText="" />}
    </div>
  );
}

/** Profile → social account → rates → verification, from the profile's missing fields and the rate card. */
function SetupChecklist({ status }: { status: CreatorStatus }) {
  const { data: profile } = useQuery({ queryKey: ["creator", "profile"], queryFn: () => unwrap(api.GET("/creator/profile")) });
  const { data: rates } = useQuery({ queryKey: ["creator", "rates"], queryFn: () => unwrap(api.GET("/creator/rates")) });
  if (!profile) return <Skeleton className="h-64" />;

  const missing = profile.missingFields ?? [];
  const detailsDone = missing.every((f) => f === "socialAccounts");
  const socialDone = !missing.includes("socialAccounts");
  const ratesDone = (rates?.entries ?? []).some((e) => e.pricePaise != null);
  const verification: ChecklistStep["state"] =
    status === "PENDING_VERIFICATION" ? "waiting" : detailsDone && socialDone ? "current" : "todo";
  const steps: ChecklistStep[] = [
    { label: "Complete your creator profile", hint: "Name, city, niches and contact details", href: "/creator/profile", state: detailsDone ? "done" : "todo" },
    { label: "Add your Instagram or Facebook", hint: "Followers and engagement set your suggested price", href: "/creator/profile", state: socialDone ? "done" : "todo" },
    { label: "Set your rates", hint: "Your own price next to our suggestion", href: "/creator/profile", state: ratesDone ? "done" : "todo" },
    {
      label: status === "REJECTED" ? "Update and resubmit for verification" : "Get verified",
      hint: status === "PENDING_VERIFICATION" ? "With our team, usually within 48 hours" : "Unlocks campaigns and brand invites",
      href: "/creator/verification",
      state: verification,
    },
  ];
  const firstOpen = steps.findIndex((s) => s.state === "todo");
  if (firstOpen >= 0 && !steps.some((s) => s.state === "current")) steps[firstOpen] = { ...steps[firstOpen], state: "current" };

  return <ProgressChecklist title={status === "PENDING_VERIFICATION" ? "Almost there" : "Get ready for your first brief"} steps={steps} />;
}

/** The three best-matching briefs the creator hasn't acted on yet. */
function TopMatches() {
  const { data } = useQuery({
    queryKey: ["campaigns", "feed", "home"],
    queryFn: () => unwrap(api.GET("/campaigns/feed", { params: { query: { sort: "MATCH", limit: 6 } } })),
  });
  const picks = (data?.items ?? []).filter((c) => !c.myApplicationStatus).slice(0, 3);
  if (!data) return <Skeleton className="h-56" />;
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold-deep">Matched for you</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight text-ink">Briefs worth a look</h2>
        </div>
        <Link href="/creator/campaigns" className="link-underline shrink-0 text-sm text-zinc-600 hover:text-ink">
          See all
        </Link>
      </div>
      {picks.length === 0 ? (
        <Card>
          <p className="font-display text-xl text-ink">No new briefs for you right now</p>
          <p className="mt-1 text-sm text-zinc-600">New campaigns arrive every week. A complete rate card and portfolio help you stand out when they do.</p>
        </Card>
      ) : (
        <ul className="grid gap-5 md:grid-cols-3">
          {picks.map((c) => (
            <li key={c.id}>
              <Link href={`/creator/campaigns/${c.id}`} className="block h-full">
                <Card interactive className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <BrandLine brand={c.brand} />
                    <MatchScore score={c.matchScore} size={48} />
                  </div>
                  <p className="font-display text-xl leading-snug tracking-tight text-ink">{c.title}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-sm">
                    <span className="font-medium text-ink">{formatOffer(c)}</span>
                    <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">{formatDeadline(c.applyBy)}</span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
