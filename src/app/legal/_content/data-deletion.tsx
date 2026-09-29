import Link from "next/link";

import { COMPANY } from "@/lib/legal";

import { type LegalDoc, List, P } from "./types";

export const dataDeletion: LegalDoc = {
  title: "Deleting your data",
  summary: "How to delete your account and what happens to your data, including anything read from Instagram.",
  version: "2026-09-29",
  sections: [
    {
      id: "delete",
      heading: "1. Delete your account",
      body: (
        <>
          <P>
            Sign in, open your profile menu, go to <strong className="font-medium text-ink">Account &amp; security</strong> and choose{" "}
            <strong className="font-medium text-ink">Delete account</strong>. If a deal is still in progress you&apos;ll be asked to
            complete or cancel it first, so the other side isn&apos;t left without a record.
          </P>
        </>
      ),
    },
    {
      id: "what-happens",
      heading: "2. What is erased",
      body: (
        <List
          items={[
            "Your profile, contact details, photos, portfolio, rate card, verification proofs and notifications are erased or anonymised straight away.",
            "Your social handles are replaced with placeholders and the link to any connected Instagram account is removed.",
            "Completed deals stay on record for the other party, shown under a deleted name, because they need them for their own records.",
            "Records the law requires us to keep are kept only as long as required, then deleted.",
          ]}
        />
      ),
    },
    {
      id: "instagram",
      heading: "3. Instagram data",
      body: (
        <P>
          When you verify by connecting Instagram, we read your follower count and the likes and comments on your recent posts once. We
          don&apos;t keep access to your Instagram account and store only those numbers. Deleting your account removes them from your
          profile and removes the link to your Instagram account. You can also remove {COMPANY.brand} from Instagram under Settings →
          Apps and websites.
        </P>
      ),
    },
    {
      id: "cant-sign-in",
      heading: "4. If you can't sign in",
      body: (
        <P>
          Email our <Link href="/legal/grievance" className="link-underline text-ink">Grievance Officer</Link> at{" "}
          {COMPANY.grievanceOfficer.email} from the address on your account. We confirm it&apos;s you and delete the account within 30
          days.
        </P>
      ),
    },
  ],
};
