const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-IN");

/** API money is integer paise (ADR 0004). */
export const formatPaise = (paise: number) => inr.format(paise / 100);
export const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);
export const formatCount = (n: number) => count.format(n);

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export const DELIVERABLE_LABELS: Record<string, string> = {
  IG_REEL: "Instagram Reel",
  IG_POST: "Instagram Post",
  IG_CAROUSEL: "Instagram Carousel",
  IG_STORY: "Instagram Stories (set of 3)",
  FB_POST: "Facebook Post",
  FB_REEL: "Facebook Reel",
};

const FIELD_LABELS: Record<string, string> = {
  displayName: "display name",
  fullName: "full name",
  dateOfBirth: "date of birth",
  city: "city",
  languages: "languages",
  categories: "niches",
  phone: "mobile number",
  contactEmail: "contact email",
  socialAccounts: "a social account",
};

/** Human-readable list of profile fields still missing ("display name, city and a social account"). */
export function humanizeMissing(fields: string[]) {
  const labels = fields.map((f) => FIELD_LABELS[f] ?? f);
  return labels.length <= 1 ? labels.join("") : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}
