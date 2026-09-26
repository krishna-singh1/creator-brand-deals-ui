import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth-layout";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · BrandDeal",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
