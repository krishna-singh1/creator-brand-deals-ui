"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { NOTIFICATIONS_KEY } from "@/components/notification-bell";
import { Button, Card, ErrorText, SectionTitle, Spinner, Textarea } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

const MAX_LENGTH = 2000;
const POLL_MS = 10_000;
const PAGE = 30;

type Message = components["schemas"]["DealMessage"];

/**
 * The brand ↔ creator thread on a deal. Polls only the newest page while the tab is visible (earlier pages load on
 * demand and never change), keeps the newest message in view, and marks this deal's message notifications read (so
 * the next message notifies again). Cancelled deals are read-only.
 */
export function MessagesPanel({ dealId, meId, partnerName, readOnly }: { dealId: string; meId: string; partnerName: string; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const latestKey = ["deals", dealId, "messages", "latest"];
  const page = (cursor?: string) =>
    unwrap(api.GET("/deals/{dealId}/messages", { params: { path: { dealId }, query: { cursor, limit: PAGE } } }));
  const latest = useQuery({ queryKey: latestKey, queryFn: () => page(), refetchInterval: POLL_MS });
  // Earlier messages start from where the newest page ended when the user first asks for them.
  const [olderFrom, setOlderFrom] = useState<string>();
  const older = useInfiniteQuery({
    queryKey: ["deals", dealId, "messages", "older", olderFrom],
    queryFn: ({ pageParam }) => page(pageParam),
    initialPageParam: olderFrom,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!olderFrom,
    staleTime: Infinity,
  });
  const hasEarlier = older.data ? older.hasNextPage : !!latest.data?.nextCursor;
  const loadingEarlier = older.isFetching;
  const loadEarlier = () => (older.data ? older.fetchNextPage() : setOlderFrom(latest.data?.nextCursor));

  const [draft, setDraft] = useState("");
  const send = useMutation({
    mutationFn: (body: string) => unwrap(api.POST("/deals/{dealId}/messages", { params: { path: { dealId } }, body: { body } })),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: latestKey });
    },
  });

  const messages = mergeThread(latest.data?.items ?? [], older.data?.pages.flatMap((p) => p.items) ?? []);
  const newestId = messages.at(-1)?.id;

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [newestId]);

  useMarkMessageNotificationsRead(dealId, newestId);

  const submit = () => {
    const body = draft.trim();
    if (body && !send.isPending) send.mutate(body);
  };

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle title="Messages" subtitle={readOnly ? "This deal was cancelled, so the thread is read-only." : `Talk to ${partnerName} about this deal.`} />
      <div ref={scroller} className="flex max-h-96 min-h-24 flex-col gap-3 overflow-y-auto pr-1" aria-live="polite" aria-label="Message thread">
        {hasEarlier && (
          <button type="button" className="self-center text-xs text-zinc-500 hover:text-ink" onClick={() => loadEarlier()} disabled={loadingEarlier}>
            {loadingEarlier ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {latest.isPending ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <p className="text-sm text-zinc-500">No messages yet.{readOnly ? "" : " Say hello, or agree on posting dates here."}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender.id === meId;
            return (
              <div key={m.id} className={`flex max-w-[85%] flex-col gap-1 ${mine ? "items-end self-end" : "items-start self-start"}`}>
                <div
                  className={`whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                    mine ? "rounded-br-md bg-ink text-ivory" : "rounded-bl-md border border-zinc-200 bg-white text-ink"
                  }`}
                >
                  {m.body}
                </div>
                <span className="text-[11px] text-zinc-500">
                  {mine ? "You" : m.sender.displayName} · {formatDateTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
      {!readOnly && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Textarea
            aria-label="Message"
            placeholder={`Message ${partnerName}…`}
            className="min-h-20"
            maxLength={MAX_LENGTH}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">
              {draft.length > MAX_LENGTH - 200 ? `${MAX_LENGTH - draft.length} characters left` : "Enter to send · Shift+Enter for a new line"}
            </span>
            <Button type="submit" disabled={!draft.trim() || send.isPending}>
              {send.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
          <ErrorText>{send.isError && errorMessage(send.error)}</ErrorText>
        </form>
      )}
    </Card>
  );
}

/** Newest page plus earlier pages, de-duplicated by id (they can overlap as new messages arrive), oldest first. */
function mergeThread(latest: Message[], older: Message[]): Message[] {
  // Pages are newest first: reversing [latest, older] gives oldest → newest; the sort only guards overlap edges.
  const byId = new Map([...latest, ...older].reverse().map((m) => [m.id, m]));
  return [...byId.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/** Reading the thread clears its unread message notifications, so the next message notifies (and emails) again. */
function useMarkMessageNotificationsRead(dealId: string, newestId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!newestId) return;
    let cancelled = false;
    (async () => {
      const page = await unwrap(api.GET("/notifications", { params: { query: { unread: true, limit: 50 } } }));
      const mine = page.items.filter((n) => n.type === "MESSAGE_RECEIVED" && n.link === `/deals/${dealId}`);
      if (cancelled || mine.length === 0) return;
      await Promise.all(mine.map((n) => api.POST("/notifications/{notificationId}/read", { params: { path: { notificationId: n.id } } })));
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [dealId, newestId, queryClient]);
}
