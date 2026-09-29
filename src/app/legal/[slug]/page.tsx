import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { notFound } from "next/navigation";

const DOCS: Record<string, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  "creator-code": "Creator Code (ASCI ad-disclosure guidelines)",
  "brand-code": "Brand Code of Conduct",
  grievance: "Grievance Officer",
  "data-deletion": "Deleting your data",
};

/** Pages with final text. The others are placeholders until the reviewed legal texts are ready (decision O-07). */
const BODIES: Record<string, string[]> = {
  "data-deletion": [
    "You can delete your BrandDeal account at any time: sign in, open your profile menu, go to Account & security and choose Delete account. Your profile, contact details, photos, verification documents and connected Instagram account are erased; completed deals stay on record for the other party under a deleted name.",
    "Connect Instagram: when you verify with Instagram we read your follower count and the likes and comments on your recent posts once. We don't keep access to your Instagram account and store only those numbers. Deleting your account removes the link to your Instagram account. You can also remove BrandDeal from Instagram under Settings → Apps and websites.",
    "If you can't sign in, email our Grievance Officer (see the Grievance page) from the address on your account and we'll delete it within 30 days.",
  ],
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: `${DOCS[slug] ?? "Legal"} · BrandDeal` };
}

// Placeholder until the reviewed legal texts are ready (decision O-07).
export default async function LegalPage(props: PageProps<"/legal/[slug]">) {
  const { slug } = await props.params;
  const title = DOCS[slug];
  if (!title) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-24">
      <Logo />
      <div className="flex animate-fade-up flex-col gap-5">
        <span className="text-xs font-medium uppercase tracking-[0.28em] text-gold-deep">Legal</span>
        <h1 className="font-display text-5xl leading-tight tracking-tight text-ink">{title}</h1>
        {(BODIES[slug] ?? ["This document is being finalised with our legal advisors and will be published here before launch."]).map(
          (paragraph) => (
            <p key={paragraph} className="text-lg leading-relaxed text-zinc-600">
              {paragraph}
            </p>
          ),
        )}
        <Link href="/" className="link-underline w-fit text-sm font-medium text-ink">
          ← Return home
        </Link>
      </div>
    </main>
  );
}
