import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · BrandDeal",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
