"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiRequestError, type Me, unwrap } from "./api/client";

export const ME_KEY = ["me"] as const;

/** Current user, or null when signed out. Tokens live in httpOnly cookies; this is the only auth state in JS. */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<Me | null> => {
      try {
        return await unwrap(api.GET("/auth/me"));
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 60_000,
  });
}

export function useSetMe() {
  const queryClient = useQueryClient();
  return (me: Me | null) => queryClient.setQueryData(ME_KEY, me);
}

export function needsOnboarding(me: Me) {
  return !me.onboarding.roleSelected || !me.onboarding.consentsAccepted;
}

/** Where a signed-in user belongs right now. */
export function homeFor(me: Me): string {
  if (needsOnboarding(me)) return "/onboarding";
  switch (me.role) {
    case "CREATOR":
      return "/creator";
    case "BRAND":
      return "/brand";
    case "ADMIN":
      return "/admin";
    default:
      return "/onboarding";
  }
}
