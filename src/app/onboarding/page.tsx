import type { Metadata } from "next";

import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Get started · BrandDeal",
  robots: { index: false },
};

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <OnboardingFlow />
    </main>
  );
}
