import { Parallax } from "@/components/motion";

/** Composed product vignette in place of stock photography: a campaign card and a deal card, gently floating. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      <Parallax speed={-0.06} className="absolute inset-0">
        <div aria-hidden className="absolute -right-10 -top-10 size-72 rounded-full bg-gold-soft/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-16 -left-12 size-80 rounded-full bg-sand blur-3xl" />
      </Parallax>

      <div className="grain absolute inset-6 overflow-hidden rounded-[2rem] bg-ink shadow-lift">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,rgb(176_141_87/0.35),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between p-8 text-ivory">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-zinc-400">
            <span>Campaign</span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] text-gold-soft">Open</span>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-display text-3xl leading-tight">
              The Monsoon
              <br />
              <span className="italic text-gold-soft">Ritual</span> Edit
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Skincare · Instagram Reels · Mumbai, Pune, Bengaluru · 10K–50K followers
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-sm">
            {[
              ["Creators", "8"],
              ["Budget", "₹6–12K"],
              ["Applied", "42"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{k}</span>
                <span className="font-display text-xl">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-2 -left-4 w-60 animate-float rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-lift backdrop-blur sm:-left-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Suggested for you</p>
        <p className="mt-1 font-display text-2xl text-ink">₹3,000 – ₹7,000</p>
        <p className="mt-2 text-xs text-zinc-500">1 Reel · tier T2 · 4.1% engagement</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-cream">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-gold-deep to-gold-soft" />
        </div>
      </div>

      <div className="absolute -right-2 top-10 flex animate-float items-center gap-3 rounded-full border border-zinc-200 bg-white/90 py-2 pl-2 pr-4 shadow-soft backdrop-blur [animation-delay:-3s] sm:-right-8">
        <span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-xs text-ink">Creator verified</span>
      </div>
    </div>
  );
}
