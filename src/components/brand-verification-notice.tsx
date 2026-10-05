"use client";

import Link from "next/link";

import { Card } from "@/components/ui";
import { type BrandProfile, useBrandProfile } from "@/lib/brand";

import { PRODUCT } from "@/lib/product";

const COPY: Record<string, { title: string; body: (p: BrandProfile) => string; cta?: string; href?: string }> = {
  UNSUBMITTED: {
    title: "Complete your profile to get verified",
    body: () => `${PRODUCT.name} checks every brand before its campaigns go live. Finish your profile and we'll review it.`,
    cta: "Complete profile",
  },
  PENDING: {
    title: "We're verifying your brand",
    body: () => "Usually within one business day. You can draft campaigns meanwhile; publishing and invites unlock once you're verified.",
    cta: "Draft your first campaign",
    href: "/brand/campaigns/new",
  },
  REJECTED: {
    title: "We couldn't verify your brand yet",
    body: (p) => `${p.verificationNote ?? "Please check your profile details."} Update your profile and it goes back to our team.`,
    cta: "Update profile",
  },
};

/** Shown to brands until an admin verifies them (nothing once verified). */
export function BrandVerificationNotice({ suggestDraft = false }: { suggestDraft?: boolean }) {
  const { data } = useBrandProfile();
  const found = data?.verificationStatus ? COPY[data.verificationStatus] : undefined;
  // "Draft your first campaign" only makes sense where the brand isn't already looking at a draft.
  const copy = found?.href && !suggestDraft ? { ...found, cta: undefined } : found;
  if (!data || !copy) return null;
  return (
    <Card tone={data.verificationStatus === "REJECTED" ? "warning" : "highlight"}>
      <p className="font-display text-2xl text-ink">{copy.title}</p>
      <p className="mt-1 text-sm text-zinc-700">{copy.body(data)}</p>
      {copy.cta && (
        <Link href={copy.href ?? "/brand/profile"} className="link-underline mt-3 inline-block text-sm font-medium text-ink">
          {copy.cta} →
        </Link>
      )}
    </Card>
  );
}
