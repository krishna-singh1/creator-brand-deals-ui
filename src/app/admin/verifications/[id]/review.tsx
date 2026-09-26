"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { CenteredMessage, RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Field, Input, SectionTitle, StatusBadge, Textarea } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { formatCount, formatDateTime } from "@/lib/format";

type Checklist = components["schemas"]["VerificationChecklist"];

const CHECKS: { key: keyof Checklist; label: string }[] = [
  { key: "handleMatches", label: "Handle exists, is public, and name/photo match the profile" },
  { key: "followersWithinTolerance", label: "Follower count within ±10% of declared" },
  { key: "insightsMatchHandle", label: "Insights screenshots show this handle" },
  { key: "engagementLooksReal", label: "Engagement looks real (0.5–20% ER, non-bot comments)" },
  { key: "audienceMostlyIndia", label: "Audience is mostly in India" },
  { key: "contentSafe", label: "Content is safe (no adult, hateful or illegal material)" },
];

export function Review({ id }: { id: string }) {
  return (
    <RequireSession role="ADMIN">
      {(me) => (
        <AppShell me={me}>
          <ReviewBody id={id} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function ReviewBody({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "verification", id],
    queryFn: () => unwrap(api.GET("/admin/verifications/{verificationId}", { params: { path: { verificationId: id } } })),
  });
  const [checklist, setChecklist] = useState<Checklist>(
    Object.fromEntries(CHECKS.map((c) => [c.key, false])) as unknown as Checklist,
  );
  const [metrics, setMetrics] = useState<Record<string, { followers: string; engagementRate: string }>>({});
  const [reason, setReason] = useState("");

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };
  const approve = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/admin/verifications/{verificationId}/approve", {
          params: { path: { verificationId: id } },
          body: {
            checklist,
            verifiedMetrics: Object.entries(metrics)
              .filter(([, m]) => m.followers !== "" && m.engagementRate !== "")
              .map(([socialAccountId, m]) => ({
                socialAccountId,
                followers: Number(m.followers),
                engagementRate: Number(m.engagementRate),
              })),
          },
        }),
      ),
    onSuccess: done,
  });
  const reject = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/admin/verifications/{verificationId}/reject", {
          params: { path: { verificationId: id } },
          body: { reason, checklist },
        }),
      ),
    onSuccess: done,
  });

  if (!data) return <CenteredMessage>Loading…</CenteredMessage>;
  const { verification, creator, socialAccounts, proofs } = data;
  const pending = verification.status === "PENDING";
  const allPass = CHECKS.every((c) => checklist[c.key]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Queue
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{creator.displayName}</h1>
        <StatusBadge status={verification.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle title="Profile" />
            <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
              <dt className="text-zinc-500">Full name</dt>
              <dd>{creator.fullName}</dd>
              <dt className="text-zinc-500">City</dt>
              <dd>{creator.city?.name}</dd>
              <dt className="text-zinc-500">Date of birth</dt>
              <dd>{creator.dateOfBirth}</dd>
              <dt className="text-zinc-500">Languages</dt>
              <dd>{creator.languages.join(", ")}</dd>
              <dt className="text-zinc-500">Submitted</dt>
              <dd>{formatDateTime(verification.submittedAt)}</dd>
              {data.note && (
                <>
                  <dt className="text-zinc-500">Note</dt>
                  <dd>{data.note}</dd>
                </>
              )}
            </dl>
          </Card>

          <Card>
            <SectionTitle title="Social accounts" subtitle="Leave the correction fields empty to verify at the declared values." />
            <div className="flex flex-col gap-4">
              {socialAccounts.map((a) => (
                <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 text-sm">
                  <a href={a.profileUrl} target="_blank" rel="noreferrer" className="font-medium underline">
                    {a.platform}: {a.handle}
                  </a>
                  <span className="text-zinc-600">
                    Declared {formatCount(a.followers)} followers · {a.avgLikes} likes · {a.avgComments} comments · {a.engagementRate}% ER
                  </span>
                  {pending && (
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Verified followers">
                        <Input
                          type="number"
                          min={0}
                          value={metrics[a.id]?.followers ?? ""}
                          onChange={(e) => setMetrics((m) => ({ ...m, [a.id]: { engagementRate: m[a.id]?.engagementRate ?? "", followers: e.target.value } }))}
                        />
                      </Field>
                      <Field label="Verified ER %">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={metrics[a.id]?.engagementRate ?? ""}
                          onChange={(e) => setMetrics((m) => ({ ...m, [a.id]: { followers: m[a.id]?.followers ?? "", engagementRate: e.target.value } }))}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle title="Insights proofs" subtitle="Links expire in 5 minutes. Reload to refresh." />
            <div className="grid grid-cols-2 gap-3">
              {proofs.map((p) => (
                <a key={p.url} href={p.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="Insights screenshot" className="w-full rounded-lg border border-zinc-200" />
                </a>
              ))}
            </div>
          </Card>

          {pending ? (
            <Card>
              <SectionTitle title="Checklist" />
              <div className="flex flex-col gap-2">
                {CHECKS.map((c) => (
                  <label key={c.key} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checklist[c.key]}
                      onChange={(e) => setChecklist((cl) => ({ ...cl, [c.key]: e.target.checked }))}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Button disabled={!allPass || approve.isPending} onClick={() => approve.mutate()}>
                  Approve creator
                </Button>
                <Field label="Rejection reason (sent to the creator)">
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Insights screenshot doesn't show your handle" />
                </Field>
                <Button variant="danger" disabled={reason.trim().length < 5 || reject.isPending} onClick={() => reject.mutate()}>
                  Reject with reason
                </Button>
                <ErrorText>{(approve.isError && errorMessage(approve.error)) || (reject.isError && errorMessage(reject.error))}</ErrorText>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm">
                Reviewed {verification.reviewedAt && formatDateTime(verification.reviewedAt)}
                {verification.reason && `: ${verification.reason}`}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
