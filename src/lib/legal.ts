import { PRODUCT } from "./product";

/**
 * Company details used by every legal page. Fill the [bracketed] placeholders once before launch; the pages show a
 * draft notice until `LEGAL_REVIEWED` is true (a lawyer has reviewed the texts). The product name comes from
 * `product.ts`, so renaming there renames it in all six documents.
 */
export const COMPANY = {
  brand: PRODUCT.name,
  legalName: "[Company legal name]",
  registeredAddress: "[Registered office address]",
  jurisdictionCity: "[City]",
  website: PRODUCT.domain,
  supportEmail: `[support@${PRODUCT.domain}]`,
  grievanceOfficer: {
    name: "[Grievance Officer name]",
    email: `[grievance@${PRODUCT.domain}]`,
    hours: "Monday to Friday, 10:00–18:00 IST",
  },
} as const;

export const LEGAL_REVIEWED = false;

/**
 * Must equal `app.policies.versions` in the API (application.yaml). Changing a version there makes every user accept
 * that document again, so change both together whenever a document's meaning changes.
 */
export const POLICY_VERSIONS = {
  TERMS: "2026-09-30",
  PRIVACY: "2026-09-30",
  ASCI_CODE: "2026-09-30",
  BRAND_CODE: "2026-09-30",
} as const;
