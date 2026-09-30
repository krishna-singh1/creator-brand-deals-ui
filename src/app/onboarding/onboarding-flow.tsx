"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { PasswordField } from "@/components/password-input";
import { RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Spinner } from "@/components/ui";
import { api, type components, type Me, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { useSetMe } from "@/lib/session";

import { PRODUCT } from "@/lib/product";

type ConsentType = components["schemas"]["ConsentType"];

const CONSENT_LABELS: Record<ConsentType, { label: string; href: string }> = {
  TERMS: { label: "Terms of Service", href: "/legal/terms" },
  PRIVACY: { label: "Privacy Policy", href: "/legal/privacy" },
  ASCI_CODE: { label: "Creator Code (ASCI ad-disclosure guidelines)", href: "/legal/creator-code" },
  BRAND_CODE: { label: "Brand Code of Conduct", href: "/legal/brand-code" },
  MARKETING: { label: "Product updates and offers by email", href: "/legal/privacy" },
};

export function OnboardingFlow() {
  return <RequireSession allowOnboarding>{(me) => <Steps me={me} />}</RequireSession>;
}

/** Steps: create password (only when needed) → role → agreements. The step count is fixed on first render. */
function Steps({ me }: { me: Me }) {
  const [initial] = useState(() => ({
    password: me.onboarding.passwordRequired,
    role: !me.onboarding.roleSelected,
  }));
  const roleStep = (initial.password ? 1 : 0) + 1;
  const total = roleStep + (initial.role ? 1 : 0);
  if (me.onboarding.passwordRequired) return <PasswordStep total={total} />;
  if (!me.onboarding.roleSelected) return <RoleStep step={roleStep} total={total} />;
  return <ConsentStep me={me} step={total} total={total} />;
}

function PasswordStep({ total }: { total: number }) {
  const setMe = useSetMe();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;
  const save = useMutation({
    mutationFn: () => unwrap(api.PUT("/me/password", { body: { newPassword: password } })),
    onSuccess: setMe,
  });

  return (
    <Card className="w-full max-w-lg animate-fade-up">
      <div className="flex flex-col gap-8">
        <Header
          step={1}
          total={total}
          title="Create your password"
          subtitle="Your email is verified. From now on, sign in with your email and this password; no code needed."
        />
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <PasswordField
            label="Password"
            showStrength
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordField
            label="Confirm password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <p className="text-xs leading-relaxed text-zinc-500">
            At least 8 characters. A short phrase like <span className="italic">monsoon chai at six</span> is strong and
            easy to remember.
          </p>
          <ErrorText>{(mismatch && "Passwords don't match.") || (save.isError && errorMessage(save.error))}</ErrorText>
          <Button type="submit" className="h-12" disabled={[...password].length < 8 || confirm !== password || save.isPending}>
            {save.isPending ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              "Save password and continue"
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function RoleStep({ step, total }: { step: number; total: number }) {
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
    <div className="flex w-full max-w-2xl animate-fade-up flex-col gap-10">
      <Header step={step} total={total} title={`How will you use ${PRODUCT.name}?`} subtitle="Choose the side of the table you sit on. This can't be changed later." />
      <div className="grid gap-5 sm:grid-cols-2">
        {options.map((o, i) => (
          <button
            key={o.role}
            type="button"
            disabled={selectRole.isPending}
            onClick={() => selectRole.mutate(o.role)}
            style={{ animationDelay: `${150 + i * 120}ms` }}
            className="group relative flex animate-fade-up flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white/80 p-8 text-left shadow-soft transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-lift disabled:opacity-60"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold-deep to-gold-soft transition-transform duration-500 group-hover:scale-x-100" />
            <span className="font-display text-sm italic text-gold">{o.role === "CREATOR" ? "Creator" : "Brand"}</span>
            <span className="font-display text-2xl tracking-tight text-ink">{o.title}</span>
            <span className="text-sm leading-relaxed text-zinc-600">{o.body}</span>
            <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-ink">
              Continue
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </button>
        ))}
      </div>
      <ErrorText>{selectRole.isError && errorMessage(selectRole.error)}</ErrorText>
    </div>
  );
}

function ConsentStep({ me, step, total }: { me: Me; step: number; total: number }) {
  const setMe = useSetMe();
  const pending = me.onboarding.pendingConsents ?? [];
  const [checked, setChecked] = useState<Partial<Record<ConsentType, boolean>>>({});
  const allChecked = pending.every((p) => checked[p.type]);

  const accept = useMutation({
    mutationFn: () => unwrap(api.POST("/me/consents", { body: { consents: pending } })),
    onSuccess: setMe,
  });

  return (
    <Card className="w-full max-w-lg animate-fade-up">
      <div className="flex flex-col gap-8">
        <Header
          step={step}
          total={total}
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
            <label
              key={p.type}
              className="flex cursor-pointer items-start gap-4 rounded-2xl border border-zinc-200 bg-ivory/60 p-4 text-sm leading-relaxed transition-all duration-300 hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-gold/5"
            >
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[#121212]"
                checked={!!checked[p.type]}
                onChange={(e) => setChecked((c) => ({ ...c, [p.type]: e.target.checked }))}
              />
              <span>
                I agree to the{" "}
                <Link href={CONSENT_LABELS[p.type].href} target="_blank" className="link-underline font-medium text-ink">
                  {CONSENT_LABELS[p.type].label}
                </Link>{" "}
                <span className="text-zinc-400">(v{p.version})</span>
              </span>
            </label>
          ))}
          <ErrorText>{accept.isError && errorMessage(accept.error)}</ErrorText>
          <Button type="submit" className="h-12" disabled={!allChecked || accept.isPending}>
            {accept.isPending ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              "Accept and continue"
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function Header({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.24em] text-gold-deep">Step {step} of {total}</span>
        <span className="h-px w-24 overflow-hidden bg-zinc-200">
          <span
            className="block h-full bg-gold transition-[width] duration-700 ease-[var(--ease-premium)]"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </span>
      </div>
      <h1 className="font-display text-4xl leading-tight tracking-tight text-ink">{title}</h1>
      <p className="text-[15px] leading-relaxed text-zinc-600">{subtitle}</p>
    </div>
  );
}
