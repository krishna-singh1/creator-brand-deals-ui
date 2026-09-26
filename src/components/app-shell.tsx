"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import { api, type Me } from "@/lib/api/client";
import { ME_KEY } from "@/lib/session";

/** Signed-in layout: top bar with the account and sign-out. Role navigation is added per milestone. */
export function AppShell({ me, children }: { me: Me; children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: () => api.POST("/auth/logout"),
    onSettled: () => {
      queryClient.setQueryData(ME_KEY, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
      router.replace("/login");
    },
  });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-semibold tracking-tight">
            BrandDeal
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline">{me.email}</span>
            <Button variant="secondary" className="h-9" disabled={logout.isPending} onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
