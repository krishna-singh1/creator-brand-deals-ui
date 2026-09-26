"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Field, SectionTitle, StatusBadge, Textarea } from "@/components/ui";
import { api, ApiRequestError, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, humanizeMissing } from "@/lib/format";
import { ME_KEY } from "@/lib/session";
import { uploadFile } from "@/lib/upload";

export default function VerificationPage() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <Verification />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Verification() {
  const { data: profile } = useQuery({ queryKey: ["creator", "profile"], queryFn: () => unwrap(api.GET("/creator/profile")) });
  const latest = useQuery({
    queryKey: ["creator", "verification"],
    queryFn: async () => {
      try {
        return await unwrap(api.GET("/creator/verification"));
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 404) return null;
        throw e;
      }
    },
  });
  if (!profile || latest.isPending) return <ContentSkeleton />;

  const request = latest.data;
  const canSubmit = profile.status === "DRAFT" || profile.status === "REJECTED";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-4xl tracking-tight text-ink">Verification</h1>
        <StatusBadge status={profile.status} />
      </div>

      {request && (
        <Card>
          <SectionTitle title="Latest request" />
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
            <dt className="text-zinc-500">Status</dt>
            <dd>
              <StatusBadge status={request.status} />
            </dd>
            <dt className="text-zinc-500">Submitted</dt>
            <dd>{formatDateTime(request.submittedAt)}</dd>
            {request.reviewedAt && (
              <>
                <dt className="text-zinc-500">Reviewed</dt>
                <dd>{formatDateTime(request.reviewedAt)}</dd>
              </>
            )}
            {request.reason && (
              <>
                <dt className="text-zinc-500">Feedback</dt>
                <dd className="text-red-700">{request.reason}</dd>
              </>
            )}
          </dl>
          {request.status === "PENDING" && (
            <p className="mt-3 text-sm text-zinc-600">Our team usually reviews within 48 hours. We&apos;ll email you.</p>
          )}
        </Card>
      )}

      {profile.status === "VERIFIED" && (
        <Card>
          <p className="text-sm">You&apos;re verified. Brands can now see your profile and you can apply to campaigns.</p>
        </Card>
      )}

      {canSubmit &&
        ((profile.missingFields ?? []).length > 0 ? (
          <Card>
            <p className="text-sm">
              Complete your profile first: add your {humanizeMissing(profile.missingFields ?? [])}.{" "}
              <Link href="/creator/profile" className="link-underline font-medium text-ink">
                Go to profile
              </Link>
            </p>
          </Card>
        ) : (
          <SubmitForm />
        ))}
    </div>
  );
}

function SubmitForm() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const proofFileIds = [];
      for (const file of files) proofFileIds.push(await uploadFile("VERIFICATION_PROOF", file));
      return unwrap(api.POST("/creator/verification", { body: { proofFileIds, note: note || undefined } }));
    },
    onSuccess: () =>
      Promise.all(
        [["creator", "verification"], ["creator", "profile"], ["creator", "dashboard"], ME_KEY].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  return (
    <Card>
      <SectionTitle
        title="Submit for verification"
        subtitle="Upload 1–5 screenshots of your Instagram/Facebook Insights: the account overview (reach, followers) and audience (top cities, age, gender). Your handle must be visible."
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        <Field label="Insights screenshots">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            className="text-sm"
          />
        </Field>
        {files.length > 0 && <p className="text-sm text-zinc-600">{files.map((f) => f.name).join(", ")}</p>}
        <Field label="Note for our team (optional)">
          <Textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={files.length === 0 || submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit for review"}
          </Button>
          <ErrorText>{submit.isError && errorMessage(submit.error)}</ErrorText>
        </div>
      </form>
    </Card>
  );
}
