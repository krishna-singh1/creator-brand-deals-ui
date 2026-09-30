"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { PasswordField, PasswordInput } from "@/components/password-input";
import { Button, ErrorText, Eyebrow, Input, Spinner } from "@/components/ui";
import { track } from "@/lib/analytics";
import { api, type Me, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { homeFor, needsOnboarding, useMe, useSetMe } from "@/lib/session";

import { GoogleButton } from "./google-button";

/**
 * password     email + password. Verified account → signed in; new/unverified email → a code is sent ("verify")
 * verify       enter the code; the password typed on the first step is saved and the user is signed in
 * code-email   "email me a code instead": request a sign-in code
 * code         enter the sign-in code
 * reset-email  forgot password: request a code
 * reset        enter the code + a new password
 */
type Mode = "password" | "verify" | "code-email" | "code" | "reset-email" | "reset";

const labelClass = "flex flex-col gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-600";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { data: currentUser } = useMe();
  const setMe = useSetMe();

  const [mode, setMode] = useState<Mode>(params.get("mode") === "reset" ? "reset-email" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const goHome = (me: Me) => router.replace(needsOnboarding(me) || !next ? homeFor(me) : next);
  const signedIn = (me: Me) => {
    setMe(me);
    goHome(me);
  };

  useEffect(() => {
    if (currentUser) goHome(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const login = useMutation({
    mutationFn: () => unwrap(api.POST("/auth/login", { body: { email, password } })),
    onSuccess: (res) => {
      if ("next" in res) {
        // Email not verified yet: a code was sent; finishing saves this password.
        track({ name: "signup_started", props: { method: "password" } });
        setOtp("");
        setResendIn(res.resendAfterSeconds);
        setMode("verify");
      } else {
        signedIn(res);
      }
    },
  });
  // The mutation variable is the mode to show once the code is sent ("code" or "reset").
  const requestOtp = useMutation<Awaited<ReturnType<typeof requestCode>>, Error, "code" | "reset" | "verify">({
    mutationFn: () => requestCode(email),
    onSuccess: (res, target) => {
      setMode(target);
      setOtp("");
      setResendIn(res.resendAfterSeconds);
    },
  });
  const verifyOtp = useMutation({
    mutationFn: () => unwrap(api.POST("/auth/otp/verify", { body: { email, otp } })),
    onSuccess: signedIn,
  });
  const reset = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/auth/password/reset", {
          body: { email, otp, newPassword: mode === "verify" ? password : newPassword },
        }),
      ),
    onSuccess: signedIn,
  });

  const go = (target: Mode) => {
    [login, requestOtp, verifyOtp, reset].forEach((m) => m.reset());
    setMode(target);
  };

  const heading: Record<Mode, { eyebrow: string; title: string; body: ReactNode }> = {
    password: {
      eyebrow: "Welcome",
      title: "Sign in to BrandDeal",
      body: "New here? Enter your email and choose a password. We'll verify your email with a quick code, just once.",
    },
    verify: {
      eyebrow: "One-time check",
      title: "Verify your email",
      body: (
        <>
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>. Enter it to confirm the
          address and finish signing in. Next time, your password is all you need.
        </>
      ),
    },
    "code-email": { eyebrow: "Welcome back", title: "Sign in with a code", body: "We'll email you a one-time code. No password needed." },
    code: {
      eyebrow: "One more step",
      title: "Check your email",
      body: (
        <>
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>. It expires in 10 minutes.
        </>
      ),
    },
    "reset-email": {
      eyebrow: "Account recovery",
      title: "Reset your password",
      body: "Enter your account email and we'll send a code to confirm it's you.",
    },
    reset: {
      eyebrow: "Account recovery",
      title: "Choose a new password",
      body: (
        <>
          Enter the code we sent to <span className="font-medium text-ink">{email}</span> and your new password.
          You&apos;ll be signed out everywhere else.
        </>
      ),
    },
  };
  const h = heading[mode];

  return (
    <div className="w-full max-w-md">
      <div key={mode} className="flex animate-fade-up flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Eyebrow>{h.eyebrow}</Eyebrow>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">{h.title}</h1>
          <p className="text-[15px] leading-relaxed text-zinc-600">{h.body}</p>
          {params.get("deleted") === "1" && mode === "password" && (
            <p role="status" className="rounded-2xl bg-cream px-4 py-3 text-sm text-zinc-700">
              Your account and personal data have been deleted.
            </p>
          )}
        </div>

        {mode === "password" && (
          <>
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                login.mutate();
              }}
            >
              <EmailField email={email} setEmail={setEmail} />
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => go("reset-email")}
                    className="link-underline text-xs text-zinc-600 hover:text-ink"
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordInput
                  id="login-password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <ErrorText>{login.isError && errorMessage(login.error)}</ErrorText>
              <Button type="submit" className="h-12" disabled={login.isPending}>
                {login.isPending ? (
                  <>
                    <Spinner /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </>
                )}
              </Button>
            </form>
            <Divider />
            <div className="flex flex-col gap-3">
              <Button type="button" variant="secondary" className="h-12" onClick={() => go("code-email")}>
                Email me a code instead
              </Button>
              <GoogleButton onSuccess={signedIn} />
            </div>
          </>
        )}

        {(mode === "code-email" || mode === "reset-email") && (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              requestOtp.mutate(mode === "code-email" ? "code" : "reset");
            }}
          >
            <EmailField email={email} setEmail={setEmail} autoFocus />
            <ErrorText>{requestOtp.isError && errorMessage(requestOtp.error)}</ErrorText>
            <Button type="submit" className="h-12" disabled={requestOtp.isPending}>
              {requestOtp.isPending ? (
                <>
                  <Spinner /> Sending code…
                </>
              ) : mode === "code-email" ? (
                <>
                  Continue with email
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </>
              ) : (
                "Send reset code"
              )}
            </Button>
            <BackToPassword onClick={() => go("password")} />
          </form>
        )}

        {mode === "verify" && (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              reset.mutate();
            }}
          >
            <CodeField label="Verification code" otp={otp} setOtp={setOtp} />
            <ErrorText>{(reset.isError && errorMessage(reset.error)) || (requestOtp.isError && errorMessage(requestOtp.error))}</ErrorText>
            <Button type="submit" className="h-12" disabled={otp.length !== 6 || reset.isPending}>
              {reset.isPending ? (
                <>
                  <Spinner /> Verifying…
                </>
              ) : (
                "Verify and sign in"
              )}
            </Button>
            <CodeFooter
              resendIn={resendIn}
              resending={requestOtp.isPending}
              onChangeEmail={() => go("password")}
              onResend={() => requestOtp.mutate("verify")}
            />
          </form>
        )}

        {mode === "code" && (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              verifyOtp.mutate();
            }}
          >
            <CodeField label="Login code" otp={otp} setOtp={setOtp} />
            <ErrorText>
              {(verifyOtp.isError && errorMessage(verifyOtp.error)) || (requestOtp.isError && errorMessage(requestOtp.error))}
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
            <CodeFooter
              resendIn={resendIn}
              resending={requestOtp.isPending}
              onChangeEmail={() => go("code-email")}
              onResend={() => requestOtp.mutate("code")}
            />
          </form>
        )}

        {mode === "reset" && (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              reset.mutate();
            }}
          >
            <CodeField label="Reset code" otp={otp} setOtp={setOtp} />
            <PasswordField
              label="New password"
              showStrength
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <ErrorText>{(reset.isError && errorMessage(reset.error)) || (requestOtp.isError && errorMessage(requestOtp.error))}</ErrorText>
            <Button type="submit" className="h-12" disabled={otp.length !== 6 || [...newPassword].length < 8 || reset.isPending}>
              {reset.isPending ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : (
                "Reset password and sign in"
              )}
            </Button>
            <CodeFooter
              resendIn={resendIn}
              resending={requestOtp.isPending}
              onChangeEmail={() => go("reset-email")}
              onResend={() => requestOtp.mutate("reset")}
            />
          </form>
        )}

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

