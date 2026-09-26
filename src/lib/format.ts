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
