import type { components } from "./api/client";

export type CreatorCard = components["schemas"]["CreatorCard"];
export type CreatorPublicProfile = components["schemas"]["CreatorPublicProfile"];
export type Platform = components["schemas"]["Platform"];

/** Search filters as form state (strings), converted to API query params (numbers, undefined when empty). */
export type CreatorFilters = {
  q: string;
  categoryId: string;
  cityId: string;
  platform: "" | Platform;
  followersMin: string;
  followersMax: string;
  engagementRateMin: string;
};

export const EMPTY_FILTERS: CreatorFilters = { q: "", categoryId: "", cityId: "", platform: "", followersMin: "", followersMax: "", engagementRateMin: "" };

const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v));

export function toQuery(f: CreatorFilters) {
  return {
    q: f.q.trim() || undefined,
    categoryId: f.categoryId || undefined,
    cityId: f.cityId || undefined,
    platform: f.platform || undefined,
    followersMin: num(f.followersMin),
    followersMax: num(f.followersMax),
    engagementRateMin: num(f.engagementRateMin),
  };
}
