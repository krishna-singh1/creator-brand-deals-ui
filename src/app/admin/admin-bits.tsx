"use client";

import { type QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card, ErrorText, Textarea } from "@/components/ui";
import { errorMessage } from "@/lib/errors";

type Page<T> = { items: T[]; nextCursor?: string };

/** Cursor-paged admin list: flattened items plus "load more". */
export function useCursorList<T>(queryKey: QueryKey, fetchPage: (cursor?: string) => Promise<Page<T>>) {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (last) => last.nextCursor,
  });
  return { ...query, items: query.data?.pages.flatMap((p) => p.items) ?? [] };
}

/** Table card with header cells, an empty state and a "load more" button. */
export function AdminTable({
  headers,
  empty,
  loading,
  hasMore,
  loadingMore,
  onMore,
  children,
}: {
  headers: string[];
  empty: boolean;
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onMore: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-x-auto p-0">
        {empty ? (
          <p className="p-6 text-sm text-zinc-500">{loading ? "Loading…" : "Nothing here."}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&>tr]:border-b [&>tr]:border-zinc-100 [&>tr:last-child]:border-0">{children}</tbody>
          </table>
        )}
      </Card>
      {hasMore && (
        <Button variant="secondary" className="self-start" disabled={loadingMore} onClick={onMore}>
          Load more
        </Button>
      )}
    </div>
  );
}

/**
 * Two-step destructive action that needs a written reason (suspend, take down). The reason is shown to the affected
 * user and stored in the audit log.
 */
export function ReasonAction({
  label,
  confirmLabel,
  prompt,
  pending,
  error,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  prompt: string;
  pending: boolean;
  error: unknown;
  onConfirm: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) {
    return (
      <Button variant="ghost" className="h-8 px-3 text-red-700" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }
  return (
    <form
      className="flex min-w-72 flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(reason.trim());
      }}
    >
      <Textarea
        aria-label={prompt}
        placeholder={prompt}
        className="min-h-16 text-sm"
        required
        minLength={3}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      <ErrorText>{error ? errorMessage(error) : null}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" variant="danger" className="h-8 px-3" disabled={reason.trim().length < 3 || pending}>
          {confirmLabel}
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-3" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
