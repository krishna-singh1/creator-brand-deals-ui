import Link from "next/link";

import { COMPANY, POLICY_VERSIONS } from "@/lib/legal";

import { type LegalDoc, List, P, Strong } from "./types";

export const privacy: LegalDoc = {
  title: "Privacy Policy",
  summary: `We collect what's needed to verify creators and brands, match them and run their deals. We don't sell your data, we don't show ads, and you can see, correct or delete your data at any time. This policy is written for India's Digital Personal Data Protection Act, 2023 (DPDP Act).`,
  version: POLICY_VERSIONS.PRIVACY,
  sections: [
    {
      id: "controller",
      heading: "1. Who is responsible for your data",
      body: (
        <P>
          {COMPANY.legalName}, {COMPANY.registeredAddress}, runs {COMPANY.brand} and decides how your personal data is used (the
          &ldquo;Data Fiduciary&rdquo; under the DPDP Act). Questions or requests: {COMPANY.grievanceOfficer.email} (see{" "}
          <Link href="/legal/grievance" className="link-underline text-ink">Grievance Officer</Link>).
        </P>
      ),
    },
    {
      id: "what-we-collect",
      heading: "2. What we collect",
      body: (
        <List
          items={[
            <><Strong>Account:</Strong> email address, password (stored only as a one-way hash), Google account ID if you sign in with Google, your role, and the policy versions you accepted with the time and IP address.</>,
            <><Strong>Creator profile:</Strong> display name, full name, date of birth, gender (optional), city, languages, niches, bio, photo, phone number and contact email, self-declared audience details, portfolio links and your rate card.</>,
            <><Strong>Social accounts:</Strong> handles or page links, follower counts, average likes, comments and views, and engagement rate, whether entered by you, checked by our team or read from Instagram.</>,
            <><Strong>Verification proofs:</Strong> the Insights screenshots you upload. They&apos;re kept in private storage and only our reviewers can open them, through links that expire after a few minutes.</>,
            <><Strong>Instagram (if you connect it):</Strong> your Instagram user ID, username, account type, follower and following counts, number of posts, and the likes and comments on your recent posts. We read them once when you verify. We don&apos;t keep the access token, can&apos;t post for you, and don&apos;t read your messages.</>,
            <><Strong>Brand profile:</Strong> brand name, logo, website, category, contact person, phone and email, and GSTIN if you add it.</>,
            <><Strong>Activity:</Strong> campaigns, applications, deals, deal messages, submissions and screenshots, payment records you report, ratings, disputes and notifications.</>,
            <><Strong>Technical:</Strong> IP address and browser details for sign-in security, rate limiting and fraud prevention, and error reports. When something breaks in your browser, the error report can include a short replay of the steps that led to it, with every text, input and image masked, so it shows clicks and page changes, not what you typed or saw. Error reports carry your account ID, never your email or name.</>,
          ]}
        />
      ),
    },
    {
      id: "why",
      heading: "3. Why we use it",
      body: (
        <List
          items={[
            "To create and secure your account (sign-in codes, passwords, session cookies).",
            "To verify creators and brands, and to keep the marketplace free of fake accounts and inflated numbers.",
            "To match creators with campaigns and to suggest fair prices.",
            "To run deals: sharing contact details between the two parties of a deal, messages, reminders and records.",
            "To send service emails and in-app notifications. You can turn activity emails off in Account & security; sign-in and security emails always go out.",
            "To handle disputes, complaints and misuse, and to meet legal duties (for example tax, law-enforcement requests or court orders).",
            "To improve the product using aggregated, non-identifying usage statistics.",
          ]}
        />
      ),
    },
    {
      id: "legal-basis",
      heading: "4. Consent and your choices",
      body: (
        <>
          <P>
            We process your data with the consent you give when you create an account and accept this policy, and where the DPDP Act
            allows it without consent (for example to comply with the law or to respond to an emergency). Marketing emails are separate
            and optional.
          </P>
          <P>
            You can withdraw consent at any time by deleting your account (or, for marketing emails, by turning them off). Withdrawing
            doesn&apos;t affect what was done before, and we keep what the law requires us to keep (section 7).
          </P>
        </>
      ),
    },
    {
      id: "who-sees",
      heading: "5. Who can see your data",
      body: (
        <List
          items={[
            "Brands see a creator's public profile: display name, photo, niches, city, languages, social handles, numbers, portfolio, ratings and reliability. Never the creator's legal name, date of birth, phone or email before a deal.",
            "After a deal is created, the brand and the creator see each other's contact details and the deal's messages and records.",
            `Our team sees what it needs to verify accounts, resolve disputes and keep the platform safe. Every admin action is logged.`,
            "Service providers that run parts of the platform for us, under contracts that limit use to our instructions: hosting and database (Railway or Render, Neon), file storage (Cloudflare R2), email delivery (Brevo), sign-in with Google, Instagram (Meta) when you connect it, error monitoring (Sentry), uptime monitoring (Better Stack, which only checks that our pages respond) and product analytics tools.",
            "Authorities, when the law requires it.",
            "We never sell your data or share it for advertising.",
          ]}
        />
      ),
    },
    {
      id: "where",
      heading: "6. Where it's stored and how it's protected",
      body: (
        <>
          <P>
            Some of our providers store data outside India (for example in Singapore, the EU or the US). We only use countries the
            Government of India has not restricted under the DPDP Act, and our providers protect data with encryption in transit and at
            rest.
          </P>
          <P>
            Passwords are hashed, sessions use secure httpOnly cookies, verification proofs are private and served only through
            expiring links, and access is limited to people who need it. If a breach affects your data, we will tell you and the Data
            Protection Board of India as the law requires.
          </P>
        </>
      ),
    },
    {
      id: "retention",
      heading: "7. How long we keep it",
      body: (
        <List
          items={[
            "Your account and profile: until you delete your account.",
            "Sign-in codes and failed sign-in records: about 24 hours.",
            "When you delete your account, your profile, contact details, photos, verification proofs, notifications and connected Instagram account are erased or anonymised. Deals you completed stay on record for the other party under a deleted name, because they need them.",
            "Records we must keep by law (for example for tax, audits or disputes) are kept only for the period the law sets, and then deleted.",
          ]}
        />
      ),
    },
    {
      id: "rights",
      heading: "8. Your rights",
      body: (
        <>
          <List
            items={[
              "See a summary of your data and how we use it.",
              "Correct or update it (most of it you can edit yourself in your profile).",
              <>Delete it (Account &amp; security → Delete account, or see <Link href="/legal/data-deletion" className="link-underline text-ink">Deleting your data</Link>).</>,
              "Nominate someone to exercise these rights if you die or can't act.",
              "Complain to our Grievance Officer, and then, if you're not satisfied, to the Data Protection Board of India.",
            ]}
          />
          <P>Write to {COMPANY.grievanceOfficer.email} from the email on your account. We reply within the times in the Grievance Officer page.</P>
        </>
      ),
    },
    {
      id: "cookies",
      heading: "9. Cookies",
      body: (
        <P>
          We use only the cookies the platform needs to keep you signed in: <code>bd_at</code> (a short-lived session, 15 minutes)
          and <code>bd_rt</code> (to renew the session, up to 30 days, sent only to our sign-in endpoints). Both are httpOnly, so
          scripts can&apos;t read them. We don&apos;t use advertising or cross-site tracking cookies.
        </P>
      ),
    },
    {
      id: "children",
      heading: "10. Children",
      body: (
        <P>
          {COMPANY.brand} is only for people aged 18 or over. We check the date of birth creators give and don&apos;t knowingly collect
          data from children. If you think a child has an account, tell the Grievance Officer and we will remove it.
        </P>
      ),
    },
    {
      id: "changes",
      heading: "11. Changes to this policy",
      body: (
        <P>
          When we change this policy in a way that matters, we publish the new version here, tell you, and ask you to accept it before
          you continue.
        </P>
      ),
    },
  ],
};
