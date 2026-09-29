import { COMPANY, POLICY_VERSIONS } from "@/lib/legal";

import { type LegalDoc, List, P } from "./types";

export const brandCode: LegalDoc = {
  title: "Brand Code of Conduct",
  summary: `What we expect from brands on ${COMPANY.brand}: clear briefs, lawful products, honest advertising, and paying creators what you agreed, on time.`,
  version: POLICY_VERSIONS.BRAND_CODE,
  sections: [
    {
      id: "briefs",
      heading: "1. Clear, fair briefs",
      body: (
        <List
          items={[
            "Describe the deliverables, dates, compensation and product value accurately. Creators quote against what you publish.",
            "State any usage rights you need (paid ads, whitelisting, reposting on your website). Anything not in the brief needs the creator's written agreement.",
            "Change a live brief only within what the platform allows, and never to reduce what you pay or increase what you ask for after creators applied.",
            "Keep requests for changes to a submission reasonable and within the brief.",
          ]}
        />
      ),
    },
    {
      id: "products",
      heading: "2. Lawful products and honest claims",
      body: (
        <List
          items={[
            "Only promote products and services you may lawfully sell in India, with the licences and registrations they need.",
            "Don't ask creators to make claims you can't substantiate (for example medical, “clinically proven” or “No. 1” claims) and give them the evidence when they ask.",
            "Never ask a creator to hide, shrink or remove the ad disclosure, or to post a fake or undisclosed review.",
            "Campaigns for alcohol, tobacco, betting, prescription drugs, weapons or unregistered financial products aren't allowed.",
          ]}
        />
      ),
    },
    {
      id: "paying",
      heading: "3. Paying creators",
      body: (
        <>
          <P>
            Payments happen directly between you and the creator; {COMPANY.brand} never holds the money. That makes paying on time part
            of your reputation here: your payment reliability is shown to creators.
          </P>
          <List
            items={[
              "Pay the agreed amount by the agreed date, or within 15 days of approving the content if no date was agreed.",
              "Record the payment on the deal (amount, date, method and reference) as soon as you make it.",
              "Deduct tax only where the law requires it, and send the creator the certificate.",
              "For barter deals, ship the product described in the brief in good condition, with tracking where possible.",
            ]}
          />
        </>
      ),
    },
    {
      id: "respect",
      heading: "4. Respect for creators",
      body: (
        <List
          items={[
            "Use a creator's contact details only for the deal you have with them. Don't add them to marketing lists or share them.",
            "Be respectful in messages. Harassment, discrimination or pressure to do something outside the brief isn't tolerated.",
            "Don't approach creators to move a deal off the platform to avoid its records or reviews.",
            "Rate creators honestly and only on the deal itself.",
          ]}
        />
      ),
    },
    {
      id: "breaches",
      heading: "5. If this code is broken",
      body: (
        <P>
          We may unpublish campaigns, pause invites, remove brand verification or suspend the account, depending on how serious the
          problem is and whether it repeats.
        </P>
      ),
    },
  ],
};
