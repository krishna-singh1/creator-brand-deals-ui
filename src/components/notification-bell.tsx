"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { api, type components, unwrap } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";

type Notification = components["schemas"]["Notification"];

export const NOTIFICATIONS_KEY = ["notifications"];

/** Bell with unread count; the panel lists recent notifications. Polls every minute. */
export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const { data } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => unwrap(api.GET("/notifications", { params: { query: { limit: 10 } } })),
    refetchInterval: 60_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  const markRead = useMutation({
    mutationFn: (id: string) => api.POST("/notifications/{notificationId}/read", { params: { path: { notificationId: id } } }),
    onSuccess: refresh,
  });
  const markAll = useMutation({ mutationFn: () => api.POST("/notifications/read-all"), onSuccess: refresh });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => panel.current && !panel.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const unread = data?.unreadCount ?? 0;
  const openItem = (n: Notification) => {
    if (!n.readAt) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-full border border-zinc-200 bg-white/70 text-ink transition-colors hover:border-zinc-400"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink ring-2 ring-ivory">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 animate-fade-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <span className="font-display text-lg text-ink">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={() => markAll.mutate()} className="text-xs text-zinc-500 hover:text-ink">
                Mark all read
              </button>
            )}
          </div>
          {(data?.items ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {data!.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-cream/60"
                  >
                    <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-gold"}`} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium text-ink">{n.title}</span>
                      {n.body && <span className="line-clamp-2 text-xs text-zinc-600">{n.body}</span>}
                      <span className="text-[11px] text-zinc-400">{formatDateTime(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
