"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card, ErrorText, Input } from "@/components/ui";
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
    <Card className="w-full max-w-sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === "email" ? "Sign in to BrandDeal" : "Check your email"}
          </h1>
          <p className="text-sm text-zinc-600">
            {step === "email"
              ? "Creators and brands use the same sign-in. New here? We'll create your account."
              : `We sent a 6-digit code to ${email}.`}
          </p>
        </div>

        {step === "email" ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              requestOtp.mutate();
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <Input
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <ErrorText>{requestOtp.isError && errorMessage(requestOtp.error)}</ErrorText>
            <Button type="submit" disabled={requestOtp.isPending}>
              {requestOtp.isPending ? "Sending code…" : "Continue with email"}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              verifyOtp.mutate();
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium">
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
                placeholder="123456"
                className="tracking-[0.4em]"
              />
            </label>
            <ErrorText>
              {(verifyOtp.isError && errorMessage(verifyOtp.error)) ||
                (requestOtp.isError && errorMessage(requestOtp.error))}
            </ErrorText>
            <Button type="submit" disabled={otp.length !== 6 || verifyOtp.isPending}>
              {verifyOtp.isPending ? "Verifying…" : "Verify and continue"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <Button type="button" variant="ghost" className="h-auto px-0" onClick={() => setStep("email")}>
                Change email
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
      </div>
    </Card>
  );
}

/** Only allow same-app relative paths as post-login redirects (no open redirects). */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}
