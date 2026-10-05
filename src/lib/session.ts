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
  return me.onboarding.passwordRequired || !me.onboarding.roleSelected || !me.onboarding.consentsAccepted;
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

/**
 * Only same-app relative paths are allowed as post-login redirects (no open redirects): a single leading "/", no
 * backslashes or control characters (browsers treat "/\evil.com" and "/\t/evil.com" like "//evil.com").
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return /[\\\u0000-\u001f\u007f]/.test(next) ? null : next;
}

/** Where to go after signing in or finishing onboarding: `next` if given, through onboarding first when it's pending. */
export function destinationFor(me: Me, next: string | null): string {
  if (!next || next.startsWith("/onboarding") || next.startsWith("/login")) return homeFor(me);
  return needsOnboarding(me) ? `/onboarding?next=${encodeURIComponent(next)}` : next;
}
