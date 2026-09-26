import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const DOCS: Record<string, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  "creator-code": "Creator Code (ASCI ad-disclosure guidelines)",
  "brand-code": "Brand Code of Conduct",
  grievance: "Grievance Officer",
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← BrandDeal
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-zinc-600">
        This document is being finalised with our legal advisors and will be published here before launch.
      </p>
    </main>
  );
}
