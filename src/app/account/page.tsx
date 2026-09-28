"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { PasswordField } from "@/components/password-input";
import { RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Input, PageTitle, SectionTitle, Skeleton, Spinner, SuccessText, Switch } from "@/components/ui";
import { api, type Me, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { useSetMe } from "@/lib/session";

export default function AccountPage() {
  return (
    <RequireSession>
      {(me) => (
        <AppShell me={me}>
          <div className="flex max-w-2xl flex-col gap-10">
            <PageTitle eyebrow="Account" title="Sign-in & security" subtitle={`Signed in as ${me.email}`} />
            <PasswordCard key={String(me.hasPassword)} me={me} />
            <EmailNotificationsCard />
            <DeleteAccountCard />
          </div>
        </AppShell>
      )}
    </RequireSession>
  );
}

function PasswordCard({ me }: { me: Me }) {
  const setMe = useSetMe();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== next;

  const save = useMutation({
    mutationFn: () =>
      unwrap(api.PUT("/me/password", { body: { currentPassword: me.hasPassword ? current : undefined, newPassword: next } })),
    onSuccess: (updated) => {
      setCurrent("");
      setNext("");
      setConfirm("");
      setMe(updated);
    },
  });

  return (
    <Card>
      <SectionTitle
        title={me.hasPassword ? "Change password" : "Create a password"}
        subtitle={
          me.hasPassword
            ? "You'll stay signed in here; every other device will be signed out."
            : "Add a password to sign in with your email and password instead of a code."
        }
      />
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {me.hasPassword && (
          <PasswordField
            label="Current password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        )}
        <PasswordField
          label="New password"
          showStrength
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <PasswordField
          label="Confirm new password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={[...next].length < 8 || confirm !== next || save.isPending}>
            {save.isPending ? (
              <>
                <Spinner /> Saving…
              </>
            ) : me.hasPassword ? (
              "Update password"
            ) : (
              "Create password"
            )}
          </Button>
          <SuccessText>{save.isSuccess && "Password saved. Other devices have been signed out."}</SuccessText>
          <ErrorText>{(mismatch && "Passwords don't match.") || (save.isError && errorMessage(save.error))}</ErrorText>
        </div>
      </form>
    </Card>
  );
}

const PREFERENCES_KEY = ["notifications", "preferences"];

/** Activity emails on/off (D-35). In-app notifications keep coming; sign-in and security emails always go out. */
function EmailNotificationsCard() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => unwrap(api.GET("/notifications/preferences")),
  });
  const save = useMutation({
    mutationFn: (emailEnabled: boolean) => unwrap(api.PUT("/notifications/preferences", { body: { emailEnabled } })),
    onSuccess: (updated) => queryClient.setQueryData(PREFERENCES_KEY, updated),
  });
  const enabled = save.isPending ? save.variables : data?.emailEnabled;

  return (
    <Card>
      <SectionTitle
        title="Email notifications"
        subtitle="Emails about applications, deals, verification, campaign updates, reminders and daily digests. You'll still see everything in the notification bell. Sign-in codes and security alerts are always sent."
      />
      <div className="flex items-center justify-between gap-6">
        <span className="text-sm text-zinc-700">
          {enabled === undefined ? "Loading…" : enabled ? "Emails are on" : "Emails are off"}
        </span>
        {isPending ? (
          <Skeleton className="h-7 w-12 rounded-full" />
        ) : (
          <Switch
            label="Email notifications"
            checked={enabled ?? true}
            disabled={save.isPending || data === undefined}
            onChange={(next) => save.mutate(next)}
          />
        )}
      </div>
      <ErrorText>{save.isError && errorMessage(save.error)}</ErrorText>
    </Card>
  );
}

/** DPDP deletion. The API refuses while deals are active and explains why; the message is shown as-is. */
function DeleteAccountCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState("");
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE("/me")),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login?deleted=1");
    },
  });
  return (
    <Card tone="danger">
      <SectionTitle
        title="Delete account"
        subtitle="Your profile, contact details, photos and verification documents are erased. Completed deals stay on record for the other party, shown under a deleted name. This can't be undone."
      />
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          remove.mutate();
        }}
      >
        <label className="flex flex-col gap-2 text-sm text-zinc-700">
          Type DELETE to confirm
          <Input className="max-w-xs" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </label>
        <ErrorText>{remove.isError && errorMessage(remove.error)}</ErrorText>
        <Button type="submit" variant="danger" className="self-start" disabled={confirm !== "DELETE" || remove.isPending}>
          {remove.isPending ? "Deleting…" : "Delete my account"}
        </Button>
      </form>
    </Card>
  );
}
