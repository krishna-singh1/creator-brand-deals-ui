import type { Metadata } from "next";

import { ClosingCta, FeatureGrid, PageHero, PlainNote, SectionHeading, StepList, type Feature, type Step } from "../marketing-bits";

export const metadata: Metadata = {
  title: "For creators — BrandDeal",
  description:
    "Get verified once, then choose the brand collaborations that fit. Suggested pricing drawn from your real engagement, cash or barter, and every agreed amount tracked to payment.",
};

const STEPS: readonly Step[] = [
  ["Present your craft", "Build a profile that shows your niche, audience and portfolio at their best, and set a rate card once."],
  ["Get verified", "Share your Instagram Insights once. Our team reviews it by hand — we aim to come back within 48 hours — and the badge then speaks for you."],
  [
    "Choose your collaborations",
    "Apply only to briefs that fit. Quote against a suggested range, agree the amount in writing, and keep the deal moving from one screen.",
  ],
];

const FEATURES: readonly Feature[] = [
  {
    title: "A price with reasoning",
    body: "Every brief shows a suggested range built from your follower tier and real engagement, so you can quote with something behind the number instead of guessing.",
    icon: "M4 19h16M7 16V9m5 7V5m5 11v-4",
  },
  {
    title: "Cash, product, or both",
    body: "Take the shape of collaboration that actually suits you. Barter is treated as a real arrangement here, not a lesser one.",
    icon: "M4 7h16v10H4zM4 11h16M9 15h2",
  },
  {
    title: "Earnings in one place",
    body: "Every agreed amount and confirmed payment, grouped by month and exportable as CSV when you need to show your numbers to someone else.",
    icon: "M7 5h9M7 9h9M13 5c2.2 0 3.5 1.3 3.5 3S15.2 11 13 11H7l6 8",
  },
  {
    title: "Reliability that travels",
    body: "Delivering on time and finishing deals is shown to brands on your profile, so consistent work compounds into better briefs.",
    icon: "M12 3l7 3v5c0 4.2-2.9 7.6-7 8.8-4.1-1.2-7-4.6-7-8.8V6z",
  },
];

export default function CreatorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For creators"
        title={
          <>
            Your work, <span className="italic text-gold-deep">valued properly.</span>
          </>
        }
        lede="BrandDeal is an invite-only marketplace for India's verified micro-creators. Get reviewed once, then pick the collaborations worth your name — with pricing that starts from your real numbers."
        ctaLabel="Apply as a creator"
        ctaName="creators_hero_apply"
      />

      <section className="border-y border-zinc-200/70 bg-white/60 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeading eyebrow="How it works" title="Three steps, then the work" />
          <StepList steps={STEPS} />
        </div>
      </section>

      <section className="py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="What you get"
            title={
              <>
                Built around <span className="italic text-gold-deep">your side</span> of the deal
              </>
            }
          />
          <FeatureGrid features={FEATURES} />
        </div>
      </section>

      <section className="pb-28">
        <div className="px-6">
          <PlainNote title="How payment actually works">
            <p>
              BrandDeal does not hold your money. You agree an amount with the brand and they pay you directly — then both of you
              confirm it here, so there is a dated record of what was agreed and what was received.
            </p>
            <p>
              That is deliberate while we are small: it keeps you in a direct relationship with the brand. We take no commission
              during the beta.
            </p>
          </PlainNote>
        </div>
      </section>

      <ClosingCta
        title={
          <>
            Your next collaboration
            <br />
            <span className="italic text-gold-deep">deserves better.</span>
          </>
        }
        lede="Verification is by hand and access is invite-only for now. It takes a minute to put your name forward."
        ctaLabel="Begin with your email"
        ctaName="creators_closing_begin"
      />
    </>
  );
}
