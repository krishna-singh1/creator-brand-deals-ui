"use client";

import { type InputHTMLAttributes, useId, useState } from "react";

import { Input } from "./ui";

/** Password field with a Show/Hide toggle. The toggle is labelled "Show"/"Hide" so the field keeps its own label. */
export function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <Input {...props} type={visible ? "text" : "password"} className={`pr-20 normal-case tracking-normal ${className}`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        className="absolute inset-y-0 right-3 my-auto h-8 rounded-full px-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 transition-colors hover:text-ink"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}

/** Four-segment length meter matching the API policy (8–128 chars; length is what matters). */
export function PasswordStrength({ value }: { value: string }) {
  const length = [...value].length;
  const level = length === 0 ? 0 : length < 8 ? 1 : length < 12 ? 2 : length < 16 ? 3 : 4;
  const label = ["", "Too short", "Good", "Strong", "Excellent"][level];
  return (
    <span className="flex items-center gap-3" aria-live="polite">
      <span className="flex flex-1 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= level ? (level === 1 ? "bg-red-400" : "bg-gold") : "bg-zinc-200"
            }`}
          />
        ))}
      </span>
      <span className="w-20 text-right text-xs normal-case tracking-normal text-zinc-500">{label}</span>
    </span>
  );
}

/** Labelled password field (label linked by id, so the Show/Hide button never becomes part of the label). */
export function PasswordField({
  label,
  showStrength = false,
  value,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & { label: string; showStrength?: boolean; value: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-600">
        {label}
      </label>
      <PasswordInput id={id} value={value} {...props} />
      {showStrength && <PasswordStrength value={value} />}
    </div>
  );
}
