"use client";

import { useMutation } from "@tanstack/react-query";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { ErrorText } from "@/components/ui";
import { api, type Me, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type GoogleCredentialResponse = { credential: string };
type GoogleAccountsId = {
  initialize(config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

/**
 * Google Identity Services button. The ID token goes to the API, which verifies it and sets the session cookies.
 * Hidden when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.
 */
export function GoogleButton({ onSuccess }: { onSuccess: (me: Me) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const login = useMutation({
    mutationFn: (idToken: string) => unwrap(api.POST("/auth/google", { body: { idToken } })),
    onSuccess,
  });

  useEffect(() => {
    const gis = window.google?.accounts.id;
    if (!CLIENT_ID || !scriptReady || !gis || !container.current) return;
    gis.initialize({ client_id: CLIENT_ID, callback: (r) => login.mutate(r.credential) });
    gis.renderButton(container.current, { theme: "outline", size: "large", width: 320, text: "continue_with" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center gap-3 text-xs uppercase text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        or
        <span className="h-px flex-1 bg-zinc-200" />
      </div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={container} className="min-h-11" />
      <ErrorText>{login.isError && errorMessage(login.error)}</ErrorText>
    </div>
  );
}
