"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ImageUpload } from "@/components/image-upload";
import { Button, Card, ErrorText, Field, Input, SectionTitle, Select, SuccessText, Textarea } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { useCategories, useCities, useLanguages } from "@/lib/catalog";
import { errorMessage } from "@/lib/errors";
import { ME_KEY } from "@/lib/session";

type Profile = components["schemas"]["CreatorProfile"];
type Update = components["schemas"]["UpdateCreatorProfileRequest"];

export function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: languages = [] } = useLanguages();
  const { data: cities = [] } = useCities();

  const [form, setForm] = useState({
    avatarFileId: undefined as string | undefined,
    displayName: profile.displayName ?? "",
    fullName: profile.fullName ?? "",
    bio: profile.bio ?? "",
    gender: profile.gender ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    cityId: profile.city?.id ?? "",
    languages: profile.languages,
    categoryIds: profile.categoryIds,
    phone: profile.phone ?? "+91",
    contactEmail: profile.contactEmail ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key: "languages" | "categoryIds", value: string) =>
    set(key, form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value]);

  const save = useMutation({
    mutationFn: () => {
      const body: Update = {
        avatarFileId: form.avatarFileId,
        displayName: form.displayName,
        fullName: form.fullName,
        bio: form.bio || undefined,
        gender: (form.gender || undefined) as Update["gender"],
        dateOfBirth: form.dateOfBirth,
        cityId: form.cityId,
        languages: form.languages,
        categoryIds: form.categoryIds,
        phone: form.phone,
        contactEmail: form.contactEmail,
        audience: profile.audience,
      };
      return unwrap(api.PUT("/creator/profile", { body }));
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["creator", "profile"], updated);
      queryClient.invalidateQueries({ queryKey: ME_KEY });
      queryClient.invalidateQueries({ queryKey: ["creator", "dashboard"] });
    },
  });

  return (
    <Card>
      <SectionTitle title="Your details" subtitle="Brands see your display name, city and niches. Phone and email are only shared once a deal is agreed." />
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="sm:col-span-2">
          <ImageUpload
            purpose="AVATAR"
            label="Upload profile photo"
            currentUrl={profile.avatarUrl}
            onUploaded={(fileId) => set("avatarFileId", fileId)}
          />
        </div>
        <Field label="Display name">
          <Input required minLength={2} maxLength={60} value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
        </Field>
        <Field label="Full name">
          <Input required minLength={2} maxLength={100} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field label="Date of birth" hint="You must be 18 or older.">
          <Input required type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </Field>
        <Field label="Gender (optional)">
          <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Prefer not to say</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="NON_BINARY">Non-binary</option>
          </Select>
        </Field>
        <Field label="City">
          <Select required value={form.cityId} onChange={(e) => set("cityId", e.target.value)}>
            <option value="">Select your city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.state}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mobile number" hint="Format: +91XXXXXXXXXX">
          <Input required inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Contact email">
          <Input required type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Bio (optional)">
            <Textarea maxLength={500} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Niches (up to 3)</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = form.categoryIds.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  aria-pressed={on}
                  disabled={!on && form.categoryIds.length >= 3}
                  onClick={() => toggle("categoryIds", c.id)}
                  className={`rounded-full border px-3 py-1 text-sm disabled:opacity-40 ${on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300"}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Content languages</legend>
          <div className="flex flex-wrap gap-3">
            {languages.map((l) => (
              <label key={l.code} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={form.languages.includes(l.code)} onChange={() => toggle("languages", l.code)} />
                {l.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" disabled={save.isPending || form.categoryIds.length === 0 || form.languages.length === 0}>
            {save.isPending ? "Saving…" : "Save details"}
          </Button>
          <SuccessText>{save.isSuccess && "Saved."}</SuccessText>
          <ErrorText>{save.isError && errorMessage(save.error)}</ErrorText>
        </div>
      </form>
    </Card>
  );
}
