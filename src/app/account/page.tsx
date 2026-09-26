"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { PasswordField } from "@/components/password-input";
import { RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, PageTitle, SectionTitle, Spinner, SuccessText } from "@/components/ui";
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
