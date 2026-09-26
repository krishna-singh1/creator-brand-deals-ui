"use client";

import { useEffect, useState } from "react";

const STORIES = [
  {
    quote:
      "We briefed once, received a shortlist of creators who genuinely lived in our niche, and every price arrived with context. It felt less like a marketplace, more like a studio.",
    name: "A skincare label, Bengaluru",
    detail: "Launch campaign · 8 creators",
  },
  {
    quote:
      "I finally know what my work is worth. The suggested range gave me the confidence to quote fairly, and the brand paid exactly what we agreed.",
    name: "A food creator, Pune",
    detail: "18K followers · 4.1% engagement",
  },
  {
    quote:
      "Product-only collaborations used to be chaos. Shipping, content, approvals: everything is tracked in one refined timeline now.",
    name: "A fashion D2C founder, Jaipur",
    detail: "Barter campaign · 12 creators",
  },
];

/** Auto-advancing, pausable carousel of illustrative collaboration stories. */
export function Stories() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % STORIES.length), 6000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative min-h-[22rem] sm:min-h-[17rem] lg:min-h-[14rem]" aria-live="polite">
        {STORIES.map((s, i) => (
          <figure
            key={s.name}
            aria-hidden={i !== index}
            className={`absolute inset-0 flex flex-col gap-8 transition-all duration-700 ease-[var(--ease-premium)] ${
              i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
            }`}
          >
            <blockquote className="font-display text-2xl leading-snug text-ivory sm:text-[1.7rem]">
              <span className="text-gold-soft">&ldquo;</span>
              {s.quote}
              <span className="text-gold-soft">&rdquo;</span>
            </blockquote>
            <figcaption className="flex flex-col gap-1 text-sm">
              <span className="text-ivory">{s.name}</span>
              <span className="text-zinc-400">{s.detail}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-10 flex items-center gap-3">
        {STORIES.map((s, i) => (
          <button
            key={s.name}
            type="button"
            aria-label={`Show story ${i + 1}`}
            onClick={() => setIndex(i)}
            className="group py-2"
          >
            <span className="block h-px w-12 overflow-hidden bg-white/20">
              <span
                className={`block h-full bg-gold-soft transition-[width] ease-linear ${i === index ? (paused ? "w-full duration-300" : "w-full duration-[6000ms]") : "w-0 duration-0"}`}
              />
            </span>
          </button>
        ))}
        <span className="ml-auto text-xs uppercase tracking-[0.2em] text-zinc-500">Illustrative stories</span>
      </div>
    </div>
  );
}
