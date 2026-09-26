"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import type { Me } from "@/lib/api/client";
import { homeFor, needsOnboarding, useMe } from "@/lib/session";

type Role = NonNullable<Me["role"]>;

/**
 * Client-side route guard. The API is the real authority (every call is authorised there); this only decides which
 * screen to show. Signed out → /login, onboarding incomplete → /onboarding, wrong role → that user's home.
 */
export function RequireSession({
  role,
  allowOnboarding = false,
  children,
}: {
  role?: Role;
  allowOnboarding?: boolean;
  children: (me: Me) => React.ReactNode;
}) {
  const { data: me, isPending, isError } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  const redirect = (() => {
    if (isPending || isError) return null;
    if (!me) return `/login?next=${encodeURIComponent(pathname)}`;
    if (needsOnboarding(me) && !allowOnboarding) return "/onboarding";
    if (!needsOnboarding(me) && allowOnboarding) return homeFor(me);
    if (role && me.role !== role) return homeFor(me);
    return null;
  })();

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (isError) {
    return <CenteredMessage>Couldn&apos;t reach BrandDeal. Please refresh.</CenteredMessage>;
  }
  if (isPending || redirect || !me) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }
  return <>{children(me)}</>;
}

export function CenteredMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">{children}</div>;
}
