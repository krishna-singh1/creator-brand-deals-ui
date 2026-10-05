"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { Button, Card, ErrorText, Field, Input, SectionTitle, Select, StatusBadge } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { formatCount } from "@/lib/format";
import { isVerifiedSource } from "@/lib/verification";

type Account = components["schemas"]["SocialAccount"];
type Platform = components["schemas"]["Platform"];

export function SocialAccounts() {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useQuery({
    queryKey: ["creator", "social-accounts"],
    queryFn: () => unwrap(api.GET("/creator/social-accounts")),
  });
  const refresh = () =>
    Promise.all(
      [["creator", "social-accounts"], ["creator", "profile"], ["creator", "rates"], ["creator", "dashboard"]].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );

  const remove = useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE("/creator/social-accounts/{socialAccountId}", { params: { path: { socialAccountId: id } } })),
    onSuccess: refresh,
  });
  const missingPlatforms = (["INSTAGRAM", "FACEBOOK"] as Platform[]).filter((p) => !accounts.some((a) => a.platform === p));

  return (
    <Card>
      <SectionTitle
        title="Social accounts"
        subtitle="Enter your current stats. Our team checks them against your Insights screenshots during verification."
      />
      <div className="flex flex-col gap-3">
        {accounts.map((a) => (
          <AccountRow
            key={a.id}
            account={a}
            removing={remove.isPending && remove.variables === a.id}
            onDelete={() => remove.mutate(a.id)}
            onSaved={refresh}
          />
        ))}
        <ErrorText>{remove.isError && errorMessage(remove.error)}</ErrorText>
        {missingPlatforms.length > 0 && <AddAccount platforms={missingPlatforms} onSaved={refresh} />}
      </div>
    </Card>
  );
}

function AccountRow({
  account,
  removing,
  onDelete,
  onSaved,
}: {
  account: Account;
  removing: boolean;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <AccountForm
        initial={account}
        platforms={[account.platform]}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onSaved();
        }}
      />
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4">
      <div className="flex flex-col gap-0.5">
        <a href={account.profileUrl} target="_blank" rel="noreferrer" className="link-underline font-medium text-ink">
          {account.platform === "INSTAGRAM" ? `@${account.handle}` : account.handle}
        </a>
        <span className="text-sm text-zinc-600">
          {formatCount(account.followers)} followers · {account.engagementRate}% engagement
          {account.isPrimary && " · primary"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={isVerifiedSource(account.source) ? "VERIFIED" : "SELF_DECLARED"} />
        <Button variant="secondary" className="h-9" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <ConfirmButton question="Remove?" className="h-9" pending={removing} onConfirm={onDelete}>
          {removing ? "Removing…" : "Remove"}
        </ConfirmButton>
      </div>
    </div>
  );
}

function AddAccount({ platforms, onSaved }: { platforms: Platform[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add {platforms.length === 1 ? (platforms[0] === "INSTAGRAM" ? "Instagram" : "Facebook") : "an account"}
      </Button>
    );
  }
  return (
    <AccountForm
      platforms={platforms}
      onCancel={() => setOpen(false)}
      onSaved={() => {
        setOpen(false);
        onSaved();
      }}
    />
  );
}

function AccountForm({
  initial,
  platforms,
  onCancel,
  onSaved,
}: {
  initial?: Account;
  platforms: Platform[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    platform: initial?.platform ?? platforms[0],
    handle: initial?.handle ?? "",
    followers: initial?.followers?.toString() ?? "",
    avgLikes: initial?.avgLikes?.toString() ?? "",
    avgComments: initial?.avgComments?.toString() ?? "",
    avgViews: initial?.avgViews?.toString() ?? "",
    isPrimary: initial?.isPrimary ?? false,
  });
  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () => {
      const body = {
        platform: form.platform,
        handle: form.handle,
        followers: Number(form.followers),
        avgLikes: Number(form.avgLikes),
        avgComments: Number(form.avgComments),
        avgViews: form.avgViews ? Number(form.avgViews) : undefined,
        isPrimary: form.isPrimary,
      };
      return initial
        ? unwrap(api.PUT("/creator/social-accounts/{socialAccountId}", { params: { path: { socialAccountId: initial.id } }, body }))
        : unwrap(api.POST("/creator/social-accounts", { body }));
    },
    onSuccess: onSaved,
  });

  return (
    <form
      className="grid gap-3 rounded-xl border border-zinc-300 p-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Field label="Platform">
        <Select value={form.platform} disabled={!!initial} onChange={(e) => set("platform", e.target.value)}>
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p === "INSTAGRAM" ? "Instagram" : "Facebook"}
            </option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label={form.platform === "INSTAGRAM" ? "Instagram username" : "Facebook page URL"}>
          <Input
            required
            value={form.handle}
            placeholder={form.platform === "INSTAGRAM" ? "@yourname" : "facebook.com/yourpage"}
            onChange={(e) => set("handle", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Followers">
        <Input required type="number" min={0} value={form.followers} onChange={(e) => set("followers", e.target.value)} />
      </Field>
      <Field label="Avg likes per post">
        <Input required type="number" min={0} value={form.avgLikes} onChange={(e) => set("avgLikes", e.target.value)} />
      </Field>
      <Field label="Avg comments per post">
        <Input required type="number" min={0} value={form.avgComments} onChange={(e) => set("avgComments", e.target.value)} />
      </Field>
      <Field label="Avg reel views (optional)">
        <Input type="number" min={0} value={form.avgViews} onChange={(e) => set("avgViews", e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 self-end pb-3 text-sm">
        <input type="checkbox" checked={form.isPrimary} onChange={(e) => set("isPrimary", e.target.checked)} />
        Primary account
      </label>
      <div className="flex items-center gap-3 sm:col-span-3">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save account"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <ErrorText>{save.isError && errorMessage(save.error)}</ErrorText>
      </div>
    </form>
  );
}
