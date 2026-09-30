/**
 * The product's own name, in one place. Changing `name` and `wordmark` renames it across every screen, the page
 * metadata, and all six legal documents (those read it through `COMPANY.brand` in `legal.ts`).
 *
 * Named "product", not "brand", because in this codebase a *brand* is an advertiser (see `brand.ts`).
 *
 * It does not reach the API, which keeps its own copy for emails (`BRAND_NAME`), nor the identifiers deliberately
 * left alone — the `com.branddeal` Java package, database and bucket names, the JWT issuer, the repository names.
 * Renaming those is a migration rather than a setting: see `docs/13-brand-migration.md` in the API repo.
 */
export const PRODUCT = {
  name: "ExposureStreet",
  /** Wordmark halves: the first is set in ink, the second in gold italic. */
  wordmark: ["Exposure", "Street"] as const,
  monogram: "E",
  domain: "exposurestreet.com",
  url: "https://www.exposurestreet.com",
} as const;
