import { brandCode } from "./brand-code";
import { creatorCode } from "./creator-code";
import { dataDeletion } from "./data-deletion";
import { grievance } from "./grievance";
import { privacy } from "./privacy";
import { terms } from "./terms";
import type { LegalDoc } from "./types";

/** Every legal page, by URL slug (/legal/[slug]). The order is the order of the "Other documents" links. */
export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms,
  privacy,
  "creator-code": creatorCode,
  "brand-code": brandCode,
  grievance,
  "data-deletion": dataDeletion,
};
