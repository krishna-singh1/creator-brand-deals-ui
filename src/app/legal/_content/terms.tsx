import Link from "next/link";

import { COMPANY, POLICY_VERSIONS } from "@/lib/legal";

import { type LegalDoc, List, P, Strong } from "./types";

export const terms: LegalDoc = {
  title: "Terms of Service",
  summary: `${COMPANY.brand} connects Indian brands with verified Instagram and Facebook creators for paid, barter and mixed collaborations. These terms explain what we do, what we don't do (we never hold or move your money), and what we expect from everyone who uses the platform.`,
  version: POLICY_VERSIONS.TERMS,
  sections: [
    {
      id: "who-we-are",
      heading: "1. Who we are and what these terms cover",
      body: (
        <>
          <P>
            {COMPANY.brand} is operated by {COMPANY.legalName}, {COMPANY.registeredAddress} (&ldquo;{COMPANY.brand}&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;). These terms apply to the website, the app and every related service (together, the
            &ldquo;platform&rdquo;). By creating an account or using the platform you agree to them, to our{" "}
            <Link href="/legal/privacy" className="link-underline text-ink">Privacy Policy</Link>, and to the{" "}
            <Link href="/legal/creator-code" className="link-underline text-ink">Creator Code</Link> or{" "}
            <Link href="/legal/brand-code" className="link-underline text-ink">Brand Code</Link> that applies to you.
          </P>
          <P>
            {COMPANY.brand} is an intermediary: we provide the marketplace, tools and records. The agreement for each collaboration is
            between the brand and the creator.
          </P>
        </>
      ),
    },
    {
      id: "eligibility",
      heading: "2. Who can use the platform",
      body: (
        <List
          items={[
            "You must be at least 18 years old and able to enter a binding contract under Indian law.",
            "Creators must run the social accounts they list and must be based in India. Brands must be businesses (or people acting for a business) that sell products or services lawfully in India.",
            "One person or business may hold one account per role. You're responsible for everything done through your account, so keep your password and email secure and tell us straight away if you suspect misuse.",
            "We may refuse, pause or close accounts that break these terms, give false information, or put other users at risk.",
          ]}
        />
      ),
    },
    {
      id: "verification",
      heading: "3. Verification and accurate information",
      body: (
        <>
          <P>
            Creators are reviewed before they can apply to campaigns, and brands are reviewed before they can publish campaigns or invite
            creators. Creators verify either by uploading Insights screenshots that our team checks, or by connecting a professional
            Instagram account so we can read their numbers directly.
          </P>
          <List
            items={[
              "Everything you enter must be true and current: identity, contact details, follower counts, engagement, audience, brand details and GSTIN.",
              "Inflating numbers (for example with bought followers, likes or comments) or editing screenshots is a serious breach and leads to suspension.",
              "Verification means we checked the information available to us at that time. It is not a guarantee of performance, reach or sales.",
            ]}
          />
        </>
      ),
    },
    {
      id: "how-deals-work",
      heading: "4. Campaigns, applications and deals",
      body: (
        <List
          items={[
            "Brands publish campaigns with a brief: deliverables, dates, compensation (cash, product, or both), guidelines and any usage rights. Creators apply with a pitch and a quote, or accept an invite.",
            "When a brand approves an application, a deal is created on the terms of the brief and the agreed price. That is a contract between the brand and the creator; both must honour it.",
            "Once a deal exists, both sides can see each other's contact details and message each other on the platform. Use them only for that deal.",
            "Creators submit the live post links (and screenshots where asked). Brands review them and either approve or request reasonable changes that stay within the brief.",
            "Either side may cancel a deal with a reason before any content is submitted. After that, disagreements go through a dispute (section 7).",
            "Suggested prices on the platform are estimates based on public benchmarks and your numbers. They are guidance, not an offer or a promise.",
          ]}
        />
      ),
    },
    {
      id: "payments",
      heading: "5. Payments (we don't hold your money)",
      body: (
        <>
          <P>
            <Strong>Brands pay creators directly</Strong> (for example by UPI or bank transfer) outside the platform. {COMPANY.brand} is
            not a party to that payment, does not hold funds, and is not responsible for a payment that is late, wrong or missing. The
            platform records what both sides report: the brand marks a payment as made, and the creator confirms receipt.
          </P>
          <List
            items={[
              "Brands must pay the agreed amount within the time agreed in the deal (or, if none was agreed, within 15 days of approving the content).",
              "Creators are responsible for their own taxes (income tax and GST where applicable). Brands are responsible for any tax deduction (such as TDS) that applies to them and for giving the creator the related certificate.",
              "For barter deals, the product is the compensation. Brands ship what the brief describes; creators confirm when it arrives.",
              "Payment reliability and completed deals are shown on profiles, so late or missing payments affect a brand's reputation on the platform.",
            ]}
          />
        </>
      ),
    },
    {
      id: "content",
      heading: "6. Content and usage rights",
      body: (
        <List
          items={[
            "Creators own the content they create. The brand gets the usage rights written in the campaign brief.",
            "If the brief says nothing about usage, the brand may share or link the live post on its own unpaid social channels with credit to the creator. Any other use (paid ads, whitelisting, websites, print, edits) needs the creator's written agreement, which the parties can record in the deal messages.",
            "All sponsored content must be clearly disclosed as advertising as described in the Creator Code. Brands must never ask creators to hide or weaken a disclosure.",
            `You give ${COMPANY.brand} a limited licence to host and show what you upload (profile photos, logos, portfolio links, briefs, screenshots) so the platform can work. We don't use your content in our own marketing without asking you.`,
            "Don't upload anything you don't have the right to share, or anything unlawful, hateful, sexual, misleading or that infringes someone else's rights.",
          ]}
        />
      ),
    },
    {
      id: "disputes",
      heading: "7. Disputes between users",
      body: (
        <>
          <P>
            If something goes wrong in a deal, either side can raise a dispute on the platform. The deal pauses, and our team reviews
            the deal history, messages and submissions, then resumes, completes or cancels the deal with a note to both sides.
          </P>
          <P>
            Our decision on the platform record is final for the platform. It doesn&apos;t stop either side from using their legal
            rights against the other, and we don&apos;t guarantee any payment or delivery.
          </P>
        </>
      ),
    },
    {
      id: "acceptable-use",
      heading: "8. What's not allowed",
      body: (
        <List
          items={[
            "Fake accounts, impersonation, or listing social accounts you don't control.",
            "Buying or selling followers, likes, comments or reviews, or asking others to do so.",
            "Using contact details or messages for spam, harassment, or anything other than the deal.",
            "Campaigns for products that are illegal, unsafe, or restricted without the licences needed (for example alcohol, tobacco, gambling, prescription drugs or unregistered financial products).",
            "Scraping, reverse engineering, overloading or trying to break the security of the platform.",
          ]}
        />
      ),
    },
    {
      id: "fees",
      heading: "9. Fees",
      body: (
        <P>
          The platform is free during the beta. If we introduce paid plans or fees, we will tell you at least 30 days in advance and you
          can choose whether to continue. Nothing is charged without your explicit agreement.
        </P>
      ),
    },
    {
      id: "suspension",
      heading: "10. Suspension and closing your account",
      body: (
        <List
          items={[
            "We may suspend or close an account that breaks these terms or the codes, with a reason. Where we can, we warn first. You can reply to the notice or contact the Grievance Officer.",
            "You can delete your account at any time from Account & security, once no deal is still in progress. See Deleting your data for what is erased and what stays on record.",
            "Obligations from deals already agreed (payment, delivery, usage rights) continue after an account is closed.",
          ]}
        />
      ),
    },
    {
      id: "liability",
      heading: "11. Our responsibility",
      body: (
        <List
          items={[
            "We provide the platform \"as is\". We work to keep it available and accurate, but we don't promise it will always be available, error-free, or that any campaign will get results.",
            "We are not responsible for what users do: the content they post, the products they sell, or payments and deliveries between them.",
            "To the extent the law allows, our total liability to you for any claim is limited to the fees you paid us in the 12 months before the claim, or ₹10,000 if you paid nothing. We are not liable for indirect losses such as lost profits or reputation.",
            "Nothing in these terms limits a liability that Indian law does not allow us to limit.",
          ]}
        />
      ),
    },
    {
      id: "changes",
      heading: "12. Changes to these terms",
      body: (
        <P>
          When we change these terms in a way that matters, we publish the new version here, tell you by email or in the app, and ask
          you to accept it before you continue. Minor fixes (typos, clearer wording) don&apos;t change the version.
        </P>
      ),
    },
    {
      id: "law",
      heading: "13. Governing law and contact",
      body: (
        <>
          <P>
            These terms are governed by the laws of India. Courts in {COMPANY.jurisdictionCity} have exclusive jurisdiction, subject to
            any right you have to go to a consumer forum where you live.
          </P>
          <P>
            Questions: {COMPANY.supportEmail}. Complaints: our{" "}
            <Link href="/legal/grievance" className="link-underline text-ink">Grievance Officer</Link>.
          </P>
        </>
      ),
    },
  ],
};
