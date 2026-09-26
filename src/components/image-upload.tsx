"use client";

import { useState } from "react";

import type { components } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { uploadFile } from "@/lib/upload";

import { ErrorText } from "./ui";

/** Picks an image, uploads it directly to storage, and reports the new fileId. */
export function ImageUpload({
  purpose,
  currentUrl,
  label,
  onUploaded,
}: {
  purpose: components["schemas"]["FilePurpose"];
  currentUrl?: string;
  label: string;
  onUploaded: (fileId: string, previewUrl: string) => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <div className="flex items-center gap-4">
      <div className="size-16 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="" className="size-full object-cover" />}
      </div>
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer text-sm font-medium underline">
          {busy ? "Uploading…" : label}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setError(undefined);
              try {
                const fileId = await uploadFile(purpose, file);
                const url = URL.createObjectURL(file);
                setPreview(url);
                onUploaded(fileId, url);
              } catch (err) {
                setError(errorMessage(err));
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
        <span className="text-xs text-zinc-500">JPG, PNG or WebP, up to 5 MB</span>
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}
