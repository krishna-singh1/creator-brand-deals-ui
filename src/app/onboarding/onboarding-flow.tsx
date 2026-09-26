"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText } from "@/components/ui";
import { api, type components, type Me, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { useSetMe } from "@/lib/session";

type ConsentType = components["schemas"]["ConsentType"];

const CONSENT_LABELS: Record<ConsentType, { label: string; href: string }> = {
  TERMS: { label: "Terms of Service", href: "/legal/terms" },
  PRIVACY: { label: "Privacy Policy", href: "/legal/privacy" },
  ASCI_CODE: { label: "Creator Code (ASCI ad-disclosure guidelines)", href: "/legal/creator-code" },
  BRAND_CODE: { label: "Brand Code of Conduct", href: "/legal/brand-code" },
  MARKETING: { label: "Product updates and offers by email", href: "/legal/privacy" },
};

export function OnboardingFlow() {
  return (
    <RequireSession allowOnboarding>
      {(me) => (me.onboarding.roleSelected ? <ConsentStep me={me} /> : <RoleStep />)}
    </RequireSession>
  );
}

function RoleStep() {
  const setMe = useSetMe();
  const selectRole = useMutation({
    mutationFn: (role: "CREATOR" | "BRAND") => unwrap(api.POST("/me/role", { body: { role } })),
    onSuccess: setMe,
  });

  const options = [
    {
      role: "CREATOR" as const,
      title: "I'm a creator",
      body: "Instagram or Facebook creator with 5k–100k followers. Find paid and barter brand deals.",
    },
    {
      role: "BRAND" as const,
      title: "I'm a brand",
      body: "D2C brand looking for micro-influencers. Post campaigns and review applicants.",
    },
  ];

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Header step={1} title="How will you use BrandDeal?" subtitle="You can't change this later." />
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.role}
            type="button"
            disabled={selectRole.isPending}
            onClick={() => selectRole.mutate(o.role)}
            className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-zinc-900 disabled:opacity-60"
          >
            <span className="text-lg font-semibold">{o.title}</span>
            <span className="text-sm text-zinc-600">{o.body}</span>
          </button>
        ))}
      </div>
      <ErrorText>{selectRole.isError && errorMessage(selectRole.error)}</ErrorText>
    </div>
  );
}

function ConsentStep({ me }: { me: Me }) {
  const setMe = useSetMe();
  const pending = me.onboarding.pendingConsents ?? [];
  const [checked, setChecked] = useState<Partial<Record<ConsentType, boolean>>>({});
  const allChecked = pending.every((p) => checked[p.type]);

  const accept = useMutation({
    mutationFn: () => unwrap(api.POST("/me/consents", { body: { consents: pending } })),
    onSuccess: setMe,
  });

  return (
    <Card className="w-full max-w-lg">
      <div className="flex flex-col gap-6">
        <Header
          step={2}
          title="A few agreements"
          subtitle={
            me.role === "CREATOR"
              ? "Indian law (ASCI) requires paid collaborations to be clearly disclosed."
              : "Please review and accept to start posting campaigns."
          }
        />
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            accept.mutate();
          }}
        >
          {pending.map((p) => (
            <label key={p.type} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
                checked={!!checked[p.type]}
                onChange={(e) => setChecked((c) => ({ ...c, [p.type]: e.target.checked }))}
              />
              <span>
                I agree to the{" "}
                <Link href={CONSENT_LABELS[p.type].href} target="_blank" className="font-medium underline">
                  {CONSENT_LABELS[p.type].label}
                </Link>{" "}
                <span className="text-zinc-400">(v{p.version})</span>
              </span>
            </label>
          ))}
          <ErrorText>{accept.isError && errorMessage(accept.error)}</ErrorText>
          <Button type="submit" disabled={!allChecked || accept.isPending}>
            {accept.isPending ? "Saving…" : "Accept and continue"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function Header({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Step {step} of 2</span>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-zinc-600">{subtitle}</p>
    </div>
  );
}
