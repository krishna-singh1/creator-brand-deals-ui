import { LaunchNiches } from "./launch-niches";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Brand deals for India&apos;s micro-influencers</h1>
        <p className="text-lg text-zinc-600">
          D2C brands post campaigns, creators apply at a fair suggested price, and every deal is tracked from approval
          to payment.
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Launch niches</h2>
        <LaunchNiches />
      </section>
    </main>
  );
}
