"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, ErrorText, Eyebrow, Input, Spinner } from "@/components/ui";
import { api, type Me, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { homeFor, needsOnboarding, useMe, useSetMe } from "@/lib/session";

import { GoogleButton } from "./google-button";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { data: currentUser } = useMe();
  const setMe = useSetMe();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const goHome = (me: Me) => router.replace(needsOnboarding(me) || !next ? homeFor(me) : next);

  useEffect(() => {
    if (currentUser) goHome(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const requestOtp = useMutation({
    mutationFn: () => unwrap(api.POST("/auth/otp/request", { body: { email } })),
    onSuccess: (res) => {
      setStep("otp");
      setOtp("");
      setResendIn(res.resendAfterSeconds);
    },
  });

  const verifyOtp = useMutation({
    mutationFn: () => unwrap(api.POST("/auth/otp/verify", { body: { email, otp } })),
    onSuccess: (me) => {
      setMe(me);
      goHome(me);
    },
  });

  const onGoogleSuccess = (me: Me) => {
    setMe(me);
    goHome(me);
  };

  return (
    <div className="w-full max-w-md">
      <div key={step} className="flex animate-fade-up flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Eyebrow>{step === "email" ? "Welcome" : "One more step"}</Eyebrow>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
            {step === "email" ? "Sign in to BrandDeal" : "Check your email"}
          </h1>
          <p className="text-[15px] leading-relaxed text-zinc-600">
            {step === "email" ? (
              "Creators and brands share one refined sign-in. New here? Your account is created the moment you verify."
            ) : (
              <>
                We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>. It expires in 10 minutes.
              </>
            )}
          </p>
        </div>

        {step === "email" ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              requestOtp.mutate();
            }}
          >
            <label className="flex flex-col gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-600">
              Email
              <Input
                type="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbrand.in"
                className="normal-case tracking-normal"
              />
            </label>
            <ErrorText>{requestOtp.isError && errorMessage(requestOtp.error)}</ErrorText>
            <Button type="submit" className="h-12" disabled={requestOtp.isPending}>
              {requestOtp.isPending ? (
                <>
                  <Spinner /> Sending code…
                </>
              ) : (
                <>
                  Continue with email
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </>
              )}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              verifyOtp.mutate();
            }}
          >
            <label className="flex flex-col gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-600">
              Login code
              <Input
                autoFocus
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="h-16 text-center font-display text-3xl tracking-[0.6em]"
              />
            </label>
            <div className="flex justify-center gap-2" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  className={`h-0.5 w-6 rounded-full transition-all duration-300 ${i < otp.length ? "bg-gold" : "bg-zinc-200"}`}
                />
              ))}
            </div>
            <ErrorText>
              {(verifyOtp.isError && errorMessage(verifyOtp.error)) ||
                (requestOtp.isError && errorMessage(requestOtp.error))}
            </ErrorText>
            <Button type="submit" className="h-12" disabled={otp.length !== 6 || verifyOtp.isPending}>
              {verifyOtp.isPending ? (
                <>
                  <Spinner /> Verifying…
                </>
              ) : (
                "Verify and continue"
              )}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <Button type="button" variant="ghost" className="h-auto px-0" onClick={() => setStep("email")}>
                ← Change email
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-auto px-0"
                disabled={resendIn > 0 || requestOtp.isPending}
                onClick={() => requestOtp.mutate()}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </Button>
            </div>
          </form>
        )}

        {step === "email" && <GoogleButton onSuccess={onGoogleSuccess} />}

        <p className="text-xs leading-relaxed text-zinc-500">
          By continuing you agree to our{" "}
          <Link href="/legal/terms" className="link-underline text-zinc-700">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="link-underline text-zinc-700">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/** Only allow same-app relative paths as post-login redirects (no open redirects). */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}
