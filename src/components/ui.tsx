import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/*
 * Shared premium primitives: charcoal/ivory/gold, soft depth, and 300–500ms eased transitions.
 * Motion uses transform/opacity only; prefers-reduced-motion is handled globally.
 */

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "gold" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary:
      "bg-ink text-ivory shadow-soft hover:-translate-y-0.5 hover:shadow-lift hover:bg-ink-soft disabled:bg-zinc-400 disabled:shadow-none",
    gold: "bg-gold text-ink shadow-soft hover:-translate-y-0.5 hover:shadow-gold hover:bg-gold-soft disabled:opacity-50",
    secondary:
      "border border-zinc-300 bg-white/70 text-ink backdrop-blur hover:-translate-y-0.5 hover:border-ink hover:shadow-soft disabled:text-zinc-400",
    ghost: "text-zinc-600 hover:text-ink disabled:text-zinc-400",
    danger: "border border-red-200 bg-white text-red-700 hover:-translate-y-0.5 hover:bg-red-50 disabled:text-red-300",
  }[variant];
  return (
    <button
      className={`group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-sm font-medium tracking-wide transition-all duration-300 ${EASE} active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const fieldClass = `rounded-xl border border-zinc-300 bg-white/80 px-4 text-base text-ink shadow-[inset_0_1px_2px_rgb(18_18_18/0.04)] outline-none transition-all duration-300 ${EASE} placeholder:text-zinc-400 hover:border-zinc-400 focus:border-gold focus:bg-white focus:shadow-[0_0_0_4px_rgb(176_141_87/0.15)] disabled:opacity-60`;

/** Fields fill their container unless the caller sets a width (e.g. `w-44` for a filter). */
function widthOf(className: string) {
  return /(^|\s)(w-|max-w-)/.test(className) ? "" : "w-full";
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-12 ${widthOf(className)} ${fieldClass} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-12 cursor-pointer ${widthOf(className)} ${fieldClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-28 py-3 ${widthOf(className)} ${fieldClass} ${className}`} {...props} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-600">
      {label}
      <span className="normal-case tracking-normal">{children}</span>
      {hint && <span className="text-xs font-normal normal-case tracking-normal text-zinc-500">{hint}</span>}
    </label>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex animate-fade-in items-start gap-2 text-sm text-red-700">
      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-600" />
      {children}
    </p>
  );
}

export function SuccessText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="flex animate-fade-in items-center gap-2 text-sm text-emerald-800">
      <svg aria-hidden viewBox="0 0 16 16" className="size-4">
        <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </p>
  );
}

const CARD_TONES = {
  default: "border-zinc-200/80 bg-white/80",
  highlight: "border-gold/40 bg-[#fbf6ec]",
  success: "border-emerald-200 bg-white/80",
  warning: "border-amber-200 bg-white/80",
  danger: "border-red-200 bg-white/80",
} as const;

export function Card({
  className = "",
  interactive = false,
  tone = "default",
  children,
}: {
  className?: string;
  interactive?: boolean;
  /** Border/background emphasis; set it here rather than via className so it isn't overridden. */
  tone?: keyof typeof CARD_TONES;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border p-7 shadow-soft backdrop-blur-sm transition-all duration-500 ${EASE} ${CARD_TONES[tone]} ${
        interactive ? "hover:-translate-y-1 hover:border-gold/40 hover:shadow-lift" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-gold-deep ${className}`}>
      <span aria-hidden className="h-px w-8 bg-gold/60" />
      {children}
    </span>
  );
}

export function PageTitle({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-3">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-[2.75rem]">{title}</h1>
        {subtitle && <p className="max-w-2xl text-[15px] leading-relaxed text-zinc-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-1.5">
      <h2 className="font-display text-2xl tracking-tight text-ink">{title}</h2>
      {subtitle && <p className="text-sm leading-relaxed text-zinc-600">{subtitle}</p>}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  VERIFIED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-900 ring-amber-200",
  PENDING: "bg-amber-50 text-amber-900 ring-amber-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
  PUBLISHED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  APPLIED: "bg-amber-50 text-amber-900 ring-amber-200",
  SHORTLISTED: "bg-gold/10 text-gold-deep ring-gold/40",
  INVITED: "bg-gold/10 text-gold-deep ring-gold/40",
  ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  UNSUBMITTED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  UNPUBLISHED_BY_ADMIN: "bg-red-50 text-red-700 ring-red-200",
  DELETED: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

export function StatusBadge({ status }: { status: string }) {
  const style = BADGE_STYLES[status] ?? "bg-cream text-zinc-700 ring-zinc-200";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ring-1 ${style}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block size-4 animate-spin-slow rounded-full border-2 border-current border-r-transparent ${className}`} />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}
