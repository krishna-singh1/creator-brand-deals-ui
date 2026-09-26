"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ImageUpload } from "@/components/image-upload";
import { CenteredMessage, RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Field, Input, SectionTitle, Select, SuccessText } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { useCategories, useCities } from "@/lib/catalog";
import { errorMessage } from "@/lib/errors";
import { ME_KEY } from "@/lib/session";

type Brand = components["schemas"]["BrandProfile"];
type Update = components["schemas"]["UpdateBrandProfileRequest"];

export default function BrandProfilePage() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Loader />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Loader() {
  const { data } = useQuery({ queryKey: ["brand", "profile"], queryFn: () => unwrap(api.GET("/brand/profile")) });
  return data ? <BrandForm key={data.id} brand={data} /> : <CenteredMessage>Loading profile…</CenteredMessage>;
}

function BrandForm({ brand }: { brand: Brand }) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const [form, setForm] = useState({
    logoFileId: undefined as string | undefined,
    brandName: brand.brandName ?? "",
    website: brand.website ?? "",
    instagramHandle: brand.instagramHandle ?? "",
    categoryId: brand.categoryId ?? "",
    companySize: brand.companySize ?? "",
    cityId: brand.city?.id ?? "",
    contactName: brand.contactName ?? "",
    contactPhone: brand.contactPhone ?? "+91",
    contactEmail: brand.contactEmail ?? "",
    gstin: brand.gstin ?? "",
  });
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () => {
      const body: Update = {
        logoFileId: form.logoFileId,
        brandName: form.brandName,
        website: form.website || undefined,
        instagramHandle: form.instagramHandle || undefined,
        categoryId: form.categoryId,
        companySize: (form.companySize || undefined) as Update["companySize"],
        cityId: form.cityId || undefined,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        gstin: form.gstin ? form.gstin.toUpperCase() : undefined,
      };
      return unwrap(api.PUT("/brand/profile", { body }));
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["brand", "profile"], updated);
      queryClient.invalidateQueries({ queryKey: ME_KEY });
      queryClient.invalidateQueries({ queryKey: ["brand", "dashboard"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Brand profile</h1>
      <Card>
        <SectionTitle title="About your brand" subtitle="Creators see this on your campaigns. Contact details are only shared once a deal is agreed." />
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <ImageUpload purpose="BRAND_LOGO" label="Upload logo" currentUrl={brand.logoUrl} onUploaded={(id) => set("logoFileId", id)} />
          </div>
          <Field label="Brand name">
            <Input required minLength={2} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />
          </Field>
          <Field label="Category">
            <Select required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Website (optional)">
            <Input type="url" placeholder="https://" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label="Instagram (optional)">
            <Input placeholder="@yourbrand" value={form.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value)} />
          </Field>
          <Field label="Team size (optional)">
            <Select value={form.companySize} onChange={(e) => set("companySize", e.target.value)}>
              <option value="">Select</option>
              <option value="SOLO">Just me</option>
              <option value="S_2_10">2–10</option>
              <option value="S_11_50">11–50</option>
              <option value="S_51_200">51–200</option>
              <option value="S_200_PLUS">200+</option>
            </Select>
          </Field>
          <Field label="City (optional)">
            <Select value={form.cityId} onChange={(e) => set("cityId", e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.state}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contact person">
            <Input required minLength={2} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </Field>
          <Field label="Contact phone" hint="Format: +91XXXXXXXXXX">
            <Input required inputMode="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
          <Field label="Work email">
            <Input required type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label="GSTIN (optional)" hint="Adds a 'GST verified' badge once our team checks it.">
            <Input maxLength={15} value={form.gstin} onChange={(e) => set("gstin", e.target.value)} />
          </Field>
          <div className="flex items-center gap-4 sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
            <SuccessText>{save.isSuccess && "Saved."}</SuccessText>
            <ErrorText>{save.isError && errorMessage(save.error)}</ErrorText>
          </div>
        </form>
      </Card>
    </div>
  );
}
