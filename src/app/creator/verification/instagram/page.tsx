"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useEffect, useRef } from "react";

import { AppShell } from "@/components/app-shell";
import { InstagramChecks } from "@/components/instagram-checks";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Card, SectionTitle, Spinner } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { ME_KEY } from "@/lib/session";

/** Instagram redirects here after Connect Instagram with ?code&state (or ?error when the creator cancels). */
export default function InstagramCallbackPage() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <Suspense fallback={<ContentSkeleton />}>
            <Finish />
          </Suspense>
        </AppShell>
      )}
    </RequireSession>
  );
}

function Finish() {
  const params = useSearchParams();
  const code = params.get("code");
  const state = params.get("state");
  const queryClient = useQueryClient();
  const sent = useRef(false);

  const verify = useMutation({
    mutationFn: (body: { code: string; state: string }) => unwrap(api.POST("/creator/verification/instagram", { body })),
    onSuccess: () =>
      Promise.all(
        [["creator", "verification"], ["creator", "profile"], ["creator", "dashboard"], ["creator", "social-accounts"], ME_KEY].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  // The code works once: send it a single time even if the effect runs twice (React dev mode).
  useEffect(() => {
    if (code && state && !sent.current) {
      sent.current = true;
      verify.mutate({ code, state });
    }
  }, [code, state, verify]);

  const back = (
    <Link href="/creator/verification" className="link-underline w-fit text-sm font-medium text-ink">
      ← Back to verification
    </Link>
  );

  if (!code || !state) {
    return (
      <Result title="Instagram wasn't connected" back={back}>
        <p className="text-sm text-zinc-600">
          {params.get("error") ? "You cancelled on Instagram, so nothing was shared." : "This link is incomplete."} You can try again
          any time.
        </p>
      </Result>
    );
  }
  if (verify.isError) {
    return (
      <Result title="We couldn't verify you yet" back={back}>
        <p className="text-sm text-red-700">{errorMessage(verify.error)}</p>
      </Result>
    );
  }
  if (!verify.data) {
    return (
      <Card>
        <p className="flex items-center gap-3 text-sm text-zinc-600">
          <Spinner /> Checking your Instagram account…
        </p>
      </Card>
    );
  }

  const approved = verify.data.status === "APPROVED";
  return (
    <Result title={approved ? "You're verified" : "Sent for review"} back={back}>
      <p className="text-sm text-zinc-600">
        {approved
          ? "Your Instagram numbers checked out. Brands can now find you and you can apply to campaigns."
          : "Some numbers need a quick look from our team (usually within 48 hours). We'll email you when it's done."}
      </p>
      {verify.data.instagram && <InstagramChecks snapshot={verify.data.instagram} />}
    </Result>
  );
}

function Result({ title, back, children }: { title: string; back: ReactNode; children: ReactNode }) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <SectionTitle title={title} />
        <div className="flex flex-col gap-5">{children}</div>
      </Card>
      {back}
    </div>
  );
}
