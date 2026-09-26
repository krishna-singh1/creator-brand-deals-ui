"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card, ErrorText, Field, Input, SectionTitle, Select } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";

type Platform = components["schemas"]["Platform"];

export function Portfolio() {
  const queryClient = useQueryClient();
  const key = ["creator", "portfolio"];
  const { data: items = [] } = useQuery({ queryKey: key, queryFn: () => unwrap(api.GET("/creator/portfolio")) });
  const [form, setForm] = useState({ url: "", platform: "INSTAGRAM" as Platform, brandName: "" });

  const add = useMutation({
    mutationFn: () =>
      unwrap(api.POST("/creator/portfolio", { body: { url: form.url, platform: form.platform, brandName: form.brandName || undefined } })),
    onSuccess: () => {
      setForm({ url: "", platform: form.platform, brandName: "" });
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.DELETE("/creator/portfolio/{portfolioItemId}", { params: { path: { portfolioItemId: id } } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return (
    <Card>
      <SectionTitle title="Portfolio" subtitle="Links to up to 6 posts or past brand collaborations you're proud of." />
      <ul className="mb-4 flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
            <a href={i.url} target="_blank" rel="noreferrer" className="truncate underline">
              {i.brandName ? `${i.brandName} · ` : ""}
              {i.url}
            </a>
            <Button variant="ghost" className="h-8" onClick={() => remove.mutate(i.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
      {items.length < 6 && (
        <form
          className="grid gap-3 sm:grid-cols-[1fr_10rem_12rem_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Field label="Post link">
            <Input required type="url" placeholder="https://www.instagram.com/p/…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </Field>
          <Field label="Platform">
            <Select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })}>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
            </Select>
          </Field>
          <Field label="Brand (optional)">
            <Input value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
          </Field>
          <Button type="submit" variant="secondary" disabled={add.isPending}>
            Add
          </Button>
        </form>
      )}
      <ErrorText>{add.isError && errorMessage(add.error)}</ErrorText>
    </Card>
  );
}
