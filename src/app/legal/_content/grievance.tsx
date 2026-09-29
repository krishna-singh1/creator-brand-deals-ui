import { COMPANY } from "@/lib/legal";

import { type LegalDoc, List, P, Strong } from "./types";

export const grievance: LegalDoc = {
  title: "Grievance Officer",
  summary: `How to raise a complaint about content, an account, a deal or your personal data, and how quickly we respond. This follows the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the DPDP Act, 2023.`,
  version: "2026-09-29",
  sections: [
    {
      id: "contact",
      heading: "1. Contact",
      body: (
        <List
          items={[
            <><Strong>Name:</Strong> {COMPANY.grievanceOfficer.name}</>,
            <><Strong>Email:</Strong> {COMPANY.grievanceOfficer.email}</>,
            <><Strong>Address:</Strong> {COMPANY.legalName}, {COMPANY.registeredAddress}</>,
            <><Strong>Hours:</Strong> {COMPANY.grievanceOfficer.hours}</>,
          ]}
        />
      ),
    },
    {
      id: "what",
      heading: "2. What to include",
      body: (
        <List
          items={[
            "Your name and the email on your account (if you have one).",
            "What the complaint is about, with links: a profile, campaign, deal or post.",
            "What you'd like us to do.",
            "For data requests (see a summary, correct, delete, nominate), write from the email on your account so we can confirm it's you.",
          ]}
        />
      ),
    },
    {
      id: "timelines",
      heading: "3. How quickly we respond",
      body: (
        <List
          items={[
            "We acknowledge every complaint within 24 hours.",
            "We resolve it within 15 days and tell you what we did and why.",
            "Content that exposes someone's private areas, shows them in a sexual act, or impersonates them (including morphed images) is removed within 24 hours of a complaint from the person affected or someone acting for them.",
          ]}
        />
      ),
    },
    {
      id: "escalation",
      heading: "4. If you're not satisfied",
      body: (
        <P>
          For complaints about personal data you can approach the Data Protection Board of India after using this process. For other
          matters you keep every right you have under Indian law, including going to a consumer forum.
        </P>
      ),
    },
  ],
};
