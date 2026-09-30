import type { Metadata } from "next";

import { PRODUCT } from "@/lib/product";
import { ClosingCta, FeatureGrid, PageHero, PlainNote, SectionHeading, StepList, type Feature, type Step } from "../marketing-bits";

export const metadata: Metadata = {
  title: `For brands — ${PRODUCT.name}`,
  description:
    "Brief once and hear from hand-verified micro-creators across India. Suggested budgets before you publish, match scores on every applicant, and one timeline from shipping to payment.",
};

const STEPS: readonly Step[] = [
  [
    "Brief with intent",
    "Describe the product, the deliverables and the creators you want — down to niche, city and follower range — and see a suggested budget before you publish.",
  ],
  ["Receive considered applications", "Verified creators apply with a pitch and a quote shown beside our suggested range, with a match score and their delivery record."],
  ["Approve and collaborate", "Approve in a click. Contacts, deliverables, approvals and payment confirmation move into a single deal view."],
];

const FEATURES: readonly Feature[] = [
  {
    title: "Hand-verified creators only",
    body: "Every creator is reviewed against their own Instagram Insights before a brand ever sees them. Nobody buys their way into the pool.",
    icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
  },
  {
    title: "Budgets suggested up front",
    body: "The same pricing engine that guides creator quotes gives you a range while you are still writing the brief, so the first number is not a shot in the dark.",
    icon: "M4 19h16M7 16V9m5 7V5m5 11v-4",
  },
  {
    title: "Or go and find them",
    body: "Search verified creators by niche, city and audience, read the full profile, and invite the ones you want directly to a campaign.",
    icon: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20",
  },
  {
    title: "One timeline per deal",
    body: "Product shipped and received, content submitted with screenshots, changes requested, payment marked and confirmed, ratings at the end. Nothing lost in DMs.",
    icon: "M5 12l4 4L19 6",
  },
];

export default function BrandsPage() {
  return (
    <>
      <PageHero
        eyebrow="For brands"
        title={
          <>
            Briefs that attract the <span className="italic text-gold-deep">right voices.</span>
          </>
        }
        lede={`${PRODUCT.name} is a curated marketplace for India's D2C labels. Write one brief, hear from verified micro-creators who actually fit it, and keep every collaboration in one place.`}
        ctaLabel="Request brand access"
        ctaName="brands_hero_request"
      />

      <section className="border-y border-zinc-200/70 bg-white/60 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeading eyebrow="How it works" title="From brief to published post" />
          <StepList steps={STEPS} />
        </div>
      </section>

      <section className="py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="What you get"
            title={
              <>
                The rigour of an agency, <span className="italic text-gold-deep">without the retainer</span>
              </>
            }
          />
          <FeatureGrid features={FEATURES} />
        </div>
      </section>

      <section className="pb-28">
        <div className="px-6">
          <PlainNote title="Before your first campaign">
            <p>
              Brands are verified by our team before a campaign can go live. You can build your profile and draft a brief straight
              away; publishing opens once that review is done.
            </p>
            <p>
              Payment happens directly between you and the creator — we record the agreed amount and both confirmations rather than
              holding funds. {PRODUCT.name} is free while we are in beta.
            </p>
          </PlainNote>
        </div>
      </section>

      <ClosingCta
        title={
          <>
            Better briefs,
            <br />
            <span className="italic text-gold-deep">better collaborations.</span>
          </>
        }
        lede="Access is invite-only while we onboard our first D2C brands by hand. Tell us who you are and we will be in touch."
        ctaLabel="Begin with your email"
        ctaName="brands_closing_begin"
      />
    </>
  );
}
