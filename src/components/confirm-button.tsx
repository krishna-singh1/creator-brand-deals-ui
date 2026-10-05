"use client";

import { useState } from "react";

import { Button } from "./ui";

/** Two-step destructive action: the first click asks inline ("Delete? Yes / Cancel"), the second does it. */
export function ConfirmButton({
  children,
  question = "Delete?",
  onConfirm,
  pending = false,
  variant = "danger",
  className = "",
}: {
  children: React.ReactNode;
  question?: string;
  onConfirm: () => void;
  pending?: boolean;
  variant?: "danger" | "ghost" | "secondary";
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button type="button" variant={variant} className={className} disabled={pending} onClick={() => setAsking(true)}>
        {children}
      </Button>
    );
  }
  return (
    <span role="group" aria-label={question} className="inline-flex animate-fade-in items-center gap-2">
      <span className="text-sm text-zinc-700">{question}</span>
      <Button
        type="button"
        variant="danger"
        className={className}
        disabled={pending}
        autoFocus
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Yes
      </Button>
      <Button type="button" variant="ghost" className={className} onClick={() => setAsking(false)}>
        Cancel
      </Button>
    </span>
  );
}
