import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth-layout";

import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Get started · BrandDeal",
  robots: { index: false },
};

export default function OnboardingPage() {
  return (
    <AuthLayout quote={{ text: "Every partnership worth having starts with knowing who you are.", by: "Getting started" }}>
      <OnboardingFlow />
    </AuthLayout>
  );
}