function EmailField({ email, setEmail, autoFocus = false }: { email: string; setEmail: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className={labelClass}>
      Email
      <Input
        type="email"
        autoComplete="email"
        inputMode="email"
        autoFocus={autoFocus}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@yourbrand.in"
        className="normal-case tracking-normal"
      />
    </label>
  );
}

function CodeField({ label, otp, setOtp }: { label: string; otp: string; setOtp: (v: string) => void }) {
  return (
    <>
      <label className={labelClass}>
        {label}
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
          <span key={i} className={`h-0.5 w-6 rounded-full transition-all duration-300 ${i < otp.length ? "bg-gold" : "bg-zinc-200"}`} />
        ))}
      </div>
    </>
  );
}

function CodeFooter({
  resendIn,
  resending,
  onChangeEmail,
  onResend,
}: {
  resendIn: number;
  resending: boolean;
  onChangeEmail: () => void;
  onResend: () => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <Button type="button" variant="ghost" className="h-auto px-0" onClick={onChangeEmail}>
        ← Change email
      </Button>
      <Button type="button" variant="ghost" className="h-auto px-0" disabled={resendIn > 0 || resending} onClick={onResend}>
        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
      </Button>
    </div>
  );
}

function BackToPassword({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="link-underline mx-auto w-fit text-sm text-zinc-600 hover:text-ink">
      ← Sign in with password
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-zinc-400" aria-hidden>
      <span className="h-px flex-1 bg-zinc-200" />
      or
      <span className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

const requestCode = (email: string) => unwrap(api.POST("/auth/otp/request", { body: { email } }));

/** Only allow same-app relative paths as post-login redirects (no open redirects). */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}
