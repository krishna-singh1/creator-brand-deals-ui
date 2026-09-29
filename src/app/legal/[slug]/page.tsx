import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/logo";
import { LEGAL_REVIEWED } from "@/lib/legal";

import { LEGAL_DOCS } from "../_content";

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = LEGAL_DOCS[slug];
  return { title: `${doc?.title ?? "Legal"} · BrandDeal`, description: doc?.summary };
}

export default async function LegalPage(props: PageProps<"/legal/[slug]">) {
  const { slug } = await props.params;
  const doc = LEGAL_DOCS[slug];
  if (!doc) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-20">
      <Logo />
      <header className="flex animate-fade-up flex-col gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.28em] text-gold-deep">Legal</span>
        <h1 className="font-display text-5xl leading-tight tracking-tight text-ink">{doc.title}</h1>
        <p className="text-sm text-zinc-500">Version {doc.version}</p>
        <p className="text-lg leading-relaxed text-zinc-600">{doc.summary}</p>
        {!LEGAL_REVIEWED && (
          <p role="note" className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
            Draft for the beta. This text is being reviewed by our legal advisors and may change; you&apos;ll be asked to accept any
            change that matters.
          </p>
        )}
      </header>

      <nav aria-label="Contents" className="rounded-3xl border border-zinc-200 bg-white/70 p-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Contents</p>
        <ol className="flex flex-col gap-1.5 text-sm">
          {doc.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="link-underline text-zinc-700">
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-10">
        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} className="flex scroll-mt-24 flex-col gap-4">
            <h2 className="font-display text-2xl tracking-tight text-ink">{s.heading}</h2>
            {s.body}
          </section>
        ))}
      </div>

      <footer className="flex flex-col gap-4 border-t border-zinc-200 pt-8 text-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Other documents</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(LEGAL_DOCS)
            .filter(([other]) => other !== slug)
            .map(([other, d]) => (
              <Link key={other} href={`/legal/${other}`} className="link-underline text-zinc-700">
                {d.title}
              </Link>
            ))}
        </div>
        <Link href="/" className="link-underline w-fit font-medium text-ink">
          ← Return home
        </Link>
      </footer>
    </main>
  );
}
