"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { identifyUser } from "@/lib/analytics";
import { ApiRequestError } from "@/lib/api/client";
import { useMe } from "@/lib/session";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failures, error) =>
              !(error instanceof ApiRequestError && error.status < 500) && failures < 2,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsIdentity />
      {children}
    </QueryClientProvider>
  );
}

/** Keeps analytics linked to the signed-in account (ID + role), or forgets it after sign-out. */
function AnalyticsIdentity() {
  const { data: me } = useMe();
  useEffect(() => identifyUser(me), [me]);
  return null;
}
