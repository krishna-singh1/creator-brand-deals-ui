import { useQuery } from "@tanstack/react-query";

import { PRODUCT } from "@/lib/product";
import { api, type components, unwrap } from "./api/client";

export type MetricSource = components["schemas"]["MetricSource"];
export type InstagramSnapshot = components["schemas"]["InstagramSnapshot"];

/** Numbers checked by ExposureStreet: by an admin, or read from Instagram (D-36). */
export function isVerifiedSource(source: MetricSource | undefined): boolean {
  return source === "ADMIN_VERIFIED" || source === "META_API";
}

/** Short label for verified metrics, e.g. next to a creator's numbers. */
export function verifiedSourceLabel(source: MetricSource | undefined): string {
  return source === "META_API" ? "Verified via Instagram" : `Metrics verified by ${PRODUCT.name}`;
}

/** How creators verify right now: Insights screenshots or Connect Instagram (admin switch). */
export function useVerificationMethod() {
  return useQuery({
    queryKey: ["creator", "verification", "method"],
    queryFn: () => unwrap(api.GET("/creator/verification/method")),
  });
}
