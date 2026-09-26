import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

/** Minimal shared primitives until the design system (shadcn/ui, O-13) lands. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-400",
    secondary: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 disabled:text-zinc-400",
    ghost: "text-zinc-600 hover:text-zinc-900 disabled:text-zinc-400",
  }[variant];
  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${className}`}
      {...props}
    />
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-red-600">
      {children}
    </p>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}
