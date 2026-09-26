"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import type { Me } from "@/lib/api/client";
import { homeFor, needsOnboarding, useMe } from "@/lib/session";

import { Skeleton } from "./ui";

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
    return <PageSkeleton />;
  }
  return <>{children(me)}</>;
}

export function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 animate-fade-in items-center justify-center p-8 text-sm tracking-wide text-zinc-500">{children}</div>
  );
}

/** Elegant placeholder shown while the session or page data loads. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto flex w-full max-w-6xl flex-1 animate-fade-in flex-col gap-8 px-6 py-24">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-2/3 max-w-lg" />
      <div className="grid gap-6 sm:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

/** Skeleton for page content inside the app shell (profile forms, detail pages). */
export function ContentSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex animate-fade-in flex-col gap-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-11 w-1/2 max-w-md" />
      <Skeleton className="h-72" />
      <Skeleton className="h-48" />
    </div>
  );
}
