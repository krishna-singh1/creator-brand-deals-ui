/**
 * Company details used by every legal page. Fill the [bracketed] placeholders once before launch; the pages show a
 * draft notice until `LEGAL_REVIEWED` is true (a lawyer has reviewed the texts).
 */
export const COMPANY = {
  brand: "BrandDeal",
  legalName: "[Company legal name]",
  registeredAddress: "[Registered office address]",
  jurisdictionCity: "[City]",
  website: "[branddeal.in]",
  supportEmail: "[support@branddeal.in]",
  grievanceOfficer: {
    name: "[Grievance Officer name]",
    email: "[grievance@branddeal.in]",
    hours: "Monday to Friday, 10:00–18:00 IST",
  },
} as const;

export const LEGAL_REVIEWED = false;

/**
 * Must equal `app.policies.versions` in the API (application.yaml). Changing a version there makes every user accept
 * that document again, so change both together whenever a document's meaning changes.
 */
export const POLICY_VERSIONS = {
  TERMS: "2026-09-29",
  PRIVACY: "2026-09-29",
  ASCI_CODE: "2026-09-29",
  BRAND_CODE: "2026-09-29",
} as const;
