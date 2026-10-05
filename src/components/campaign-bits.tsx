import type { components } from "@/lib/api/client";
import { COMPENSATION_LABELS, type CompensationType } from "@/lib/campaigns";

type BrandSummary = components["schemas"]["BrandSummary"];

/** Circular match score with an animated gold arc. */
export function MatchScore({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="3" className="stroke-zinc-200" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-gold transition-[stroke-dashoffset] duration-1000 ease-[var(--ease-premium)]"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-sm text-ink">{score}%</span>
    </div>
  );
}

const COMPENSATION_STYLES: Record<CompensationType, string> = {
  CASH: "bg-white text-ink ring-zinc-300",
  PRODUCT: "bg-cream text-gold-deep ring-gold/30",
  PRODUCT_PLUS_CASH: "bg-ink text-gold-soft ring-ink",
};

export function CompensationBadge({ type }: { type: CompensationType }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ring-1 ${COMPENSATION_STYLES[type]}`}>
      {COMPENSATION_LABELS[type]}
    </span>
  );
}

/** Brand logo (or monogram) + name, with the GST badge when verified. */
export function BrandLine({ brand, className = "" }: { brand?: BrandSummary; className?: string }) {
  if (!brand) return null;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt="" className="size-7 rounded-full object-cover ring-1 ring-zinc-200" />
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-ink font-display text-xs text-gold-soft">
          {brand.brandName.charAt(0)}
        </span>
      )}
      <span className="text-sm text-zinc-700">{brand.brandName}</span>
      {brand.gstVerified && <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-700">GST ✓</span>}
    </span>
  );
}
